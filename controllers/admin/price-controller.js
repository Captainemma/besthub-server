const Price = require('../../models/Price');
const mongoose = require('mongoose');

// Get all prices
const getAllPrices = async (req, res) => {
  try {
    console.log('🔄 Fetching all prices...');
    
    const prices = await Price.find().lean();
    
    // Structure the data by network and user role
    const structuredPrices = {
      MTN: {
        customer: [],
        agent: [],
        wholesaler: []
      },
      Telecel: {
        customer: [],
        agent: [],
        wholesaler: []
      },
      AT: {
        customer: [],
        agent: [],
        wholesaler: []
      }
    };

    prices.forEach(price => {
      if (structuredPrices[price.network] && structuredPrices[price.network][price.userRole]) {
        structuredPrices[price.network][price.userRole] = price.packages;
      }
    });

    console.log('✅ Prices fetched successfully');

    res.json({
      success: true,
      data: structuredPrices
    });
  } catch (error) {
    console.error('❌ Get all prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching prices'
    });
  }
};

// Update prices for a specific network and user role
const updatePrices = async (req, res) => {
  try {
    const { network, userRole } = req.params;
    const { packages } = req.body;

    console.log(`🔄 Updating prices for ${network} - ${userRole}`, packages);

    // Validate input
    if (!['MTN', 'Telecel', 'AT'].includes(network)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid network'
      });
    }

    if (!['customer', 'agent', 'wholesaler'].includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user role'
      });
    }

    if (!packages || !Array.isArray(packages)) {
      return res.status(400).json({
        success: false,
        message: 'Packages array is required'
      });
    }

    // Update or create the price document for this specific network and user role
    const updatedPrice = await Price.findOneAndUpdate(
      { network, userRole },
      { 
        network,
        userRole,
        packages: packages.map(pkg => ({
          _id: pkg._id || new mongoose.Types.ObjectId(),
          packageName: pkg.packageName,
          originalPrice: parseFloat(pkg.originalPrice),
          sellingPrice: parseFloat(pkg.sellingPrice)
        }))
      },
      { upsert: true, new: true, runValidators: true }
    );

    console.log(`✅ Prices updated for ${network} - ${userRole}`);

    res.json({
      success: true,
      message: 'Prices updated successfully',
      data: updatedPrice.packages
    });
  } catch (error) {
    console.error('❌ Update prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating prices: ' + error.message
    });
  }
};

// Add new package to specific network and user role
const addNewPackage = async (req, res) => {
  try {
    const { network, userRole } = req.params;
    const packageData = req.body;

    console.log(`🔄 Adding new package to ${network} - ${userRole}:`, packageData);

    if (!['MTN', 'Telecel', 'AT'].includes(network)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid network'
      });
    }

    if (!['customer', 'agent', 'wholesaler'].includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user role'
      });
    }

    if (!packageData.packageName || !packageData.originalPrice) {
      return res.status(400).json({
        success: false,
        message: 'Package name and original price are required'
      });
    }

    // Find or create price document for this network and user role
    let priceDoc = await Price.findOne({ network, userRole });
    
    if (!priceDoc) {
      priceDoc = new Price({
        network,
        userRole,
        packages: []
      });
    }

    // Check if package with same name already exists
    const existingPackage = priceDoc.packages.find(
      pkg => pkg.packageName === packageData.packageName
    );

    if (existingPackage) {
      return res.status(400).json({
        success: false,
        message: `Package "${packageData.packageName}" already exists for ${network} - ${userRole}`
      });
    }

    // Add the new package with unique ID
    const newPackage = {
      _id: new mongoose.Types.ObjectId(),
      packageName: packageData.packageName,
      originalPrice: parseFloat(packageData.originalPrice),
      sellingPrice: parseFloat(packageData.sellingPrice) || parseFloat(packageData.originalPrice)
    };

    priceDoc.packages.push(newPackage);
    await priceDoc.save();

    console.log(`✅ New package added to ${network} - ${userRole}`);

    res.status(201).json({
      success: true,
      message: 'Package added successfully',
      data: newPackage
    });
  } catch (error) {
    console.error('❌ Add package error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding package: ' + error.message
    });
  }
};

// Delete package from specific network and user role
const deletePackage = async (req, res) => {
  try {
    const { network, userRole, packageId } = req.params;

    console.log(`🔄 Deleting package ${packageId} from ${network} - ${userRole}`);

    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid package ID'
      });
    }

    const priceDoc = await Price.findOne({ network, userRole });
    
    if (!priceDoc) {
      return res.status(404).json({
        success: false,
        message: 'Price configuration not found'
      });
    }

    // Check if this is the last package
    if (priceDoc.packages.length <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the last package. You must have at least one package.'
      });
    }

    // Remove the package
    const initialLength = priceDoc.packages.length;
    priceDoc.packages = priceDoc.packages.filter(pkg => pkg._id.toString() !== packageId);
    
    if (priceDoc.packages.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    await priceDoc.save();

    console.log(`✅ Package deleted from ${network} - ${userRole}`);

    res.json({
      success: true,
      message: 'Package deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete package error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting package: ' + error.message
    });
  }
};

module.exports = {
  getAllPrices,
  updatePrices,
  addNewPackage,
  deletePackage
};