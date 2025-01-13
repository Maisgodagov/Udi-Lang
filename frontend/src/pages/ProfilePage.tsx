import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProfilePage.css'

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<{ username: string; email: string; created_at: string; role: string } | null>(null);
  const [userStats, setUserStats] = useState<{ total: number; translated: number }>({
    total: 0,
    translated: 0,
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Token:', token);
    if (!token) {
      // Если нет токена, перенаправляем на страницу логина
      console.error('No token found');
      navigate('/login');
    } else {
      // Получаем данные пользователя с сервера
      axios
        .get('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }, // Отправляем токен для аутентификации
        })
        .then((response) => {
          console.log('User profile data:', response.data);
          setUser(response.data); // Сохраняем полученные данные пользователя
          localStorage.setItem('role', response.data.role); // Сохраняем роль в localStorage
        })
        .catch((err) => {
          setError('Не удалось загрузить данные пользователя');
          console.error('Error fetching user profile:', err.response?.data || err.message);
        });
  
      // Получаем статистику пользователя (количество добавленных и переведенных слов)
      axios
        .get('/api/user/stats', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setUserStats(response.data); // Сохраняем статистику
        })
        .catch((err) => {
          setError('Не удалось загрузить статистику');
          console.error('Error fetching user statistics:', err.response?.data || err.message);
        });
    }
  }, [navigate]);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className='page-wrapper'>

      <h1 className='section-title'>Личный кабинет</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {user ? (
        <div className='profile-wrapper'>
          <div className="profile-top">
            <div className='profile-picture'></div>
            <div>
              <div className="name-wrapper">
                <p className='profile-name'>{user.username.slice(0,1).toUpperCase()}{user.username.slice(1)}</p>
                <p className='profile-role'> {user.role}</p>
              </div>
              <p className='profile-email'>Почта: {user.email}</p>
              {/* Преобразуем строку с датой в объект Date и выводим ее */}
              <p className='profile-join-date'>
                На UdiLang с {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Invalid Date'}
              </p>
            </div>
          </div>
          <p className='profile-stat'>
            {`Вы добавили в словарь ${userStats.translated} слов`}
          </p>
          <button className='profile-logout' onClick={handleLogout}>Выйти</button>
        </div>
      ) : (
        <p>Загрузка</p>
      )}
    </div>
  );
};

export default ProfilePage;
