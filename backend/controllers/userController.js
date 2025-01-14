const { User } = require('../models/userModel');

// Функция для получения профиля пользователя
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;  // Извлекаем ID пользователя из токена
    const user = await User.findById(userId);  // Получаем данные пользователя

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    });
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

module.exports = { getProfile, getUsers };  // Экспортируем функцию для использования в маршрутах
