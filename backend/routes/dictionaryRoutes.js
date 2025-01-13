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
  checkRole(['admin', 'moderator', 'translator', 'user']), // Для админа, модератора и переводчика
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

router.get('/mixed-words-phrases', async (req, res) => {
  try {
    const [words] = await db.query(
      'SELECT id, word_rus AS text, word_udi, audio_url, "word" AS type FROM dictionary'
    );
    const [phrases] = await db.query(
      'SELECT id, phrase_rus AS text, phrase_udi, audio_url, "phrase" AS type FROM phrases'
    );

    const mixed = [...words, ...phrases];
    if (mixed.length === 0) {
      return res.status(404).json({ message: 'Нет доступных данных для перевода' });
    }

    mixed.sort(() => Math.random() - 0.5);
    res.json(mixed);
  } catch (err) {
    console.error('Error fetching mixed data:', err);
    res.status(500).json({ error: 'Ошибка при загрузке данных' });
  }
});

module.exports = router;
