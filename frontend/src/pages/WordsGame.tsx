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

const WordsGame: React.FC = () => {
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [username, setUsername] = useState<string | null>(null);
  const navigate = useNavigate();

  // Функция для генерации вариантов ответа
  const generateOptions = (correct: string, allWords: Word[]) => {
    const otherTranslations = allWords
      .map((w) => w.translation)
      .filter((trans) => trans.trim() !== '' && trans !== correct);
    const randomOptions: string[] = [];
    const copy = [...otherTranslations];
    while (copy.length > 0 && randomOptions.length < 2) {
      const index = Math.floor(Math.random() * copy.length);
      randomOptions.push(copy[index]);
      copy.splice(index, 1);
    }
    const opts = [correct, ...randomOptions];
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    // Берем первую часть каждого варианта до запятой.
    return opts.map((opt) => opt.split(',')[0].trim());
  };

  // Функция проигрывания аудио (опционально)
  const playAudio = (audioUrl?: string) => {
    if (!audioUrl) return;
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

        const filteredWords = fetchedWords.filter(
          (word) =>
            typeof word.word_udi === 'string' &&
            word.word_udi.trim() !== '' &&
            typeof word.translation === 'string' &&
            word.translation.trim() !== '' &&
            (!word.audio_url || word.audio_url.trim() === '')
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
          playAudio(shuffledWords[0].audio_url);
        } else {
          setError('Нет слов для изучения.');
        }
      })
      .catch((err) => {
        setError('Error fetching words');
        console.error(err);
      });
  }, [navigate]);

  // При смене текущего слова генерируем варианты и сбрасываем feedback
  useEffect(() => {
    if (currentWord) {
      const opts = generateOptions(currentWord.translation, words);
      setOptions(opts);
      setFeedback('');
    }
  }, [currentWord, words]);

  const handleAnswer = (selected: string) => {
    if (!currentWord) return;
    if (selected === currentWord.translation) {
      setFeedback('правильно');
      setTimeout(() => {
        handleSkip();
      }, 1000);
    } else {
      setFeedback('неправильно');
    }
  };

  const handleSkip = () => {
    const remaining = words.slice(1);
    setWords(remaining);
    setCurrentWord(remaining[0] || null);
  };

  // Обработчик для drop zone, вызывается при отпускании draggable элемента
  const handleDrop = (target: string) => {
    if (target === 'dontknow') {
      handleSkip();
    } else {
      handleAnswer(target);
    }
  };

  return (
    <div className="games-container">
      {error && <p className="error-message">{error}</p>}
      {currentWord ? (
        <>
          <DraggableWord word={currentWord.word_udi} />
          <div className="options-wrapper">
            <DropZone target={options[0] || ''} onDrop={handleDrop}>
              {options[0]}
            </DropZone>
            <DropZone target={options[1] || ''} onDrop={handleDrop}>
              {options[1]}
            </DropZone>
            <DropZone target={options[2] || ''} onDrop={handleDrop}>
              {options[2]}
            </DropZone>
            <DropZone target="dontknow" onDrop={handleDrop}>
              не знаю
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
