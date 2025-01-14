const multer = require('multer');
const path = require('path');
const { db } = require('../config/db');

// Настройка multer для загрузки файлов в папку uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsPath = path.join(__dirname, '../../uploads'); // Дважды ".." чтобы выйти из папки backend
    console.log('Uploads path:', uploadsPath);
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Получение всех слов (словарь)
const getDictionary = async (res) => {
  try {
    const [results] = await db.query('SELECT * FROM dictionary');
    res.status(200).json(results);
  } catch (err) {
    console.error('Ошибка при загрузке слов:', err);
    res.status(500).json({ message: 'Ошибка при загрузке слов' });
  }
};

// Получение всех фраз
const getPhrases = async (res) => {
  try {
    const [results] = await db.query('SELECT * FROM phrases');
    res.status(200).json(results);
  } catch (err) {
    console.error('Ошибка при загрузке фраз:', err);
    res.status(500).json({ message: 'Ошибка при загрузке фраз' })
  }
}

// Добавление нового слова в словарь
const addWord = async (req, res) => {
  const { word_udi, word_rus, username } = req.body;
  const baseUrl = process.env.BASE_URL || 'https://udilang.ru';
  const audioUrl = `${baseUrl}/uploads/${req.file.filename}`;

  console.log('Received data:', req.body);
  console.log('Received file:', req.file);

  if (!word_udi || !word_rus || !audioUrl || !username) {
    return res.status(400).json({ message: 'Нужно заполнить все поля, включая запись произношения' });
  }

  try {
    const query = 'INSERT INTO dictionary (word_udi, word_rus, audio_url, username) VALUES (?, ?, ?, ?)';
    const [results] = await db.query(query, [word_udi, word_rus, audioUrl, username]);
    res.status(201).json({ message: 'Слово добавлено', wordId: results.insertId });
  } catch (err) {
    console.error('Error adding word to dictionary:', err);
    res.status(500).json({ message: 'Ошибка при добавлении слова' });
  }
};

// Получение слов, у которых нет перевода (в таблице dictionary)
const getWordsToTranslate = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM dictionary WHERE word_udi IS NULL OR word_udi = ""');
    res.status(200).json(results);
  } catch (err) {
    console.error('Ошибка при получении слов:', err);
    res.status(500).json({ message: 'Ошибка при получении слов для перевода' });
  }
};

// Получение фраз, у которых нет перевода (в таблице phrases)
const getPhrasesToTranslate = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM phrases WHERE phrase_udi IS NULL OR phrase_udi = ""');
    res.status(200).json(results);
  } catch (err) {
    console.error('Ошибка при получении фраз:', err);
    res.status(500).json({ message: 'Ошибка при получении фраз для перевода' });
  }
};

// Добавление перевода для слова (обновление таблицы dictionary)
const addTranslation = async (req, res) => {
  const { word_udi, word_rus, username } = req.body;
  const baseUrl = process.env.BASE_URL || 'https://udilang.ru';
  const audioUrl = req.file ? `${baseUrl}/uploads/${req.file.filename}` : '';

  console.log('Received translation data:', { word_udi, word_rus, audioUrl, username });
  if (!audioUrl) {
    return res.status(400).json({ message: 'Audio file is required' });
  }

  try {
    const query = 'UPDATE dictionary SET word_udi = ?, audio_url = ?, username = ? WHERE word_rus = ?';
    await db.query(query, [word_udi, audioUrl, username, word_rus]);
    res.status(200).json({ message: 'Translation added successfully' });
  } catch (err) {
    console.error('Error adding translation:', err);
    res.status(500).json({ message: 'Error adding translation' });
  }
};

// Добавление перевода для фразы (обновление таблицы phrases)
const addPhraseTranslation = async (req, res) => {
  const { phrase_udi, phrase_rus, username } = req.body;
  const baseUrl = process.env.BASE_URL || 'https://udilang.ru';
  const audioUrl = req.file ? `${baseUrl}/uploads/${req.file.filename}` : '';

  console.log('Received translation data for phrase:', { phrase_udi, phrase_rus, audioUrl, username });
  if (!audioUrl) {
    return res.status(400).json({ message: 'Аудиофайл обязателен' });
  }

  try {
    const query = 'UPDATE phrases SET phrase_udi = ?, audio_url = ?, username = ? WHERE phrase_rus = ?';
    await db.query(query, [phrase_udi, audioUrl, username, phrase_rus]);
    res.status(200).json({ message: 'Перевод фразы успешно добавлен' });
  } catch (err) {
    console.error('Error adding phrase translation:', err);
    res.status(500).json({ message: 'Ошибка при добавлении перевода фразы' });
  }
};

