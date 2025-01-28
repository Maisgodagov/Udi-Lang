const { db } = require('../config/db');
const { User } = require('../models/userModel');

// Функция для получения профиля пользователя
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;  // из токена
    const [rows] = await db.query('SELECT username, email, role, created_at, xp, first_name, last_name, gender, birth_date FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = rows[0];
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
};

const getUsers = async (req, res) => {
  try {
    const [users] = await db.query('SELECT * FROM users');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при загрузке пользователей'})
  }
}
// Изменение роли пользователя 
  const changeUserRole = async (req, res) => {
      const { id } = req.params;
      const { role } = req.body;
      if (!role) {
        return res.satus(400).json({ message: 'Вы не выбрали роль'});
      }
      try {
        const query = 'UPDATE users SET role = ? WHERE id = ?';
        const [result] = await db.query(query, [role, id]);
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Слово не найдено' });
        }
        res.status(200).json({ message: 'Роль пользователя обновлена' });      
      } catch (err) {
        console.error('Ошибка при обновлении роли:', err);
        res.status(500).json({ message: 'Ошибка при обновлении слова'})
      }
  }
  
module.exports = { getProfile, getUsers, changeUserRole };  // Экспортируем функцию для использования в маршрутах
