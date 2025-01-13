import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Hamburger from 'hamburger-react'; // Компонент бургер-меню
import axios from 'axios';
import './Header.css';

const Header: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null); // Состояние для роли
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Получаем данные пользователя
      axios
        .get('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setUsername(response.data.username);
          setRole(response.data.role); // Устанавливаем роль пользователя
          localStorage.setItem('role', response.data.role); // Сохраняем роль в localStorage
        })
        .catch((err) => {
          setError('Ошибка при загрузке данных пользователя');
          console.error(err);
        });
    } else {
      setError('Не найден токен, войдите в систему');
    }
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'; // Блокируем прокрутку
    } else {
      document.body.style.overflow = ''; // Убираем блокировку прокрутки
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="logo">
        <Link className="logo-text" to="/">UdiLang</Link>
      </div>

      <div className="burgerMenuButton" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        <Hamburger toggled={isMenuOpen} toggle={setIsMenuOpen} />
      </div>

      <nav className={isMenuOpen ? 'nav open' : 'nav'}>
        <ul className="navList">
          <li className="navItem">
            <div className="userSelection">
              {username ? <p className="username">Привет, {username.charAt(0).toUpperCase() + username.slice(1)}!</p> : null}
              {error && <p className="error">{error}</p>}
            </div>
          </li>
          <li className="navItem">
            <Link to="/profile" className="navLink" onClick={handleLinkClick}>Личный кабинет</Link>
          </li>
          <li className="navItem">
            <Link to="/" className="navLink" onClick={handleLinkClick}>Главная</Link>
          </li>
          <li className="navItem">
            <Link to="/dictionary" className="navLink" onClick={handleLinkClick}>Словарь</Link>
          </li>
          {role === 'admin' || role === 'moderator' ? (
            <li className="navItem">
              <Link to="/add-word" className="navLink" onClick={handleLinkClick}>Добавить слово</Link>
            </li>
          ) : null}
          {role === 'admin' || role === 'moderator' || role === 'translator' ? (
            <li className="navItem">
              <Link to="/add-translation" className="navLink" onClick={handleLinkClick}>Переводить</Link>
            </li>
          ) : null}
          {role === 'admin' ? (
            <li className="navItem">
              <Link to="/admin" className="navLink" onClick={handleLinkClick}>Админ</Link>
            </li>
          ) : null}
        </ul>
        <button onClick={handleLogout} className="logoutButton">Выйти</button>
      </nav>
    </header>
  );
};

export default Header;
