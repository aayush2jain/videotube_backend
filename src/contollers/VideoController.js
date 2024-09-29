import { uploadOnCloudinary } from '../utils/cloudnary.js';
import { Video } from '../models/Video.model.js';
import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { v2 as cloudinary } from "cloudinary";
import streamifier from 'streamifier';
// Cloudinary configuration
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadVideo = async (req, res, next) => {
    try {
        const user = req.user._id;
        const userdata = await User.findById(user);
        const uploaderavatar = userdata.avatar;
        const uploadername = userdata.username;
        const { title, description, duration } = req.body;

        if (!req.files?.videoFile || !req.files?.thumbnail) {
            return res.status(400).json({ message: "Video file and thumbnail are required" });
        }

        const videoFile = req.files.videoFile[0];
        const thumbnailFile = req.files.thumbnail[0];

        // Helper function to upload files to Cloudinary using buffer
      const uploadToCloudinary = (fileBuffer, resourceType) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_large_stream({ 
            resource_type: resourceType, 
            chunk_size: 6000000 // chunk size in bytes, 6MB is typical
        }, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
        
        // Convert buffer to stream and pipe it to Cloudinary
        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};


        // Upload video and thumbnail using their buffers
        const videoUpload = await uploadToCloudinary(videoFile.buffer, 'video');
        const thumbnailUpload = await uploadToCloudinary(thumbnailFile.buffer, 'image');

        const video = await Video.create({
            title,
            description,
            duration,
            videoFile: videoUpload.secure_url,
            thumbnail: thumbnailUpload.secure_url,
            owner: user,
            uploaderavatar: uploaderavatar,
            uploadername: uploadername
        });

        return res.status(200).json({ message: "Video uploaded successfully", video });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


const getAllVideos = async (req, res) => {
    try {
        const videos = await Video.find()

        return res.status(200).json({videos})
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve videos", error });
    }
};

const getVideos = async (req, res) => {
    try {
        const user = req.user._id;
        if (!user) {
            console.log("User not found");
            return res.status(400).json({ message: "User not found" });
        }

        const videos = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(user)
                }
            },
            {
                $lookup: {
                    from: "users", // Assuming the users collection is named "users"
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails"
                }
            },
            // {
            //     $unwind: "$ownerDetails"
            // },
            {
                $addFields: {
                    username: "$ownerDetails.username",
                    avatar: "$ownerDetails.avatar",
                    fullName: "$ownerDetails.fullName",
                    ownerId:"$ownerDetails._id"
                }
            },
            {
                $project: {
                    ownerDetails: 0 // Hide the intermediate lookup details
                }
            }
        ]);

        console.log(videos)
        res.status(200).json(videos);
    } catch (error) {
        console.error("Error fetching videos:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getVideo = async (req, res) => {
    try {
        const {_id} = await req.params
        console.log("videoid",_id)
        if (!_id) {
            console.log("video not found");
            return res.status(400).json({ message: "video not found" });
        }

        const videos = await Video.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(_id)
                }
            },
            {
                $lookup: {
                    from: "users", // Assuming the users collection is named "users"
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails"
                }
            },
            // {
            //     $unwind: "$ownerDetails"
            // },
            {
                $addFields: {
                    username: "$ownerDetails.username",
                    avatar: "$ownerDetails.avatar",
                    fullName: "$ownerDetails.fullName",
                    ownerId:"$ownerDetails._id"
                }
            },
            {
                $project: {
                    ownerDetails: 0 // Hide the intermediate lookup details
                }
            }
        ]);

        res.status(200).json(videos);
    } catch (error) {
        console.error("Error fetching videos:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export {
         uploadVideo,
         getAllVideos,
         getVideos,
         getVideo
 };
