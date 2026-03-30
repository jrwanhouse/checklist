const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const db      = require('../db');
const { enviarEmail, emailResetSenha, emailVerificacao } = require('../services/email');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'checklist_secret';

// ── POST /api/auth/login ──────────────────────────────────────
// 1º passo: valida email+senha, devolve token temporário + lista de empresas
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha)
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });

  try {
    const [rows] = await db.query(
      'SELECT id, nome, sobrenome, email, senha_hash, admin, ativo FROM usuarios WHERE email = ?',
      [email.toLowerCase()]
    );
    if (!rows.length)
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });

    const u = rows[0];
    if (!u.ativo)
      return res.status(403).json({ erro: 'Conta desativada.' });

    const ok = await bcrypt.compare(senha, u.senha_hash);
    if (!ok)
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });

    // Busca empresas vinculadas
    const [empresas] = await db.query(
      `SELECT e.id, e.nome FROM empresas e
       JOIN usuario_empresa ue ON ue.empresa_id = e.id
       WHERE ue.usuario_id = ? AND e.ativo = 1 ORDER BY e.nome`,
      [u.id]
    );

    // Token temporário (sem empresa) — válido 10 min só para a seleção
    const tokenTemp = jwt.sign(
      { id: u.id, email: u.email, admin: !!u.admin, etapa: 'escolha_empresa' },
      JWT_SECRET, { expiresIn: '10m' }
    );

    return res.json({
      token_temp: tokenTemp,
      usuario: { id: u.id, nome: u.nome, sobrenome: u.sobrenome, email: u.email, admin: !!u.admin },
      empresas,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
});

