const express = require('express');
const db = require('../db');
const { autenticar } = require('./auth');
const router = express.Router();

router.use(autenticar);

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.periodo_inicio, r.periodo_fim, r.observacao,
              r.meta, r.meta_atingida, r.percentual_atingido,
              r.indicador_id, i.nome AS indicador_nome,
              r.segmento_id, s.nome AS segmento_nome,
              i.perspectiva_id, p.nome AS perspectiva_nome
       FROM resultados r
       LEFT JOIN indicadores i ON i.id = r.indicador_id
       LEFT JOIN segmentos   s ON s.id = r.segmento_id
       LEFT JOIN perspectivas p ON p.id = i.perspectiva_id
       WHERE r.empresa_id = ? ORDER BY r.periodo_inicio DESC`,
      [req.usuario.empresa_id]
    );
    res.json({ resultados: rows });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

router.post('/', async (req, res) => {
  const { indicador_id, segmento_id, periodo_inicio, periodo_fim, meta, meta_atingida, observacao } = req.body;
  if (!indicador_id || !periodo_inicio || !periodo_fim || meta === undefined || meta_atingida === undefined)
    return res.status(400).json({ erro: 'Indicador, período, meta e meta atingida são obrigatórios.' });
  const percentual_atingido = meta > 0 ? Math.round((meta_atingida / meta) * 100) : 0;
  try {
    const [r] = await db.query(
      `INSERT INTO resultados
         (empresa_id, indicador_id, segmento_id, periodo_inicio, periodo_fim, meta, meta_atingida, percentual_atingido, observacao)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [req.usuario.empresa_id, indicador_id, segmento_id || null,
       periodo_inicio, periodo_fim, meta, meta_atingida, percentual_atingido, observacao || null]
    );
    res.status(201).json({ id: r.insertId, percentual_atingido, mensagem: 'Resultado criado.' });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

router.put('/:id', async (req, res) => {
  const { indicador_id, segmento_id, periodo_inicio, periodo_fim, meta, meta_atingida, observacao } = req.body;
  const percentual_atingido = meta > 0 ? Math.round((meta_atingida / meta) * 100) : 0;
  try {
    const [r] = await db.query(
      `UPDATE resultados SET
         indicador_id=?, segmento_id=?, periodo_inicio=?, periodo_fim=?,
         meta=?, meta_atingida=?, percentual_atingido=?, observacao=?
       WHERE id=? AND empresa_id=?`,
      [indicador_id, segmento_id || null, periodo_inicio, periodo_fim,
       meta, meta_atingida, percentual_atingido, observacao || null,
       req.params.id, req.usuario.empresa_id]
    );
    if (!r.affectedRows) return res.status(404).json({ erro: 'Resultado não encontrado.' });
    res.json({ percentual_atingido, mensagem: 'Resultado atualizado.' });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const [r] = await db.query(
      'DELETE FROM resultados WHERE id=? AND empresa_id=?',
      [req.params.id, req.usuario.empresa_id]
    );
    if (!r.affectedRows) return res.status(404).json({ erro: 'Resultado não encontrado.' });
    res.json({ mensagem: 'Resultado excluído.' });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

module.exports = router;
