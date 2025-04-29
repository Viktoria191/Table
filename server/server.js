const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['https://your-frontend.vercel.app', 'http://localhost:3000']
}));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'build')));

app.get('/api/items', (req, res) => { /* ... */ });
app.post('/api/select', (req, res) => { /* ... */ });
app.post('/api/reorder', (req, res) => { /* ... */ });

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});