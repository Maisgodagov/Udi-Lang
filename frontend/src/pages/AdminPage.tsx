import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPage.css';

interface DictionaryEntry {
  id: number;
  word_udi: string;
  word_rus: string;
  audio_url: string;
  username: string;
}

const AdminPage: React.FC = () => {
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [wordUdiEdit, setWordUdiEdit] = useState<string>('');
  const [wordRusEdit, setWordRusEdit] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    fetchDictionary();
  }, []);

  const fetchDictionary = async () => {
    try {
      const response = await axios.get('/api/dictionary');
      setDictionary(response.data);
    } catch (err) {
      setError('Ошибка при загрузке слов');
      console.error(err);
    }
  };

  const handleEdit = (entry: DictionaryEntry) => {
    setEditingId(entry.id);
    setWordUdiEdit(entry.word_udi);
    setWordRusEdit(entry.word_rus);
  };

  const handleSave = async (id: number) => {
    try {
      await axios.put(`/api/dictionary/${id}`, { word_udi: wordUdiEdit, word_rus: wordRusEdit });
      setSuccessMessage('Слово успешно обновлено');
      setEditingId(null);
      fetchDictionary();
    } catch (err) {
      setError('Ошибка при сохранении слова');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить это слово?')) {
      try {
        await axios.delete(`/api/dictionary/${id}`);
        setSuccessMessage('Слово успешно удалено');
        fetchDictionary();
      } catch (err) {
        setError('Ошибка при удалении слова');
        console.error(err);
      }
    }
  };

  const handlePlayAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch((err) => console.error('Ошибка воспроизведения аудио:', err));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setWordUdiEdit('');
    setWordRusEdit('');
  };

  return (
    <div className="admin-page">
      <h1 className="section-title">Админ панель</h1>
      {error && <p className="error-msg">{error}</p>}
      {successMessage && <p className="success-msg">{successMessage}</p>}
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Удинское слово</th>
            <th>Русское слово</th>
            <th>Добавлено пользователем</th>
            <th>Произношение</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {dictionary.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.id}</td>
              <td>
                {editingId === entry.id ? (
                  <input
                    type="text"
                    value={wordUdiEdit}
                    onChange={(e) => setWordUdiEdit(e.target.value)}
                  />
                ) : (
                  entry.word_udi
                )}
              </td>
              <td>
                {editingId === entry.id ? (
                  <input
                    type="text"
                    value={wordRusEdit}
                    onChange={(e) => setWordRusEdit(e.target.value)}
                  />
                ) : (
                  entry.word_rus
                )}
              </td>
              <td>{entry.username}</td>
              <td>
                <button
                  className="play-btn"
                  onClick={() => handlePlayAudio(entry.audio_url)}
                >
                  ▶️
                </button>
              </td>
              <td>
                {editingId === entry.id ? (
                  <>
                    <button
                      className="save-btn"
                      onClick={() => handleSave(entry.id)}
                    >
                      Сохранить
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={handleCancelEdit}
                    >
                      Отмена
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(entry)}
                    >
                      Редактировать
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(entry.id)}
                    >
                      Удалить
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPage;
