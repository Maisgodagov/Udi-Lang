import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface DictionaryEntry {
  id: number;
  word_udi: string;
  word_rus: string;
  audio_url: string;
}

const DictionaryPage: React.FC = () => {
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Запрос на сервер для получения слов
    axios
      .get('/api/dictionary')
      .then((response) => {
        setDictionary(response.data);  // Сохраняем полученные данные
      })
      .catch((err) => {
        setError('Error fetching dictionary data');
        console.error(err);
      });
  }, []);

  const handleAudioPlay = (audioUrl: string) => {
    // Формируем полный URL
    const fullAudioUrl = `http://localhost:3001${audioUrl}`;
    const audio = new Audio(fullAudioUrl);
    audio.play();
  };

  return (
    <div>
      <h1>Dictionary</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {dictionary.length > 0 ? (
        <ul>
          {dictionary.map((entry) => (
            <li key={entry.id}>
              <p><strong>{entry.word_udi}</strong> - {entry.word_rus}</p>
              <button onClick={() => handleAudioPlay(entry.audio_url)}>
                Play Pronunciation
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Loading dictionary...</p>
      )}
    </div>
  );
};

export default DictionaryPage;
