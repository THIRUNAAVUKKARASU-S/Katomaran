const db = require('../utils/dbHelper');

module.exports = async function (req, res, next) {
  const apiKey = req.header('x-api-key');

  if (!apiKey) {
    return res.status(401).json({ message: 'Access denied. No API key provided' });
  }

  try {
    const keyRecord = await db.apiKey.findOne({ key: apiKey });

    if (!keyRecord || !keyRecord.isActive) {
      return res.status(401).json({ message: 'Invalid or revoked developer API key' });
    }

    // Increment usage count
    await db.apiKey.findByIdAndUpdate(keyRecord._id, {
      usageCount: keyRecord.usageCount + 1
    });

    // Populate user id for resource creation reference
    req.user = {
      id: keyRecord.userId
    };

    next();
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'API validation error' });
  }
};
