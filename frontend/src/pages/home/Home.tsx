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
  return (
    <div className="home-page">
      <div className="container">
        {error && <p className="error-message">{error}</p>}

        {user && (
          <>
            <p className="greeting">Привет, {user.first_name.trim()}!</p>
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
            <div className="action-btn words-game-btn" onClick={() => handleNavigate('/words-game')}>
              Учить слова
            </div>
            <div className="action-btn phrase-game-btn" onClick={() => handleNavigate('/phrase-game')}>
              Учить фразы
            </div>
            <div className="action-btn dictionary-btn" onClick={() => handleNavigate('/dictionary')}>
              Словарь
            </div>
            <div className="action-btn phrases-btn" onClick={() => handleNavigate('/phrases')}>
              Сборник фраз
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default Home;
