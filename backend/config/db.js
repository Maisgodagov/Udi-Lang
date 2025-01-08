const mysql = require('mysql2');

// Настроим пул соединений для базы данных
const pool = mysql.createPool({
  host: 'mgodag3j.beget.tech',
  user: 'mgodag3j_admin',
  password: 'Mais19970619.',
  database: 'mgodag3j_admin'
});

// Получение соединения с промисами
const db = pool.promise();  // Применяем promise() к пулу соединений

module.exports = { db };
