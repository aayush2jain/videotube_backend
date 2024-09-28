import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Cloudinary configuration
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath, resourceType = "auto") => {
    try {
        if (!localFilePath) throw new Error("No file path provided");

        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: resourceType, // Automatically detect or use "video" / "image"
        });

        // File successfully uploaded, remove the local file
        fs.unlinkSync(localFilePath);
        console.log("File successfully uploaded and local file removed:", response.secure_url);
        
        return response;

    } catch (error) {
        // Remove the local file even if the upload fails
        try {
            if (fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
            }
        } catch (fsError) {
            console.error("Error removing local file:", fsError);
        }

        console.error("Error uploading to Cloudinary:", error);
        return null; // Return null to indicate failure
    }
};

export { uploadOnCloudinary };
