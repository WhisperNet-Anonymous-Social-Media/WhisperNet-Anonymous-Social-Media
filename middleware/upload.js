const multer = require("multer");
const { storage } = require("../config/cloudinary");

const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    },
});

module.exports = upload;
