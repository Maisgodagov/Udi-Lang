import React, { useState, useEffect } from 'react';
import './AdminPage.css';
import api from '../services/axiosConfig';

// Интерфейс для элемента "фразы"
interface PhraseEntry {
  id: number;
  phrase_udi: string;
  phrase_rus: string;
  audio_url: string;
  username: string;
}

const AdminPhrasesPage: React.FC = () => {
  const [phrases, setPhrases] = useState<PhraseEntry[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [phraseUdiEdit, setPhraseUdiEdit] = useState<string>('');
  const [phraseRusEdit, setPhraseRusEdit] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchPhrases();
  }, []);

  // Получение всех фраз из таблицы phrases
  const fetchPhrases = async () => {
    try {
      const response = await api.get('/phrases');
      setPhrases(response.data);
    } catch (err) {
      setError('Ошибка при загрузке фраз');
      console.error(err);
    }
  };

  // Обработчик изменения строки поиска
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Фильтрация фраз по поисковому запросу (ищем по phrase_udi и phrase_rus)
  const filteredPhrases = phrases.filter(
    (entry) =>
      entry.phrase_udi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.phrase_rus.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Начать редактирование выбранной фразы
  const handleEdit = (entry: PhraseEntry) => {
    setEditingId(entry.id);
    setPhraseUdiEdit(entry.phrase_udi);
    setPhraseRusEdit(entry.phrase_rus);
  };

  // Сохранить изменения (PUT /phrases/:id)
  // Создадим эндпоинт на бэкенде по аналогии с обновлением слов:
  //   router.put('/phrases/:id', updatePhrase);
  const handleSave = async (id: number) => {
    try {
      // Отправляем PUT-запрос на /phrases/:id
      await api.put(`/phrases/${id}`, {
        phrase_udi: phraseUdiEdit,
        phrase_rus: phraseRusEdit,
      });
      setSuccessMessage('Фраза успешно обновлена');
      setEditingId(null);
      fetchPhrases();
    } catch (err) {
      setError('Ошибка при сохранении фразы');
      console.error(err);
    }
  };

  // Удалить фразу (DELETE /phrases/:id)
  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту фразу?')) {
      try {
        await api.delete(`/phrases/${id}`);
        setSuccessMessage('Фраза успешно удалена');
        fetchPhrases();
      } catch (err) {
        setError('Ошибка при удалении фразы');
        console.error(err);
      }
    }
  };

  // Воспроизвести аудио
  const handlePlayAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch((err) =>
      console.error('Ошибка воспроизведения аудио:', err)
    );
  };

  // Отмена редактирования
  const handleCancelEdit = () => {
    setEditingId(null);
    setPhraseUdiEdit('');
    setPhraseRusEdit('');
  };

  return (
    <div className="dictionary-wrapper">
      <h1 className="section-title">Управление фразами</h1>
      {error && <p className="error-msg">{error}</p>}
      {successMessage && <p className="success-msg">{successMessage}</p>}

      {/* Поле для поиска */}
      <div className="search-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Найти фразу..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      <ul className="admin-list">
        {filteredPhrases.map((entry) => (
          <li key={entry.id} className="admin-item">
            <div className="admin-info">
              <span className="admin-id">{entry.id}.</span>

              {/* phrase_udi */}
              <div className="admin-word">
                {editingId === entry.id ? (
                  <input
                    className="word-edit-input"
                    placeholder="Фраза на удинском"
                    type="text"
                    value={phraseUdiEdit}
                    onChange={(e) => setPhraseUdiEdit(e.target.value)}
                  />
                ) : (
                  <span className="admin-word-udi">{entry.phrase_udi} -</span>
                )}
              </div>

              {/* phrase_rus */}
              <div className="admin-word">
                {editingId === entry.id ? (
                  <input
                    className="word-edit-input"
                    placeholder="Фраза на русском"
                    type="text"
                    value={phraseRusEdit}
                    onChange={(e) => setPhraseRusEdit(e.target.value)}
                  />
                ) : (
                  <span className="admin-word-rus">{entry.phrase_rus}</span>
                )}
              </div>

              <span className="admin-username">{entry.username}</span>
            </div>

            <div className="admin-actions">
              {/* Кнопка проигрывания */}
              <button className="play-btn" onClick={() => handlePlayAudio(entry.audio_url)}>
                Произн.
              </button>

              {editingId === entry.id ? (
                <>
                  <button
                    className="word-save-btn"
                    onClick={() => handleSave(entry.id)}
                  >
                    Сохр.
                  </button>
                  <button className="word-cancel-btn" onClick={handleCancelEdit}>
                    Отм.
                  </button>
                </>
              ) : (
                <>
                  <button className="edit-btn" onClick={() => handleEdit(entry)}>
                    Ред.
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(entry.id)}>
                    Удалить
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminPhrasesPage;
