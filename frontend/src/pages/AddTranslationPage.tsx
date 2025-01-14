import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import RecordRTC from 'recordrtc';
import { Howl } from 'howler';
import './AddTranslationPage.css';
import { useNavigate } from 'react-router-dom';
import api from '../services/axiosConfig'; // Путь к вашему файлу

// Интерфейс для элемента перевода (слово или фраза)
interface TranslationItem {
  id: number;
  text: string;
  translation: string;
  audio_url?: string;
  type: 'word' | 'phrase';
}

const AddTranslationPage: React.FC = () => {
  const [wordUdi, setWordUdi] = useState('');
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

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Howl | null>(null);

  const [currentItem, setCurrentItem] = useState<TranslationItem | null>(null);
  const [items, setItems] = useState<TranslationItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [translatedItems, setTranslatedItems] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    // Проверяем токен и получаем профиль
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role') || '';
    setRole(storedRole);
    if (!token) {
      navigate('/login');
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

    // Получение слов без перевода
    const fetchWords = api.get('/words-to-translate');
    // Получение фраз без перевода
    const fetchPhrases = api.get('/phrases-to-translate');

    Promise.all([fetchWords, fetchPhrases])
      .then(([wordsRes, phrasesRes]) => {
        const words: TranslationItem[] = wordsRes.data.map((item: any) => ({
          id: item.id,
          text: item.word_rus,
          translation: item.word_udi || '',
          audio_url: item.audio_url,
          type: 'word'
        }));
        const phrases: TranslationItem[] = phrasesRes.data.map((item: any) => ({
          id: item.id,
          text: item.phrase_rus,
          translation: item.phrase_udi || '',
          audio_url: item.audio_url,
          type: 'phrase'
        }));
        const mixed = [...words, ...phrases];
        if (mixed.length > 0) {
          const shuffledItems = shuffle(mixed);
          setItems(shuffledItems);
          setCurrentItem(shuffledItems[0]);
          setTotalItems(mixed.length);
        } else {
          setError('No data available to translate.');
        }
      })
      .catch((err) => {
        setError('Error fetching items to translate');
        console.error(err);
      });

    // Получаем статистику по словарю
    api
      .get('/dictionary-statistics')
      .then((response) => {
        setTranslatedItems(response.data.translated);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [navigate]);

  const shuffle = (array: TranslationItem[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!wordUdi || !audioBlob || !username || !currentItem) {
      setError('Заполните все поля и запишите произношение.');
      return;
    }

    const formData = new FormData();
    if (currentItem.type === 'word') {
      formData.append('word_udi', wordUdi);
      formData.append('word_rus', currentItem.text);
    } else {
      formData.append('phrase_udi', wordUdi);
      formData.append('phrase_rus', currentItem.text);
    }
    formData.append('audio', audioBlob, 'audio.wav');
    formData.append('username', username);

    const endpoint = currentItem.type === 'word' ? '/add-translation' : '/add-phrase-translation';

    setIsLoading(true);
    api
      .post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => {
        setSuccessMessage(
          `${currentItem.type === 'word' ? 'Слово успешно добавлено!' : 'Фраза успешно добавлена!'} `
        );
        setWordUdi('');
        setAudioUrl('');
        setAudioBlob(null);
        setError('');
        // Убираем использованный элемент и переходим к следующему
        const remaining = items.slice(1);
        setItems(remaining);
        setCurrentItem(remaining[0] || null);
        setTranslatedItems(translatedItems + 1);
      })
      .catch((err) => {
        setError('Ошибка при добавлении перевода');
        console.error('Error:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

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

  const handleSkip = () => {
    const remaining = items.slice(1);
    setItems(remaining);
    setCurrentItem(remaining[0] || null);
  };
  const handleDeleteCurrent = () => {
    if (!currentItem) return;
    // if (!window.confirm('Вы уверены, что хотите удалить этот элемент?')) return;

    const endpoint =
      currentItem.type === 'word'
        ? `/dictionary/${currentItem.id}`
        : `/phrases/${currentItem.id}`;

    api
      .delete(endpoint)
      .then(() => {
        setSuccessMessage(
          currentItem.type === 'word'
            ? 'Слово успешно удалено'
            : 'Фраза успешно удалена'
        );
        // После удаления переходим к следующему элементу
        const remaining = items.slice(1);
        setItems(remaining);
        setCurrentItem(remaining[0] || null);
      })
      .catch((err) => {
        setError('Ошибка при удалении элемента');
        console.error('Delete error:', err);
      });
  };
  return (
    <div className="page-wrapper">
      <h1 className="section-title">Добавить перевод</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p className="words-stat">{`Переведено ${translatedItems} из ${totalItems} слов и фраз`}</p>
      {currentItem ? (
        <form className="add-form" onSubmit={handleSubmit}>
          <div>
            <h3 className="russian-word">
              {currentItem.text}{' '}
              <span className="type-label">
                {currentItem.type === 'word' ? 'cлово' : 'фраза'}
              </span>
            </h3>
            <input
              className="add-input"
              placeholder="Перевод на удинский (русскими буквами)"
              type="text"
              value={wordUdi}
              onChange={(e) => setWordUdi(e.target.value)}
              required
            />
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
            <button onClick={handleDeleteCurrent}
              className="delete-btn-admin" 
            >
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
        - Слова и фразы выводятся случайным образом, на русском языке.
      </p>
      <p className="add-word-text">
        - Если вы знаете перевод на удинский, введите перевод русскими буквами.
      </p>
      <p className="add-word-text">
        - Запишите произношение.
      </p>
      <p className="add-word-text">
        - Если вы не знаете или не помните перевод, просто откройте Другое слово.
      </p>
    </div>
  );
};

export default AddTranslationPage;
