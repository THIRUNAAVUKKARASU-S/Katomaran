const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    default: null
  },
  action: {
    type: String,
    required: true // e.g. "URL_CREATE", "URL_DELETE", "PASSWORD_CHANGE", "MEMBER_INVITE", "API_KEY_CREATE"
  },
  description: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Activity', ActivitySchema);
