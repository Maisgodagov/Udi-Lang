const express = require('express');
const { getDictionary, addWord, upload } = require('../controllers/dictionaryController'); // Подключаем контроллер
const router = express.Router();

// Получить все слова из словаря
router.get('/dictionary', getDictionary);

// Добавить слово в словарь
router.post('/dictionary', upload.single('audio'), addWord); // Используем multer для загрузки одного файла

module.exports = { dictionaryRoutes: router };
