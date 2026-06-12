const mongoose = require('mongoose');
const User = require('../models/User');
const URL = require('../models/URL');
const Analytics = require('../models/Analytics');
const Workspace = require('../models/Workspace');
const APIKey = require('../models/APIKey');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

// In-Memory Database Fallback Store
const memoryDb = {
  users: [],
  urls: [],
  analytics: [],
  workspaces: [],
  apiKeys: [],
  activities: [],
  notifications: []
};

// Seed a default personal workspace if needed
const isMongooseConnected = () => mongoose.connection.readyState === 1;

// Helper to get random coordinates based on country for mock previews
const getMockCoordinates = (country) => {
  const coords = {
    'US': { lat: 37.7749, lng: -122.4194, city: 'San Francisco', state: 'California' },
    'IN': { lat: 19.0760, lng: 72.8777, city: 'Mumbai', state: 'Maharashtra' },
    'GB': { lat: 51.5074, lng: -0.1278, city: 'London', state: 'England' },
    'FR': { lat: 48.8566, lng: 2.3522, city: 'Paris', state: 'Île-de-France' },
    'DE': { lat: 52.5200, lng: 13.4050, city: 'Berlin', state: 'Berlin' },
    'JP': { lat: 35.6762, lng: 139.6503, city: 'Tokyo', state: 'Tokyo' },
    'CA': { lat: 43.6532, lng: -79.3832, city: 'Toronto', state: 'Ontario' }
  };
  return coords[country] || { lat: 39.8283, lng: -98.5795, city: 'Unknown City', state: 'Unknown State' };
};

