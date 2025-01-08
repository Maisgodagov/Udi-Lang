import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<{ username: string; email: string; created_at: string } | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Если нет токена, перенаправляем на страницу логина
      navigate('/login');
    } else {
      // Получаем данные пользователя с сервера
      axios
        .get('api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }, // Отправляем токен для аутентификации
        })
        .then((response) => {
          console.log('User data from client:', response.data); // Логируем полученные данные
          setUser(response.data);  // Сохраняем полученные данные пользователя
        })
        .catch((err) => {
          setError('Error fetching user data');
          console.error(err);
        });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div>
      <h1>User Profile</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {user ? (
        <div>
          <p>Username: {user.username}</p>
          <p>Email: {user.email}</p>
          {/* Преобразуем строку с датой в объект Date и выводим ее */}
          <p>
            Registration Date: {user.created_at ? new Date(user.created_at).toLocaleString() : 'Invalid Date'}
          </p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default ProfilePage;
