const express = require('express');
const { getDictionary, addWord, upload, getWordsToTranslate, getUserStats, getDictionaryStatistics, addTranslation } = require('../controllers/dictionaryController');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.get('/dictionary', getDictionary);
router.post('/dictionary', upload.single('audio'), addWord); // Используем multer для загрузки одного файла
router.get('/words-to-translate', getWordsToTranslate); // Получаем слова без перевода
router.post('/add-translation', upload.single('audio'), addTranslation); // Добавляем перевод
router.get('/dictionary-statistics', getDictionaryStatistics);
router.get('/user/stats', authMiddleware, getUserStats);

module.exports = router;
