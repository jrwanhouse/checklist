const express = require('express');
const bcrypt  = require('bcryptjs');
const db      = require('../db');
const { autenticar, soAdmin } = require('./auth');
const router  = express.Router();

router.use(autenticar, soAdmin);

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.nome, u.sobrenome, u.email, u.admin, u.ativo,
             IFNULL(JSON_ARRAYAGG(
               CASE WHEN e.id IS NOT NULL
               THEN JSON_OBJECT('id', e.id, 'nome', e.nome)
               ELSE NULL END
             ), JSON_ARRAY()) AS empresas
      FROM usuarios u
      LEFT JOIN usuario_empresa ue ON ue.usuario_id = u.id
      LEFT JOIN empresas e         ON e.id = ue.empresa_id
      GROUP BY u.id ORDER BY u.nome`);
    rows.forEach(r => {
      try {
        const emp = typeof r.empresas === 'string' ? JSON.parse(r.empresas) : r.empresas;
        r.empresas = (Array.isArray(emp) ? emp : []).filter(Boolean);
      } catch { r.empresas = []; }
    });
    res.json({ usuarios: rows });
  } catch (e) { console.error(e); res.status(500).json({ erro: 'Erro interno.' }); }
});

router.post('/', async (req, res) => {
  const { nome, sobrenome, email, senha, admin, empresas } = req.body;
  if (!nome || !sobrenome || !email || !senha)
    return res.status(400).json({ erro: 'Campos obrigatórios faltando.' });
  try {
    const hash = await bcrypt.hash(senha, 12);
    const [r] = await db.query(
      'INSERT INTO usuarios (nome, sobrenome, email, senha_hash, admin) VALUES (?,?,?,?,?)',
      [nome, sobrenome, email.toLowerCase(), hash, admin ? 1 : 0]);
    const uid = r.insertId;
    if (empresas?.length)
      for (const emp of empresas)
        await db.query('INSERT INTO usuario_empresa (usuario_id, empresa_id) VALUES (?,?)', [uid, emp.id]);
    res.status(201).json({ mensagem: 'Usuário criado.', id: uid });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'E-mail já cadastrado.' });
    res.status(500).json({ erro: 'Erro interno.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [r] = await db.query('DELETE FROM usuarios WHERE id=?', [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.json({ mensagem: 'Usuário excluído.' });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

router.put('/:id', async (req, res) => {
  const { nome, sobrenome, ativo, admin, empresas, nova_senha } = req.body;
  try {
    if (nova_senha) {
      const hash = await bcrypt.hash(nova_senha, 12);
      await db.query('UPDATE usuarios SET nome=?,sobrenome=?,ativo=?,admin=?,senha_hash=? WHERE id=?',
        [nome, sobrenome, ativo??1, admin?1:0, hash, req.params.id]);
    } else {
      await db.query('UPDATE usuarios SET nome=?,sobrenome=?,ativo=?,admin=? WHERE id=?',
        [nome, sobrenome, ativo??1, admin?1:0, req.params.id]);
    }
    if (empresas !== undefined) {
      await db.query('DELETE FROM usuario_empresa WHERE usuario_id=?', [req.params.id]);
      for (const emp of empresas)
        await db.query('INSERT INTO usuario_empresa (usuario_id, empresa_id) VALUES (?,?)', [req.params.id, emp.id]);
    }
    res.json({ mensagem: 'Usuário atualizado.' });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

module.exports = router;
