import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import RegisterPage from './pages/register/RegisterPage';
import LoginPage from './pages/login/LoginPage';
import Home from './pages/home/Home';
import ProfilePage from './pages/profile/ProfilePage';
import Header from './components/header/Header';
import DictionaryPage from './pages/dictionary/DictionaryPage';
import AddWordPage from './pages/addWord/AddWordPage';
import AddTranslationPage from './pages/translate/AddTranslationPage';
import AdminPage from './pages/admin/adminWords/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';
import PhrasesPage from './pages/phrases/PhrasesPage';
import AdminUsers from './pages/admin/adminUsers/AdminUsers';
import WordsGame from './pages/training/wordsGame/WordsGame';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import CustomDragLayer from './components/CustomDragLayer';
import TrainingPage from './pages/training/TrainingPage';
import PhraseGame from './pages/training/phrasesGame/PhraseGame';
import AdminPhrasesPage from './pages/admin/adminPhrases/AdminPhrases';
import AddPhrasePage from './pages//addPhrase/AddPhrasePage';

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
            path="/add-phrase"
            element={
              <ProtectedRoute allowedRoles={['admin', 'moderator']}>
                <AddPhrasePage />
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
            path="/admin-phrase"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPhrasesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/words-game"
            element={
              <ProtectedRoute allowedRoles={['admin', 'translator', 'user', 'moderator']}>
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
           <Route
            path="/training"
            element={
              <ProtectedRoute allowedRoles={['admin', 'translator', 'user', 'moderator']}>
                <TrainingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/phrase-game"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PhraseGame />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
};

export default App;
