#!/usr/bin/env node
/**
 * Build script: copia o frontend para www/ e substitui paths
 * relativos de API pela URL do servidor de produção.
 *
 * Uso:
 *   node scripts/build.js
 *   API_URL=https://meu-servidor.com node scripts/build.js
 */

const fs   = require('fs');
const path = require('path');

// Carrega .env se existir
const envFile = path.resolve(__dirname, '../.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const [key, ...val] = line.trim().split('=');
    if (key && !key.startsWith('#') && !process.env[key]) {
      process.env[key] = val.join('=');
    }
  }
}

const API_URL = process.env.API_URL || 'https://SEU_SERVIDOR_AQUI';

const SRC_DIR = path.resolve(__dirname, '../../frontend/public');
const OUT_DIR = path.resolve(__dirname, '../www');

// ── Limpa e recria www/ ─────────────────────────────────────────
if (fs.existsSync(OUT_DIR)) fs.rmSync(OUT_DIR, { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Copia e patcha cada arquivo HTML ───────────────────────────
const files = fs.readdirSync(SRC_DIR);

for (const file of files) {
  const srcFile = path.join(SRC_DIR, file);
  const outFile = path.join(OUT_DIR, file);

  const stat = fs.statSync(srcFile);
  if (stat.isDirectory()) {
    // Copia subdiretórios (assets, etc.) integralmente
    copyDir(srcFile, outFile);
    continue;
  }

  if (!file.endsWith('.html')) {
    fs.copyFileSync(srcFile, outFile);
    continue;
  }

  let content = fs.readFileSync(srcFile, 'utf8');

  // No mobile (Capacitor), usa replace() para não empilhar login no histórico.
  // Só aplica se estiver rodando como app nativo.
  content = content.replace(
    "window.location.href='/dashboard.html'",
    "(window.Capacitor&&window.Capacitor.isNativePlatform?window.Capacitor.isNativePlatform():false)?window.location.replace('/dashboard.html'):window.location.href='/dashboard.html'"
  );

  // Substitui paths relativos de API por URL absoluta
  // Cobre padrões: '/api/...' e "/api/..."
  content = content.replace(/(['"`])\/api\//g, `$1${API_URL}/api/`);

  // Substitui fetch('/api/ ou fetch("/api/
  content = content.replace(/fetch\((['"`])\/api\//g, `fetch($1${API_URL}/api/`);

  // Template literals: fetch(`/api/${...}`)  → fetch(`${API_URL}/api/${...}`)
  // Já coberto pela regex acima para backtick, mas garantimos template literals também:
  content = content.replace(/fetch\(`\/api\//g, `fetch(\`${API_URL}/api/`);

  // Adiciona meta para permitir conteúdo misto e viewport otimizado para mobile
  content = content.replace(
    '<meta name="viewport" content="width=device-width,initial-scale=1.0"/>',
    '<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>'
  );

  // Injeta capacitor.js e botão de voltar antes do </head>
  const backButtonSnippet = `
  <script src="capacitor.js"></script>
  <style>
    #mob-back-btn {
      display: none;
      position: fixed;
      top: 12px;
      left: 12px;
      z-index: 99999;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(124,58,237,0.85);
      border: none;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      backdrop-filter: blur(4px);
    }
    #mob-back-btn svg { display: block; }
  </style>
  <script>
    (function() {
      function isMobile() {
        return typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform
          ? window.Capacitor.isNativePlatform()
          : /Android|iPhone|iPad/i.test(navigator.userAgent);
      }
      window.addEventListener('DOMContentLoaded', function() {
        if (!isMobile()) return;
        var btn = document.createElement('button');
        btn.id = 'mob-back-btn';
        btn.setAttribute('aria-label', 'Voltar');
        btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
        btn.addEventListener('click', function() {
          if (window.history.length > 1) {
            window.history.back();
          }
        });
        document.body.appendChild(btn);
        function updateBtn() {
          btn.style.display = (window.history.length > 1) ? 'flex' : 'none';
        }
        updateBtn();
        window.addEventListener('popstate', updateBtn);
        window.addEventListener('pushstate', updateBtn);
        // Monitora mudanças de página via pushState
        var origPush = history.pushState.bind(history);
        history.pushState = function() { origPush.apply(this, arguments); updateBtn(); };
      });
    })();
  </script>`;

  content = content.replace('</head>', backButtonSnippet + '\n</head>');

  fs.writeFileSync(outFile, content, 'utf8');
  console.log(`✓ ${file}`);
}

// Gera manifest.json para PWA/Android
const manifest = {
  name: 'Checklist',
  short_name: 'Checklist',
  start_url: '/index.html',
  display: 'standalone',
  background_color: '#0a0a14',
  theme_color: '#7c3aed',
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
  ]
};

fs.writeFileSync(
  path.join(OUT_DIR, 'manifest.json'),
  JSON.stringify(manifest, null, 2),
  'utf8'
);
console.log('✓ manifest.json');

// Cria pasta de ícones com placeholder (substitua pelos ícones reais)
const iconsDir = path.join(OUT_DIR, 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

console.log('\n✅ Build concluído em www/');
console.log(`   API_URL = ${API_URL}`);
if (API_URL === 'https://SEU_SERVIDOR_AQUI') {
  console.log('\n⚠️  ATENÇÃO: defina a variável de ambiente API_URL antes de gerar o APK:');
  console.log('   API_URL=https://meu-servidor.com node scripts/build.js');
}

// ── Helpers ────────────────────────────────────────────────────
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
