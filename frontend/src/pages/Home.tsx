import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

// Опционально, интерфейс для статистики пользователя
interface UserStats {
  translated: number; // количество переведенных слов
  total: number;      // общее количество слов, добавленных пользователем
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>('');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Если нет токена, перенаправляем на страницу логина
      navigate('/login');
      return;
    }

    // Загружаем профиль
    axios
      .get('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        setUsername(response.data.username);
      })
      .catch((err) => {
        setError('Ошибка при получении профиля');
        console.error(err);
      });

    // Загружаем статистику
    axios
      .get('/api/user/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        setUserStats(response.data);
      })
      .catch((err) => {
        console.error(err);
        setError('Ошибка при загрузке статистики пользователя');
      });
  }, [navigate]);

  // Пример функции для перехода по маршрутам
  const handleNavigate = (route: string) => {
    navigate(route);
  };
  

  return (
    <div className="home-page">
      <h1 className="home-title">Сайт в разработке</h1>
      {/* {error && <p style={{ color: 'red' }}>{error}</p>}

      {username && <p className="greeting">Привет, {username}!</p>}

      {userStats && (
        <div className="progress-block">
          <h2>Ваш прогресс</h2>
          <p>Добавлено слов: {userStats.total}</p>
          <p>Озвучено (или переведено) слов: {userStats.translated}</p>
          {/* Дополнительно можно вычислить % завершения, если есть общая цель */}
          {/* <p>
            Прогресс: 
            {userStats.total > 0
              ? ((userStats.translated / userStats.total) * 100).toFixed(1)
              : 0}
            %
          </p>
        </div>
      )}

      <div className="quick-actions">
        <h2>Начните обучение сейчас!</h2>
        <div className="actions-grid">
          <button className="action-btn" onClick={() => handleNavigate('/training')}>
            Тренироваться
          </button>
          <button className="action-btn" onClick={() => handleNavigate('/dictionary')}>
            Перейти к словарю
          </button>
          <button className="action-btn" onClick={() => handleNavigate('/phrases')}>
            Перейти к фразам
          </button>
          <button className="action-btn" onClick={() => handleNavigate('/profile')}>
            Мой профиль
          </button>
        </div>
      </div> */} 

      {/* Пример блока с "мотивацией" или новостями
      <div className="motivation-block">
        <h2>Мотивирующая цитата</h2>
        <p className="quote-text">
          "Язык — ключ к культуре" <br />
          — Неизвестный автор
        </p>
      </div> */}
    </div>
  );
};

export default Home;
