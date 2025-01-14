const express = require('express');
const { getProfile } = require('../controllers/userController');  // Убедись, что правильно импортирована функция
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');
const { getUsers } = require('../controllers/userController')

const router = express.Router();

// Используем getProfile как обработчик для маршрута
router.get('/profile', authMiddleware, getProfile);  // Прокачиваешь запрос на правильный обработчик

router.get('/users', authMiddleware, getUsers);
router.get(
    '/users',
    authMiddleware,
    checkRole(['admin', 'moderator']),
    getUsers
  );
module.exports = router; // Экспортируем router напрямую
