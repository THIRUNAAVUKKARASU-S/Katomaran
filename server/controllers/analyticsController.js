const db = require('../utils/dbHelper');

// Get Analytics for a URL
exports.getURLAnalytics = async (req, res) => {
  const urlId = req.params.id;

  try {
    // Check if URL exists and belongs to logged-in user
    const url = await db.url.findById(urlId);
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    if (url.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Unauthorized access to analytics' });
    }

    // 1. Total Clicks
    const totalClicks = url.clicks;

    // 2. Fetch last 100 visits
    const recentVisits = await db.analytics.find({ urlId });

    // 3. Last visited time
    const lastVisit = recentVisits.length > 0 ? recentVisits[0].timestamp : null;

    // 4. Daily Click Trend (Last 30 Days)
    const trendData = await db.analytics.getTrend(urlId, 30);

    // 5. Distributions
    const browserDist = await db.analytics.getDistribution(urlId, 'browser');
    const deviceDist = await db.analytics.getDistribution(urlId, 'device');
    const osDist = await db.analytics.getDistribution(urlId, 'os');

    res.json({
      urlDetails: {
        originalUrl: url.originalUrl,
        shortUrl: url.shortUrl,
        createdAt: url.createdAt,
        expiryDate: url.expiryDate,
        clicks: totalClicks
      },
      lastVisit,
      recentVisits: recentVisits.slice(0, 100), // Limit list to recent 100
      charts: {
        clickTrend: trendData,
        browserDist,
        deviceDist,
        osDist
      }
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// Get Public Analytics for a URL (without Auth if enabled)
exports.getPublicURLAnalytics = async (req, res) => {
  const { shortCode } = req.params;

  try {
    const url = await db.url.findOne({ shortCode });
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    if (!url.isPublicStatsEnabled) {
      return res.status(403).json({ message: 'Public stats are disabled for this shortened link' });
    }

    const totalClicks = url.clicks;
    const recentVisits = await db.analytics.find({ urlId: url._id });
    const lastVisit = recentVisits.length > 0 ? recentVisits[0].timestamp : null;

    const trendData = await db.analytics.getTrend(url._id, 30);
    const browserDist = await db.analytics.getDistribution(url._id, 'browser');
    const deviceDist = await db.analytics.getDistribution(url._id, 'device');
    const osDist = await db.analytics.getDistribution(url._id, 'os');

    res.json({
      urlDetails: {
        originalUrl: url.originalUrl,
        shortUrl: url.shortUrl,
        createdAt: url.createdAt,
        expiryDate: url.expiryDate,
        clicks: totalClicks
      },
      lastVisit,
      charts: {
        clickTrend: trendData,
        browserDist,
        deviceDist,
        osDist
      }
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};
