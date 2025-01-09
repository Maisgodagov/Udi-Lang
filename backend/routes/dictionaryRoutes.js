const express = require('express');
const { getDictionary, addWord, upload, getWordsToTranslate, addTranslation } = require('../controllers/dictionaryController');
const router = express.Router();

router.get('/dictionary', getDictionary);
router.post('/dictionary', upload.single('audio'), addWord); // Используем multer для загрузки одного файла
router.get('/words-to-translate', getWordsToTranslate); // Получаем слова без перевода
router.post('/add-translation', upload.single('audio'), addTranslation); // Добавляем перевод

module.exports = router;
