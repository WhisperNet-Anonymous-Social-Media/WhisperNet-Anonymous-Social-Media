const User = require("../models/User");
const generatePseudonym = require("../utils/pseudonym");
const jwt = require("jsonwebtoken");

async function verifyOtp(req, res) {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Check if OTP exists and matches
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // 2. Check if OTP is expired
    if (user.otpExpires && user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // 3. Mark user as verified
    user.verified = true;
    
    // 4. Clear the OTP fields (Security: prevent reuse)
    user.otp = undefined;
    user.otpExpires = undefined;

    // Assign pseudonym if not already set
    if (!user.pseudonym) {
      let pseudonym = "";
      let attempt = 0;

      // Deterministic salted name + collision suffix fallback
      while (attempt < 100) {
        const candidate = generatePseudonym(email, attempt);
        const suffix = attempt === 0 ? "" : ` #${attempt + 1}`;
        pseudonym = `${candidate}${suffix}`;

        const existingUser = await User.findOne({ pseudonym });
        if (!existingUser) break;
        attempt += 1;
      }

      user.pseudonym = pseudonym;
      console.log("Assigned pseudonym:", pseudonym);
    }

    await user.save();

    // 🔑 Create JWT token
    const token = jwt.sign(
      { userId: user._id, pseudonym: user.pseudonym }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1h" }
    );

    console.log("OTP verified for:", user.email); 

    return res.json({
      message: "OTP verified",
      pseudonym: user.pseudonym,
      token: token
    });

  } catch (err) {
    console.error("Error verifying OTP:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { verifyOtp };
