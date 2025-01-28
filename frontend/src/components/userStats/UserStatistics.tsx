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
          <h3>Статистика слов</h3>
          <p>Всего слов в процессе: {wordStats.totalLearned}</p>
          <p>Выучено (mastered): {wordStats.masteredCount}</p>
          <p>Нужно повторить: {wordStats.needReviewCount}</p>
        </div>
        <div className="statistics-section">
          <h3>Статистика фраз</h3>
          <p>Всего фраз в процессе: {phraseStats.totalPhrases}</p>
          <p>Выучено (mastered): {phraseStats.masteredPhrases}</p>
          <p>Нужно повторить: {phraseStats.needReviewPhrases}</p>
        </div>
      </div>
    </div>
  );
};

export default UserStatistics;
