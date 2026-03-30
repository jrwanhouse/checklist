const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST || 'localhost',
  port:     process.env.DB_PORT || 3306,
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'wan965gwh@!#',
  database: process.env.DB_NAME || 'checklist',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

// Testa a conexão ao iniciar
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL conectado com sucesso!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Erro ao conectar no MySQL:', err.message);
    process.exit(1);
  });

module.exports = pool;
