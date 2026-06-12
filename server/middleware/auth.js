const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from header
  const authHeader = req.header('Authorization');
  let token;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'linklite_super_secret_jwt_key_hackathon_winner');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};
