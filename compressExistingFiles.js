const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

// Путь к папке с аудиофайлами
const uploadsDir = path.join(__dirname, '../uploads');

// Указываем путь к ffmpeg (если необходимо)
ffmpeg.setFfmpegPath('/usr/bin/ffmpeg'); // Укажите путь, если ffmpeg не в PATH

// Функция для сжатия файла
const compressAudio = async (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioBitrate(96) // Устанавливаем битрейт
      .audioChannels(1) // Конвертируем в моно
      .toFormat('mp3')  // Преобразуем в MP3
      .on('end', () => {
        console.log(`Сжатие завершено: ${outputPath}`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`Ошибка при сжатии файла ${inputPath}:`, err.message);
        reject(err);
      })
      .save(outputPath);
  });
};

// Функция для обработки всех файлов
const processFiles = async () => {
  try {
    const files = fs.readdirSync(uploadsDir);
    console.log(`Найдено файлов: ${files.length}`);

    for (const file of files) {
      const inputPath = path.join(uploadsDir, file);
      const compressedPath = path.join(uploadsDir, `compressed_${file}`);

      // Пропускаем уже обработанные файлы (например, MP3 или файлы с "compressed_")
      if (file.startsWith('compressed_') || path.extname(file) === '.mp3') {
        console.log(`Пропуск файла: ${file}`);
        continue;
      }

      try {
        // Сжимаем файл
        console.log(`Обработка файла: ${file}`);
        await compressAudio(inputPath, compressedPath);

        // Удаляем оригинальный файл после успешного сжатия
        fs.unlinkSync(inputPath);
        console.log(`Оригинальный файл удален: ${file}`);
      } catch (err) {
        console.error(`Ошибка при обработке файла ${file}:`, err.message);
      }
    }

    console.log('Обработка завершена!');
  } catch (err) {
    console.error('Ошибка при обработке файлов:', err.message);
  }
};

// Запускаем обработку
processFiles();
