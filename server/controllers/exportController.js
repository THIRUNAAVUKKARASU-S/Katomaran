const db = require('../utils/dbHelper');

// Export Link Click Logs to CSV
exports.exportCSV = async (req, res) => {
  const urlId = req.params.id;

  try {
    const url = await db.url.findById(urlId);
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    // Check ownership/permissions
    if (url.userId.toString() !== req.user.id) {
      // Check if user belongs to the URL workspace
      if (url.workspaceId) {
        const ws = await db.workspace.findById(url.workspaceId);
        const isMember = ws?.members.some(m => m.userId.toString() === req.user.id);
        if (!isMember) {
          return res.status(401).json({ message: 'Unauthorized export' });
        }
      } else {
        return res.status(401).json({ message: 'Unauthorized export' });
      }
    }

    // Fetch logs
    const logs = await db.analytics.find({ urlId });

    // Build CSV Content
    let csvContent = 'Timestamp,IP Address,Country,State,City,Browser,Device,OS\n';
    
    logs.forEach(log => {
      const time = log.timestamp instanceof Date ? log.timestamp.toISOString() : new Date(log.timestamp).toISOString();
      const ip = log.ipAddress || 'Unknown';
      const country = log.country || 'Unknown';
      const state = log.state || 'Unknown';
      const city = log.city || 'Unknown';
      const browser = log.browser || 'Unknown';
      const device = log.device || 'Unknown';
      const os = log.os || 'Unknown';

      // Escape quotes in fields
      csvContent += `"${time}","${ip}","${country.replace(/"/g, '""')}","${state.replace(/"/g, '""')}","${city.replace(/"/g, '""')}","${browser.replace(/"/g, '""')}","${device.replace(/"/g, '""')}","${os.replace(/"/g, '""')}"\n`;
    });

    // Send headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="linklite-export-${url.shortCode}.csv"`);
    
    // Log Activity
    await db.activity.create({
      userId: req.user.id,
      action: 'URL_EXPORT',
      workspaceId: url.workspaceId || null,
      description: `Exported click logs for link "${url.shortCode}" to CSV`
    });

    return res.status(200).send(csvContent);

  } catch (error) {
    console.error('Export error:', error.message);
    res.status(500).send('Server Error');
  }
};
