import React, { useEffect, useState, useRef } from 'react';
import './DictionaryPage.css';
import api from '../services/axiosConfig'; // Путь к вашему файлу

interface PhrasesEntry {
  id: number;
  phrase_udi: string;
  phrase_rus: string;
  audio_url: string;
}

const PhrasesPage: React.FC = () => {
  const [phrases, setPhrases] = useState<PhrasesEntry[]>([]);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true); // Для проверки, есть ли еще слова для подгрузки
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Запрос на сервер для получения слов с пагинацией
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/phrases?page=${page}&limit=50`);
        // Проверяем, чтобы не было дублирующих слов при подгрузке
        setHasMore(response.data.length === 50); // Если меньше 50, значит больше нет данных для подгрузки
        setPhrases((prev) => {
          // Преобразуем новый список в Set для удаления дубликатов
          const uniqueEntries = new Map(prev.concat(response.data).map((entry) => [entry.id, entry]));
          return Array.from(uniqueEntries.values()); // Преобразуем Map обратно в массив
        });
      } catch (err) {
        setError('Не удалось загрузить фразы');
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


 const filteredPhrases = phrases
    .filter(
      (entry) =>
        entry.phrase_udi && entry.phrase_udi.trim() !== '' && // Проверка на наличие удинского перевода
        (entry.phrase_udi.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.phrase_rus.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleAudioPlay = (audioUrl: string) => {
      // Проверяем, начинается ли audioUrl с "http" (уже полный URL)
      const fullAudioUrl = audioUrl.startsWith('http') 
        ? audioUrl 
        : `${import.meta.env.VITE_API_URL || 'https://udilang.ru'}${audioUrl.startsWith('/') ? '' : '/'}${audioUrl}`;
      
      console.log('Full audio URL:', fullAudioUrl);
    
      try {
        const audio = new Audio(fullAudioUrl);
        audio.play().catch(() => {
        });
      } catch (error) {
        console.error('Error playing audio:', error);
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
      <h1 className="section-title">Фразы</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div className="search-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Найти фразы..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {filteredPhrases.length > 0 ? (
        <ul className="dictionary-list">
          {filteredPhrases.map((entry, index) => (
            <li
              key={entry.id} // Используем уникальный ключ - entry.id
              className="dictionary-item"
              ref={filteredPhrases.length === index + 1 ? lastElementRef : null}
            >
              <p>
                <strong>{entry.phrase_udi}</strong> - {entry.phrase_rus}
              </p>
              <button
                className="dictionary-play-btn"
                onClick={() => handleAudioPlay(entry.audio_url)}
              >
                Произношение
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

export default PhrasesPage;