// ── POST /api/auth/selecionar-empresa ────────────────────────
// 2º passo: confirma empresa escolhida, devolve token definitivo
router.post('/selecionar-empresa', async (req, res) => {
  const { token_temp, empresa_id } = req.body;
  if (!token_temp || !empresa_id)
    return res.status(400).json({ erro: 'Token e empresa são obrigatórios.' });

  let payload;
  try {
    payload = jwt.verify(token_temp, JWT_SECRET);
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }

  if (payload.etapa !== 'escolha_empresa')
    return res.status(400).json({ erro: 'Token inválido para esta etapa.' });

  try {
    // Verifica se usuário realmente pertence a essa empresa
    const [vinculo] = await db.query(
      'SELECT id FROM usuario_empresa WHERE usuario_id = ? AND empresa_id = ?',
      [payload.id, empresa_id]
    );
    if (!vinculo.length)
      return res.status(403).json({ erro: 'Você não tem acesso a esta empresa.' });

    const [emp] = await db.query('SELECT id, nome FROM empresas WHERE id = ? AND ativo = 1', [empresa_id]);
    if (!emp.length)
      return res.status(404).json({ erro: 'Empresa não encontrada.' });

    // Token definitivo (com empresa)
    const token = jwt.sign(
      { id: payload.id, email: payload.email, admin: payload.admin, empresa_id: Number(empresa_id) },
      JWT_SECRET, { expiresIn: '8h' }
    );

    return res.json({ token, empresa: emp[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
});

// ── POST /api/auth/cadastro ───────────────────────────────────
router.post('/cadastro', async (req, res) => {
  const { nome, sobrenome, email, senha } = req.body;
  if (!nome || !sobrenome || !email || !senha)
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  if (senha.length < 8)
    return res.status(400).json({ erro: 'Senha com mínimo 8 caracteres.' });
  try {
    const [exist] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email.toLowerCase()]);
    if (exist.length) return res.status(409).json({ erro: 'E-mail já cadastrado.' });
    const hash = await bcrypt.hash(senha, 12);
    const verifToken = crypto.randomBytes(32).toString('hex');
    const verifExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const [r] = await db.query(
      'INSERT INTO usuarios (nome, sobrenome, email, senha_hash, verificacao_token, verificacao_expiry) VALUES (?,?,?,?,?,?)',
      [nome, sobrenome, email.toLowerCase(), hash, verifToken, verifExpiry]
    );
    const appUrl = process.env.APP_URL || 'http://localhost:3001';
    const link = `${appUrl}/api/auth/verificar-email?token=${verifToken}`;
    await enviarEmail({ para: email.toLowerCase(), assunto: 'Confirme seu e-mail — Checklist', html: emailVerificacao(nome, link) });
    return res.status(201).json({ mensagem: 'Usuário criado. Verifique seu e-mail para confirmar a conta.', id: r.insertId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
});

// ── Middleware JWT ────────────────────────────────────────────
function autenticar(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ erro: 'Token ausente.' });
  try { req.usuario = jwt.verify(h.split(' ')[1], JWT_SECRET); next(); }
  catch { return res.status(401).json({ erro: 'Token inválido ou expirado.' }); }
}

function soAdmin(req, res, next) {
  if (!req.usuario.admin) return res.status(403).json({ erro: 'Acesso restrito ao administrador.' });
  next();
}

router.get('/me', autenticar, (req, res) => res.json({ usuario: req.usuario }));

// ── GET /api/auth/minhas-empresas ─────────────────────────────
router.get('/minhas-empresas', autenticar, async (req, res) => {
  try {
    const [empresas] = await db.query(
      `SELECT e.id, e.nome FROM empresas e
       JOIN usuario_empresa ue ON ue.empresa_id = e.id
       WHERE ue.usuario_id = ? AND e.ativo = 1 ORDER BY e.nome`,
      [req.usuario.id]
    );
    res.json({ empresas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno.' });
  }
});

// ── POST /api/auth/trocar-empresa ─────────────────────────────
router.post('/trocar-empresa', autenticar, async (req, res) => {
  const { empresa_id } = req.body;
  if (!empresa_id) return res.status(400).json({ erro: 'empresa_id obrigatório.' });
  try {
    const [vinculo] = await db.query(
      'SELECT id FROM usuario_empresa WHERE usuario_id = ? AND empresa_id = ?',
      [req.usuario.id, empresa_id]
    );
    if (!vinculo.length) return res.status(403).json({ erro: 'Você não tem acesso a esta empresa.' });

    const [emp] = await db.query('SELECT id, nome FROM empresas WHERE id = ? AND ativo = 1', [empresa_id]);
    if (!emp.length) return res.status(404).json({ erro: 'Empresa não encontrada.' });

    const token = jwt.sign(
      { id: req.usuario.id, email: req.usuario.email, admin: req.usuario.admin, empresa_id: Number(empresa_id) },
      JWT_SECRET, { expiresIn: '8h' }
    );
    res.json({ token, empresa: emp[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno.' });
  }
});

// ── POST /api/auth/esqueci-senha ──────────────────────────────
router.post('/esqueci-senha', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ erro: 'E-mail obrigatório.' });
  try {
    const [rows] = await db.query(
      'SELECT id, nome FROM usuarios WHERE email = ? AND ativo = 1',
      [email.toLowerCase()]
    );
    // Sempre retorna 200 para não revelar se o e-mail existe
    if (!rows.length) return res.json({ mensagem: 'Se o e-mail existir, você receberá um link de redefinição.' });

    const u = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await db.query('UPDATE usuarios SET reset_token = ?, reset_expiry = ? WHERE id = ?', [token, expiry, u.id]);

    const appUrl = process.env.APP_URL || 'http://localhost:3001';
    const link = `${appUrl}/reset-senha.html?token=${token}`;
    await enviarEmail({ para: email.toLowerCase(), assunto: 'Redefinição de senha — Checklist', html: emailResetSenha(u.nome, link) });

    return res.json({ mensagem: 'Se o e-mail existir, você receberá um link de redefinição.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
});

// ── POST /api/auth/redefinir-senha ────────────────────────────
router.post('/redefinir-senha', async (req, res) => {
  const { token, nova_senha } = req.body;
  if (!token || !nova_senha) return res.status(400).json({ erro: 'Token e nova senha são obrigatórios.' });
  if (nova_senha.length < 8) return res.status(400).json({ erro: 'Senha com mínimo 8 caracteres.' });
  try {
    const [rows] = await db.query(
      'SELECT id FROM usuarios WHERE reset_token = ? AND reset_expiry > NOW()',
      [token]
    );
    if (!rows.length) return res.status(400).json({ erro: 'Token inválido ou expirado.' });

    const hash = await bcrypt.hash(nova_senha, 12);
    await db.query(
      'UPDATE usuarios SET senha_hash = ?, reset_token = NULL, reset_expiry = NULL WHERE id = ?',
      [hash, rows[0].id]
    );
    return res.json({ mensagem: 'Senha redefinida com sucesso.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
});

// ── GET /api/auth/verificar-email ─────────────────────────────
router.get('/verificar-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Token obrigatório.');
  try {
    const [rows] = await db.query(
      'SELECT id FROM usuarios WHERE verificacao_token = ? AND verificacao_expiry > NOW()',
      [token]
    );
    if (!rows.length) return res.status(400).send('Token inválido ou expirado.');

    await db.query(
      'UPDATE usuarios SET email_verificado = 1, verificacao_token = NULL, verificacao_expiry = NULL WHERE id = ?',
      [rows[0].id]
    );
    const appUrl = process.env.APP_URL || 'http://localhost:3001';
    return res.redirect(`${appUrl}/email-verificado.html`);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Erro interno.');
  }
});

// ── POST /api/auth/reenviar-verificacao ───────────────────────
router.post('/reenviar-verificacao', autenticar, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nome, email, email_verificado FROM usuarios WHERE id = ?',
      [req.usuario.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    const u = rows[0];
    if (u.email_verificado) return res.status(400).json({ erro: 'E-mail já verificado.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.query('UPDATE usuarios SET verificacao_token = ?, verificacao_expiry = ? WHERE id = ?', [token, expiry, u.id]);

    const appUrl = process.env.APP_URL || 'http://localhost:3001';
    const link = `${appUrl}/api/auth/verificar-email?token=${token}`;
    await enviarEmail({ para: u.email, assunto: 'Confirme seu e-mail — Checklist', html: emailVerificacao(u.nome, link) });

    return res.json({ mensagem: 'E-mail de verificação reenviado.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
});

module.exports = router;
module.exports.autenticar = autenticar;
module.exports.soAdmin    = soAdmin;
