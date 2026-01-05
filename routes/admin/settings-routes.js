const express = require("express");
const {
  getSystemSettings,
  updateSystemSettings
} = require("../../controllers/admin/settings-controller");

const router = express.Router();

// System settings routes
router.get("/", getSystemSettings);
router.put("/", updateSystemSettings);

module.exports = router;