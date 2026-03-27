require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const path      = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;

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

app.listen(PORT, () => console.log(`🚀 Checklist em http://localhost:${PORT}`));
