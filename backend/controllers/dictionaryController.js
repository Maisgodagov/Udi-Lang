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
  const baseUrl = process.env.BASE_URL || 'https://udilang.ru'; // Добавьте эту строку
  const audioUrl = `${baseUrl}/uploads/${req.file.filename}`;


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
  const { word_udi, word_rus, username } = req.body;  // Получаем имя пользователя из тела запроса
  const baseUrl = process.env.BASE_URL || 'https://udilang.ru'; // Добавьте эту строку
  const audioUrl = req.file ? `${baseUrl}/uploads/${req.file.filename}` : '';
 

  console.log('Received translation data:', { word_udi, word_rus, audioUrl, username });

  if (!audioUrl) {
    return res.status(400).json({ message: 'Audio file is required' });
  }

  try {
    // Обновляем поля word_udi, audio_url и username в базе данных для определенного слова
    const query = 'UPDATE dictionary SET word_udi = ?, audio_url = ?, username = ? WHERE word_rus = ?';
    await db.query(query, [word_udi, audioUrl, username, word_rus]);  // Передаем параметры в правильном порядке
    res.status(200).json({ message: 'Translation added successfully' });
  } catch (err) {
    console.error('Error adding translation:', err);
    res.status(500).json({ message: 'Error adding translation' });
  }
};

// Функция для получения статистики по пользователю
const getUserStats = async (req, res) => {
  const username = req.user.username;  // Получаем имя пользователя из токена

  try {
    // Получаем количество переведенных слов
    const [translatedResults] = await db.query(
      'SELECT COUNT(*) AS translated FROM dictionary WHERE username = ? AND word_udi IS NOT NULL AND word_udi != ""',
      [username]
    );

    // Получаем общее количество добавленных слов
    const [totalResults] = await db.query(
      'SELECT COUNT(*) AS total FROM dictionary WHERE username = ?',
      [username]
    );

    console.log('Stats:', {
      translated: translatedResults[0].translated,
      total: totalResults[0].total
    }); // Логируем для проверки

    res.status(200).json({
      translated: translatedResults[0].translated,
      total: totalResults[0].total,
    });
  } catch (err) {
    console.error('Error fetching user stats:', err);
    res.status(500).json({ message: 'Error fetching user stats' });
  }
};


// Функция для обновления слова
const updateWord = async (req, res) => {
  const { id } = req.params; // ID слова из URL
  const { word_udi, word_rus } = req.body; // Новые данные слова

  console.log('Update request received for ID:', id); // Логируем ID
  console.log('Update data:', { word_udi, word_rus }); // Логируем данные

  if (!id || !word_udi || !word_rus) {
    return res.status(400).json({ message: 'Необходимо заполнить оба поля и указать ID' });
  }

  try {
    const query = 'UPDATE dictionary SET word_udi = ?, word_rus = ? WHERE id = ?';
    const [result] = await db.query(query, [word_udi, word_rus, id]);

    if (result.affectedRows === 0) {
      console.log('Word not found for ID:', id); // Логируем, если запись не найдена
      return res.status(404).json({ message: 'Слово не найдено' });
    }

    res.status(200).json({ message: 'Слово успешно обновлено' });
  } catch (err) {
    console.error('Ошибка при обновлении слова:', err);
    res.status(500).json({ message: 'Ошибка при обновлении слова' });
  }
};

// Функция для удаления слова
const deleteWord = async (req, res) => {
  const { id } = req.params; // ID слова из URL

  console.log('Delete request received for ID:', id); // Логируем ID

  if (!id) {
    return res.status(400).json({ message: 'ID is required' });
  }

  try {
    const query = 'DELETE FROM dictionary WHERE id = ?';
    const [result] = await db.query(query, [id]);

    if (result.affectedRows === 0) {
      console.log('Word not found for ID:', id); // Логируем, если запись не найдена
      return res.status(404).json({ message: 'Слово не найдено' });
    }

    res.status(200).json({ message: 'Слово успешно удалено' });
  } catch (err) {
    console.error('Ошибка при удалении слова:', err);
    res.status(500).json({ message: 'Ошибка при удалении слова' });
  }
};

// Функция для получения статистики словаря
const getDictionaryStatistics = async (req, res) => {
  try {
    // Получаем общее количество слов
    const [totalResults] = await db.query('SELECT COUNT(*) AS total FROM dictionary');
    const [translatedResults] = await db.query('SELECT COUNT(*) AS translated FROM dictionary WHERE word_udi IS NOT NULL AND word_udi != ""');

    // Отправляем статистику
    res.status(200).json({
      total: totalResults[0].total,
      translated: translatedResults[0].translated,
    });
  } catch (err) {
    console.error('Ошибка при получении статистики:', err);
    res.status(500).json({ message: 'Error fetching dictionary statistics' });
  }
};

module.exports = { getDictionary, addWord, getWordsToTranslate, getDictionaryStatistics, getUserStats, deleteWord, updateWord, addTranslation, upload };
