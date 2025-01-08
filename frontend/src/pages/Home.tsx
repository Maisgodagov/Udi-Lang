import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const [user, setUser] = useState<string | null>(null);
  const navigate = useNavigate();  // Инициализируем navigate

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Если токен есть, это означает, что пользователь залогинен.
      // В будущем здесь можно будет получить данные о пользователе с сервера.
      setUser('User'); // Здесь, возможно, стоит получить имя пользователя с сервера
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token'); // Удаляем токен из localStorage
    setUser(null);  // Очищаем информацию о пользователе
    alert('Logged out successfully!');
    navigate('/login');  // Перенаправляем на страницу логина
  };

  return (
    <div>

      {user ? (
        <div>
          <p>Welcome, {user}!</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <p>Please log in to see your information.</p>
      )}
    </div>
  );
};

export default Home;
