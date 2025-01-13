import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';  // Импортируем useNavigate
import { register } from '../services/api';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();  // Инициализируем navigate

  useEffect(() => {
      const token = localStorage.getItem('token');
      if (token) {
        navigate('/'); // Перенаправляем на главную, если токен существует
      }
    }, [navigate]);
  
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await register({ username, email, password });
      navigate('/login');  // Перенаправляем на страницу логина
    } catch (error) {
      setError('Ошибка, попробуйте еще раз.');
      console.error(error);
    }
  };

  return (
    <div className='login-wrapper'>
      <h1 className='login-title'>Регистрация</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form className='login-form' onSubmit={handleSubmit}>
        <div>
          <input
            className='login-input'
            placeholder='Имя пользователя'
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            className='login-input' 
            placeholder='Почта'
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            className='login-input'
            placeholder='Пароль'
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className='login-btn' type="submit">Создать аккаунт</button>
      </form>

      <p className='login-text'>
        Уже есть аккаунт? <a className='reg-link' href="/login">Войти</a>
      </p>
    </div>
  );
};

export default RegisterPage;
