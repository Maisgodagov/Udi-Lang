const express = require('express');
const path = require('path');
const cors = require('cors');
const { authRoutes } = require('./routes/authRoutes');
const { userRoutes } = require('./routes/userRoutes');
const { dictionaryRoutes } = require('./routes/dictionaryRoutes');

const app = express();
app.use(express.json());
app.use(cors());

// Отдаем файлы из папки 'uploads' как статические
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Путь должен быть правильным

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api', dictionaryRoutes);

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