// Получение статистики по пользователю (на основе таблицы dictionary)
const getUserStats = async (req, res) => {
  const username = req.user.username;
  try {
    const [translatedResults] = await db.query(
      'SELECT COUNT(*) AS translated FROM dictionary WHERE username = ? AND word_udi IS NOT NULL AND word_udi != ""',
      [username]
    );
    const [totalResults] = await db.query(
      'SELECT COUNT(*) AS total FROM dictionary WHERE username = ?',
      [username]
    );
    console.log('Stats:', {
      translated: translatedResults[0].translated,
      total: totalResults[0].total
    });
    res.status(200).json({
      translated: translatedResults[0].translated,
      total: totalResults[0].total,
    });
  } catch (err) {
    console.error('Error fetching user stats:', err);
    res.status(500).json({ message: 'Error fetching user stats' });
  }
};

// Обновление слова (в таблице dictionary)
const updateWord = async (req, res) => {
  const { id } = req.params;
  const { word_udi, word_rus } = req.body;
  console.log(`PUT /api/dictionary/${id}`, req.body);

  if (!word_udi || !word_rus) {
    return res.status(400).json({ message: 'Необходимо заполнить оба поля' });
  }

  try {
    const query = 'UPDATE dictionary SET word_udi = ?, word_rus = ? WHERE id = ?';
    const [result] = await db.query(query, [word_udi, word_rus, id]);
    if (result.affectedRows === 0) {
      console.log('Word not found:', id);
      return res.status(404).json({ message: 'Слово не найдено' });
    }
    res.status(200).json({ message: 'Слово успешно обновлено' });
  } catch (err) {
    console.error('Ошибка при обновлении слова:', err);
    res.status(500).json({ message: 'Ошибка при обновлении слова' });
  }
};

// Удаление слова (из таблицы dictionary)
const deleteWord = async (req, res) => {
  const { id } = req.params;
  console.log(`DELETE /api/dictionary/${id}`);
  try {
    const query = 'DELETE FROM dictionary WHERE id = ?';
    const [result] = await db.query(query, [id]);
    if (result.affectedRows === 0) {
      console.log('Word not found:', id);
      return res.status(404).json({ message: 'Слово не найдено' });
    }
    res.status(200).json({ message: 'Слово успешно удалено' });
  } catch (err) {
    console.error('Ошибка при удалении слова:', err);
    res.status(500).json({ message: 'Ошибка при удалении слова' });
  }
};

// Удаление фразы из таблицы
const deletePhrase = async (req, res) => {
  const { id } = req.params;
  console.log(`DELETE /api/phrases/${id}`);
  try {
    const query = 'DELETE FROM phrases WHERE id = ?';
    const [result] = await db.query(query, [id]);
    if (result.affectedRows === 0) {
      console.log('Phrase not found:', id);
      return res.status(404).json({ message: 'Фраза не найдена' });
    }
    res.status(200).json({ message: 'Фраза успешно удалена' });
  } catch (err) {
    console.error('Ошибка при удалении фразы:', err);
    res.status(500).json({ message: 'Ошибка при удалении фразы' });
  }
};

// Добавление новой фразы (вставка в таблицу phrases)
const addPhrase = async (req, res) => {
  const { phrase_udi, phrase_rus, username } = req.body;
  const baseUrl = process.env.BASE_URL || 'https://udilang.ru';
  const audioUrl = req.file ? `${baseUrl}/uploads/${req.file.filename}` : '';
  console.log('Received phrase data:', req.body);
  if (!phrase_udi || !phrase_rus || !audioUrl || !username) {
    return res.status(400).json({ message: 'Все поля, включая запись, обязательны для заполнения' });
  }
  try {
    const query = 'INSERT INTO phrases (phrase_udi, phrase_rus, audio_url, username) VALUES (?, ?, ?, ?)';
    const [results] = await db.query(query, [phrase_udi, phrase_rus, audioUrl, username]);
    res.status(201).json({ message: 'Фраза добавлена', phraseId: results.insertId });
  } catch (err) {
    console.error('Error adding phrase:', err);
    res.status(500).json({ message: 'Ошибка при добавлении фразы' });
  }
};

// Получение статистики по словарю (на основе таблицы dictionary)
const getDictionaryStatistics = async (req, res) => {
  try {
    const [totalResults] = await db.query('SELECT COUNT(*) AS total FROM dictionary');
    const [translatedResults] = await db.query('SELECT COUNT(*) AS translated FROM dictionary WHERE word_udi IS NOT NULL AND word_udi != ""');
    res.status(200).json({
      total: totalResults[0].total,
      translated: translatedResults[0].translated,
    });
  } catch (err) {
    console.error('Ошибка при получении статистики:', err);
    res.status(500).json({ message: 'Error fetching dictionary statistics' });
  }
};

module.exports = { 
  getDictionary, 
  addWord, 
  getWordsToTranslate, 
  getPhrasesToTranslate, 
  addPhraseTranslation, 
  addTranslation, 
  getUserStats, 
  updateWord, 
  deleteWord, 
  deletePhrase, 
  getDictionaryStatistics, 
  addPhrase,
  getPhrases,
  upload
};
