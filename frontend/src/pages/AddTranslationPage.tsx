import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import RecordRTC from 'recordrtc';
import { Howl } from 'howler';
import './AddTranslationPage.css';

// Определяем интерфейс для слова
interface Word {
  id: number;
  word_rus: string;
  word_udi?: string;
  audio_url?: string;
}

const AddTranslationPage: React.FC = () => {
  const [wordUdi, setWordUdi] = useState(''); // Перевод на удинском
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

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Howl | null>(null);

  const [currentWord, setCurrentWord] = useState<Word | null>(null); // Используем тип Word для currentWord
  const [words, setWords] = useState<Word[]>([]); // Храним все слова без перевода

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
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

    // Загружаем слова, которые не имеют перевода
    axios
      .get('/api/words-to-translate')
      .then((response) => {
        setWords(response.data);
        setCurrentWord(response.data[0]); // Устанавливаем первое слово
      })
      .catch((err) => {
        setError('Error fetching words to translate');
        console.error(err);
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!wordUdi || !audioBlob || !username || !currentWord) {
      setError('All fields are required, including the audio');
      return;
    }
  
    const formData = new FormData();
    formData.append('word_udi', wordUdi);
    formData.append('word_rus', currentWord.word_rus); // Заполняем русское слово из currentWord
    formData.append('audio', audioBlob, 'audio.wav'); // Передаем файл
    formData.append('username', username);  // Добавляем имя пользователя в форму
  
    axios
      .post('/api/add-translation', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => {
        setSuccessMessage('Перевод добавлен!');
        setWordUdi('');
        setAudioUrl('');
        setAudioBlob(null);
        setError('');
        setWords(words.slice(1));  // Убираем первое слово из списка
        setCurrentWord(words[1]);  // Переходим к следующему слову
      })
      .catch((err) => {
        setError('Ошибка при добавлении перевода');
        console.error('Error:', err);
      });
  };
  
  const startRecording = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const newRecorder = new RecordRTC(stream, {
          type: 'audio',
          mimeType: 'audio/wav',
          recorderType: RecordRTC.StereoAudioRecorder,
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
    setWords(words.slice(1));  // Пропускаем текущее слово
    setCurrentWord(words[1]);  // Переходим к следующему слову
  };

  return (
    <div className="add-word-wrapper">
      <h1 className="section-title">Добавить перевод</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {currentWord && (
        <form className="add-form" onSubmit={handleSubmit}>
          <div>
            <h3>{currentWord.word_rus}</h3> {/* Выводим текущее русское слово */}
            <input
              className="add-input"
              placeholder="Перевод на удинском"
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
                    {isPlaying ? 'Pause' : 'Play'}
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

          <button className="save-btn" type="submit">
            Сохранить
          </button>
          <button className="skip-btn" type="button" onClick={handleSkip}>
            Не знаю
          </button>

          {successMessage && <p className="success-msg">{successMessage}</p>}
        </form>
      )}
    </div>
  );
};

export default AddTranslationPage;