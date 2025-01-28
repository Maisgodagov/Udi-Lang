const { db } = require('../config/db');
const { User } = require('../models/userModel');

// Функция для получения профиля пользователя
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // userId из токена
    // Добавляем в SELECT нужные поля
    const [rows] = await db.query(`
      SELECT 
        username, 
        email, 
        role, 
        created_at, 
        xp,
        first_name,
        last_name,
        gender,
        birth_date
      FROM users
      WHERE id = ?
    `, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = rows[0];
    res.status(200).json(user);
  } catch (error) {
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

// userController.js
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.userId; // должно быть 8
    
    const [rows] = await db.query('SELECT * FROM user_word_progress WHERE user_id = ?', [userId]);

    // Посмотрим, что реально вернулось. Может быть там пусто.
    
    // Потом делаем COUNT(*):
    const [[{ totalLearned }]] = await db.query(`
      SELECT COUNT(*) AS totalLearned
      FROM user_word_progress
      WHERE user_id = ?
    `, [userId]);

    const [[{ masteredCount }]] = await db.query(`
      SELECT COUNT(*) AS masteredCount
      FROM user_word_progress
      WHERE user_id = ?
        AND status = 'mastered'
    `, [userId]);

    const [[{ needReviewCount }]] = await db.query(`
      SELECT COUNT(*) AS needReviewCount
      FROM user_word_progress
      WHERE user_id = ?
        AND status = 'need_review'
    `, [userId]);

    res.status(200).json({
      totalLearned,
      masteredCount,
      needReviewCount,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user stats' });
  }
};
// Получение статистики пользователя по фразам
const getUserPhraseStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in request' });
    }

    // Общее количество изучаемых фраз
    const [[{ totalPhrases }]] = await db.query(`
      SELECT COUNT(*) AS totalPhrases 
      FROM user_phrase_progress 
      WHERE user_id = ?
    `, [userId]);

    // Количество выученных фраз
    const [[{ masteredPhrases }]] = await db.query(`
      SELECT COUNT(*) AS masteredPhrases 
      FROM user_phrase_progress 
      WHERE user_id = ? 
        AND status = 'mastered'
    `, [userId]);

    // Количество фраз, которые нужно повторить
    const [[{ needReviewPhrases }]] = await db.query(`
      SELECT COUNT(*) AS needReviewPhrases 
      FROM user_phrase_progress 
      WHERE user_id = ? 
        AND status = 'need_review'
    `, [userId]);

    res.status(200).json({
      totalPhrases,
      masteredPhrases,
      needReviewPhrases,
    });
  } catch (err) {
    console.error('Error fetching user phrase stats:', err);
    res.status(500).json({ message: 'Error fetching user phrase stats' });
  }
};

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
        res.status(500).json({ message: 'Ошибка при обновлении слова'})
      }
  }
  
module.exports = { getProfile, getUsers, getUserPhraseStats, getUserStats, changeUserRole };  // Экспортируем функцию для использования в маршрутах
