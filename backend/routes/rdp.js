const express = require('express');
const db = require('../db');
const { autenticar } = require('./auth');
const router = express.Router();

router.use(autenticar);

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.titulo, r.descricao, r.responsavel, r.prazo, r.status,
              GROUP_CONCAT(ri.indicador_id ORDER BY ri.indicador_id) AS indicadores_ids,
              GROUP_CONCAT(i.nome ORDER BY i.nome SEPARATOR ', ') AS indicadores_nomes
       FROM rdp r
       LEFT JOIN rdp_indicadores ri ON ri.rdp_id = r.id
       LEFT JOIN indicadores i ON i.id = ri.indicador_id
       WHERE r.empresa_id = ?
       GROUP BY r.id
       ORDER BY r.criado_em DESC`,
      [req.usuario.empresa_id]
    );
    rows.forEach(row => {
      row.indicadores_ids = row.indicadores_ids
        ? row.indicadores_ids.split(',').map(Number)
        : [];
    });
    res.json({ rdp: rows });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

router.get('/:id', async (req, res) => {
  const { de, ate } = req.query;
  try {
    const [rdp] = await db.query(
      'SELECT id, titulo, descricao, responsavel, prazo, status FROM rdp WHERE id=? AND empresa_id=?',
      [req.params.id, req.usuario.empresa_id]
    );
    if (!rdp.length) return res.status(404).json({ erro: 'RDP não encontrado.' });

    const [indicadores] = await db.query(
      `SELECT i.id, i.nome, i.unidade, i.natureza,
              i.rgvini, i.rgvfim, i.rgaini, i.rgafim, i.rgveini, i.rgvefim,
              p.nome AS perspectiva_nome
       FROM rdp_indicadores ri
       JOIN indicadores i ON i.id = ri.indicador_id
       LEFT JOIN perspectivas p ON p.id = i.perspectiva_id
       WHERE ri.rdp_id = ?
       ORDER BY i.nome`,
      [req.params.id]
    );

    for (const ind of indicadores) {
      const params = [ind.id, req.usuario.empresa_id];
      let cond = '';
      if (de)  { cond += ' AND periodo_inicio >= ?'; params.push(de); }
      if (ate) { cond += ' AND periodo_fim <= ?';    params.push(ate); }
      const [resultados] = await db.query(
        `SELECT meta, meta_atingida, percentual_atingido, periodo_inicio, periodo_fim
         FROM resultados WHERE indicador_id=? AND empresa_id=?${cond}
         ORDER BY periodo_fim ASC`,
        params
      );
      ind.resultados = resultados;
    }

    res.json({ rdp: rdp[0], indicadores });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

router.post('/', async (req, res) => {
  const { titulo, descricao, responsavel, prazo, status, indicadores_ids } = req.body;
  if (!titulo) return res.status(400).json({ erro: 'Título obrigatório.' });
  try {
    const [r] = await db.query(
      'INSERT INTO rdp (empresa_id, titulo, descricao, responsavel, prazo, status) VALUES (?,?,?,?,?,?)',
      [req.usuario.empresa_id, titulo, descricao || null, responsavel || null, prazo || null, status || 'pendente']
    );
    const rdpId = r.insertId;
    if (Array.isArray(indicadores_ids) && indicadores_ids.length) {
      const vals = indicadores_ids.map(iid => [rdpId, iid]);
      await db.query('INSERT INTO rdp_indicadores (rdp_id, indicador_id) VALUES ?', [vals]);
    }
    res.status(201).json({ id: rdpId, mensagem: 'RDP criado.' });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

router.put('/:id', async (req, res) => {
  const { titulo, descricao, responsavel, prazo, status, indicadores_ids } = req.body;
  try {
    const [r] = await db.query(
      'UPDATE rdp SET titulo=?, descricao=?, responsavel=?, prazo=?, status=? WHERE id=? AND empresa_id=?',
      [titulo, descricao || null, responsavel || null, prazo || null, status, req.params.id, req.usuario.empresa_id]
    );
    if (!r.affectedRows) return res.status(404).json({ erro: 'RDP não encontrado.' });
    await db.query('DELETE FROM rdp_indicadores WHERE rdp_id = ?', [req.params.id]);
    if (Array.isArray(indicadores_ids) && indicadores_ids.length) {
      const vals = indicadores_ids.map(iid => [req.params.id, iid]);
      await db.query('INSERT INTO rdp_indicadores (rdp_id, indicador_id) VALUES ?', [vals]);
    }
    res.json({ mensagem: 'RDP atualizado.' });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const [r] = await db.query(
      'DELETE FROM rdp WHERE id=? AND empresa_id=?',
      [req.params.id, req.usuario.empresa_id]
    );
    if (!r.affectedRows) return res.status(404).json({ erro: 'RDP não encontrado.' });
    res.json({ mensagem: 'RDP excluído.' });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

module.exports = router;
