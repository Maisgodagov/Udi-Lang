import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TrainingPage.css';

// Информация об играх
const games = [
  {
    id: 'words-game',
    title: 'Изучи слово',
    description: 'Тренируйся, соединяя слова с их переводами.',
    route: '/words-game',
  },
  {
    id: 'phrase-game',
    title: 'Собери фразу',
    description: 'Эта игра в разработке.',
    route: '/phrase-game',
  },
];

const TrainingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (route: string) => {
    navigate(route);
  };

  return (
    <div className="training-page">
      <h1 className="section-title">Выбери тренировку</h1>
      <div className="games-list">
        {games.map((game) => (
          <div className="game-card" key={game.id}>
            <h2 className="game-title">{game.title}</h2>
            <p className="game-description">{game.description}</p>
            <button
              className="game-play-btn"
              onClick={() => handleNavigate(game.route)}
            >
              Играть
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrainingPage;
