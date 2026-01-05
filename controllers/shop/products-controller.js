const Price = require("../../models/Price");

const getFilteredBundles = async (req, res) => {
  try {
    const { network = [], category = [], sortBy = "price-lowtohigh" } = req.query;

    // Determine which networks to fetch
    let networks = [];
    if (network.length) {
      networks = network.split(",").map(n => n.toUpperCase());
    } else {
      // Default to all networks if none specified
      networks = ["MTN", "TELECEL", "AT"];
    }

    // Find prices for customer role for the specified networks
    const priceData = await Price.find({ 
      network: { $in: networks },
      userRole: "customer" 
    });

    // Transform the data to match expected format
    let allBundles = [];
    priceData.forEach(price => {
      const bundles = price.packages.map(pkg => ({
        _id: pkg._id,
        network: price.network,
        dataAmount: pkg.packageName + "GB", // Convert "1" to "1GB"
        packageName: pkg.packageName + "GB",
        price: pkg.sellingPrice, // Use selling price for customers
        sellingPrice: pkg.sellingPrice,
        originalPrice: pkg.originalPrice // Include but don't show to clients
      }));
      allBundles = [...allBundles, ...bundles];
    });

    // Apply sorting
    let sort = {};
    switch (sortBy) {
      case "price-lowtohigh":
        allBundles.sort((a, b) => a.price - b.price);
        break;
      case "price-hightolow":
        allBundles.sort((a, b) => b.price - a.price);
        break;
      case "data-lowtohigh":
        allBundles.sort((a, b) => parseFloat(a.dataAmount) - parseFloat(b.dataAmount));
        break;
      case "data-hightolow":
        allBundles.sort((a, b) => parseFloat(b.dataAmount) - parseFloat(a.dataAmount));
        break;
      default:
        allBundles.sort((a, b) => a.price - b.price);
        break;
    }

    res.status(200).json({
      success: true,
      data: allBundles,
    });
  } catch (error) {
    console.error("Get bundles error:", error);
    res.status(500).json({
      success: false,
      message: "Some error occurred",
    });
  }
};

const getBundleDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Search through all prices to find the specific package
    const allPrices = await Price.find({ userRole: "customer" });
    
    let foundPackage = null;
    let foundNetwork = null;
    
    // Look through all packages to find the one with matching ID
    for (const price of allPrices) {
      const package = price.packages.find(pkg => pkg._id.toString() === id);
      if (package) {
        foundPackage = package;
        foundNetwork = price.network;
        break;
      }
    }

    if (!foundPackage) {
      return res.status(404).json({
        success: false,
        message: "Data bundle not found!",
      });
    }

    // Transform to expected format
    const bundle = {
      _id: foundPackage._id,
      network: foundNetwork,
      dataAmount: foundPackage.packageName + "GB",
      packageName: foundPackage.packageName + "GB",
      price: foundPackage.sellingPrice,
      sellingPrice: foundPackage.sellingPrice,
      originalPrice: foundPackage.originalPrice
    };

    res.status(200).json({
      success: true,
      data: bundle,
    });
  } catch (error) {
    console.error("Get bundle details error:", error);
    res.status(500).json({
      success: false,
      message: "Some error occurred",
    });
  }
};

const getBundlesByNetwork = async (req, res) => {
  try {
    const { network } = req.params;
    
    console.log(`🔍 Client requested network: "${network}"`);
    
    // Map network names to match your database EXACTLY
    const networkMap = {
      'mtn': 'MTN',
      'telecel': 'Telecel',
      'vodafone': 'Telecel',
      'airteltigo': 'AT',
      'at': 'AT',
      'airteltigo': 'AT', // Handle "AirtelTigo" from client
      'airtel': 'AT',
      'tigo': 'AT'
    };
    
    const dbNetwork = networkMap[network.toLowerCase()] || network;
    
    console.log(`🔍 Mapped to database network: "${dbNetwork}"`);
    
    // Find prices for this network and customer role
    const priceData = await Price.findOne({ 
      network: dbNetwork,
      userRole: "customer" 
    });

    if (!priceData) {
      console.log(`❌ No price data found for network: "${dbNetwork}"`);
      return res.status(200).json({
        success: true,
        data: [],
        message: `No packages found for ${network}`
      });
    }

    if (!priceData.packages || priceData.packages.length === 0) {
      console.log(`❌ No packages array found for network: "${dbNetwork}"`);
      return res.status(200).json({
        success: true,
        data: [],
        message: `No packages found for ${network}`
      });
    }

    console.log(`✅ Found ${priceData.packages.length} packages for ${dbNetwork}`);
    console.log('📦 Packages:', JSON.stringify(priceData.packages, null, 2));

    // Transform the packages data to match expected format
    const bundles = priceData.packages.map(pkg => ({
      _id: pkg._id,
      network: priceData.network,
      dataAmount: pkg.packageName + "GB",
      packageName: pkg.packageName + "GB",
      price: pkg.sellingPrice,
      sellingPrice: pkg.sellingPrice,
      originalPrice: pkg.originalPrice
    }));

    // Sort by price (low to high)
    bundles.sort((a, b) => a.price - b.price);

    console.log(`📤 Sending ${bundles.length} bundles to client`);
    
    res.status(200).json({
      success: true,
      data: bundles,
    });
  } catch (error) {
    console.error("Get bundles by network error:", error);
    res.status(500).json({
      success: false,
      message: "Some error occurred",
    });
  }
};

const handleBuyClick = () => {
  console.log(`🔄 Fetching packages for network: "${network}"`);
  // Clear any previous errors
  dispatch(clearNetworkError());
  // Fetch packages for this network when modal opens
  dispatch(fetchBundlesByNetwork(network.toLowerCase()));
  setShowPackageModal(true);
};

module.exports = { 
  getFilteredBundles, 
  getBundleDetails, 
  getBundlesByNetwork 
};