import React, { useState, useEffect } from 'react';
import './PhraseGame.css';
import api from '../services/axiosConfig';
import correctSoundFile from '../assets/right.wav';
import incorrectSoundFile from '../assets/wrong.wav';

interface Phrase {
  id: number;
  phrase_udi: string;
  phrase_rus: string;
  audio_url: string;
}

const shuffleArray = (array: string[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const playSound = (soundFile: string) => {
  const audio = new Audio(soundFile);
  audio.play().catch((err) => console.error('Ошибка воспроизведения звука:', err));
};

const PhraseGame: React.FC = () => {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [currentPhrase, setCurrentPhrase] = useState<Phrase | null>(null);
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [started, setStarted] = useState<boolean>(false);

  useEffect(() => {
    const fetchPhrases = async () => {
      try {
        const response = await api.get('/phrases');
        const filteredPhrases: Phrase[] = response.data.filter(
          (phrase: any) => phrase.audio_url && phrase.audio_url.trim() !== ''
        );
        setPhrases(filteredPhrases);
        setCurrentPhrase(filteredPhrases[0] || null);
      } catch (error) {
        console.error('Ошибка при загрузке фраз:', error);
      }
    };

    fetchPhrases();
  }, []);

  useEffect(() => {
    if (currentPhrase && started) {
      const words = currentPhrase.phrase_udi.split(' ');
      setShuffledWords(shuffleArray(words));
      setSelectedWords([]);
      setFeedback('');
      playAudio(currentPhrase.audio_url);
    }
  }, [currentPhrase, started]);

  const playAudio = (audioUrl: string) => {
    const fullAudioUrl = audioUrl.startsWith('http')
      ? audioUrl
      : `${import.meta.env.VITE_API_URL || 'https://udilang.ru'}${audioUrl.startsWith('/') ? '' : '/'}${audioUrl}`;
    const audio = new Audio(fullAudioUrl);
    audio.play().catch((err) => console.error('Ошибка воспроизведения аудио:', err));
  };

  const handleWordClick = (word: string, index: number) => {
    if (!currentPhrase) return;

    const correctWords = currentPhrase.phrase_udi.split(' ');
    const isCorrect = word === correctWords[selectedWords.length];

    if (isCorrect) {
      setSelectedWords((prev) => [...prev, word]);
      setShuffledWords((prev) => prev.filter((_, i) => i !== index));

      if (selectedWords.length + 1 === correctWords.length) {
        setFeedback('Верно!');
        playSound(correctSoundFile);
        setTimeout(() => {
          const currentIndex = phrases.findIndex((p) => p.id === currentPhrase.id);
          const nextPhrase = phrases[currentIndex + 1] || null;
          setCurrentPhrase(nextPhrase);
        }, 1000);
      }
    } else {
      playSound(incorrectSoundFile);
      const wordElement = document.getElementById(`word-${index}`);
      if (wordElement) {
        wordElement.classList.add('incorrect');
        setTimeout(() => {
          wordElement.classList.remove('incorrect');
        }, 1000);
      }
    }
  };

  const handleStart = () => {
    setStarted(true);
  };

  if (!started) {
    return (
      <div className="phrase-game-container start-screen">
        <h1 className="game-title">Собери фразу</h1>
        <button className="start-btn" onClick={handleStart}>
          Начать игру
        </button>
      </div>
    );
  }

  if (!currentPhrase) {
    return <p>Все фразы закончились!</p>;
  }

  const correctWords = currentPhrase.phrase_udi.split(' ');

  return (
    <div className="phrase-game-container">
      <h1 className="game-title">Собери фразу</h1>
      <p className="phrase-translation">{currentPhrase.phrase_rus}</p>
      <button className="play-audio-btn" onClick={() => playAudio(currentPhrase.audio_url)}>
        Воспроизвести озвучку
      </button>
      <div className="shuffled-words">
        {shuffledWords.map((word, index) => (
          <button
            key={index}
            id={`word-${index}`}
            className="word-btn"
            onClick={() => handleWordClick(word, index)}
          >
            {word}
          </button>
        ))}
      </div>
      <div className="phrase-slots">
        {correctWords.map((_, index) => (
          <div
            key={index}
            className={`slot ${selectedWords[index] ? 'filled' : ''}`}
          >
            {selectedWords[index] || ''}
          </div>
        ))}
      </div>
      {feedback && <p className="feedback">{feedback}</p>}
    </div>
  );
};

export default PhraseGame;
