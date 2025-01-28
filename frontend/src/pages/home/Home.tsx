import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/axiosConfig'; // Используем настроенный axios
import './Home.css';
import LevelProgress from '../../components/progressBar/LevelProgress';  // <-- путь подкорректируйте
import UserStatistics from '../../components/userStats/UserStatistics'; // Импортируем новый компонент

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
  const [wordStats, setWordStats] = useState<UserStats | null>(null);
  const [phraseStats, setPhraseStats] = useState<PhraseStats | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // Загружаем профиль
        const profileRes = await api.get('/user/profile');
        setUser(profileRes.data);

        // Загружаем статистику по словам
        const wordStatsRes = await api.get('/user/stats');
        setWordStats(wordStatsRes.data);

        // Загружаем статистику по фразам
        const phraseStatsRes = await api.get('/user/phrase-stats');
        setPhraseStats(phraseStatsRes.data);
      } catch (err) {
        setError('Ошибка при загрузке данных');
        console.error(err);
      }
    };

    fetchData();
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
      {error && <p className="error-message">{error}</p>}

      {user && (
        <>
          <p className="greeting">Привет, {getFullName()}!</p>
          {/* Наш вынесенный компонент */}
          <LevelProgress xp={user.xp} />
        </>
      )}

      {wordStats && phraseStats && (
        <UserStatistics wordStats={wordStats} phraseStats={phraseStats} />
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
