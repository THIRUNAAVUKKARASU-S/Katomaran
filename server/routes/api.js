const express = require('express');
const router = express.Router();

// Middlewares
const auth = require('../middleware/auth');
const apiKeyAuth = require('../middleware/apiKeyAuth');

// Controllers
const authController = require('../controllers/authController');
const urlController = require('../controllers/urlController');
const analyticsController = require('../controllers/analyticsController');
const workspaceController = require('../controllers/workspaceController');
const apiKeyController = require('../controllers/apiKeyController');
const exportController = require('../controllers/exportController');

// --- Auth Routes ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// --- User Profile, Activities & Notifications ---
router.get('/user/profile', auth, authController.getProfile);
router.get('/user/activities', auth, authController.getActivities);
router.get('/user/notifications', auth, authController.getNotifications);
router.post('/user/notifications/read', auth, authController.markNotificationsRead);

// --- URL Operations ---
router.post('/url/create', auth, urlController.createURL);
router.get('/url/all', auth, urlController.getAllURLs);
router.put('/url/update/:id', auth, urlController.updateURL);
router.delete('/url/delete/:id', auth, urlController.deleteURL);

// --- Password Gate Verification (Public) ---
router.post('/url/verify-password/:shortCode', urlController.verifyPassword);

// --- Export Data ---
router.get('/url/export/csv/:id', auth, exportController.exportCSV);

// --- Analytics Reports ---
router.get('/analytics/:id', auth, analyticsController.getURLAnalytics);
router.get('/public/analytics/:shortCode', analyticsController.getPublicURLAnalytics);

// --- Team Workspaces ---
router.get('/workspace', auth, workspaceController.getWorkspaces);
router.post('/workspace', auth, workspaceController.createWorkspace);
router.post('/workspace/invite/:id', auth, workspaceController.inviteMember);
router.post('/workspace/remove/:id', auth, workspaceController.removeMember);
router.delete('/workspace/delete/:id', auth, workspaceController.deleteWorkspace);

// --- Developer API Keys ---
router.get('/apikey', auth, apiKeyController.getKeys);
router.post('/apikey/generate', auth, apiKeyController.generateKey);
router.delete('/apikey/revoke/:id', auth, apiKeyController.revokeKey);

// --- Developer API v1 Endpoint (Header API Key Auth) ---
router.post('/v1/shorten', apiKeyAuth, urlController.createURL);

module.exports = router;
