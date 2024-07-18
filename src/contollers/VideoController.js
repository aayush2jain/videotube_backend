import { uploadOnCloudinary } from '../utils/cloudnary.js';
import { Video } from '../models/Video.model.js';
import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
const uploadVideo = async (req, res, next) => {
    try {
        const user = req.user._id;
        const userdata = await User.findById(user);
        const uploaderavatar = userdata.avatar;
    
        const uploadername = userdata.username;
        console.log("video user",uploaderavatar,uploadername);
        const { title, description, duration } = req.body;

        if (!req.files?.videoFile || !req.files?.thumbnail) {
            return res.status(400).json({ message: "Video file and thumbnail are required" });
        }

        const videoPath = req.files.videoFile[0].path;
        const thumbnailPath = req.files.thumbnail[0].path;

        const videoUpload = await uploadOnCloudinary(videoPath);
        const thumbnailUpload = await uploadOnCloudinary(thumbnailPath);

        const video = await Video.create({
            title,
            description,
            duration,
            videoFile: videoUpload.secure_url,
            thumbnail: thumbnailUpload.secure_url,
            owner:user,
            uploaderavatar:uploaderavatar,
            uploadername:uploadername
        });

        if (video) {
            return res.status(200).json({ message: "Video uploaded successfully", video });
        } else {
            return res.status(500).json({ message: "Failed to upload video" });
        }
    } catch (error) {
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
