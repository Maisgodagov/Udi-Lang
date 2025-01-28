import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Hamburger from 'hamburger-react'; // Компонент бургер-меню
import axios from 'axios';
import './Header.css';

// Описываем интерфейс для профиля пользователя
interface UserProfile {
  id?: number;
  username: string;
  role: string;
  email?: string;
  xp?: number;
  first_name?: string;
  last_name?: string;
  gender?: string;
  birth_date?: string;
  created_at?: string;
}

const Header: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          setUser(response.data);
          // Сохраняем роль в localStorage (если нужно)
          localStorage.setItem('role', response.data.role);
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

  // Обработчик выхода из аккаунта
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  // Закрываем меню при клике по ссылке
  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  // Вспомогательный метод для отображения "имя фамилия" или username
  const getDisplayName = () => {
    if (!user) return '';
    const first = user.first_name?.trim();
    const last = user.last_name?.trim();

    if (first || last) {
      // например: "Иван Петров"
      return [first, last].filter(Boolean).join(' ');
    } else {
      // Если имя и фамилия не заданы, выводим username
      return user.username.charAt(0).toUpperCase() + user.username.slice(1);
    }
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-wrapper">
          <div className="logo">
            <Link className="logo-text" to="/">UdiLang</Link>
          </div>

          <div className="burgerMenuButton" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Hamburger toggled={isMenuOpen} toggle={setIsMenuOpen} />
          </div>
        </div>

        <nav className={isMenuOpen ? 'nav open' : 'nav'}>
          <ul className="navList">
            {/* Блок с приветствием пользователя */}
            <li className="navItem">
              <Link to="/profile" className="navLink" onClick={handleLinkClick}>
                <div className="nav-profile-wrapper">
                  <span className="profile-picture nav-profile-picture"></span>
                  <div className="nav-profile-info">
                    {user && (
                      <p className="username">
                        {getDisplayName()}
                      </p>
                    )}
                    {user && (
                      <p className="user-role">@{user.username}</p>
                    )}
                    {error && <p className="error">{error}</p>}
                  </div>
                  <span className="nav-profile-link"></span>
                </div>
              </Link>
            </li>

            <span className="nav-devider"></span>
            <li className="navItem">
              <Link to="/" className="navLink" onClick={handleLinkClick}>
                <p className="nav-home-link">Главная</p>
              </Link>
            </li>
            <li className="navItem">
              <Link to="/dictionary" className="navLink" onClick={handleLinkClick}>
                <p className="nav-dict-link">Слова</p>
              </Link>
            </li>
            <li className="navItem">
              <Link to="/phrases" className="navLink" onClick={handleLinkClick}>
                <p className="nav-phrase-link">Фразы</p>
              </Link>
            </li>
            <li className="navItem">
              <Link to="/training" className="navLink" onClick={handleLinkClick}>
                <p className="nav-practice-link">Тренироваться</p>
              </Link>
            </li>
            <span className="nav-devider"></span>

            {(user?.role === 'admin' || user?.role === 'moderator' || user?.role === 'translator') && (
              <li className="navItem">
                <Link to="/add-translation" className="navLink" onClick={handleLinkClick}>
                  <p className="nav-record-link">Переводить</p>
                </Link>
              </li>
            )}
            {(user?.role === 'admin' || user?.role === 'moderator' || user?.role === 'translator') && (
              <span className="nav-devider"></span>
            )}
            {(user?.role === 'admin' || user?.role === 'moderator') && (
              <>
                <li className="navItem">
                  <Link to="/add-word" className="navLink" onClick={handleLinkClick}>
                    Добавить слово
                  </Link>
                </li>
                <li className="navItem">
                  <Link to="/add-phrase" className="navLink" onClick={handleLinkClick}>
                    Добавить фразу
                  </Link>
                </li>
              </>
            )}
            {user?.role === 'admin' && (
              <>
                <li className="navItem">
                  <Link to="/admin" className="navLink" onClick={handleLinkClick}>
                    Админ-слова
                  </Link>
                </li>
                <li className="navItem">
                  <Link to="/admin-phrase" className="navLink" onClick={handleLinkClick}>
                    Админ-фразы
                  </Link>
                </li>
                <li className="navItem">
                  <Link to="/admin-users" className="navLink" onClick={handleLinkClick}>
                    Админ-пользователи
                  </Link>
                </li>
              </>
            )}
          </ul>

          {(user?.role === 'admin') && <span className="nav-devider"></span>}

          <button onClick={handleLogout} className="logoutButton">Выйти</button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
