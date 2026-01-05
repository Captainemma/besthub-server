const express = require("express");
const { getDashboardData } = require("../../controllers/admin/dashboard-controller");
const { authMiddleware, adminMiddleware } = require("../../controllers/auth/auth-controller");

const router = express.Router();

// Protect all admin dashboard routes
router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/", getDashboardData);

module.exports = router;