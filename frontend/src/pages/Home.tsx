import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();  // Инициализируем navigate

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Если нет токена, перенаправляем на страницу логина
      navigate('/login');
    }
  }, [navigate]);
  return (
    <div>

    </div>
  );
};

export default Home;
