const express = require('express');
const { db } = require('../config/db'); // Если требуется
const { 
  getDictionary, 
  addWord, 
  upload, 
  getWordsToTranslate, 
  getUserStats, 
  updateWord, 
  deleteWord, 
  getDictionaryStatistics, 
  addTranslation,
  getMixedWordsPhrases,  // Добавляем новую функцию
  // Также можно добавить getPhrasesToTranslate, addPhraseTranslation, addPhrase, если нужно
} = require('../controllers/dictionaryController');

const { authMiddleware, checkRole } = require('../middleware/authMiddleware');
const router = express.Router();

// 1. Тестовый маршрут
router.get('/test', (req, res) => {
  res.status(200).json({ message: 'Test route works!' });
});

// 2. Получение всего словаря (для авторизованных пользователей)
router.get('/dictionary', authMiddleware, getDictionary);

// 3. Добавление нового слова (только для admin и moderator)
router.post(
  '/dictionary',
  authMiddleware,
  checkRole(['admin', 'moderator']),
  upload.single('audio'),
  addWord
);

// 4. Получение слов без перевода (для admin, translator, moderator)
router.get(
  '/words-to-translate',
  authMiddleware,
  checkRole(['admin', 'translator', 'moderator']),
  getWordsToTranslate
);

// 5. Добавление перевода для слова (POST /api/add-translation)
router.post(
  '/add-translation',
  authMiddleware,
  checkRole(['translator', 'admin', 'moderator']),
  upload.single('audio'),
  addTranslation
);

// 6. Получение смешанного списка слов и фраз
router.get(
  '/mixed-words-phrases',
  authMiddleware,
  // Если нужно ограничить доступ, добавьте checkRole([...])
  getMixedWordsPhrases
);

// 7. Статистика по словарю
router.get(
  '/dictionary-statistics',
  authMiddleware,
  checkRole(['admin', 'translator', 'moderator']),
  getDictionaryStatistics
);

// 8. Статистика по пользователю
router.get(
  '/user/stats',
  authMiddleware,
  checkRole(['admin', 'moderator', 'translator', 'user']),
  getUserStats
);

// 9. Обновление слова
router.put(
  '/dictionary/:id',
  authMiddleware,
  checkRole(['admin', 'moderator']),
  updateWord
);

// 10. Удаление слова
router.delete(
  '/dictionary/:id',
  authMiddleware,
  checkRole(['admin', 'moderator']),
  deleteWord
);

module.exports = router;