const dbHelper = {
  isMock: () => !isMongooseConnected(),

  // User Queries
  user: {
    findOne: async (query) => {
      if (isMongooseConnected()) return await User.findOne(query);
      if (query.email) {
        let u = memoryDb.users.find(x => x.email.toLowerCase() === query.email.toLowerCase());
        if (!u && query.email.toLowerCase() === 'member@example.com') {
          u = {
            _id: 'usr_mockmember',
            name: 'Mock Member',
            email: 'member@example.com',
            createdAt: new Date()
          };
          memoryDb.users.push(u);
        }
        return u || null;
      }
      return null;
    },
    findById: async (id) => {
      if (isMongooseConnected()) return await User.findById(id).select('-password');
      const u = memoryDb.users.find(u => u._id === id);
      if (u) {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
      }
      return null;
    },
    create: async (data) => {
      if (isMongooseConnected()) {
        const user = new User(data);
        await user.save();
        return user;
      }
      const newUser = {
        _id: 'usr_' + Math.random().toString(36).substring(2, 9),
        ...data,
        createdAt: new Date()
      };
      memoryDb.users.push(newUser);
      
      // Auto-create a default workspace for mock user
      const defaultWs = {
        _id: 'ws_' + Math.random().toString(36).substring(2, 9),
        name: `${newUser.name}'s Workspace`,
        ownerId: newUser._id,
        members: [{ userId: newUser._id, role: 'Owner' }],
        createdAt: new Date()
      };
      memoryDb.workspaces.push(defaultWs);

      return newUser;
    }
  },

  // URL Queries
  url: {
    findOne: async (query) => {
      if (isMongooseConnected()) return await URL.findOne(query);
      if (query.shortCode) {
        return memoryDb.urls.find(u => u.shortCode === query.shortCode) || null;
      }
      if (query.$or) {
        const alias = query.$or[0].shortCode || query.$or[0].customAlias;
        return memoryDb.urls.find(u => u.shortCode === alias || u.customAlias === alias) || null;
      }
      if (query.userId && query.originalUrl) {
        return memoryDb.urls.find(u => u.userId === query.userId && u.originalUrl === query.originalUrl && !u.customAlias) || null;
      }
      return null;
    },
    find: async (query) => {
      if (isMongooseConnected()) return await URL.find(query).sort({ createdAt: -1 });
      if (query.userId) {
        // Return urls belonging to user OR workspaces they belong to
        const workspaces = memoryDb.workspaces.filter(ws => 
          ws.members.some(m => m.userId.toString() === query.userId.toString())
        );
        const wsIds = workspaces.map(w => w._id.toString());
        return memoryDb.urls
          .filter(u => (u.userId && u.userId.toString() === query.userId.toString()) || (u.workspaceId && wsIds.includes(u.workspaceId.toString())))
          .sort((a, b) => b.createdAt - a.createdAt);
      }
      if (query.workspaceId) {
        return memoryDb.urls
          .filter(u => u.workspaceId && u.workspaceId.toString() === query.workspaceId.toString())
          .sort((a, b) => b.createdAt - a.createdAt);
      }
      return [];
    },
    findById: async (id) => {
      if (isMongooseConnected()) return await URL.findById(id);
      return memoryDb.urls.find(u => u._id === id) || null;
    },
    create: async (data) => {
      if (isMongooseConnected()) {
        const url = new URL(data);
        await url.save();
        return url;
      }
      const newUrl = {
        _id: 'url_' + Math.random().toString(36).substring(2, 9),
        clicks: 0,
        createdAt: new Date(),
        ...data
      };
      memoryDb.urls.push(newUrl);
      return newUrl;
    },
    findByIdAndUpdate: async (id, set) => {
      if (isMongooseConnected()) {
        return await URL.findByIdAndUpdate(id, { $set: set }, { new: true });
      }
      const idx = memoryDb.urls.findIndex(u => u._id === id);
      if (idx !== -1) {
        memoryDb.urls[idx] = { ...memoryDb.urls[idx], ...set };
        return memoryDb.urls[idx];
      }
      return null;
    },
    findByIdAndDelete: async (id) => {
      if (isMongooseConnected()) {
        return await URL.findByIdAndDelete(id);
      }
      const idx = memoryDb.urls.findIndex(u => u._id === id);
      if (idx !== -1) {
        const deleted = memoryDb.urls[idx];
        memoryDb.urls.splice(idx, 1);
        return deleted;
      }
      return null;
    },
    incrementClicks: async (urlObj) => {
      if (isMongooseConnected()) {
        urlObj.clicks += 1;
        await urlObj.save();
        return;
      }
      const url = memoryDb.urls.find(u => u._id === urlObj._id);
      if (url) {
        url.clicks += 1;
      }
    }
  },

  // Analytics Queries
  analytics: {
    find: async (query) => {
      if (isMongooseConnected()) return await Analytics.find(query).sort({ timestamp: -1 });
      if (query.urlId) {
        return memoryDb.analytics
          .filter(a => a.urlId.toString() === query.urlId.toString())
          .sort((a, b) => b.timestamp - a.timestamp);
      }
      return [];
    },
    create: async (data) => {
      let finalData = { ...data };
      
      // Inject coordinate details for demo mapping on local IP redirects
      if (!isMongooseConnected()) {
        const mockGeo = getMockCoordinates(data.country || 'US');
        finalData = {
          ...finalData,
          latitude: data.latitude || mockGeo.lat,
          longitude: data.longitude || mockGeo.lng,
          city: data.city || mockGeo.city,
          state: data.state || mockGeo.state
        };
      }

      if (isMongooseConnected()) {
        const analytic = new Analytics(finalData);
        await analytic.save();
        return analytic;
      }
      
      const newAnalytic = {
        _id: 'an_' + Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
        ...finalData
      };
      memoryDb.analytics.push(newAnalytic);
      return newAnalytic;
    },
    deleteMany: async (query) => {
      if (isMongooseConnected()) return await Analytics.deleteMany(query);
      if (query.urlId) {
        memoryDb.analytics = memoryDb.analytics.filter(a => a.urlId.toString() !== query.urlId.toString());
      }
    },
    getTrend: async (urlId, days) => {
      if (isMongooseConnected()) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);
        const trend = await Analytics.aggregate([
          {
            $match: {
              urlId: new mongoose.Types.ObjectId(urlId),
              timestamp: { $gte: thirtyDaysAgo }
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
              clicks: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        return trend.map(item => ({ date: item._id, clicks: item.clicks }));
      }
      
      const visits = memoryDb.analytics.filter(a => a.urlId.toString() === urlId.toString());
      const dates = {};
      visits.forEach(v => {
        const dStr = new Date(v.timestamp).toISOString().split('T')[0];
        dates[dStr] = (dates[dStr] || 0) + 1;
      });
      return Object.keys(dates).sort().map(d => ({ date: d, clicks: dates[d] }));
    },
    getDistribution: async (urlId, field) => {
      if (isMongooseConnected()) {
        const dist = await Analytics.aggregate([
          { $match: { urlId: new mongoose.Types.ObjectId(urlId) } },
          {
            $group: {
              _id: `$${field}`,
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } }
        ]);
        return dist.map(item => ({ name: item._id, value: item.count }));
      }

      const visits = memoryDb.analytics.filter(a => a.urlId.toString() === urlId.toString());
      const counts = {};
      visits.forEach(v => {
        const val = v[field] || 'Unknown';
        counts[val] = (counts[val] || 0) + 1;
      });
      return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
    }
  },

  // Workspace Queries
  workspace: {
    find: async (query) => {
      if (isMongooseConnected()) return await Workspace.find(query).populate('members.userId', 'name email');
      if (query['members.userId']) {
        const uid = query['members.userId'].toString();
        return memoryDb.workspaces.filter(ws => 
          ws.members.some(m => m.userId.toString() === uid)
        );
      }
      return [];
    },
    findById: async (id) => {
      if (isMongooseConnected()) return await Workspace.findById(id).populate('members.userId', 'name email');
      return memoryDb.workspaces.find(w => w._id === id) || null;
    },
    create: async (data) => {
      if (isMongooseConnected()) {
        const ws = new Workspace(data);
        await ws.save();
        return ws;
      }
      const newWs = {
        _id: 'ws_' + Math.random().toString(36).substring(2, 9),
        createdAt: new Date(),
        ...data
      };
      memoryDb.workspaces.push(newWs);
      return newWs;
    },
    findByIdAndUpdate: async (id, set) => {
      if (isMongooseConnected()) {
        return await Workspace.findByIdAndUpdate(id, { $set: set }, { new: true }).populate('members.userId', 'name email');
      }
      const idx = memoryDb.workspaces.findIndex(w => w._id === id);
      if (idx !== -1) {
        memoryDb.workspaces[idx] = { ...memoryDb.workspaces[idx], ...set };
        return memoryDb.workspaces[idx];
      }
      return null;
    },
    findByIdAndDelete: async (id) => {
      if (isMongooseConnected()) return await Workspace.findByIdAndDelete(id);
      const idx = memoryDb.workspaces.findIndex(w => w._id === id);
      if (idx !== -1) {
        const deleted = memoryDb.workspaces[idx];
        memoryDb.workspaces.splice(idx, 1);
        
        // Cascade delete URLs under workspace
        memoryDb.urls = memoryDb.urls.filter(u => u.workspaceId?.toString() !== id.toString());
        return deleted;
      }
      return null;
    }
  },

  // APIKey Queries
  apiKey: {
    find: async (query) => {
      if (isMongooseConnected()) return await APIKey.find(query);
      if (query.userId) {
        return memoryDb.apiKeys.filter(k => k.userId.toString() === query.userId.toString());
      }
      return [];
    },
    findOne: async (query) => {
      if (isMongooseConnected()) return await APIKey.findOne(query);
      if (query.key) {
        return memoryDb.apiKeys.find(k => k.key === query.key) || null;
      }
      return null;
    },
    create: async (data) => {
      if (isMongooseConnected()) {
        const keyObj = new APIKey(data);
        await keyObj.save();
        return keyObj;
      }
      const newKey = {
        _id: 'key_' + Math.random().toString(36).substring(2, 9),
        usageCount: 0,
        createdAt: new Date(),
        ...data
      };
      memoryDb.apiKeys.push(newKey);
      return newKey;
    },
    findByIdAndUpdate: async (id, set) => {
      if (isMongooseConnected()) {
        return await APIKey.findByIdAndUpdate(id, { $set: set }, { new: true });
      }
      const idx = memoryDb.apiKeys.findIndex(k => k._id === id);
      if (idx !== -1) {
        memoryDb.apiKeys[idx] = { ...memoryDb.apiKeys[idx], ...set };
        return memoryDb.apiKeys[idx];
      }
      return null;
    },
    findByIdAndDelete: async (id) => {
      if (isMongooseConnected()) return await APIKey.findByIdAndDelete(id);
      const idx = memoryDb.apiKeys.findIndex(k => k._id === id);
      if (idx !== -1) {
        const deleted = memoryDb.apiKeys[idx];
        memoryDb.apiKeys.splice(idx, 1);
        return deleted;
      }
      return null;
    }
  },

  // Activity Queries
  activity: {
    find: async (query) => {
      if (isMongooseConnected()) return await Activity.find(query).sort({ timestamp: -1 }).limit(30);
      if (query.userId) {
        return memoryDb.activities
          .filter(a => a.userId.toString() === query.userId.toString())
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 30);
      }
      return [];
    },
    create: async (data) => {
      if (isMongooseConnected()) {
        const act = new Activity(data);
        await act.save();
        return act;
      }
      const newAct = {
        _id: 'act_' + Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
        ...data
      };
      memoryDb.activities.push(newAct);
      return newAct;
    }
  },

  // Notification Queries
  notification: {
    find: async (query) => {
      if (isMongooseConnected()) return await Notification.find(query).sort({ createdAt: -1 });
      if (query.userId) {
        return memoryDb.notifications
          .filter(n => n.userId.toString() === query.userId.toString())
          .sort((a, b) => b.createdAt - a.createdAt);
      }
      return [];
    },
    create: async (data) => {
      if (isMongooseConnected()) {
        const notif = new Notification(data);
        await notif.save();
        return notif;
      }
      const newNotif = {
        _id: 'ntf_' + Math.random().toString(36).substring(2, 9),
        isRead: false,
        createdAt: new Date(),
        ...data
      };
      memoryDb.notifications.push(newNotif);
      return newNotif;
    },
    findByIdAndUpdate: async (id, set) => {
      if (isMongooseConnected()) {
        return await Notification.findByIdAndUpdate(id, { $set: set }, { new: true });
      }
      const idx = memoryDb.notifications.findIndex(n => n._id === id);
      if (idx !== -1) {
        memoryDb.notifications[idx] = { ...memoryDb.notifications[idx], ...set };
        return memoryDb.notifications[idx];
      }
      return null;
    },
    markAllAsRead: async (userId) => {
      if (isMongooseConnected()) {
        await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
        return;
      }
      memoryDb.notifications.forEach(n => {
        if (n.userId.toString() === userId.toString()) {
          n.isRead = true;
        }
      });
    }
  }
};

module.exports = dbHelper;
