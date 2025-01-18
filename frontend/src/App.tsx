import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import AdminUsers from './pages/AdminUsers';
import WordsGame from './pages/WordsGame';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import CustomDragLayer from './components/CustomDragLayer';

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

const AppContent: React.FC = () => {
  const location = useLocation();
  const [initialRect, setInitialRect] = useState<DOMRect | null>(null);

  return (
    <div>
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
          <Route
            path="/admin-users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/words-game"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DndProvider
                  backend={
                    isTouchDevice
                      ? (manager) => TouchBackend(manager, { enableMouseEvents: true })
                      : HTML5Backend
                  }
                >
                  <WordsGame setInitialRect={setInitialRect} />
                  <CustomDragLayer initialRect={initialRect} />
                </DndProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
};

export default App;
