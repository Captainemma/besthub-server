const express = require("express");
const {
  addBundle,
  fetchAllBundles,
  editBundle,
  deleteBundle,
  toggleBundleStatus,
} = require("../../controllers/admin/products-controller");
const { authMiddleware, adminMiddleware } = require("../../controllers/auth/auth-controller");

const router = express.Router();

// Protect all admin product routes
router.use(authMiddleware);
router.use(adminMiddleware);

router.post("/bundles", addBundle);
router.get("/bundles", fetchAllBundles);
router.put("/bundles/:id", editBundle);
router.delete("/bundles/:id", deleteBundle);
router.patch("/bundles/:id/status", toggleBundleStatus);

module.exports = router;