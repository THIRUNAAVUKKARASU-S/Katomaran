require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const apiRoutes = require('./routes/api');
const { redirectURL } = require('./controllers/redirectController');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
// Customize Helmet content security policy to allow remote resource loads in local client dev
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false
}));

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'production') {
      return callback(null, true);
    }
    return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
  },
  credentials: true
}));

// Request Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 200, // Limit each IP to 200 requests per `window`
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Apply rate limiter to API routes
app.use('/api', apiLimiter);

// API Routes
app.use('/api', apiRoutes);

// Public Redirect Route (needs to be server-side redirect)
// Use a separate rate limiter for redirects if desired, or skip it so users can access shortened links quickly
app.get('/:shortCode', redirectURL);

// Server status endpoint
app.get('/', (req, res) => {
  res.json({ status: 'LinkLite Server is running smoothly.' });
});

// Database Connection
const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/linklite';

console.log('Attempting database connection to MongoDB...');
mongoose.connect(dbUri)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.warn('⚠️ Failed to connect to MongoDB:', err.message);
    console.log('🚀 Falling back to In-Memory Database Mode for local preview.');
    app.listen(PORT, () => {
      console.log(`Server is running in Fallback Mock Mode on port ${PORT}`);
    });
  });
