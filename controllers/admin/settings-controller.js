const Setting = require('../../models/Setting');

// Get system settings
const getSystemSettings = async (req, res) => {
  try {
    console.log('🔄 Fetching system settings...');
    
    let settings = await Setting.findOne({ type: 'system' });
    
    if (!settings) {
      // Create default settings if none exist
      settings = new Setting({
        type: 'system',
        data: {
          mtnAvailable: true,
          telecelAvailable: true,
          atAvailable: true,
          maintenanceMode: false,
          newRegistrations: true,
          autoApproveAgents: false,
          emailNotifications: true,
          lowBalanceAlerts: true,
          systemAlerts: true,
          agentCommission: 10,
          wholesalerCommission: 15,
          minTopupAmount: 5,
          maxTopupAmount: 5000,
          dailyUserLimit: 1000
        }
      });
      await settings.save();
      console.log('✅ Created default system settings');
    }

    console.log('✅ Settings loaded:', settings.data);
    
    res.json({
      success: true,
      data: settings.data
    });
  } catch (error) {
    console.error('❌ Get system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system settings'
    });
  }
};

// Update system settings
const updateSystemSettings = async (req, res) => {
  try {
    const settingsData = req.body;
    console.log('🔄 Updating system settings:', settingsData);

    let settings = await Setting.findOne({ type: 'system' });
    
    if (!settings) {
      settings = new Setting({
        type: 'system',
        data: settingsData
      });
    } else {
      settings.data = { ...settings.data, ...settingsData };
    }

    await settings.save();
    console.log('✅ System settings updated successfully');

    res.json({
      success: true,
      message: 'System settings updated successfully',
      data: settings.data
    });
  } catch (error) {
    console.error('❌ Update system settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating system settings'
    });
  }
};

module.exports = {
  getSystemSettings,
  updateSystemSettings
};