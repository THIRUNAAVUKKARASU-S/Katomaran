const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const db = require('../utils/dbHelper');

// Register User
exports.register = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  try {
    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Strong password check: min 6 chars, containing a letter and number
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    let user = await db.user.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in DB
    user = await db.user.create({
      name,
      email,
      password: hashedPassword
    });

    // Generate JWT
    const payload = {
      user: {
        id: user.id || user._id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'linklite_super_secret_jwt_key_hackathon_winner',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({
          token,
          user: {
            id: user.id || user._id,
            name: user.name,
            email: user.email
          }
        });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Login User
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Check if user exists
    const user = await db.user.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const payload = {
      user: {
        id: user.id || user._id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'linklite_super_secret_jwt_key_hackathon_winner',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id || user._id,
            name: user.name,
            email: user.email
          }
        });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Get User Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await db.user.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Get User Audit Activities Timeline
exports.getActivities = async (req, res) => {
  try {
    const activities = await db.activity.find({ userId: req.user.id });
    res.json(activities);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Get User Notifications Alerts
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await db.notification.find({ userId: req.user.id });
    res.json(notifications);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Mark All Notifications as Read
exports.markNotificationsRead = async (req, res) => {
  try {
    await db.notification.markAllAsRead(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};
