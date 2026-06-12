const crypto = require('crypto');
const db = require('../utils/dbHelper');

// Get All API Keys for User
exports.getKeys = async (req, res) => {
  try {
    const keys = await db.apiKey.find({ userId: req.user.id });
    res.json(keys);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Generate New API Key
exports.generateKey = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Please provide a name for the API key' });
  }

  try {
    // Generate secure random string
    const rawKey = 'll_' + crypto.randomBytes(24).toString('hex');
    
    const newApiKey = await db.apiKey.create({
      userId: req.user.id,
      key: rawKey,
      name: name.trim(),
      isActive: true
    });

    // Log Activity
    await db.activity.create({
      userId: req.user.id,
      action: 'API_KEY_CREATE',
      description: `Created new developer API key "${name}"`
    });

    res.status(201).json(newApiKey);

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Revoke API Key
exports.revokeKey = async (req, res) => {
  try {
    const keyId = req.params.id;
    const key = await db.apiKey.findOne({ _id: keyId }); // Wait, dbHelper handles by ID if we pass id, or we search by ID

    // We can delete the key or deactivate it
    const deletedKey = await db.apiKey.findByIdAndDelete(keyId);
    if (!deletedKey) {
      return res.status(404).json({ message: 'API key not found' });
    }

    // Log Activity
    await db.activity.create({
      userId: req.user.id,
      action: 'API_KEY_REVOKE',
      description: `Revoked API key "${deletedKey.name}"`
    });

    res.json({ message: 'API key successfully revoked' });

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};
