const DataBundle = require("../../models/DataBundle");

// Add a new data bundle
const addBundle = async (req, res) => {
  try {
    const {
      network,
      packageName,
      dataAmount,
      validity,
      price,
      description,
      category,
    } = req.body;

    const newBundle = new DataBundle({
      network,
      packageName,
      dataAmount,
      validity,
      price,
      description: description || "",
      category: category || "regular",
    });

    await newBundle.save();
    res.status(201).json({
      success: true,
      message: "Data bundle added successfully",
      data: newBundle,
    });
  } catch (e) {
    console.error("Add bundle error:", e);
    res.status(500).json({
      success: false,
      message: "Error occurred while adding bundle",
    });
  }
};

// Fetch all data bundles
const fetchAllBundles = async (req, res) => {
  try {
    const { network, page = 1, limit = 20 } = req.query;
    
    let filters = {};
    if (network && network !== 'all') {
      filters.network = network;
    }

    const bundles = await DataBundle.find(filters)
      .sort({ network: 1, price: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await DataBundle.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: bundles,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalBundles: total
    });
  } catch (e) {
    console.error("Fetch bundles error:", e);
    res.status(500).json({
      success: false,
      message: "Error occurred",
    });
  }
};

// Edit a data bundle
const editBundle = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      network,
      packageName,
      dataAmount,
      validity,
      price,
      description,
      category,
      isActive,
    } = req.body;

    let bundle = await DataBundle.findById(id);
    if (!bundle)
      return res.status(404).json({
        success: false,
        message: "Data bundle not found",
      });

    bundle.network = network || bundle.network;
    bundle.packageName = packageName || bundle.packageName;
    bundle.dataAmount = dataAmount || bundle.dataAmount;
    bundle.validity = validity || bundle.validity;
    bundle.price = price || bundle.price;
    bundle.description = description || bundle.description;
    bundle.category = category || bundle.category;
    bundle.isActive = isActive !== undefined ? isActive : bundle.isActive;

    await bundle.save();
    res.status(200).json({
      success: true,
      message: "Data bundle updated successfully",
      data: bundle,
    });
  } catch (e) {
    console.error("Edit bundle error:", e);
    res.status(500).json({
      success: false,
      message: "Error occurred",
    });
  }
};

// Delete a data bundle
const deleteBundle = async (req, res) => {
  try {
    const { id } = req.params;
    const bundle = await DataBundle.findByIdAndDelete(id);

    if (!bundle)
      return res.status(404).json({
        success: false,
        message: "Data bundle not found",
      });

    res.status(200).json({
      success: true,
      message: "Data bundle deleted successfully",
    });
  } catch (e) {
    console.error("Delete bundle error:", e);
    res.status(500).json({
      success: false,
      message: "Error occurred",
    });
  }
};

// Toggle bundle active status
const toggleBundleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const bundle = await DataBundle.findById(id);

    if (!bundle)
      return res.status(404).json({
        success: false,
        message: "Data bundle not found",
      });

    bundle.isActive = !bundle.isActive;
    await bundle.save();

    res.status(200).json({
      success: true,
      message: `Bundle ${bundle.isActive ? 'activated' : 'deactivated'} successfully`,
      data: bundle,
    });
  } catch (e) {
    console.error("Toggle bundle status error:", e);
    res.status(500).json({
      success: false,
      message: "Error occurred",
    });
  }
};

module.exports = {
  addBundle,
  fetchAllBundles,
  editBundle,
  deleteBundle,
  toggleBundleStatus,
};