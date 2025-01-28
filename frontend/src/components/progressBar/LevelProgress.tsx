import React from 'react';
import './LevelProgress.css';

/**
 * Интерфейс для свойств
 * xp: общее количество опыта пользователя
 */
interface LevelProgressProps {
  xp: number;
}

/**
 * Компонент, который показывает уровень и прогресс до следующего уровня.
 */
const LevelProgress: React.FC<LevelProgressProps> = ({ xp }) => {
  // Пример вычисления уровня:
  // Уровень = floor( sqrt(xp / 100) )
  const currentLevel = Math.floor(Math.sqrt(xp / 100));
  const nextLevel = currentLevel + 1;

  // Сколько XP нужно для текущего уровня (минимум) и для следующего
  const currentLevelXP = currentLevel * currentLevel * 100;
  const nextLevelXP = nextLevel * nextLevel * 100;
  const leftToNextLevel = nextLevelXP - xp;
  // Сколько XP между текущим уровнем и следующим
  const range = nextLevelXP - currentLevelXP;
  // Сколько уже "накоплено" с начала текущего уровня
  const progressInLevel = xp - currentLevelXP;
  // Вычисляем процент прохождения от текущего уровня до следующего
  const percent = Math.min(100, Math.floor((progressInLevel / range) * 100));

  return (
    <div className="level-progress-wrapper">
      <h3>{currentLevel} уровень</h3>
      <p>{xp} очков</p>
      <div className="xp-progress-bar">
        <div className="xp-progress-inner" style={{ width: `${percent}%` }}>
          {percent}%
        </div>
      </div>
      <p className="xp-stats">
        {leftToNextLevel} очков до уровня {nextLevel}
      </p>
    </div>
  );
};

export default LevelProgress;
