const User = require("../models/User");
const generatePseudonym = require("../utils/pseudonym");

async function verifyOtp(req, res) {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.verified = true;

    // Assign pseudonym if not already set
    if (!user.pseudonym) {
      let pseudonym;
      let exists = true;

      while (exists) {
        pseudonym = generatePseudonym();
        exists = await User.findOne({ pseudonym });
      }

      user.pseudonym = pseudonym;
      console.log("Assigned pseudonym:", pseudonym);
    }

    await user.save();
    console.log("OTP verified for:", user.email); 
    console.log("Assigned pseudonym:", user.pseudonym);

    return res.json({
      message: "OTP verified",
      pseudonym: user.pseudonym,
    });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {verifyOtp};
