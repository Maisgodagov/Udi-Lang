import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import Home from './pages/Home';
import ProfilePage from './pages/ProfilePage';
import Header from './components/Header';
import DictionaryPage from './pages/DictionaryPage';
import AddWordPage from './pages/AddWordPage';
import AddTranslationPage from './pages/AddTranslationPage';

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

// Дополнительный компонент для обработки рендеринга Header
const AppContent: React.FC = () => {
  const location = useLocation();  // Получаем текущий путь
  return (
    <div>
      {/* Условный рендеринг Header */}
      {location.pathname !== '/login' && location.pathname !== '/register' && <Header />}
      
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/dictionary" element={<DictionaryPage />} />
          <Route path="/add-word" element={<AddWordPage />} />
          <Route path="/add-translation" element={<AddTranslationPage  />} />
        </Routes>
      </div>
    </div>
  );
};
export default App;
