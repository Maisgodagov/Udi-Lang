import React from 'react';
import './UserStatistics.css';

// Интерфейсы для типов данных
interface UserStats {
  totalLearned: number;
  masteredCount: number;
  needReviewCount: number;
}

interface PhraseStats {
  totalPhrases: number;
  masteredPhrases: number;
  needReviewPhrases: number;
}

interface UserStatisticsProps {
  wordStats: UserStats;
  phraseStats: PhraseStats;
}

const UserStatistics: React.FC<UserStatisticsProps> = ({ wordStats, phraseStats }) => {
  return (
    <div className="user-statistics-container">
      <h2 className="statistics-title">Ваша статистика</h2>
      <div className="statistics-blocks">
        <div className="statistics-section">
          <h3>Слова</h3>
          <p>Пройдено: {wordStats.totalLearned}</p>
          <p>Выучено: {wordStats.masteredCount}</p>
          <p>Повторить: {wordStats.needReviewCount}</p>
        </div>
        <div className="statistics-section">
          <h3>Фразы</h3>
          <p>Пройдено: {phraseStats.totalPhrases}</p>
          <p>Выучено: {phraseStats.masteredPhrases}</p>
          <p>Повторить: {phraseStats.needReviewPhrases}</p>
        </div>
      </div>
    </div>
  );
};

export default UserStatistics;
