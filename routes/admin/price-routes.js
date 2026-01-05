const express = require("express");
const {
  getAllPrices,
  updatePrices,
  addNewPackage,
  deletePackage
} = require("../../controllers/admin/price-controller");
const { authMiddleware, adminMiddleware } = require("../../controllers/auth/auth-controller");

const router = express.Router();

// Protect all admin price routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Price management routes
router.get("/", getAllPrices);
router.put("/:network/:userRole", updatePrices);
router.post("/:network/:userRole/packages", addNewPackage);
router.delete("/:network/:userRole/packages/:packageId", deletePackage);

module.exports = router;