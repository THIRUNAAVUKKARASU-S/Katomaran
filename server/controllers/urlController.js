const bcrypt = require('bcryptjs');
const validator = require('validator');
const UAParser = require('ua-parser-js');
const requestIp = require('request-ip');
const geoip = require('geoip-lite');
const db = require('../utils/dbHelper');
const { scanUrl } = require('../utils/malwareScanner');

// Generate unique random 6-character short code
const generateShortCode = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let isUnique = false;
  let code = '';

  while (!isUnique) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Check if code exists in DB
    const existing = await db.url.findOne({ shortCode: code });
    if (!existing) {
      isUnique = true;
    }
  }
  return code;
};

// Create Short URL
exports.createURL = async (req, res) => {
  let { 
    originalUrl, 
    customAlias, 
    expiryDays, 
    customExpiryDate,
    password, 
    workspaceId,
    smartRedirects
  } = req.body;
  const userId = req.user ? req.user.id : null;

  try {
    if (!originalUrl) {
      return res.status(400).json({ message: 'Original URL is required' });
    }

    // Standardize URL protocol if not provided
    if (!/^https?:\/\//i.test(originalUrl)) {
      originalUrl = 'http://' + originalUrl;
    }

    // Validate URL format
    if (!validator.isURL(originalUrl, { require_protocol: true })) {
      return res.status(400).json({ message: 'Invalid URL format' });
    }

    // --- Malware & Phishing Security Check ---
    const scan = await scanUrl(originalUrl);
    if (!scan.isSafe) {
      return res.status(400).json({ 
        message: `Malware Warning: ${scan.flagReason}`,
        score: scan.score,
        isSafe: false
      });
    }

    // Calculate Expiry Date
    let expiryDate = null;
    if (customExpiryDate) {
      expiryDate = new Date(customExpiryDate);
      if (isNaN(expiryDate.getTime())) {
        return res.status(400).json({ message: 'Invalid expiry date' });
      }
    } else if (expiryDays) {
      const days = parseInt(expiryDays);
      if (!isNaN(days) && days > 0) {
        expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);
      }
    }

    // Handle Password Protection
    let hashedPassword = null;
    let isPasswordProtected = false;
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password.trim(), salt);
      isPasswordProtected = true;
    }

    let shortCode = '';

    // Handle Custom Alias
    if (customAlias) {
      customAlias = customAlias.trim();
      if (customAlias.length < 3) {
        return res.status(400).json({ message: 'Custom alias must be at least 3 characters' });
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(customAlias)) {
        return res.status(400).json({ message: 'Custom alias can only contain letters, numbers, hyphens, and underscores' });
      }

      // Check if custom alias is already taken
      const aliasExists = await db.url.findOne({
        $or: [{ shortCode: customAlias }, { customAlias: customAlias }]
      });
      if (aliasExists) {
        return res.status(400).json({ message: 'Custom alias / short code is already taken' });
      }

      shortCode = customAlias;
    } else {
      shortCode = await generateShortCode();
    }

    // Prevent duplicate entries for the SAME URL by the SAME user if desired (only for personal/no-alias links)
    if (userId && !customAlias && !workspaceId) {
      const duplicate = await db.url.findOne({ userId, originalUrl });
      if (duplicate && (!duplicate.expiryDate || new Date(duplicate.expiryDate) > new Date()) && !duplicate.isPasswordProtected) {
        return res.status(200).json(duplicate);
      }
    }

    // Construct shortUrl path
    const host = req.get('host');
    const protocol = req.protocol;
    const shortUrl = `${protocol}://${host}/${shortCode}`;

    const newURL = await db.url.create({
      userId,
      originalUrl,
      shortCode,
      customAlias: customAlias || undefined,
      shortUrl,
      expiryDate,
      password: hashedPassword,
      isPasswordProtected,
      workspaceId: workspaceId || null,
      smartRedirects: smartRedirects || { devices: {}, countries: [] }
    });

    // Log Activity Audit Log
    await db.activity.create({
      userId: req.user.id,
      workspaceId: workspaceId || null,
      action: 'URL_CREATE',
      description: `Created shortened URL for "${originalUrl}" with code "${shortCode}"`
    });

    res.status(201).json(newURL);

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Get All URLs for Logged-In User or Workspace
exports.getAllURLs = async (req, res) => {
  const { workspaceId } = req.query;

  try {
    let query = { userId: req.user.id };
    if (workspaceId && workspaceId !== 'null' && workspaceId !== 'undefined') {
      query = { workspaceId };
    }
    const urls = await db.url.find(query);
    res.json(urls);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Update URL configuration
exports.updateURL = async (req, res) => {
  const { originalUrl, customAlias, customExpiryDate, password, smartRedirects } = req.body;
  const urlId = req.params.id;

  try {
    let url = await db.url.findById(urlId);

    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    // Check ownership
    if (url.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Unauthorized modification' });
    }

    let updates = {};

    if (originalUrl) {
      let formattedUrl = originalUrl;
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = 'http://' + formattedUrl;
      }
      if (!validator.isURL(formattedUrl, { require_protocol: true })) {
        return res.status(400).json({ message: 'Invalid URL format' });
      }

      // Malware Security Check on edit
      const scan = await scanUrl(formattedUrl);
      if (!scan.isSafe) {
        return res.status(400).json({ message: `Malware Warning: ${scan.flagReason}` });
      }

      updates.originalUrl = formattedUrl;
    }

    if (customExpiryDate !== undefined) {
      if (customExpiryDate === null || customExpiryDate === '') {
        updates.expiryDate = null;
      } else {
        const expiryDate = new Date(customExpiryDate);
        if (isNaN(expiryDate.getTime())) {
          return res.status(400).json({ message: 'Invalid expiry date' });
        }
        updates.expiryDate = expiryDate;
      }
    }

    // Update Password Protection
    if (password !== undefined) {
      if (password === null || password.trim() === '') {
        updates.password = null;
        updates.isPasswordProtected = false;
      } else {
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(password.trim(), salt);
        updates.isPasswordProtected = true;
      }
    }

    // Update smart redirects
    if (smartRedirects) {
      updates.smartRedirects = smartRedirects;
    }

    if (customAlias && customAlias.trim() !== url.customAlias) {
      const aliasTrimmed = customAlias.trim();
      if (aliasTrimmed.length < 3) {
        return res.status(400).json({ message: 'Custom alias must be at least 3 characters' });
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(aliasTrimmed)) {
        return res.status(400).json({ message: 'Custom alias can only contain letters, numbers, hyphens, and underscores' });
      }

      // Check if alias is taken by other links
      const aliasExists = await db.url.findOne({
        _id: { $ne: urlId },
        $or: [{ shortCode: aliasTrimmed }, { customAlias: aliasTrimmed }]
      });
      if (aliasExists) {
        return res.status(400).json({ message: 'Custom alias / short code is already taken' });
      }

      updates.customAlias = aliasTrimmed;
      updates.shortCode = aliasTrimmed;

      const host = req.get('host');
      const protocol = req.protocol;
      updates.shortUrl = `${protocol}://${host}/${aliasTrimmed}`;
    }

    url = await db.url.findByIdAndUpdate(urlId, updates);

    // Log Activity
    await db.activity.create({
      userId: req.user.id,
      workspaceId: url.workspaceId || null,
      action: 'URL_UPDATE',
      description: `Updated configuration settings for link "${url.shortCode}"`
    });

    res.json(url);

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Delete URL
exports.deleteURL = async (req, res) => {
  try {
    const url = await db.url.findById(req.params.id);

    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    // Check ownership
    if (url.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Unauthorized deletion' });
    }

    // Delete corresponding analytics records
    await db.analytics.deleteMany({ urlId: url._id });

    // Delete URL record
    await db.url.findByIdAndDelete(req.params.id);

    // Log Activity
    await db.activity.create({
      userId: req.user.id,
      workspaceId: url.workspaceId || null,
      action: 'URL_DELETE',
      description: `Deleted link "${url.shortCode}" and its analytics logs`
    });

    res.json({ message: 'URL and its analytics deleted successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Verify Password Gate and Redirect Target resolution
exports.verifyPassword = async (req, res) => {
  const { shortCode } = req.params;
  const { password } = req.body;

  try {
    const url = await db.url.findOne({ shortCode });
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    if (url.expiryDate && new Date(url.expiryDate) < new Date()) {
      return res.status(410).json({ message: 'Link has expired' });
    }

    if (!url.isPasswordProtected) {
      return res.status(400).json({ message: 'Link is not password protected' });
    }

    // Compare Hashed password
    const isMatch = await bcrypt.compare(password || '', url.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Password incorrect.' });
    }

    // Capture visitor details since pass check was successful!
    const ipAddress = requestIp.getClientIp(req) || '127.0.0.1';
    
    // IP Country & Location lookup
    let country = 'Unknown';
    let state = 'Unknown';
    let city = 'Unknown';
    let latitude = null;
    let longitude = null;

    if (ipAddress && ipAddress !== '127.0.0.1' && ipAddress !== '::1') {
      const geo = geoip.lookup(ipAddress);
      if (geo) {
        country = geo.country || 'Unknown';
        state = geo.region || 'Unknown';
        city = geo.city || 'Unknown';
        if (geo.ll) {
          latitude = geo.ll[0];
          longitude = geo.ll[1];
        }
      }
    } else {
      country = 'US';
      state = 'CA';
      city = 'San Francisco';
      latitude = 37.7749;
      longitude = -122.4194;
    }

    // User Agent parsing
    const userAgent = req.headers['user-agent'] || '';
    const parser = new UAParser(userAgent);
    const uaResults = parser.getResult();

    const browser = uaResults.browser.name || 'Unknown';
    const os = uaResults.os.name || 'Unknown';
    let device = uaResults.device.type || 'Desktop';
    if (device) {
      device = device.charAt(0).toUpperCase() + device.slice(1);
    }

    // Resolve Smart Redirect Target URL
    let targetUrl = url.originalUrl;

    if (url.smartRedirects) {
      if (url.smartRedirects.countries && url.smartRedirects.countries.length > 0) {
        const countryMatch = url.smartRedirects.countries.find(
          c => c.country.toUpperCase() === country.toUpperCase()
        );
        if (countryMatch && countryMatch.url) {
          targetUrl = countryMatch.url;
        }
      }

      if (targetUrl === url.originalUrl && url.smartRedirects.devices) {
        const devKey = device.toLowerCase();
        if (url.smartRedirects.devices[devKey]) {
          targetUrl = url.smartRedirects.devices[devKey];
        }
      }
    }

    // 1. Increment click count
    await db.url.incrementClicks(url);

    // 2. Save Analytics Record
    await db.analytics.create({
      urlId: url._id,
      browser,
      device,
      os,
      ipAddress,
      country,
      state,
      city,
      latitude,
      longitude
    });

    res.json({ targetUrl });

  } catch (error) {
    console.error('Verify pass error:', error.message);
    res.status(500).send('Server Error');
  }
};
