const express = require("express");
const {
  getAllUsers,
  getUserDetails,
  updateUserRole,
  updateUserStatus,
  getUserStats,
  deleteUser,
} = require("../../controllers/admin/user-controller");
const { authMiddleware, adminMiddleware } = require("../../controllers/auth/auth-controller");

const router = express.Router();

// Protect all admin user routes
router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/", getAllUsers);
router.get("/stats", getUserStats);
router.get("/:id", getUserDetails);
router.put("/:id/role", updateUserRole);
router.put("/:id/status", updateUserStatus);
router.delete("/:id", deleteUser);

module.exports = router;