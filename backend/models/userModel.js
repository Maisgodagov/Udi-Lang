const { db } = require('../config/db');  // Импортируем пул соединений

class User {
  // Поиск пользователя по email
  static async findByEmail(email) {
    try {
      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0]; // Возвращаем первого найденного пользователя
    } catch (err) {
      throw err; // Пробрасываем ошибку, если что-то пошло не так
    }
  }

  // Поиск пользователя по ID
  static async findById(userId) {
    try {
      const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
      return rows[0]; // Возвращаем первого найденного пользователя
    } catch (err) {
      throw err; // Пробрасываем ошибку, если что-то пошло не так
    }
  }

  constructor(username, email, password) {
    this.username = username;
    this.email = email;
    this.password = password;
  }

  // Сохранение пользователя в базу данных
  async save() {
    try {
      await db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
        [this.username, this.email, this.password]);
    } catch (err) {
      throw err; // Пробрасываем ошибку, если что-то пошло не так
    }
  }
}

module.exports = { User };
