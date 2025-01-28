const express = require('express');
const { getProfile } = require('../controllers/userController');  // Убедись, что правильно импортирована функция
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');
const { getUsers, changeUserRole } = require('../controllers/userController')

const router = express.Router();

// Используем getProfile как обработчик для маршрута
router.get('/profile', authMiddleware, getProfile);  // Прокачиваешь запрос на правильный обработчик

router.get('/users', getUsers);

// Обновление роли юзера
router.put(
    '/users/:id',
    authMiddleware,
    checkRole(['admin']),
    changeUserRole
  );

  // **новый** маршрут для статистики
// GET /api/user/stats
router.get('/users/stats', authMiddleware, getUserStats);
  
module.exports = router; // Экспортируем router напрямую
