const multer = require('multer');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const { db } = require('../config/db');

// Настройка multer для загрузки файлов в папку uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const trimSilence = async (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters('silenceremove=1:0:-50dB') // Убираем тишину с порогом -50 dB
      .on('end', () => {
        resolve();
      })
      .on('error', (err) => {
        console.error(`Ошибка при обрезке тишины ${inputPath}:`, err.message);
        reject(err);
      })
      .save(outputPath);
  });
};
// Функция для сжатия аудиофайла
const compressAudio = async (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioBitrate(96) // Устанавливаем битрейт
      .audioChannels(1) // Конвертируем в моно
      .toFormat('mp3')  // Преобразуем в формат MP3
      .on('end', () => {
        resolve();
      })
      .on('error', (err) => {
        reject(err);
      })
      .save(outputPath);
  });
};
// Получение всех слов (словарь)
const getDictionary = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM dictionary');
    res.status(200).json(results);
  } catch (err) {
    console.error('Ошибка при загрузке слов:', err);
    res.status(500).json({ message: 'Ошибка при загрузке слов' });
  }
};

// Получение всех фраз
const getPhrases = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM phrases');
    res.status(200).json(results);
  } catch (err) {
    console.error('Ошибка при загрузке фраз:', err);
    res.status(500).json({ message: 'Ошибка при загрузке фраз' })
  }
}

// Добавление нового слова в словарь
// controllers/dictionaryController.js

