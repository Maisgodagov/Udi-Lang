import React, { useEffect, useState, useRef } from 'react';
import './DictionaryPage.css';
import api from '../../services/axiosConfig'; // Путь к вашему файлу

interface DictionaryEntry {
  id: number;
  word_udi: string;
  word_rus: string;
  audio_url: string;
}

const DictionaryPage: React.FC = () => {
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([]);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true); // Для проверки, есть ли еще слова для подгрузки
  const observer = useRef<IntersectionObserver | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Запрос на сервер для получения слов с пагинацией
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/dictionary?page=${page}&limit=50`);
        // Проверяем, чтобы не было дублирующих слов при подгрузке
        setHasMore(response.data.length === 50); // Если меньше 50, значит больше нет данных для подгрузки
        setDictionary((prev) => {
          // Преобразуем новый список в Set для удаления дубликатов
          const uniqueEntries = new Map(prev.concat(response.data).map((entry) => [entry.id, entry]));
          return Array.from(uniqueEntries.values()); // Преобразуем Map обратно в массив
        });
      } catch (err) {
        setError('Не удалось загрузить слова');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredDictionary = dictionary.filter((entry) =>
    entry.audio_url && entry.audio_url.trim() !== '' && 
    (
      entry.word_udi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.word_rus.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

    const handleAudioPlay = (entry: DictionaryEntry) => {
      if (playingId === entry.id) {
        return;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      // Проверяем, начинается ли audioUrl с "http" (уже полный URL)
      const fullAudioUrl = entry.audio_url.startsWith('http') 
        ? entry.audio_url 
        : `${import.meta.env.VITE_API_URL || 'https://udilang.ru'}${entry.audio_url.startsWith('/') ? '' : '/'}${entry.audio_url}`;      
      try {
        const audio = new Audio(fullAudioUrl);
        audioRef.current = audio;
        setPlayingId(entry.id);

        audio.onended = () => {
          setPlayingId(null);
        };
        // Если произошла ошибка или пользователь прервал воспроизведение
        audio.onpause = () => {
          setPlayingId(null);
        };
  
        audio.play().catch(() => {
          // При ошибке воспроизведения также снимаем блокировку
          setPlayingId(null);
        });
      } catch (error) {
        console.error('Error playing audio:', error);
        setPlayingId(null);
      }
    };

  // Функция для наблюдения за скроллом и подгрузкой данных
  const lastElementRef = (node: Element | null) => {
    if (loading) return; // Если уже загружаем, не начинаем новую подгрузку
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage((prev) => prev + 1); // Подгружаем следующую страницу
      }
    });
    if (node) observer.current.observe(node);
  };
  return (
    <div className="dictionary-wrapper">
      <h1 className="dictionary-section-title">Словарь</h1>
      <span className='words-count'>{filteredDictionary.length} слов</span>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div className="search-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Найти слово..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {filteredDictionary.length > 0 ? (
        <ul className="dictionary-list">
          {filteredDictionary.map((entry, index) => (
            <li
              key={entry.id} // Используем уникальный ключ - entry.id
              className="dictionary-item"
              ref={filteredDictionary.length === index + 1 ? lastElementRef : null}
            >
              <p>
                <strong>{entry.word_udi.toLowerCase()}</strong> - {entry.word_rus}
              </p>
              <button
                className="dictionary-play-btn"
                onClick={() => handleAudioPlay(entry)}
                disabled={playingId === entry.id}
              >
                {playingId === entry.id ? 'Проигрывается...' : 'Произношение'}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p></p>
      )}

      {loading && <p>Загружаем...</p>}
    </div>
  );
};

export default DictionaryPage;
