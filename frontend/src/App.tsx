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
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';
import PhrasesPage from './pages/PhrasesPage';

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

// Компонент для обработки рендеринга Header
const AppContent: React.FC = () => {
  const location = useLocation(); // Получаем текущий путь
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
          <Route path="/phrases" element={<PhrasesPage />} />
          <Route
            path="/add-word"
            element={
              <ProtectedRoute allowedRoles={['admin', 'moderator']}>
                <AddWordPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-translation"
            element={
              <ProtectedRoute allowedRoles={['translator', 'admin', 'moderator']}>
                <AddTranslationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
};

export default App;
