import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AddWordPage.css';
import api from '../services/axiosConfig';

const AddWordPage: React.FC = () => {
  const [wordUdi, setWordUdi] = useState('');
  const [wordRus, setWordRus] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    // Получаем профиль (если нужно, но теперь username не используется)
    axios
      .get('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } })
      .catch((err) => {
        setError('Error fetching user data');
        console.error(err);
      });
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!wordUdi || !wordRus) {
      setError('Все обязательные поля (слово на удинском и перевод) должны быть заполнены');
      return;
    }

    const formData = new FormData();
    formData.append('word_udi', wordUdi.trim().toLowerCase());
    formData.append('word_rus', wordRus.trim().toLowerCase());
    formData.append('comment', comment.trim());
    // username и audio_url не передаются, сервер вставит пустые строки

    setIsLoading(true);
    api
      .post('/dictionary', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => {
        setSuccessMessage('Слово добавлено!');
        setWordUdi('');
        setWordRus('');
        setComment('');
        setError('');
      })
      .catch((err) => {
        setError('Ошибка при добавлении слова');
        console.error('Error:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
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
        <div>
          <textarea
            className="add-input comment-input"
            placeholder="Комментарий (опционально)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
        </div>
        <button className="save-btn" type="submit" disabled={isLoading}>
          {isLoading ? 'Сохранение...' : 'Сохранить'}
        </button>
        {error && <p className="error-msg">{error}</p>}
        {successMessage && <p className="success-msg">{successMessage}</p>}
      </form>
      <p className="add-word-text">
        - Добавляйте удинское слово и перевод. Комментарий можно использовать для дополнительных пояснений.
      </p>
    </div>
  );
};

export default AddWordPage;
