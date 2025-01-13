import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import RecordRTC from 'recordrtc';
import { Howl } from 'howler';
import './AddTranslationPage.css';
import { useNavigate } from 'react-router-dom';
import api from '../services/axiosConfig'; // Путь к вашему файлу

// Определяем интерфейс для слова
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

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Howl | null>(null);

  const [currentItem, setCurrentItem] = useState<TranslationItem | null>(null);
  const [items, setItems] = useState<TranslationItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [translatedItems, setTranslatedItems] = useState(0);

  const navigate = useNavigate()

  useEffect(() => {
    // Загружаем данные пользователя и слова без перевода
    const token = localStorage.getItem('token');
    if (!token) {
      // Если нет токена, перенаправляем на страницу логина
      navigate('/login');
    }
    else if (token) {
      axios
        .get('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setUsername(response.data.username);
        })
        .catch((err) => {
          setError('Error fetching user data');
          console.error(err);
        });
    } else {
      setError('No token found, please log in');
    }

    api
    .get('/mixed-words-phrases')
    .then((response) => {
      console.log('Mixed items response:', response.data)
      if (Array.isArray(response.data) && response.data.length > 0) {
        const shuffledItems = shuffle(response.data);
        setItems(shuffledItems);
        setCurrentItem(shuffledItems[0]); // Устанавливаем первое слово
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
        setTotalItems(response.data.total);
        setTranslatedItems(response.data.translated);
      })
      .catch((err) => {
        setError('Error fetching dictionary statistics');
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
      setError('All fields are required, including the audio');
      return;
    }
    // const wordUdiLowerCase = wordUdi.toLowerCase();
    // const wordRusLowerCase = currentWord.word_rus.toLowerCase();

    const formData = new FormData();
    formData.append(currentItem.type === 'word' ? 'word_udi' : 'phrase_udi', wordUdi);
    formData.append(currentItem.type === 'word' ? 'word_rus' : 'phrase_rus', currentItem.text);
    formData.append('audio', audioBlob, 'audio.wav');
    formData.append('username', username);

    const endpoint =
      currentItem.type === 'word' ? '/add-word-translation' : '/add-phrase-translation';

    setIsLoading(true)
    api
      .post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => {
        setSuccessMessage(
          `${currentItem.type === 'word' ? 'Слово' : 'Фраза'} успешно добавлено!`
        );
        setWordUdi('');
        setAudioUrl('');
        setAudioBlob(null);
        setError('');
        setItems(items.slice(1));  // Убираем первое слово из списка
        setCurrentItem(items[1]);  // Переходим к следующему слову

        // Обновляем статистику
        setTranslatedItems(translatedItems + 1);
      })
      .catch((err) => {
        setError('Ошибка при добавлении перевода');
        console.error('Error:', err);
      })
      .finally(() => {
        setIsLoading(false);
      })
  };

  const startRecording = () => {
    navigator.mediaDevices
    .getUserMedia({
      audio: {
        sampleRate: 44100, // Установить частоту дискретизации
        channelCount: 2,   // Стерео
        echoCancellation: true, // Устранение эха
        noiseSuppression: true, // Подавление шума
        autoGainControl: true,  // Автоматическая регулировка громкости
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
        console.error('Error accessing audio media: ', err);
      });
  };

  const stopRecording = () => {
    if (recorder) {
      recorder.stopRecording(() => {
        const audioBlob = recorder.getBlob();
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        setIsRecording(false);
        if (intervalRef.current) clearInterval(intervalRef.current);

        soundRef.current = new Howl({
          src: [audioUrl],
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
          setMediaStream(null); // Очищаем состояние
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
    const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${formattedMinutes}:${formattedSeconds}`;
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
    setItems(items.slice(1));  // Пропускаем текущее слово
    setCurrentItem(items[1]);  // Переходим к следующему слову
  };

  return (
    <div className="page-wrapper">
      <h1 className="section-title">Добавить перевод</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p className='words-stat'>{`Переведено ${translatedItems} из ${totalItems} слов`}</p> {/* Отображаем счетчик */}
      {currentItem && (
        <form className="add-form" onSubmit={handleSubmit}>
          <div>
            <h3 className='russian-word'>{currentItem.text}{' '}
            <span className="type-label">
                ({currentItem.type === 'word' ? 'Слово' : 'Фраза'})
              </span>
            </h3> {/* Выводим текущее русское слово */}
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
          <button className="skip-btn" type="button" onClick={handleSkip}>
            Другое слово
          </button>

          {successMessage && <p className="success-msg">{successMessage}</p>}
        </form>  
      )}
      <p className="add-word-text">
      - Слова выводятся случайным образом, на русском языке.
      </p>
      <p className="add-word-text">
      - Если вы знаете перевод на удинский, введите перевод русскими буквами.
      </p>
      <p className="add-word-text">
      - Запишите произношение слова.
      </p>
      <p className="add-word-text">
      - Если вы не знаете или не помните перевод, просто откройте Другое слово
      </p>
      <p className="add-word-text">
      - Все русские слова добавляются автоматически, из-за чего могут попадаться слова, у которых нет перевода на удинский язык, например "атом" или "интернет". Если вам попалось такое слово, вы можете ввести в перевод это же слово или же пропустить его.
      </p>
    </div>
  );
};

export default AddTranslationPage;