const addWord = async (req, res) => {
  const { word_udi, word_rus, comment } = req.body;
  

  // Проверяем, что обязательные поля заполнены
  if (!word_udi || !word_rus) {
    return res.status(400).json({ 
      message: 'Нужно заполнить обязательные поля: слово на удинском и перевод на русский' 
    });
  }

  try {
    // Здесь audio_url и username устанавливаем как пустые строки
    const query = 'INSERT INTO dictionary (word_udi, word_rus, comment, audio_url, username) VALUES (?, ?, ?, ?, ?)';
    const [results] = await db.query(query, [word_udi, word_rus, comment || '', '', '']);
    res.status(201).json({ message: 'Слово добавлено', wordId: results.insertId });
  } catch (err) {
    console.error('Ошибка при добавлении слова в словарь:', err);
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

const addTranslation = async (req, res) => {
  const { word_udi, word_rus, username } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: 'Аудиофайл обязателен' });
  }

  const baseUrl = process.env.BASE_URL || 'https://udilang.ru';
  const inputPath = req.file.path;
  const trimmedPath = path.join(path.dirname(inputPath), `trimmed_${req.file.filename}`);
  const compressedPath = path.join(path.dirname(inputPath), `compressed_${req.file.filename}`);

  try {
    console.log('Получены данные для обновления:', {
      word_udi,
      word_rus,
      username,
      inputPath,
    });

    // Удаление тишины
    await trimSilence(inputPath, trimmedPath);

    // Сжатие файла
    await compressAudio(trimmedPath, compressedPath);

    // Удаляем временные файлы (исходный и обрезанный)
    fs.unlinkSync(inputPath);
    fs.unlinkSync(trimmedPath);

    // Генерируем URL для сжатого файла
    const audioUrl = `${baseUrl}/uploads/compressed_${req.file.filename}`;

    // Выполняем обновление записи в базе данных
    const query = 'UPDATE dictionary SET word_udi = ?, audio_url = ?, username = ? WHERE word_rus = ?';
    const [result] = await db.query(query, [word_udi, audioUrl, username, word_rus]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Слово не найдено' });
    }

    res.status(200).json({ message: 'Перевод добавлен успешно', audioUrl });
  } catch (err) {
    // Удаляем временные файлы в случае ошибки
    if (fs.existsSync(trimmedPath)) {
      fs.unlinkSync(trimmedPath);
    }
    if (fs.existsSync(compressedPath)) {
      fs.unlinkSync(compressedPath);
    }

    res.status(500).json({ message: 'Ошибка сервера при добавлении перевода', error: err.message });
  }
};
// Добавление перевода для фразы (обновление таблицы phrases)
const addPhraseTranslation = async (req, res) => {
  const { phrase_udi, phrase_rus, username } = req.body;
  const baseUrl = process.env.BASE_URL || 'https://udilang.ru';
  const audioUrl = req.file ? `${baseUrl}/uploads/${req.file.filename}` : '';

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

  if (!word_udi || !word_rus) {
    return res.status(400).json({ message: 'Необходимо заполнить оба поля' });
  }

  try {
    const query = 'UPDATE dictionary SET word_udi = ?, word_rus = ? WHERE id = ?';
    const [result] = await db.query(query, [word_udi, word_rus, id]);
    if (result.affectedRows === 0) {
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
  try {
    const query = 'DELETE FROM dictionary WHERE id = ?';
    const [result] = await db.query(query, [id]);
    if (result.affectedRows === 0) {
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
  try {
    const query = 'DELETE FROM phrases WHERE id = ?';
    const [result] = await db.query(query, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Фраза не найдена' });
    }
    res.status(200).json({ message: 'Фраза успешно удалена' });
  } catch (err) {
    console.error('Ошибка при удалении фразы:', err);
    res.status(500).json({ message: 'Ошибка при удалении фразы' });
  }
};

// Добавление новой фразы (вставка в таблицу phrases)
// Обязательным делаем только поле phrase_rus.
// Остальные поля (phrase_udi, audioUrl, username) не обязательны.
const addPhrase = async (req, res) => {
  const { phrase_udi, phrase_rus, username } = req.body;
  
  // Проверяем, что обязательные поля заполнены
  if (!phrase_rus) {
    return res.status(400).json({ message: 'Необходимо указать фразу на русском языке (phrase_rus)' });
  }

  // Если придёт файл, значит хотим сохранять аудио
  const baseUrl = process.env.BASE_URL || 'https://udilang.ru';
  let audioUrl = '';
  if (req.file) {
    audioUrl = `${baseUrl}/uploads/${req.file.filename}`;
  }

  try {
    // Учитывая, что поля phrase_udi и username могут быть не заданы, ставим их в ''
    const query = `
      INSERT INTO phrases (phrase_udi, phrase_rus, audio_url, username) 
      VALUES (?, ?, ?, ?)
    `;
    const [results] = await db.query(query, [
      phrase_udi || '',
      phrase_rus.trim(),
      audioUrl,
      username || ''
    ]);

    res.status(201).json({ message: 'Фраза добавлена', phraseId: results.insertId });
  } catch (err) {
    console.error('Ошибка при добавлении фразы:', err);
    res.status(500).json({ message: 'Ошибка при добавлении фразы' });
  }
};


// Обновление фразы
const updatePhrase = async (req, res) => {
  const { id } = req.params;
  const { phrase_udi, phrase_rus } = req.body;

  if (!phrase_udi || !phrase_rus) {
    return res.status(400).json({ message: 'Необходимо заполнить оба поля' });
  }

  try {
    const query = 'UPDATE phrases SET phrase_udi = ?, phrase_rus = ? WHERE id = ?';
    const [result] = await db.query(query, [phrase_udi, phrase_rus, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Фраза не найдена' });
    }
    res.status(200).json({ message: 'Фраза успешно обновлена' });
  } catch (err) {
    console.error('Ошибка при обновлении фразы:', err);
    res.status(500).json({ message: 'Ошибка при обновлении фразы' });
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
    res.status(500).json({ message: 'Error fetching dictionary statistics' });
  }
};
// controllers/dictionaryController.js

/**
 * Обновление прогресса слова:
 * userId   - из токена
 * wordId   - ID слова
 * result   - 'correct' / 'incorrect'
 * XP       - сколько очков даём за правильный ответ (например, 10)
 * Если запись (user_word_progress) отсутствует, создаём её, иначе обновляем
 */
const updateWordProgress = async (req, res) => {
  try {
    const userId = req.user.userId; // берем из authMiddleware
    const { wordId, result } = req.body; // например { "wordId": 123, "result": "correct" }

    // Проверка входных данных
    if (!wordId || !result) {
      return res.status(400).json({ message: 'wordId и result обязательны' });
    }

    // 1. Проверяем, есть ли такое слово в dictionary
    const [rows] = await db.query('SELECT id FROM dictionary WHERE id = ?', [wordId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Слово не найдено' });
    }

    // 2. Получаем/создаём запись в user_word_progress для (userId, wordId)
    const [progressRows] = await db.query(
      'SELECT * FROM user_word_progress WHERE user_id = ? AND word_id = ?',
      [userId, wordId]
    );

    let progress = progressRows[0];
    if (!progress) {
      // создаём запись со статусом 'learning'
      await db.query(
        `INSERT INTO user_word_progress (user_id, word_id, status, xp, times_correct, times_incorrect, last_practiced)
         VALUES (?, ?, 'learning', 0, 0, 0, NOW())`,
        [userId, wordId]
      );
      // сразу получаем её обратно
      const [newProgressRows] = await db.query(
        'SELECT * FROM user_word_progress WHERE user_id = ? AND word_id = ?',
        [userId, wordId]
      );
      progress = newProgressRows[0];
    }

    // 3. Обновляем поля
    let newTimesCorrect = progress.times_correct;
    let newTimesIncorrect = progress.times_incorrect;
    let newXP = progress.xp;
    let newStatus = progress.status;

    // Допустим, за правильный ответ +10 XP, за неправильный +0
    if (result === 'correct') {
      newTimesCorrect += 1;
      newXP += 10;  
      // Если пользователь ответил правильно N раз — статус = 'mastered'
      if (newTimesCorrect >= 3) {
        newStatus = 'mastered';
      }
    } else if (result === 'incorrect') {
      newTimesIncorrect += 1;
      newStatus = 'need_review';
    }

    // 4. Сохраняем обновлённые значения в user_word_progress
    await db.query(
      `UPDATE user_word_progress
       SET times_correct = ?, times_incorrect = ?, xp = ?, status = ?, last_practiced = NOW()
       WHERE id = ?`,
      [newTimesCorrect, newTimesIncorrect, newXP, newStatus, progress.id]
    );

    // 5. Обновляем общий XP пользователя в таблице users
    // Сначала получим текущее значение xp у пользователя
    const [userRows] = await db.query('SELECT xp FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    const userXpOld = userRows[0].xp || 0;
    let xpIncrement = 0;
    if (result === 'correct') {
      xpIncrement = 10; // То же, что и выше
    }
    const userXpNew = userXpOld + xpIncrement;

    await db.query('UPDATE users SET xp = ? WHERE id = ?', [userXpNew, userId]);

    return res.status(200).json({
      message: 'Прогресс обновлён',
      wordProgress: {
        wordId,
        timesCorrect: newTimesCorrect,
        timesIncorrect: newTimesIncorrect,
        status: newStatus,
        xp: newXP,
      },
      userXp: userXpNew,
    });
  } catch (err) {
    console.error('Ошибка при обновлении прогресса слова:', err);
    return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
};

module.exports = { 
  getDictionary, 
  addWord, 
  getWordsToTranslate, 
  getPhrasesToTranslate, 
  addPhraseTranslation, 
  addTranslation, 
  updateWordProgress,
  getUserStats, 
  updateWord, 
  deleteWord, 
  deletePhrase, 
  getDictionaryStatistics, 
  addPhrase,
  getPhrases,
  updatePhrase,
  upload
};
