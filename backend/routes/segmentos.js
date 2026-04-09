const express = require('express');
const db = require('../db');
const { autenticar } = require('./auth');
const router = express.Router();

router.use(autenticar);

router.get('/', async (req, res) => {
  try {
    const { indicador_id } = req.query;
    let sql = `SELECT s.id, s.indicador_id, s.nome, s.ativo, i.nome AS indicador_nome
               FROM segmentos s
               JOIN indicadores i ON i.id = s.indicador_id
               WHERE s.empresa_id = ?`;
    const params = [req.usuario.empresa_id];
    if (indicador_id) { sql += ' AND s.indicador_id = ?'; params.push(indicador_id); }
    sql += ' ORDER BY s.indicador_id, s.nome';
    const [rows] = await db.query(sql, params);
    res.json({ segmentos: rows });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

router.post('/', async (req, res) => {
  const { indicador_id, nome } = req.body;
  if (!indicador_id || !nome) return res.status(400).json({ erro: 'Indicador e nome obrigatórios.' });
  try {
    const [r] = await db.query(
      'INSERT INTO segmentos (empresa_id, indicador_id, nome) VALUES (?,?,?)',
      [req.usuario.empresa_id, indicador_id, nome.trim()]
    );
    res.status(201).json({ id: r.insertId, mensagem: 'Segmento criado.' });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

router.put('/:id', async (req, res) => {
  const { nome, ativo } = req.body;
  if (!nome) return res.status(400).json({ erro: 'Nome obrigatório.' });
  try {
    const [r] = await db.query(
      'UPDATE segmentos SET nome=?, ativo=? WHERE id=? AND empresa_id=?',
      [nome.trim(), ativo ?? 1, req.params.id, req.usuario.empresa_id]
    );
    if (!r.affectedRows) return res.status(404).json({ erro: 'Segmento não encontrado.' });
    res.json({ mensagem: 'Segmento atualizado.' });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const [r] = await db.query(
      'DELETE FROM segmentos WHERE id=? AND empresa_id=?',
      [req.params.id, req.usuario.empresa_id]
    );
    if (!r.affectedRows) return res.status(404).json({ erro: 'Segmento não encontrado.' });
    res.json({ mensagem: 'Segmento excluído.' });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

module.exports = router;
