import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import RecordRTC from 'recordrtc';
import { Howl } from 'howler';
import './AddTranslationPage.css';
import { useNavigate } from 'react-router-dom';
import api from '../services/axiosConfig';

// Интерфейс для элемента словаря (только для слов)
interface TranslationItem {
  id: number;
  text: string;         // слово на русском (word_rus)
  translation: string;  // слово на удинском (word_udi)
  comment?: string;     // комментарий, если есть
  audio_url?: string;
  type: 'word';
}

const AddTranslationPage: React.FC = () => {
  // Теперь нам не нужен ввод перевода (wordUdi) – оно уже есть в базе
  // Оставляем только состояния для записи аудио и работы с данными
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [recorder, setRecorder] = useState<RecordRTC | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [username, setUsername] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<string>('');
  
  const [currentItem, setCurrentItem] = useState<TranslationItem | null>(null);
  const [items, setItems] = useState<TranslationItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [translatedItems, setTranslatedItems] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Howl | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Проверяем токен и получаем профиль
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role') || '';
    setRole(storedRole);
    if (!token) {
      navigate('/login');
      return;
    }
    axios
      .get('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(response => {
        setUsername(response.data.username);
      })
      .catch(err => {
        setError('Error fetching user data');
        console.error(err);
      });

    // Получение всех слов из словаря
    api.get('/dictionary')
      .then(res => {
        // Преобразуем полученные данные. Ожидается, что на бекенде таблица dictionary содержит:
        // word_rus, word_udi, comment, audio_url, и т.д.
        const fetchedWords: TranslationItem[] = res.data
          .filter((item: any) => 
            item.word_rus && item.word_rus.trim() !== '' &&
            item.word_udi && item.word_udi.trim() !== '' &&
            (!item.audio_url || item.audio_url.trim() === '')
          )
          .map((item: any) => ({
            id: item.id,
            text: item.word_rus,           // русское слово
            translation: item.word_udi,      // удинское слово
            comment: item.comment,           // комментарий (опционально)
            audio_url: item.audio_url,       // должна быть пустая, если не записано озвучивание
            type: 'word'
          }));
          
        if (fetchedWords.length > 0) {
          const shuffledItems = shuffle(fetchedWords);
          setItems(shuffledItems);
          setCurrentItem(shuffledItems[0]);
          setTotalItems(fetchedWords.length);
        } else {
          setError('Нет слов, требующих озвучивания.');
        }
      })
      .catch(err => {
        setError('Ошибка при получении слов для озвучивания.');
        console.error(err);
      });
    
    // Можно также получить статистику по словарю, если нужно
    api.get('/dictionary-statistics')
      .then(response => {
        setTranslatedItems(response.data.translated);
      })
      .catch(err => {
        console.error(err);
      });
  }, [navigate]);

  // Функция перемешивания
  const shuffle = (array: TranslationItem[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // На этой странице пользователю нужно только записать озвучку.
  // Поэтому проверяем только наличие audioBlob, username и выбранного элемента.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!audioBlob || !username || !currentItem) {
      setError('Запишите произношение.');
      return;
    }

    const formData = new FormData();
    // Передаём информацию из выбранного слова
    // При обновлении записи озвучки используем сохранённые значения перевода и слова
    formData.append('word_udi', currentItem.translation);
    formData.append('word_rus', currentItem.text);
    // Ранее записанный комментарий остаётся неизменным (при желании можно его отправлять тоже)
    if (currentItem.comment) {
      formData.append('comment', currentItem.comment);
    }
    // Добавляем аудио-запись
    formData.append('audio', audioBlob, 'audio.wav');
    // Добавляем username
    formData.append('username', username);

    setIsLoading(true);
    // Используем эндпоинт, который обновляет слово, добавляя озвучку
    // Например, '/add-translation'
    api.post('/add-translation', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => {
        setSuccessMessage('Озвучка успешно добавлена!');
        setAudioUrl('');
        setAudioBlob(null);
        setError('');
        // Убираем использованный элемент и переходим к следующему
        const remaining = items.slice(1);
        setItems(remaining);
        setCurrentItem(remaining[0] || null);
        setTranslatedItems(translatedItems + 1);
      })
      .catch(err => {
        setError('Ошибка при добавлении озвучки');
        console.error('Error:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Функции записи аудио (оставляем их без изменений)
  const startRecording = () => {
    navigator.mediaDevices
      .getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 2,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      .then((stream) => {
        setMediaStream(stream);
        const newRecorder = new RecordRTC(stream, {
          type: 'audio',
          mimeType: 'audio/wav',
          recorderType: RecordRTC.StereoAudioRecorder,
          desiredSampRate: 44100,
        });
        newRecorder.startRecording();
        setRecorder(newRecorder);
        setIsRecording(true);
        setDuration(0);
        intervalRef.current = setInterval(() => setDuration((prev) => prev + 1), 1000);
      })
      .catch((err) => {
        console.error('Ошибка доступа к микрофону', err);
      });
  };

  const stopRecording = () => {
    if (recorder) {
      recorder.stopRecording(() => {
        const blob = recorder.getBlob();
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setIsRecording(false);
        if (intervalRef.current) clearInterval(intervalRef.current);

        soundRef.current = new Howl({
          src: [url],
          html5: true,
          onplay: () => {
            setIsPlaying(true);
            setCurrentTime(0);
            setInterval(() => {
              setCurrentTime(soundRef.current?.seek() || 0);
            }, 100);
          },
          onend: () => {
            setIsPlaying(false);
            setCurrentTime(0);
          },
        });
        if (mediaStream) {
          mediaStream.getTracks().forEach((track) => track.stop());
          setMediaStream(null);
        }
      });
    }
  };

  const handleReset = () => {
    setAudioBlob(null);
    setAudioUrl('');
    setIsRecording(false);
    setDuration(0);
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      soundRef.current?.pause();
    } else {
      soundRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Переход к следующему слову (если, например, пользователь не хочет озвучивать текущее слово)
  const handleSkip = () => {
    const remaining = items.slice(1);
    setItems(remaining);
    setCurrentItem(remaining[0] || null);
  };

  // Удаление слова (если администратор решит его исключить)
  const handleDeleteCurrent = () => {
    if (!currentItem) return;
    const endpoint = `/dictionary/${currentItem.id}`;
    api.delete(endpoint)
      .then(() => {
        setSuccessMessage('Слово успешно удалено');
        // Удаляем элемент и переходим к следующему
        const remaining = items.slice(1);
        setItems(remaining);
        setCurrentItem(remaining[0] || null);
      })
      .catch(err => {
        setError('Ошибка при удалении элемента');
        console.error('Delete error:', err);
      });
  };

  return (
    <div className="page-wrapper">
      <h1 className="section-title">Добавить озвучку</h1>
      <p className="words-stat">{`Осталось озвучить ${totalItems} слов`}</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {currentItem ? (
        <form className="add-form" onSubmit={handleSubmit}>
          <div>
          <h3 className="udin-word">
              {currentItem.translation}
              <span className="type-label">уди.</span>
            </h3>
            <h3 className="russian-word">
              {currentItem.text}{' '}
              <span className="type-label">рус.</span>
            </h3>
            {currentItem.comment && (
              <p className="comment">{currentItem.comment}</p>
            )}
          </div>

          <div className="record-wrapper">
            {audioUrl && (
              <div className="audio-player-wrapper">
                <div className="audio-player">
                  <button
                    className={`player-play-btn ${isPlaying ? 'playing' : 'paused'}`}
                    type="button"
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? '' : ''}
                  </button>
                  <p className="player-time">
                    {formatDuration(Math.floor(currentTime))} / {formatDuration(duration)}
                  </p>
                </div>
              </div>
            )}

            {isRecording ? (
              <div className="indicator-wrapper">
                <p className="record-duration-text">{formatDuration(duration)}</p>
                <div className="boxContainer">
                  <div className="box box1"></div>
                  <div className="box box5"></div>
                  <div className="box box2"></div>
                  <div className="box box2"></div>
                  <div className="box box3"></div>
                  <div className="box box4"></div>
                  <div className="box box3"></div>
                  <div className="box box4"></div>
                  <div className="box box5"></div>
                </div>
                <button className="stop-record-btn" type="button" onClick={stopRecording}></button>
              </div>
            ) : audioUrl ? (
              <button className="re-record-btn" type="button" onClick={handleReset}></button>
            ) : (
              <button className="record-btn" type="button" onClick={startRecording}>
                Записать произношение
              </button>
            )}
          </div>

          <button className="save-btn" type="submit" disabled={isLoading}>
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </button>
          <div className="btn-skip-wrapper">
            {role === 'admin' && (
              <button type="button" onClick={handleDeleteCurrent} className="delete-btn-admin">
                Удалить
              </button>
            )}
            <button className="skip-btn" type="button" onClick={handleSkip}>
              Другое слово
            </button>
          </div>
          {successMessage && <p className="success-msg">{successMessage}</p>}
        </form>
      ) : (
        <p></p>
      )}
      <p className="add-word-text">
        - Нажмите "Записать произношение", чтобы добавить озвучку.
      </p>
      <p className="add-word-text">
        - Если не хотите озвучивать текущее слово – нажмите "Другое слово".
      </p>
    </div>
  );
};

export default AddTranslationPage;
