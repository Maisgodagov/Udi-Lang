import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AddWordPage.css';
import api from '../services/axiosConfig';

const AddWordPage: React.FC = () => {
  const [wordUdi, setWordUdi] = useState('');
  const [wordRus, setWordRus] = useState('');
  const [comment, setComment] = useState('');
  const [audioUrl, setAudioUrl] = useState(''); // если аудио уже есть, его можно задавать или оставлять пустым
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [username, setUsername] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Проверяем токен и получаем профиль
    const token = localStorage.getItem('token');
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
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!wordUdi || !wordRus || !username) {
      setError('Пожалуйста, заполните удинское слово, перевод и комментарий (если нужен)');
      return;
    }

    const wordUdiLowerCase = wordUdi.toLowerCase();
    const wordRusLowerCase = wordRus.toLowerCase();

    // Создаем FormData. Если аудио не требуется, его можно не добавлять (или оставить пустым)
    const formData = new FormData();
    formData.append('word_udi', wordUdiLowerCase);
    formData.append('word_rus', wordRusLowerCase);
    formData.append('comment', comment);
    formData.append('username', username);
    // Если аудио отсутствует, можно либо вообще не передавать поле audio, либо передавать пустую строку.
    if (audioUrl) {
      formData.append('audio', audioUrl);
    }

    api
      .post('/dictionary2', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(() => {
        setSuccessMessage('Слово добавлено!');
        setWordUdi('');
        setWordRus('');
        setComment('');
        setAudioUrl('');
        setError('');
      })
      .catch((err) => {
        setError('Ошибка при добавлении слова');
        console.error('Error:', err);
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
            className="add-textarea"
            placeholder="Комментарий (необязательно)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        {/* Если аудио не требуется, можно убрать блок с воспроизведением */}
        {/* <div className="audio-section">
          <p>Аудио (необязательно)</p>
          {/* Можно добавить поле для ввода URL или кнопку для выбора файла */}
        {/* </div> */}
        <button className="save-btn" type="submit">
          Сохранить
        </button>
        {error && <p className="error-msg">{error}</p>}
        {successMessage && <p className="success-msg">{successMessage}</p>}
      </form>
      <p className="add-word-text">
        - Пишите удинское слово русскими буквами так, как слышите его.
      </p>
      <p className="add-word-text">
        - Укажите перевод на русский.
      </p>
      <p className="add-word-text">
        - Можно добавить комментарий, если нужно.
      </p>
    </div>
  );
};

export default AddWordPage;
