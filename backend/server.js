const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/projects', require('./routes/projects'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/reminders', require('./routes/reminders'));

// Serve frontend build in production
const frontendDist = path.join(__dirname, '../frontend/dist');
if (require('fs').existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  require('./cron/dailyReminder').start();
});
