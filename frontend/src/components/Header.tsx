import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Hamburger from 'hamburger-react';  // Импортируем компонент из библиотеки
import axios from 'axios';  // Для запросов на сервер
import './Header.css'

const Header: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Состояние для отображения бургер-меню
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Получаем данные пользователя с сервера
      axios
        .get('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }, // Отправляем токен для аутентификации
        })
        .then((response) => {
          console.log('User data from server:', response.data); // Логируем полученные данные
          setUsername(response.data.username); // Извлекаем имя пользователя из ответа
        })
        .catch((err) => {
          setError('Error fetching user data');
          console.error(err);
        });
    } else {
      setError('No token found, please log in');
    }
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'; // Блокируем прокрутку
    } else {
      document.body.style.overflow = ''; // Убираем блокировку прокрутки
    }
    // Очищаем эффект при размонтировании компонента
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);


  const handleLogout = () => {
    localStorage.removeItem('token'); // Удаляем токен
    navigate('/login');  // Перенаправляем на страницу логина
  };

   // Обработчик для закрытия меню при клике на ссылку
   const handleLinkClick = () => {
    setIsMenuOpen(false); // Закрываем меню при клике
  };

  return (
    <header className='header'>
      <div className='logo'>
        <Link className='logo-text' to="/">UdiLang</Link>
      </div>

      {/* Кнопка бургер-меню с анимацией */}
      <div className='burgerMenuButton' onClick={() => setIsMenuOpen(!isMenuOpen)}>
        <Hamburger toggled={isMenuOpen} toggle={setIsMenuOpen} />
      </div>

      {/* Бургер-меню */}
      <nav className={isMenuOpen ? 'nav open' : 'nav'}>
          
        <ul className='navList'>
        <li className='navItem'>    
          <div className='userSelection'>
            {username ? <p className='username'>Привет, {username.slice(0,1).toUpperCase()}{username.slice(1)}!</p> : null}
            {error && <p className='error'>{error}</p>}
          </div>
          </li>
          <li className='navItem'>    
            <Link to="/profile" className='navLink' onClick={handleLinkClick}>Личный кабинет</Link>
          </li>

          <li className='navItem'>
            <Link to="/" className='navLink' onClick={handleLinkClick}>Главная</Link>
          </li>
          <li className='navItem'>
            <Link to="/dictionary" className='navLink' onClick={handleLinkClick}>Словарь</Link>
          </li>
          <li className='navItem'>
            <Link to="/add-word" className='navLink' onClick={handleLinkClick}>Добавить слово</Link>
          </li>
          <li className='navItem'>
            <Link to="/add-translation" className='navLink' onClick={handleLinkClick}>Переводить слова</Link>
          </li>
          <li className='navItem'>
            <Link to="/admin" className='navLink' onClick={handleLinkClick}>Админ</Link>
          </li>
        </ul>
        <button onClick={handleLogout} className='logoutButton'>Выйти</button>

      </nav>
    </header>
  );
};

export default Header;
