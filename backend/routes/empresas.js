const express = require('express');
const db = require('../db');
const { autenticar, soAdmin } = require('./auth');
const router = express.Router();

router.use(autenticar);

// Listar empresas (admin geral vê todas; usuário comum só as suas)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nome, cnpj, ativo, criado_em FROM empresas ORDER BY nome');
    res.json({ empresas: rows });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

// Criar empresa (somente admin)
router.post('/', soAdmin, async (req, res) => {
  const { nome, cnpj } = req.body;
  if (!nome) return res.status(400).json({ erro: 'Nome obrigatório.' });
  try {
    const [r] = await db.query('INSERT INTO empresas (nome, cnpj) VALUES (?,?)', [nome, cnpj || null]);
    res.status(201).json({ id: r.insertId, mensagem: 'Empresa criada.' });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

// Atualizar empresa
router.put('/:id', soAdmin, async (req, res) => {
  const { nome, cnpj, ativo } = req.body;
  try {
    await db.query('UPDATE empresas SET nome=?, cnpj=?, ativo=? WHERE id=?',
      [nome, cnpj || null, ativo ?? 1, req.params.id]);
    res.json({ mensagem: 'Empresa atualizada.' });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

// Excluir empresa
router.delete('/:id', soAdmin, async (req, res) => {
  try {
    const [r] = await db.query('DELETE FROM empresas WHERE id=?', [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ erro: 'Empresa não encontrada.' });
    res.json({ mensagem: 'Empresa excluída.' });
  } catch (e) {
    if (e.code === 'ER_ROW_IS_REFERENCED_2')
      return res.status(409).json({ erro: 'Empresa possui usuários vinculados. Desvincule-os antes de excluir.' });
    res.status(500).json({ erro: 'Erro interno.' });
  }
});

module.exports = router;
