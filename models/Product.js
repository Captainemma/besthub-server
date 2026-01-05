const express = require("express");
const {
  getFilteredBundles,
  getBundleDetails,
  getBundlesByNetwork,
} = require("../../controllers/shop/products-controller");

const router = express.Router();

// Public routes - no authentication required for viewing bundles
router.get("/bundles", getFilteredBundles);
router.get("/bundles/network/:network", getBundlesByNetwork);
router.get("/bundle/:id", getBundleDetails);

module.exports = router;