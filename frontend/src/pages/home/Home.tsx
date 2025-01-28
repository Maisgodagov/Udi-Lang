import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';
import LevelProgress from '../../components/progressBar/LevelProgress';  // <-- путь подкорректируйте

// Интерфейсы для типов данных
interface UserProfile {
  username: string;
  xp: number;
  first_name: string;
  last_name?: string; // Добавлено для отображения фамилии
}

interface UserStats {
  totalLearned: number;
  masteredCount: number;
  needReviewCount: number;
}

interface PhraseStats {
  totalPhrases: number;
  masteredPhrases: number;
  needReviewPhrases: number;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [phraseStats, setPhraseStats] = useState<PhraseStats | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Загружаем профиль
    axios
      .get('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => {
        setError('Ошибка при получении профиля');
        console.error(err);
      });

    // Загружаем статистику по словам
    axios
      .get('/api/user/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setStats(res.data);
      })
      .catch((err) => {
        setError('Ошибка при загрузке статистики слов');
        console.error(err);
      });

    // Загружаем статистику по фразам
    axios
      .get('/api/user/phrase-stats', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setPhraseStats(res.data);
      })
      .catch((err) => {
        setError('Ошибка при загрузке статистики фраз');
        console.error(err);
      });
  }, [navigate]);

  const handleNavigate = (route: string) => {
    navigate(route);
  };

  // Функция для отображения полного имени
  const getFullName = () => {
    if (!user) return '';
    const firstName = user.first_name.trim();
    const lastName = user.last_name ? user.last_name.trim() : '';
    return `${firstName} ${lastName}`.trim();
  };

  return (
    <div className="home-page">
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {user && (
        <>
          <p className="greeting">Привет, {getFullName()}!</p>
          {/* Наш вынесенный компонент */}
          <LevelProgress xp={user.xp} />
        </>
      )}

      {stats && (
        <div className="progress-block">
          <h2>Статистика слов</h2>
          <p>Всего слов в процессе: {stats.totalLearned}</p>
          <p>Выучено (mastered): {stats.masteredCount}</p>
          <p>Нужно повторить: {stats.needReviewCount}</p>
        </div>
      )}

      {phraseStats && (
        <div className="progress-block">
          <h2>Статистика фраз</h2>
          <p>Всего фраз в процессе: {phraseStats.totalPhrases}</p>
          <p>Выучено (mastered): {phraseStats.masteredPhrases}</p>
          <p>Нужно повторить: {phraseStats.needReviewPhrases}</p>
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
