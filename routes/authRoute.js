const express = require("express");
const {
  signupValidator,
  loginValidator,
} = require("../utils/validators/authValidator");

const {
  signup,
  login,
  forgotPassword,
  verifyPassResetCode,
  resetPassword,
} = require("../controller/authController");
const upload = require("../middlewares/uploadFiles");

const router = express.Router();

router.post(
  "/signup",

  upload.fields([
    { name: "Licensing", maxCount: 1 },
    { name: "taxCard", maxCount: 1 },
    { name: "CommercialRegister", maxCount: 1 },
  ]),
    
  signup
);
router.post("/login", loginValidator, login);
router.post("/forgotPassword", forgotPassword);
router.post("/verifyResetCode", verifyPassResetCode);
router.put("/resetPassword", resetPassword);

module.exports = router;
module.exports = router;
