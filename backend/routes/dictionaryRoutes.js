const express = require('express');
const { db } = require('../config/db'); // Если требуется для inline-запроса (не обязательно)
const { 
  getDictionary, 
  addWord, 
  upload, 
  getWordsToTranslate, 
  getPhrasesToTranslate, 
  addPhraseTranslation, 
  addTranslation, 
  getUserStats, 
  updateWord, 
  deleteWord, 
  getDictionaryStatistics,
  addPhrase
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

// 4. Получение слов без перевода
router.get(
  '/words-to-translate',
  authMiddleware,
  checkRole(['admin', 'translator', 'moderator']),
  getWordsToTranslate
);

// 5. Получение фраз без перевода
router.get(
  '/phrases-to-translate',
  authMiddleware,
  checkRole(['admin', 'translator', 'moderator']),
  getPhrasesToTranslate
);

// 6. Добавление перевода для слова (обновление таблицы dictionary)
router.post(
  '/add-translation',
  authMiddleware,
  checkRole(['translator', 'admin', 'moderator']),
  upload.single('audio'),
  addTranslation
);

// 7. Добавление перевода для фразы (обновление таблицы phrases)
router.post(
  '/add-phrase-translation',
  authMiddleware,
  checkRole(['translator', 'admin', 'moderator']),
  upload.single('audio'),
  addPhraseTranslation
);

// 8. Статистика по словарю
router.get(
  '/dictionary-statistics',
  authMiddleware,
  checkRole(['admin', 'translator', 'moderator']),
  getDictionaryStatistics
);

// 9. Статистика по пользователю
router.get(
  '/user/stats',
  authMiddleware,
  checkRole(['admin', 'moderator', 'translator', 'user']),
  getUserStats
);

// 10. Обновление слова
router.put(
  '/dictionary/:id',
  authMiddleware,
  checkRole(['admin', 'moderator']),
  updateWord
);

// 11. Удаление слова
router.delete(
  '/dictionary/:id',
  authMiddleware,
  checkRole(['admin', 'moderator']),
  deleteWord
);

// 12. Добавление новой фразы (вставка в таблицу phrases)
router.post(
  '/phrases',
  authMiddleware,
  checkRole(['admin', 'moderator']),
  upload.single('audio'),
  addPhrase
);

module.exports = router;
