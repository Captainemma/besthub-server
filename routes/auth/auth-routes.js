const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  authMiddleware,
} = require("../../controllers/auth/auth-controller");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

// Check authentication status - fixed implementation
router.get("/check-auth", authMiddleware, async (req, res) => {
  try {
    // User is already attached to req by authMiddleware
    const user = req.user;
    
    res.status(200).json({
      success: true,
      message: "Authenticated user!",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        userName: user.userName,
        status: user.status
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Authentication check failed",
    });
  }
});

module.exports = router;