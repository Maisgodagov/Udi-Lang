import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

// Интерфейс профиля (по желанию можно дополнить)
interface UserProfile {
  username: string;
  xp: number;         // общий опыт пользователя
  role: string;
  // ... если нужны другие поля, например first_name, last_name, ...
}

// Интерфейс статистики
interface UserStats {
  totalLearned: number;
  masteredCount: number;
  needReviewCount: number;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // 1) Загружаем профиль пользователя
    axios
      .get('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => {
        setError('Ошибка при получении профиля');
        console.error(err);
      });

    // 2) Загружаем статистику (totalLearned, masteredCount, needReviewCount)
    axios
      .get('/api/user/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setStats(res.data);
      })
      .catch((err) => {
        setError('Ошибка при загрузке статистики пользователя');
        console.error(err);
      });
  }, [navigate]);

  // Вычислим уровень (пример: level = floor(sqrt(xp / 100)))
  const getLevel = (xp: number) => {
    return Math.floor(Math.sqrt(xp / 100));
  };

  const handleNavigate = (route: string) => {
    navigate(route);
  };

  return (
    <div className="home-page">
      <h1 className="home-title">Добро пожаловать на UdiLang!</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {user && (
        <p className="greeting">Привет, {user.username}!</p>
      )}

      {/* Блок "геймификации" */}
      {user && (
        <div className="xp-block">
          <h2>Ваш уровень и опыт</h2>
          <p>Уровень: {getLevel(user.xp)} </p>
          <p>Опыт (XP): {user.xp}</p>
          {/* Пример: Прогресс до следующего уровня */}
          <ProgressBar xp={user.xp} />
        </div>
      )}

      {stats && (
        <div className="progress-block">
          <h2>Статистика изучения</h2>
          <p>Всего слов в процессе: {stats.totalLearned}</p>
          <p>Выученных слов: {stats.masteredCount}</p>
          <p>Нужно повторить: {stats.needReviewCount}</p>
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
      </div>
    </div>
  );
};

export default Home;

// Дополнительный пример компонента ProgressBar (очень простой)
interface ProgressBarProps {
  xp: number;
}
const ProgressBar: React.FC<ProgressBarProps> = ({ xp }) => {
  // Пример: для перехода с уровня N на N+1 нужно 100*(N+1)^2 XP
  // или любой другой алгоритм. Для простоты сделаем на основе "sqrt(xp / 100)".
  const currentLevel = Math.floor(Math.sqrt(xp / 100));
  const currentLevelXP = currentLevel * currentLevel * 100;     // XP, при котором уровень currentLevel
  const nextLevel = currentLevel + 1;
  const nextLevelXP = nextLevel * nextLevel * 100;             // XP для следующего уровня
  const range = nextLevelXP - currentLevelXP;                  // сколько XP между этими уровнями
  const progressInLevel = xp - currentLevelXP;                 // сколько "вложено" в текущий уровень

  // вычислим процент прохождения
  const percent = Math.min(100, Math.floor((progressInLevel / range) * 100));

  return (
    <div className="xp-progress-bar">
      <div className="xp-progress-inner" style={{ width: `${percent}%` }}>
        {percent}%
      </div>
      <p style={{ fontSize: '0.9rem' }}>
        {xp} / {nextLevelXP} XP до уровня {nextLevel}
      </p>
    </div>
  );
};
