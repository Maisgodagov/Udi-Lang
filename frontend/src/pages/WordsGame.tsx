import React, { useState, useEffect } from 'react';
import './WordsGame.css';
import api from '../services/axiosConfig';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DraggableWord from '../components/DraggableWord';
import DropZone from '../components/DropZone';

interface Word {
  id: number;
  word_udi: string;
  translation: string;
  audio_url?: string;
}

const PRELOAD_COUNT = 5;

const WordsGame: React.FC = () => {
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [username, setUsername] = useState<string | null>(null);
  const [started, setStarted] = useState<boolean>(false);
  const [preloadedAudios, setPreloadedAudios] = useState<{ [id: number]: HTMLAudioElement }>({});

  const navigate = useNavigate();

  // Генерация вариантов ответа — ровно 2 варианта: правильный и 1 неверный
  const generateOptions = (correct: string, allWords: Word[]): string[] => {
    const normalizedCorrect = correct.split(',')[0].trim().toLowerCase();
    const otherTranslations = allWords
      .map((w) => w.translation.split(',')[0].trim().toLowerCase())
      .filter((trans) => trans !== '' && trans !== normalizedCorrect);
    let randomOption = '';
    if (otherTranslations.length > 0) {
      const index = Math.floor(Math.random() * otherTranslations.length);
      randomOption = otherTranslations[index];
    }
    let opts = [normalizedCorrect];
    if (randomOption) opts.push(randomOption);
    if (opts.length === 1) {
      opts.push(normalizedCorrect);
    }
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  };

  // Функция проигрывания аудио с использованием кеша
  const playAudio = (audioUrl?: string, wordId?: number) => {
    if (!audioUrl || !started) return;
    let audio: HTMLAudioElement;
    if (wordId && preloadedAudios[wordId]) {
      audio = preloadedAudios[wordId];
    } else {
      const fullAudioUrl = audioUrl.startsWith('http')
        ? audioUrl
        : `${import.meta.env.VITE_API_URL || 'https://udilang.ru'}${audioUrl.startsWith('/') ? '' : '/'}${audioUrl}`;
      audio = new Audio(fullAudioUrl);
      audio.preload = 'auto';
    }
    audio.play().catch((err) => {
      console.error('Ошибка при воспроизведении аудио:', err);
    });
  };

  // Функция предзагрузки аудио для слова
  const preloadAudioForWord = (word: Word) => {
    if (!word.audio_url) return;
    if (preloadedAudios[word.id]) return;
    const fullAudioUrl = word.audio_url.startsWith('http')
      ? word.audio_url
      : `${import.meta.env.VITE_API_URL || 'https://udilang.ru'}${word.audio_url.startsWith('/') ? '' : '/'}${word.audio_url}`;
    const audio = new Audio(fullAudioUrl);
    audio.preload = 'auto';
    audio.load();
    setPreloadedAudios((prev) => ({ ...prev, [word.id]: audio }));
  };

  // Предзагрузка аудио для следующих PRELOAD_COUNT слов
  const preloadNextAudios = () => {
    const currentIndex = words.findIndex((w) => currentWord && w.id === currentWord.id);
    if (currentIndex === -1) return;
    const nextWords = words.slice(currentIndex + 1, currentIndex + 1 + PRELOAD_COUNT);
    nextWords.forEach((word) => preloadAudioForWord(word));
  };

  // Обработчик для кнопки "Прослушать ещё раз"
  const handleListen = () => {
    if (currentWord && currentWord.audio_url) {
      playAudio(currentWord.audio_url, currentWord.id);
    }
  };

  // Обработчик для кнопки "Начать игру"
  const handleStart = () => {
    setStarted(true);
    // Не вызываем playAudio здесь, так как эффект с [currentWord, started] выполнится после начала игры.
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

    // Получение слов из словаря
    api
      .get('/dictionary')
      .then((res) => {
        const fetchedWords: Word[] = res.data.map((item: any) => ({
          id: item.id,
          word_udi: item.word_udi || '',
          translation: item.word_rus,
          audio_url: item.audio_url,
        }));

        // Фильтруем: word_udi и translation не пустые, audio_url обязательно заполнено (озвучка есть)
        const filteredWords = fetchedWords.filter(
          (word) =>
            word.word_udi.trim() !== '' &&
            word.translation.trim() !== '' &&
            word.audio_url && word.audio_url.trim() !== ''
        );

        if (filteredWords.length > 0) {
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
          const opts = generateOptions(shuffledWords[0].translation, shuffledWords);
          setOptions(opts);
          preloadAudioForWord(shuffledWords[0]);
          preloadNextAudios();
        } else {
          setError('Нет слов для изучения.');
        }
      })
      .catch((err) => {
        setError('Error fetching words');
        console.error(err);
      });
  }, [navigate]);

  // Отдельный эффект для воспроизведения аудио при изменении currentWord и started
  useEffect(() => {
    if (currentWord && started) {
      const opts = generateOptions(currentWord.translation, words);
      setOptions(opts);
      setFeedback('');
      playAudio(currentWord.audio_url, currentWord.id);
      preloadNextAudios();
    }
  }, [currentWord, started]);

  const handleAnswer = (selected: string) => {
    if (!currentWord) return;
    const correctAnswer = currentWord.translation.split(',')[0].trim().toLowerCase();
    const selectedAnswer = selected.split(',')[0].trim().toLowerCase();
    if (selectedAnswer === correctAnswer) {
      setFeedback('правильно');
      setTimeout(() => {
        handleSkip();
      }, 1000);
    } else {
      setFeedback('неправильно');
      setTimeout(() => {
        setFeedback('');
      }, 2000);
    }
  };

  const handleSkip = () => {
    if (currentWord && preloadedAudios[currentWord.id]) {
      setPreloadedAudios((prev) => {
        const newPreloaded = { ...prev };
        delete newPreloaded[currentWord.id];
        return newPreloaded;
      });
    }
    const remaining = words.slice(1);
    setWords(remaining);
    setCurrentWord(remaining[0] || null);
  };

  // Обработчик для drop zone: если target равен "dontknow", пропускаем слово, иначе проверяем ответ.
  const handleDrop = (target: string) => {
    if (target === 'dontknow') {
      handleSkip();
    } else {
      handleAnswer(target);
    }
  };

  if (!started) {
    return (
      <div className="games-container start-screen">
        <h1 className="game-title">Игра: Изучи слово</h1>
        <button className="start-btn" onClick={handleStart}>
          Начать игру
        </button>
      </div>
    );
  }

  return (
    <div className="games-container">
      {error && <p className="error-message">{error}</p>}
      {currentWord ? (
        <>
          <DraggableWord word={currentWord.word_udi} />
          <button className="listen-btn" onClick={handleListen}>
            Прослушать ещё раз
          </button>
          <div className="options-wrapper">
            {/* Верхняя зона – вариант ответа */}
            <DropZone target={options[0] || ''} onDrop={handleDrop}>
              {options[0]}
            </DropZone>
            {/* Левая зона – вариант "не знаю" */}
            <DropZone target="dontknow" onDrop={handleDrop}>
              не знаю
            </DropZone>
            {/* Нижняя зона – вариант ответа */}
            <DropZone target={options[1] || ''} onDrop={handleDrop}>
              {options[1]}
            </DropZone>
          </div>
          {feedback && <p className="feedback">{feedback}</p>}
        </>
      ) : (
        <p>Нет слов для отображения</p>
      )}
    </div>
  );
};

export default WordsGame;
