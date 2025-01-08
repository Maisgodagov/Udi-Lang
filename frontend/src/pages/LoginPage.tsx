import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';  // Импортируем useNavigate
import { login } from '../services/api';
import './loginPage.css'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();  // Инициализируем navigate

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await login({ email, password });
      localStorage.setItem('token', response.data.token); // Сохраняем токен в localStorage
      navigate('/');  // Перенаправляем на главную страницу
    } catch (error) {
      setError('Failed to login. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className='login-wrapper'>
      <h1 className='login-title'>Вход</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form className='login-form' onSubmit={handleSubmit}>
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
        <button className='login-btn' type="submit">Войти</button>
      </form>

      <p className='login-text'>
        Нет аккаунта? <a href="/register">Регистрация</a>
      </p>
    </div>
  );
};

export default LoginPage;
