import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AddPhrasePage.css';
import api from '../services/axiosConfig';

const AddPhrasePage: React.FC = () => {
  const [phraseUdi, setPhraseUdi] = useState('');
  const [phraseRus, setPhraseRus] = useState('');
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
    axios
      .get('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } })
      .catch((err) => {
        setError('Error fetching user data');
        console.error(err);
      });
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!phraseUdi || !phraseRus) {
      setError('Все обязательные поля (фраза на удинском и перевод) должны быть заполнены');
      return;
    }

    const payload = {
      phrase_udi: phraseUdi.trim().toLowerCase(),
      phrase_rus: phraseRus.trim().toLowerCase(),
      comment: comment.trim(),
    };

    setIsLoading(true);
    api
      .post('/phrases', payload)
      .then(() => {
        setSuccessMessage('Фраза добавлена!');
        setPhraseUdi('');
        setPhraseRus('');
        setComment('');
        setError('');
      })
      .catch((err) => {
        setError('Ошибка при добавлении фразы');
        console.error('Error:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="page-wrapper">
      <h1 className="section-title">Добавить фразу</h1>
      <form className="add-form" onSubmit={handleSubmit}>
        <div>
          <input
            className="add-input"
            placeholder="Фраза на удинском (русскими буквами)"
            type="text"
            value={phraseUdi}
            onChange={(e) => setPhraseUdi(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            className="add-input"
            placeholder="Перевод на русский"
            type="text"
            value={phraseRus}
            onChange={(e) => setPhraseRus(e.target.value)}
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
        - Добавляйте удинский вариант фразы и перевод. Комментарий можно использовать для пояснений.
      </p>
    </div>
  );
};

export default AddPhrasePage;
