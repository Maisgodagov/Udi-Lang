import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import RecordRTC from 'recordrtc';
import { Howl } from 'howler';
import './AddTranslationPage.css';
import { useNavigate } from 'react-router-dom';
import api from '../services/axiosConfig';

// Объединяем в единый тип элементы "словаря" (words) и "фраз" (phrases)
type TaskItem = {
  id: number;
  text: string;         // Либо word_rus, либо phrase_rus
  translation: string;  // Либо word_udi, либо phrase_udi
  comment?: string;
  audio_url?: string;
  type: 'word' | 'phrase';
};

const AddTranslationPage: React.FC = () => {
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

  // общее поле для ввода перевода (если у слова/фразы перевода нет)
  const [userTranslation, setUserTranslation] = useState('');

  // Храним текущий обрабатываемый элемент (слово или фразу)
  const [currentItem, setCurrentItem] = useState<TaskItem | null>(null);
  const [items, setItems] = useState<TaskItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [translatedItems, setTranslatedItems] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Howl | null>(null);

  const navigate = useNavigate();

  // ----------------------------------------------------------------
  // Первичная загрузка данных
  // ----------------------------------------------------------------
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
      .then((response) => {
        setUsername(response.data.username);
      })
      .catch((err) => {
        setError('Error fetching user data');
        console.error(err);
      });

    // Загружаем ВСЕ слова из словаря
    Promise.all([
      api.get('/dictionary'), // для слов
      api.get('/phrases'),    // для фраз
    ])
      .then(([dictRes, phraseRes]) => {
        const dictionaryData = dictRes.data;
        const phrasesData = phraseRes.data;

        // 1) Слова, у которых есть word_udi, но нет audio_url => нужно только озвучить
        const wordsWithTranslationNoAudio: TaskItem[] = dictionaryData
          .filter((item: any) =>
            item.word_rus &&
            item.word_rus.trim() !== '' &&
            item.word_udi &&
            item.word_udi.trim() !== '' &&
            (!item.audio_url || item.audio_url.trim() === '')
          )
          .map((item: any) => ({
            id: item.id,
            text: item.word_rus,
            translation: item.word_udi,
            comment: item.comment,
            audio_url: item.audio_url,
            type: 'word',
          }));

        // 2) Слова, у которых нет word_udi (и нет озвучки), но есть word_rus => нужно добавить перевод и озвучку
        const wordsNoTranslationNoAudio: TaskItem[] = dictionaryData
          .filter((item: any) =>
            item.word_rus &&
            item.word_rus.trim() !== '' &&
            (!item.word_udi || item.word_udi.trim() === '') &&
            (!item.audio_url || item.audio_url.trim() === '')
          )
          .map((item: any) => ({
            id: item.id,
            text: item.word_rus,
            translation: '',          // Перевода пока нет
            comment: item.comment,
            audio_url: item.audio_url,
            type: 'word',
          }));

        // 3) Фразы, у которых нет phrase_udi (и нет аудио) => нужно добавить перевод и озвучку
        // (Если хотите, можно также проверить !item.audio_url, чтобы точно знать, что и озвучки нет)
        const phrasesToTranslate: TaskItem[] = phrasesData
          .filter((item: any) =>
            item.phrase_rus &&
            item.phrase_rus.trim() !== '' &&
            (!item.phrase_udi || item.phrase_udi.trim() === '') &&
            (!item.audio_url || item.audio_url.trim() === '')
          )
          .map((item: any) => ({
            id: item.id,
            text: item.phrase_rus,
            translation: '', // Нет перевода
            comment: item.comment, // если вдруг есть
            audio_url: item.audio_url,
            type: 'phrase',
          }));

        // Объединяем всё в один массив
        const combinedItems = [
          ...wordsWithTranslationNoAudio,
          ...wordsNoTranslationNoAudio,
          ...phrasesToTranslate,
        ];

        // Перемешаем
        const shuffledItems = shuffle(combinedItems);

        // Сохраняем в стейт
        setItems(shuffledItems);
        setCurrentItem(shuffledItems[0] || null);
        setTotalItems(shuffledItems.length);

        if (shuffledItems.length === 0) {
          setError('Нет элементов, требующих перевода или озвучивания.');
        }
      })
      .catch((err) => {
        setError('Ошибка при получении данных.');
        console.error(err);
      });

    // Статистика по словарю (количество переведённых слов)
    api
      .get('/dictionary-statistics')
      .then((response) => {
        setTranslatedItems(response.data.translated);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [navigate]);

  // Функция для перемешивания массива
  const shuffle = (array: TaskItem[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // ----------------------------------------------------------------
  // Сабмит (добавление перевода, если нужно, и озвучки)
  // ----------------------------------------------------------------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentItem) {
      setError('Нет элемента для добавления перевода/озвучки');
      return;
    }

    // Проверяем наличие аудиозаписи
    if (!audioBlob) {
      setError('Сначала запишите произношение.');
      return;
    }

    // Определяем, есть ли необходимость в переводе
    const needTranslation =
      (currentItem.type === 'word' && !currentItem.translation) ||
      currentItem.type === 'phrase';

    // Если нужна запись перевода, проверяем наличие userTranslation
    if (needTranslation && !userTranslation.trim()) {
      setError('Сначала введите перевод на удинский язык.');
      return;
    }

    // Создаём FormData
    const formData = new FormData();
    formData.append('username', username || '');
    formData.append('audio', audioBlob, 'audio.wav');

    if (currentItem.type === 'word') {
      // Слово
      // Если слово без перевода (word_udi), берём из userTranslation
      // Иначе берём готовое currentItem.translation
      const wordUdi = currentItem.translation
        ? currentItem.translation
        : userTranslation;

      formData.append('word_udi', wordUdi);
      formData.append('word_rus', currentItem.text);
      // comment, если нужно, можно тоже передавать:
      // if (currentItem.comment) formData.append('comment', currentItem.comment);

      // Запрос на эндпоинт для добавления/обновления слова: /add-translation
      setIsLoading(true);
      api
        .post('/add-translation', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then(() => {
          setSuccessMessage('Слово успешно обновлено!');
          handleAfterSubmit();
        })
        .catch((err) => {
          setError('Ошибка при добавлении озвучки');
          console.error('Error:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Фраза
      // Здесь всегда нужно добавить phrase_udi (берём из userTranslation)
      formData.append('phrase_udi', userTranslation.trim());
      formData.append('phrase_rus', currentItem.text);

      // Эндпоинт для фраз: /add-phrase-translation
      setIsLoading(true);
      api
        .post('/add-phrase-translation', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then(() => {
          setSuccessMessage('Фраза успешно обновлена!');
          handleAfterSubmit();
        })
        .catch((err) => {
          setError('Ошибка при добавлении озвучки фразы');
          console.error('Error:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  // После успешной отправки убираем текущий элемент и переходим к следующему
  const handleAfterSubmit = () => {
    setAudioUrl('');
    setAudioBlob(null);
    setError('');
    setUserTranslation('');

    // Удаляем использованный элемент
    const remaining = items.slice(1);
    setItems(remaining);
    setCurrentItem(remaining[0] || null);

    // Обновим счётчик "переведённых" слов (только если это слово)
    // Для фраз статистику не ведём, оставим как в исходном коде
    if (currentItem && currentItem.type === 'word') {
      setTranslatedItems((prev) => prev + 1);
    }
  };

  // ----------------------------------------------------------------
  // Логика записи аудио
  // ----------------------------------------------------------------
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

        intervalRef.current = setInterval(
          () => setDuration((prev) => prev + 1),
          1000
        );
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
              setCurrentTime(soundRef.current?.seek() as number || 0);
            }, 100);
          },
          onend: () => {
            setIsPlaying(false);
            setCurrentTime(0);
          },
        });

        // Останавливаем все дорожки
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

  const handlePlayPause = () => {
    if (isPlaying) {
      soundRef.current?.pause();
    } else {
      soundRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatDuration = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes < 10 ? '0' : ''}${minutes}:${
      seconds < 10 ? '0' : ''
    }${seconds}`;
  };

  // ----------------------------------------------------------------
  // Пропуск текущего элемента
  // ----------------------------------------------------------------
  const handleSkip = () => {
    if (!currentItem) return;
    const remaining = items.slice(1);
    setItems(remaining);
    setCurrentItem(remaining[0] || null);
    setAudioUrl('');
    setAudioBlob(null);
    setError('');
    setUserTranslation('');
  };

  // ----------------------------------------------------------------
  // Удаление текущего элемента (для админа)
  // ----------------------------------------------------------------
  const handleDeleteCurrent = () => {
    if (!currentItem) return;

    // В зависимости от типа, будет разный эндпоинт
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

        const remaining = items.slice(1);
        setItems(remaining);
        setCurrentItem(remaining[0] || null);
        setAudioUrl('');
        setAudioBlob(null);
        setError('');
        setUserTranslation('');
      })
      .catch((err) => {
        setError('Ошибка при удалении элемента');
        console.error('Delete error:', err);
      });
  };

  // ----------------------------------------------------------------
  // Отрисовка
  // ----------------------------------------------------------------
  // Логика заголовка в зависимости от типа и наличия перевода:
  const getTitle = () => {
    if (!currentItem) return '';

    if (currentItem.type === 'phrase') {
      return 'Добавьте перевод и произношение фразы';
    }
    // Слово
    if (currentItem.translation) {
      // если уже есть перевод (word_udi)
      return 'Добавьте произношение слова';
    } else {
      return 'Добавьте перевод и произношение слова';
    }
  };

  return (
    <div className="page-wrapper">
      <h1 className="section-title translate-title">{getTitle()}</h1>

      {/* Старая надпись "Осталось озвучить X слов" в примере: */}
      <p className="words-stat">Осталось {items.length} слов и фраз</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {currentItem ? (
        <form className="add-form" onSubmit={handleSubmit}>
          <div>
            {/* Если это слово с переводом, показываем русское + удинское.
                Если слово без перевода, показываем только русское, а поле для ввода удинского – ниже.
                Если фраза – тоже только исходную фразу, а поле для ввода удинского – ниже.
            */}
            {currentItem.type === 'word' ? (
              <>
                <p className='russian-word'>
                  {currentItem.text}
                </p>
                {currentItem.translation && (
                  <p className='udin-word'>
                    {currentItem.translation}
                  </p>
                )}
              </>
            ) : (
              // фраза
              <p className='russian-word'>
                {currentItem.text}
              </p>
            )}

            {currentItem.comment && (
              <p className="comment">Комментарий: {currentItem.comment}</p>
            )}
          </div>

          {/* Если перевода нет (слово без word_udi) или это фраза (phrase_udi всегда нужно), 
              показываем поле для ввода перевода */}
          {(currentItem.type === 'phrase' || !currentItem.translation) && (
            <div className="translation-input-block">
              <label>
                <input className='udin-word'
                  type="text"
                  value={userTranslation}
                  onChange={(e) => setUserTranslation(e.target.value)}
                  placeholder='введите перевод на удинский...'
                />
              </label>
            </div>
          )}

          <div className="record-wrapper">
            {/* Плеер прослушивания, если уже записано что-то */}
            {audioUrl && (
              <div className="audio-player-wrapper">
                <div className="audio-player">
                  <button
                    className={`player-play-btn ${
                      isPlaying ? 'playing' : 'paused'
                    }`}
                    type="button"
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? '' : ''}
                  </button>
                  <p className="player-time">
                    {formatDuration(Math.floor(currentTime))} /{' '}
                    {formatDuration(duration)}
                  </p>
                </div>
              </div>
            )}

            {/* Кнопки записи / остановки / повторной записи */}
            {isRecording ? (
              <div className="indicator-wrapper">
                <p className="record-duration-text">
                  {formatDuration(duration)}
                </p>
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
                <button
                  className="stop-record-btn"
                  type="button"
                  onClick={stopRecording}
                >
                  
                </button>
              </div>
            ) : audioUrl ? (
              <button
                className="re-record-btn"
                type="button"
                onClick={handleReset}
              >
                
              </button>
            ) : (
              <button
                className="record-btn"
                type="button"
                onClick={startRecording}
              >
                Записать произношение
              </button>
            )}
          </div>

          {/* Кнопка сохранить */}
          <button className="save-btn" type="submit" disabled={isLoading}>
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </button>

          {/* Кнопка "Пропустить" и "Удалить" (для админа) */}
          <div className="btn-skip-wrapper">
            {role === 'admin' && (
              <button
                type="button"
                onClick={handleDeleteCurrent}
                className="delete-btn-admin"
              >
                Удалить
              </button>
            )}
            <button className="skip-btn" type="button" onClick={handleSkip}>
              Пропустить
            </button>
          </div>

          {successMessage && <p className="success-msg">{successMessage}</p>}
        </form>
      ) : (
        // Если currentItem == null, значит элементы закончились
        <p style={{ marginTop: '20px' }}>
          Нет элементов, требующих перевода или озвучивания
        </p>
      )}

      <p className="add-word-text">
        - Нажмите "Записать произношение", чтобы добавить аудиозапись.
      </p>
      <p className="add-word-text">
        - Если не хотите переводить текущую фразу или слово, то нажмите "Пропустить".
      </p>
    </div>
  );
};
export default AddTranslationPage;
