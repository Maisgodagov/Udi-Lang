import React, { useState, useEffect } from 'react';
import './WordsGame.css';
import api from '../services/axiosConfig';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Word {
  id: number;
  word_udi: string;
  translation: string;
  audio_url?: string;
}

const WordsGame: React.FC = () => {
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [error, setError] = useState('');
  const [role, setRole] = useState<string>('');
  const [username, setUsername] = useState<string | null>(null);
  const navigate = useNavigate();

  // Функция для генерации вариантов ответа
  const generateOptions = (correct: string, allWords: Word[]) => {
    // Возьмем все переводы, кроме правильного
    const otherTranslations = allWords
      .map((w) => w.translation)
      .filter((trans) => trans.trim() !== '' && trans !== correct);
    
    // Если вариантов меньше 2, используем все что есть
    const randomOptions: string[] = [];
    const copy = [...otherTranslations];
    while (copy.length > 0 && randomOptions.length < 2) {
      const index = Math.floor(Math.random() * copy.length);
      randomOptions.push(copy[index]);
      copy.splice(index, 1);
    }
    // Собираем массив с правильным ответом и двумя случайными
    const opts = [correct, ...randomOptions];
    // Перемешиваем варианты
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  };

  // Проигрывание аудио для текущего слова
  const playAudio = (audioUrl?: string) => {
    if (!audioUrl) return;
    // Если ссылка не начинается с "http", можно добавить базовый URL (по необходимости)
    const fullAudioUrl = audioUrl.startsWith('http')
      ? audioUrl
      : `${import.meta.env.VITE_API_URL || 'https://udilang.ru'}${audioUrl.startsWith('/') ? '' : '/'}${audioUrl}`;
    const audio = new Audio(fullAudioUrl);
    audio.play().catch((err) => {
      console.error('Ошибка при воспроизведении аудио:', err);
    });
  };

  useEffect(() => {
    // Проверяем токен и получаем профиль
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role') || '';
    setRole(storedRole);
    if (!token) {
      navigate('/login');
      return;
    } else {
      axios
        .get('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => {
          setUsername(response.data.username);
        })
        .catch((err) => {
          setError('Error fetching user data');
          console.error(err);
        });
    }

    // Получение слов для перевода
    api
      .get('/dictionary')
      .then((res) => {
        console.log('Ответ сервера:', res.data);
        const fetchedWords: Word[] = res.data.map((item: any) => ({
          id: item.id,
          word_udi: item.word_udi || '',
          translation: item.word_rus, // перевод на русский
          audio_url: item.audio_url,
        }));

        console.log('Преобразованные слова:', fetchedWords);

        const filteredWords = fetchedWords.filter(
          (word) =>
            typeof word.word_udi === 'string' &&
            word.word_udi.trim() !== '' &&
            typeof word.translation === 'string' &&
            word.translation.trim() !== ''
        );

        console.log('Отфильтрованные слова:', filteredWords);

        if (filteredWords.length > 0) {
          // Перемешиваем и выбираем первое слово
          const shuffle = (array: Word[]) => {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
          };
          const shuffledWords = shuffle(filteredWords);
          setWords(shuffledWords);
          setCurrentWord(shuffledWords[0]);
        } else {
          setError('Слово не найдено');
        }
      })
      .catch((err) => {
        setError('Error fetching items to translate');
        console.error(err);
      });
  }, [navigate]);

  // Каждый раз, когда меняется текущее слово, генерируем варианты и сразу воспроизводим аудио
  useEffect(() => {
    if (currentWord) {
      const opts = generateOptions(currentWord.translation, words);
      setOptions(opts);
      playAudio(currentWord.audio_url);
      setFeedback(''); // Сбрасываем предыдущее сообщение
    }
  }, [currentWord, words]);

  // Обработчик клика по варианту ответа
  const handleAnswer = (selected: string) => {
    if (!currentWord) return;
    if (selected === currentWord.translation) {
      setFeedback('правильно');
      // Переход на следующее слово через короткую задержку (например, 1 секунда)
      setTimeout(() => {
        handleSkip();
      }, 1000);
    } else {
      setFeedback('неправильно');
    }
  };

  // Обработчик кнопки "Пропустить" (также можно использовать для перехода к следующему слову)
  const handleSkip = () => {
    const remaining = words.slice(1);
    setWords(remaining);
    setCurrentWord(remaining[0] || null);
  };

  return (
    <div className="games-container">
      {error && <p className="error-message">{error}</p>}
      {currentWord ? (
        <div className="games-word">
          <span className="games-word-udi">{currentWord.word_udi}</span>
          <div className="options-container">
            {options.map((option, index) => (
              <button 
                key={index} 
                className="option-btn" 
                onClick={() => handleAnswer(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <button className="skip-btn" onClick={handleSkip}>
            Пропустить
          </button>
          {feedback && <p className="feedback">{feedback}</p>}
        </div>
      ) : (
        <p>Нет слов для отображения</p>
      )}
    </div>
  );
};

export default WordsGame;
