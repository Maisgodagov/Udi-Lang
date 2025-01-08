import React, { useState } from 'react';
import axios from 'axios';
import RecordRTC from 'recordrtc';

const AddWordPage: React.FC = () => {
  const [wordUdi, setWordUdi] = useState('');
  const [wordRus, setWordRus] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recorder, setRecorder] = useState<RecordRTC | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!wordUdi || !wordRus || !audioBlob) {
      setError('All fields are required, including the audio');
      return;
    }

    const formData = new FormData();
    formData.append('word_udi', wordUdi);
    formData.append('word_rus', wordRus);
    formData.append('audio', audioBlob, 'audio.wav');

    // Отправляем данные на сервер
    axios
      .post('http://localhost:3001/api/dictionary', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => {
        setSuccessMessage('Word added successfully');
        setWordUdi('');
        setWordRus('');
        setAudioUrl('');
        setAudioBlob(null);
        setError('');
      })
      .catch((err) => {
        setError('Error adding word');
        console.error('Error:', err); // Логируем ошибку
      });
  };

  const startRecording = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const newRecorder = new RecordRTC(stream, {
          type: 'audio',
          mimeType: 'audio/wav',
          recorderType: RecordRTC.StereoAudioRecorder,
        });

        newRecorder.startRecording();
        setRecorder(newRecorder);
        setIsRecording(true);
      })
      .catch((err) => {
        console.error('Error accessing audio media: ', err);
      });
  };

  const stopRecording = () => {
    if (recorder) {
      recorder.stopRecording(() => {
        const audioBlob = recorder.getBlob();
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl); // Сохраняем URL для прослушивания
        setIsRecording(false);
      });
    }
  };

  return (
    <div>
      <h1>Add New Word</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Word in Udi:</label>
          <input
            type="text"
            value={wordUdi}
            onChange={(e) => setWordUdi(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Word in Russian:</label>
          <input
            type="text"
            value={wordRus}
            onChange={(e) => setWordRus(e.target.value)}
            required
          />
        </div>

        {/* Кнопки для записи аудио */}
        {!isRecording ? (
          <button type="button" onClick={startRecording}>
            Start Recording
          </button>
        ) : (
          <button type="button" onClick={stopRecording}>
            Stop Recording
          </button>
        )}

        {/* Прослушивание записанного аудио */}
        {audioUrl && (
          <div>
            <audio controls>
              <source src={audioUrl} type="audio/wav" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        <button type="submit">Add Word</button>
      </form>
    </div>
  );
};

export default AddWordPage;
