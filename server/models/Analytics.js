const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  urlId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'URL',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  browser: {
    type: String,
    default: 'Unknown'
  },
  device: {
    type: String,
    default: 'Desktop'
  },
  os: {
    type: String,
    default: 'Unknown'
  },
  ipAddress: {
    type: String,
    default: 'Unknown'
  },
  country: {
    type: String,
    default: 'Unknown'
  },
  // Location upgrades
  state: {
    type: String,
    default: 'Unknown'
  },
  city: {
    type: String,
    default: 'Unknown'
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  }
});

module.exports = mongoose.model('Analytics', AnalyticsSchema);
