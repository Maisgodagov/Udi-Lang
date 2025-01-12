import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPage.css';
import api from '../services/axiosConfig'; // Путь к вашему файлу

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
      const response = await api.get('/dictionary');
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
    <div className="dictionary-wrapper">
      <h1 className="section-title">Админ панель</h1>
      {error && <p className="error-msg">{error}</p>}
      {successMessage && <p className="success-msg">{successMessage}</p>}
      <ul className="admin-list">
        {dictionary.map((entry) => (
          <li key={entry.id} className="admin-item">
            <div className="admin-info">
              <span className="admin-id">{entry.id}.</span>
              <div className="admin-word">
                {editingId === entry.id ? (
                  <input
                    className='word-edit-input'
                    placeholder='Слово на удинском'
                    type="text"
                    value={wordUdiEdit}
                    onChange={(e) => setWordUdiEdit(e.target.value)}
                  />
                ) : (
                  <span className='admin-word-udi'>{entry.word_udi} -</span>
                )}
              </div>
              <div className="admin-word">
                {editingId === entry.id ? (
                  <input
                    className='word-edit-input'
                    placeholder='Перевод на русский'
                    type="text"
                    value={wordRusEdit}
                    onChange={(e) => setWordRusEdit(e.target.value)}
                  />
                ) : (
                  <span className='admin-word-rus'>{entry.word_rus}</span>
                )}
              </div>
              <span className="admin-username">{entry.username}</span>
            </div>
            <div className="admin-actions">
              <button
                className="play-btn"
                onClick={() => handlePlayAudio(entry.audio_url)}
              >Произн.
              </button>
              {editingId === entry.id ? (
                <>
                  <button
                    className="word-save-btn"
                    onClick={() => handleSave(entry.id)}
                  >
                    Сохр.
                  </button>
                  <button
                    className="word-cancel-btn"
                    onClick={handleCancelEdit}
                  >
                    Отм.
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(entry)}
                  >
                    Ред.
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(entry.id)}
                  >
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

export default AdminPage;
