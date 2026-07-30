const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/operations', require('./routes/operationRoutes'));
app.use('/api/boms', require('./routes/bomRoutes'));
app.use('/api/routings', require('./routes/routingRoutes'));
app.use('/api/joborders', require('./routes/jobOrderRoutes'));
app.use('/api/production-entries', require('./routes/productionEntryRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/audit-logs', require('./routes/auditLogRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/backup', require('./routes/backupRoutes'));

module.exports = app;