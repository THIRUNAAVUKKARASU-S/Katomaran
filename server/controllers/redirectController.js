const UAParser = require('ua-parser-js');
const requestIp = require('request-ip');
const geoip = require('geoip-lite');
const db = require('../utils/dbHelper');

exports.redirectURL = async (req, res) => {
  const { shortCode } = req.params;

  try {
    // Look up the URL in database
    const url = await db.url.findOne({ shortCode });

    const clientUrl = process.env.NODE_ENV === 'production' 
      ? `${req.protocol}://${req.get('host')}` 
      : 'http://localhost:5173';

    if (!url) {
      return res.redirect(`${clientUrl}/not-found`);
    }

    // Check if the link has expired
    if (url.expiryDate && new Date(url.expiryDate) < new Date()) {
      return res.redirect(`${clientUrl}/expired`);
    }

    // Parse request metadata first to check country/device redirects
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
      country = 'US'; // Default fallback for local testing
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

    // Resolve Smart Redirect Target URL based on Country or Device
    let targetUrl = url.originalUrl;

    if (url.smartRedirects) {
      // 1. Country redirection rule check
      if (url.smartRedirects.countries && url.smartRedirects.countries.length > 0) {
        const countryMatch = url.smartRedirects.countries.find(
          c => c.country.toUpperCase() === country.toUpperCase()
        );
        if (countryMatch && countryMatch.url) {
          targetUrl = countryMatch.url;
        }
      }

      // 2. Device redirection rule check (runs if country match didn't trigger)
      if (targetUrl === url.originalUrl && url.smartRedirects.devices) {
        const devKey = device.toLowerCase(); // 'mobile', 'tablet', 'desktop'
        if (url.smartRedirects.devices[devKey]) {
          targetUrl = url.smartRedirects.devices[devKey];
        }
      }
    }

    // Check Password Protection Lock
    if (url.isPasswordProtected) {
      // Redirect to frontend password validation gate
      return res.redirect(`${clientUrl}/p/${shortCode}`);
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

    // 3. Perform HTTP Redirect
    return res.redirect(targetUrl);

  } catch (error) {
    console.error('Redirect error:', error.message);
    res.status(500).send('Server Error');
  }
};
