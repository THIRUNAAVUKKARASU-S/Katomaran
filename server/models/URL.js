const mongoose = require('mongoose');

const URLSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  originalUrl: {
    type: String,
    required: [true, 'Original URL is required']
  },
  shortCode: {
    type: String,
    required: [true, 'Short code is required'],
    unique: true,
    trim: true
  },
  customAlias: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  shortUrl: {
    type: String,
    required: [true, 'Short URL is required']
  },
  clicks: {
    type: Number,
    default: 0
  },
  expiryDate: {
    type: Date,
    default: null
  },
  // Security upgrades
  password: {
    type: String,
    default: null
  },
  isPasswordProtected: {
    type: Boolean,
    default: false
  },
  isPublicStatsEnabled: {
    type: Boolean,
    default: false
  },
  // Enterprise collaboration
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    default: null
  },
  // Smart dynamic redirections
  smartRedirects: {
    devices: {
      mobile: { type: String, default: null },
      tablet: { type: String, default: null },
      desktop: { type: String, default: null }
    },
    countries: [
      {
        country: { type: String, uppercase: true }, // e.g. "US", "IN"
        url: { type: String }
      }
    ]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('URL', URLSchema);
