// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import our route files
const authRoutes = require('./routes/authRoutes');
const leadRoutes = require('./routes/leadRoutes');

// Create the Express app
const app = express();

// ---- MIDDLEWARE ----
// Allow cross-origin requests (so our frontend can talk to backend)
app.use(cors());
// Parse incoming JSON request bodies
app.use(express.json());

// ---- DATABASE ----
// Connect to MongoDB
connectDB();

// ---- ROUTES ----
// All auth routes start with /api/auth  (login, register)
app.use('/api/auth', authRoutes);
// All lead routes start with /api/leads (CRUD for leads)
app.use('/api/leads', leadRoutes);

// A simple test route to confirm the server is running
app.get('/', (req, res) => {
  res.json({ message: 'MiniCRM API is running!' });
});

// ---- START SERVER ----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});