const multer = require('multer');
const path = require('path');
const { db } = require('../config/db');

// Путь к папке uploads в корне проекта
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Указываем абсолютный путь к папке uploads в корне проекта
    const uploadsPath = path.join(__dirname, '../../uploads');  // Дважды ".." чтобы выйти из папки backend
    console.log('Uploads path:', uploadsPath);  // Логируем путь для проверки
    cb(null, uploadsPath);  // Убедитесь, что путь правильный
  },
  filename: (req, file, cb) => {
    // Генерация уникального имени для файла
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Функция для получения всех слов из словаря
const getDictionary = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM dictionary'); // Запрос к базе данных
    res.status(200).json(results);  // Отправляем данные
  } catch (err) {
    console.error('Ошибка при загрузке слов:', err);
    res.status(500).json({ message: 'Ошибка при загрузке слов' });
  }
};

// Функция для добавления нового слова в словарь
const addWord = async (req, res) => {
  const { word_udi, word_rus, username } = req.body;  // Получаем имя пользователя из тела запроса
  const audioUrl = req.file ? `/uploads/${req.file.filename}` : '';  // Путь к файлу

  console.log('Received data:', req.body);
  console.log('Received file:', req.file);  // Логируем файл

  if (!word_udi || !word_rus || !audioUrl || !username) {
    return res.status(400).json({ message: 'Нужно заполнить все поля, включая запись произношения' });
  }

  try {
    const query = 'INSERT INTO dictionary (word_udi, word_rus, audio_url, username) VALUES (?, ?, ?, ?)';
    const [results] = await db.query(query, [word_udi, word_rus, audioUrl, username]);  // Передаем username
    res.status(201).json({ message: 'Слово добавлено', wordId: results.insertId });
  } catch (err) {
    console.error('Error adding word to dictionary:', err);
    res.status(500).json({ message: 'Ошибка при добавлении слова' });
  }
};

// Функция для получения слов, у которых нет перевода
// Функция для получения слов, у которых нет перевода на удинский
const getWordsToTranslate = async (req, res) => {
  try {
    // Запрос к базе данных, чтобы получить слова с пустым полем word_udi
    const [results] = await db.query('SELECT * FROM dictionary WHERE word_udi IS NULL OR word_udi = ""');
    res.status(200).json(results);  // Отправляем результаты
  } catch (err) {
    console.error('Ошибка при получении слов:', err);
    res.status(500).json({ message: 'Ошибка при получении слов для перевода' });
  }
};


const addTranslation = async (req, res) => {
  const { word_udi, word_rus, username } = req.body;
  const audioUrl = req.file ? `/uploads/${req.file.filename}` : '';  // Путь к файлу

  console.log('Received translation data:', { word_udi, word_rus, audioUrl, username });

  if (!audioUrl) {
    return res.status(400).json({ message: 'Audio file is required' });
  }

  try {
    const query = 'UPDATE dictionary SET word_udi = ?, audio_url = ? WHERE word_rus = ?';
    await db.query(query, [word_udi, audioUrl, word_rus]);
    res.status(200).json({ message: 'Translation added successfully' });
  } catch (err) {
    console.error('Error adding translation:', err);
    res.status(500).json({ message: 'Error adding translation' });
  }
};


module.exports = { getDictionary, addWord, getWordsToTranslate, addTranslation, upload };
