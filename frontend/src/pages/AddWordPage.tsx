import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import RecordRTC from 'recordrtc';
import { Howl } from 'howler';
import { useNavigate } from 'react-router-dom';
import './AddWordPage.css';
import api from '../services/axiosConfig'; // Путь к вашему файлу

const AddWordPage: React.FC = () => {
  const [wordUdi, setWordUdi] = useState('');
  const [wordRus, setWordRus] = useState('');
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

  const intervalRef = useRef<NodeJS.Timeout | null>(null); 
  const soundRef = useRef<Howl | null>(null);

  const navigate = useNavigate(); 
  useEffect(() => {
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
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!wordUdi || !wordRus || !audioBlob || !username) {
      setError('All fields are required, including the audio');
      return;
    }
    const wordUdiLowerCase = wordUdi.toLowerCase();
    const wordRusLowerCase = wordRus.toLowerCase();

    const formData = new FormData();
    formData.append('word_udi',wordUdiLowerCase);
    formData.append('word_rus', wordRusLowerCase);
    formData.append('audio', audioBlob, 'audio.wav');
    formData.append('username', username);  // Добавляем имя пользователя в форму

    api
      .post('/dictionary', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => {
        setSuccessMessage('Слово добавлено!');
        setWordUdi('');
        setWordRus('');
        setAudioUrl('');
        setAudioBlob(null);
        setError('');
      })
      .catch((err) => {
        setError('Ошибка при добавлении слова');
        console.error('Error:', err);
      });
  };

  const startRecording = () => {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      setMediaStream(stream); // Сохраняем активный поток

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
      console.error('Error accessing audio media:', err);
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

      // Останавливаем поток
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        setMediaStream(null); // Освобождаем состояние
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

  return (
    <div className="page-wrapper">
      <h1 className="section-title">Добавить слово</h1>
      <form className="add-form" onSubmit={handleSubmit}>
        <div>
          <input
            className="add-input"
            placeholder="Слово на удинском (русскими буквами)"
            type="text"
            value={wordUdi}
            onChange={(e) => setWordUdi(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            className="add-input"
            placeholder="Перевод на русский"
            type="text"
            value={wordRus}
            onChange={(e) => setWordRus(e.target.value)}
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
                  onClick={handlePlayPause}>
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

        <button className="save-btn" type="submit">
          Сохранить
        </button>
          {error && <p className='error-msg'>{error}</p>}
          {successMessage && <p className='success-msg'>{successMessage}</p>}
      </form>

      <p className="add-word-text">
        - Пишите удинское слово русскими буквами так, как слышите его.
      </p>
      <p className="add-word-text">
        - Запишите произношение слова, произнесите слово один или несколько раз, четко и понятно.
      </p>
      <p className="add-word-text">
        - Переслушайте запись, проверьте, что всё правильно и нажмите сохранить.
      </p>
    </div>
  );
};

export default AddWordPage;