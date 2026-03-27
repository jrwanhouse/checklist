const express = require('express');
const db = require('../db');
const { autenticar } = require('./auth');
const router = express.Router();

router.use(autenticar);

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.id, i.nome, i.descricao, i.natureza, i.unidade, i.percentual,
              i.acumulado, i.segmento, i.fonte,
              i.rgvini, i.rgvfim, i.rgaini, i.rgafim, i.rgveini, i.rgvefim,
              i.ativo, i.perspectiva_id, p.nome AS perspectiva_nome
       FROM indicadores i
       LEFT JOIN perspectivas p ON p.id = i.perspectiva_id
       WHERE i.empresa_id = ? ORDER BY i.nome`,
      [req.usuario.empresa_id]
    );
    res.json({ indicadores: rows });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

function extrairCampos(body) {
  const {
    nome, descricao, perspectiva_id,
    natureza, unidade, percentual, acumulado, segmento, fonte,
    rgvini, rgvfim, rgaini, rgafim, rgveini, rgvefim
  } = body;
  return {
    nome, descricao: descricao || null,
    perspectiva_id: perspectiva_id || null,
    natureza: natureza || '',
    unidade: unidade || '',
    percentual: percentual ?? 0,
    acumulado: acumulado ? 1 : 0,
    segmento: segmento ? 1 : 0,
    fonte: fonte || '',
    rgvini: rgvini ?? null, rgvfim: rgvfim ?? null,
    rgaini: rgaini ?? null, rgafim: rgafim ?? null,
    rgveini: rgveini ?? null, rgvefim: rgvefim ?? null,
  };
}

router.post('/', async (req, res) => {
  const f = extrairCampos(req.body);
  if (!f.nome) return res.status(400).json({ erro: 'Nome obrigatório.' });
  try {
    const [r] = await db.query(
      `INSERT INTO indicadores
        (empresa_id, perspectiva_id, nome, descricao, natureza, unidade, percentual,
         acumulado, segmento, fonte, rgvini, rgvfim, rgaini, rgafim, rgveini, rgvefim)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [req.usuario.empresa_id, f.perspectiva_id, f.nome, f.descricao, f.natureza,
       f.unidade, f.percentual, f.acumulado, f.segmento, f.fonte,
       f.rgvini, f.rgvfim, f.rgaini, f.rgafim, f.rgveini, f.rgvefim]
    );
    res.status(201).json({ id: r.insertId, mensagem: 'Indicador criado.' });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

router.put('/:id', async (req, res) => {
  const f = extrairCampos(req.body);
  const ativo = req.body.ativo ?? 1;
  try {
    const [r] = await db.query(
      `UPDATE indicadores SET
        perspectiva_id=?, nome=?, descricao=?, natureza=?, unidade=?, percentual=?,
        acumulado=?, segmento=?, fonte=?, rgvini=?, rgvfim=?, rgaini=?, rgafim=?,
        rgveini=?, rgvefim=?, ativo=?
       WHERE id=? AND empresa_id=?`,
      [f.perspectiva_id, f.nome, f.descricao, f.natureza, f.unidade, f.percentual,
       f.acumulado, f.segmento, f.fonte, f.rgvini, f.rgvfim, f.rgaini, f.rgafim,
       f.rgveini, f.rgvefim, ativo, req.params.id, req.usuario.empresa_id]
    );
    if (!r.affectedRows) return res.status(404).json({ erro: 'Indicador não encontrado.' });
    res.json({ mensagem: 'Indicador atualizado.' });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const [r] = await db.query(
      'DELETE FROM indicadores WHERE id=? AND empresa_id=?',
      [req.params.id, req.usuario.empresa_id]
    );
    if (!r.affectedRows) return res.status(404).json({ erro: 'Indicador não encontrado.' });
    res.json({ mensagem: 'Indicador excluído.' });
  } catch (e) { res.status(500).json({ erro: 'Erro interno.' }); }
});

module.exports = router;
