require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const path      = require('path');
const https     = require('https');
const http      = require('http');
const fs        = require('fs');

const app        = express();
const PORT       = process.env.PORT       || 3001;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const SSL_KEY    = process.env.SSL_KEY_PATH;
const SSL_CERT   = process.env.SSL_CERT_PATH;

app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', rateLimit({ windowMs: 15*60*1000, max: 40, message: { erro: 'Muitas tentativas.' } }));

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/empresas',      require('./routes/empresas'));
app.use('/api/usuarios',      require('./routes/usuarios'));
app.use('/api/perspectivas',  require('./routes/perspectivas'));
app.use('/api/indicadores',   require('./routes/indicadores'));
app.use('/api/resultados',    require('./routes/resultados'));
app.use('/api/rdp',           require('./routes/rdp'));

app.use(express.static(path.join(__dirname, '../frontend/public')));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, '../frontend/public/index.html')));

if (SSL_KEY && SSL_CERT) {
  const sslOptions = {
    key:  fs.readFileSync(SSL_KEY),
    cert: fs.readFileSync(SSL_CERT),
  };

  https.createServer(sslOptions, app).listen(HTTPS_PORT, () =>
    console.log(`🔒 Checklist em https://localhost:${HTTPS_PORT}`)
  );

  // Redireciona HTTP → HTTPS
  http.createServer((req, res) => {
    const host = (req.headers.host || '').replace(/:\d+$/, '');
    res.writeHead(301, { Location: `https://${host}:${HTTPS_PORT}${req.url}` });
    res.end();
  }).listen(PORT, () =>
    console.log(`↪️  HTTP redirect em http://localhost:${PORT} → https://localhost:${HTTPS_PORT}`)
  );
} else {
  app.listen(PORT, () => console.log(`🚀 Checklist em http://localhost:${PORT}`));
}
