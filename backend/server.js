const express = require('express');
const cors = require('cors');
const walletRoutes = require('./routes/walletRoutes');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
    origin: '*',
    allowedHeaders: ['Content-Type', 'user-id', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api', walletRoutes);

// Simple health check endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Smart Digital Wallet Backend is running!' });
});

app.listen(PORT, () => {
    console.log(`Server is running locally on http://localhost:${PORT}`);
});
