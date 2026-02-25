const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        let resourceType = "image";

        if (file.mimetype.startsWith("audio") || file.mimetype.startsWith("video")) {
            resourceType = "video"; // Cloudinary treats audio as video
        }

        return {
            folder: "whispernet_posts",
            resource_type: resourceType,
        };
    },
});

module.exports = { cloudinary, storage };
