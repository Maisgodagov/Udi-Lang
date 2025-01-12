const express = require('express');
const { 
  getDictionary, 
  addWord, 
  upload, 
  getWordsToTranslate, 
  getUserStats, 
  updateWord, 
  deleteWord, 
  getDictionaryStatistics, 
  addTranslation 
} = require('../controllers/dictionaryController');

const { authMiddleware, checkRole } = require('../middleware/authMiddleware'); // Экспорт через деструктуризацию.

const router = express.Router();

router.get('/dictionary', authMiddleware, getDictionary); // Доступ для всех авторизованных пользователей

router.post(
  '/dictionary',
  authMiddleware,
  checkRole(['admin', 'moderator']), // Только для админа и модератора
  upload.single('audio'),
  addWord
);

router.get(
  '/words-to-translate',
  authMiddleware,
  checkRole(['admin', 'translator', 'moderator']), // Только для админа и переводчика
  getWordsToTranslate
);

router.post(
  '/add-translation',
  authMiddleware,
  checkRole(['translator', 'admin', 'moderator' ]), // Только для переводчика
  upload.single('audio'),
  addTranslation
);

router.get(
  '/dictionary-statistics',
  authMiddleware,
  checkRole(['admin', 'translator', 'moderator']), // Только для админа
  getDictionaryStatistics
);

router.get(
  '/user/stats',
  authMiddleware,
  checkRole(['admin', 'moderator', 'translator']), // Для админа, модератора и переводчика
  getUserStats
);

router.put(
  '/dictionary/:id',
  authMiddleware,
  checkRole(['admin', 'moderator']), // Для админа и модератора
  updateWord
);

router.delete(
  '/dictionary/:id',
  authMiddleware,
  checkRole(['admin', 'moderator']), // Только для админа
  deleteWord
);

router.get('/test', (req, res) => {
  res.status(200).json({ message: 'Test route works!' });
});

module.exports = router;
