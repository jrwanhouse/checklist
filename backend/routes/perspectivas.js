const express = require('express');
const db = require('../db');
const { autenticar } = require('./auth');
const router = express.Router();

router.use(autenticar);

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nome, descricao, ativo FROM perspectivas WHERE empresa_id = ? ORDER BY nome',
      [req.usuario.empresa_id]
    );
    res.json({ perspectivas: rows });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

router.post('/', async (req, res) => {
  const { nome, descricao } = req.body;
  if (!nome) return res.status(400).json({ erro: 'Nome obrigatório.' });
  try {
    const [r] = await db.query(
      'INSERT INTO perspectivas (empresa_id, nome, descricao) VALUES (?,?,?)',
      [req.usuario.empresa_id, nome, descricao || null]
    );
    res.status(201).json({ id: r.insertId, mensagem: 'Perspectiva criada.' });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

router.put('/:id', async (req, res) => {
  const { nome, descricao, ativo } = req.body;
  try {
    const [r] = await db.query(
      'UPDATE perspectivas SET nome=?, descricao=?, ativo=? WHERE id=? AND empresa_id=?',
      [nome, descricao || null, ativo ?? 1, req.params.id, req.usuario.empresa_id]
    );
    if (!r.affectedRows) return res.status(404).json({ erro: 'Perspectiva não encontrada.' });
    res.json({ mensagem: 'Perspectiva atualizada.' });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const [r] = await db.query(
      'DELETE FROM perspectivas WHERE id=? AND empresa_id=?',
      [req.params.id, req.usuario.empresa_id]
    );
    if (!r.affectedRows) return res.status(404).json({ erro: 'Perspectiva não encontrada.' });
    res.json({ mensagem: 'Perspectiva excluída.' });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

module.exports = router;
