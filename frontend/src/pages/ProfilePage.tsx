import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProfilePage.css';

interface UserProfile {
  username: string;
  email: string;
  role: string;
  created_at: string;
  xp: number;          // добавлено
  first_name: string;  // добавлено
  last_name: string;   // добавлено
  gender: string;      // добавлено
  birth_date: string;  // добавлено
}

interface UserStats {
  totalLearned: number;
  masteredCount: number;
  needReviewCount: number;
}

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    totalLearned: 0,
    masteredCount: 0,
    needReviewCount: 0,
  });

  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      navigate('/login');
      return;
    }

    // 1) Загружаем профиль
    axios
      .get('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setUser(response.data);
        localStorage.setItem('role', response.data.role);
      })
      .catch((err) => {
        setError('Не удалось загрузить данные пользователя');
        console.error('Error fetching user profile:', err.response?.data || err.message);
      });

    // 2) Загружаем статистику
    axios
      .get('/api/user/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setUserStats(response.data);
      })
      .catch((err) => {
        setError('Не удалось загрузить статистику');
        console.error('Error fetching user statistics:', err.response?.data || err.message);
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="page-wrapper">
      <h1 className="section-title">Личный кабинет</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {user ? (
        <div className="profile-wrapper">
          <div className="profile-top">
            <div className="profile-picture" />
            <div>
              {/* Отображаем имя + фамилию, если они есть */}
              <div className="name-wrapper">
                <p className="profile-name">
                  {user.first_name ? user.first_name : user.username} {user.last_name}
                </p>
                <p className="profile-role"> {user.role}</p>
              </div>

              {/* Почта */}
              <p className="profile-email">Почта: {user.email}</p>

              {/* Пол (gender) */}
              {user.gender && (
                <p className="profile-gender">Пол: {user.gender}</p>
              )}

              {/* Дата рождения */}
              {user.birth_date && (
                <p className="profile-birth-date">
                  Дата рождения: {new Date(user.birth_date).toLocaleDateString()}
                </p>
              )}

              {/* Дата регистрации */}
              <p className="profile-join-date">
                На UdiLang с{' '}
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : 'Invalid Date'}
              </p>
            </div>
          </div>

          {/* XP и уровень (если хотим уровень) */}
          <div className="xp-block">
            <p>Набранный опыт (XP): {user.xp}</p>
            {/* Если хотим вывести уровень, можно вычислять так */}
            <p>
              Уровень:{' '}
              {Math.floor(Math.sqrt(user.xp / 100))}
            </p>
          </div>

          {/* Статистика пользователя */}
          <div className="stats-block">
            <p>Всего слов в изучении: {userStats.totalLearned}</p>
            <p>Выучено (mastered): {userStats.masteredCount}</p>
            <p>Нужно повторить: {userStats.needReviewCount}</p>
          </div>

          <button className="profile-logout" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      ) : (
        <p>Загрузка</p>
      )}
    </div>
  );
};

export default ProfilePage;
