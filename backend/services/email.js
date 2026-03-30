const nodemailer = require('nodemailer');

function createTransporter() {
  if (!process.env.EMAIL_USER) return null;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function enviarEmail({ para, assunto, html }) {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('\n📧 [EMAIL - MODO DEV - configure EMAIL_USER no .env para envio real]');
    console.log(`   Para: ${para}`);
    console.log(`   Assunto: ${assunto}`);
    console.log(`   Conteúdo: ${html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()}\n`);
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"Checklist" <${process.env.EMAIL_USER}>`,
    to: para,
    subject: assunto,
    html,
  });
}

function emailResetSenha(nome, link) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f7f6fb;padding:40px 20px;">
    <div style="background:#fff;border-radius:16px;padding:40px;box-shadow:0 2px 20px rgba(0,0,0,0.06);">
      <div style="text-align:center;margin-bottom:32px;">
        <span style="background:linear-gradient(135deg,#7c3aed,#6d28d9);border-radius:12px;padding:10px 20px;color:#fff;font-size:18px;font-weight:800;">✓ Checklist</span>
      </div>
      <h2 style="color:#0d0d1a;font-size:22px;font-weight:800;margin:0 0 8px;">Redefinição de Senha</h2>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Olá, <strong>${nome}</strong>! Recebemos uma solicitação para redefinir a senha da sua conta.
      </p>
      <a href="${link}" style="display:block;text-align:center;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:700;font-size:15px;margin:0 0 24px;">
        Redefinir Minha Senha
      </a>
      <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0;">
        Este link expira em <strong>1 hora</strong>. Se você não solicitou a redefinição, ignore este e-mail — sua senha permanece a mesma.
      </p>
      <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;">
      <p style="color:#d1d5db;font-size:11px;text-align:center;margin:0;">
        Ou copie e cole este link no navegador:<br>
        <span style="color:#a78bfa;word-break:break-all;">${link}</span>
      </p>
    </div>
  </div>`;
}

function emailVerificacao(nome, link) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f7f6fb;padding:40px 20px;">
    <div style="background:#fff;border-radius:16px;padding:40px;box-shadow:0 2px 20px rgba(0,0,0,0.06);">
      <div style="text-align:center;margin-bottom:32px;">
        <span style="background:linear-gradient(135deg,#7c3aed,#6d28d9);border-radius:12px;padding:10px 20px;color:#fff;font-size:18px;font-weight:800;">✓ Checklist</span>
      </div>
      <h2 style="color:#0d0d1a;font-size:22px;font-weight:800;margin:0 0 8px;">Confirme seu E-mail</h2>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Olá, <strong>${nome}</strong>! Clique no botão abaixo para verificar seu endereço de e-mail e ativar sua conta.
      </p>
      <a href="${link}" style="display:block;text-align:center;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:700;font-size:15px;margin:0 0 24px;">
        Verificar E-mail
      </a>
      <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0;">
        Este link expira em <strong>24 horas</strong>. Se você não criou uma conta, ignore este e-mail.
      </p>
      <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;">
      <p style="color:#d1d5db;font-size:11px;text-align:center;margin:0;">
        Ou copie e cole este link no navegador:<br>
        <span style="color:#a78bfa;word-break:break-all;">${link}</span>
      </p>
    </div>
  </div>`;
}

module.exports = { enviarEmail, emailResetSenha, emailVerificacao };
