import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudnary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Cookie } from 'express-session';
import { Subscription } from '../models/Subscription.model.js';
import mongoose from 'mongoose';

const generateAndAcessRefreshToken = async(userId)=>{
   try{
      const user = await User.findById(userId);
    //   console.log(user)
      const accessToken =  await user.generateacessToken();
      const refreshToken = await user.generateRefreshToken();
      user.refreshToken = refreshToken;
      await user.save({validateBeforeSave:false});
     
    //  console.log(refreshToken,"",accessToken)
      return {refreshToken,accessToken}
   }
   catch(error){
    console.log(error)
   }
}


const registeredUser = async (req,res,next) => {
    const { fullName, email, username, password } = req.body;
   console.log("fu;llname",fullName,"email:",email,"username",username,"pass",password);
    // Validate required fields
    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        // Check if the user already exists
        const existedUser = await User.findOne({
            $or: [{ username }]
        });

        if (existedUser) {
            return res.status(409).json({ error: "User with email or username already exists" });
        }

        // Handle file uploads
        const avatarLocalPath = req.files?.avatar?.[0]?.path;
        
        let coverImageLocalPath = req.files?.coverImage?.[0]?.path;

        if (!avatarLocalPath) {
            return res.status(400).json({ error: "Avatar file is required" });
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);
  
        const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

        // Create the user
        const user = await User.create({
            
            avatar: avatar.secure_url,
            coverImage: coverImage?.secure_url || "",
            email,
            password,
            username: username.toLowerCase()
        });

        // Fetch the created user without password and refreshToken
        const createdUser = await User.findById(user._id).select("-password -refreshToken");

        if (!createdUser) {
            return res.status(500).json({ error: "Something went wrong while registering the user" });
        }

        return res.status(201).json({ message: "User created successfully", user: createdUser });

    } catch (error) {
        next(error);
    }
};
const loginUser = async (req, res, next) => {
      const { fullName, email, username, password } = req.body;
   console.log("fullname",fullName,"email:",email,"username",username,"pass",password);
    // Validate required fields

    try {
        const existedUser = await User.findOne({ email });
        if (!existedUser) {
            console.log("User not found:",email);
            return res.status(404).json({ message: "User not found" });
        }
        const check = await existedUser.isPasswordCorrect(password);
        if (check) {
            console.log("Login successful for user:", username,email);
            // return res.status(200).json({ message: "Login successful" });
        } else {
            // console.log("Incorrect password for user:",email);
            return res.status(299).json({ message: "Incorrect user or password" });
        }
       const {accessToken,refreshToken} = await generateAndAcessRefreshToken(existedUser._id)
     
       
   
        const loggedInUser = await User.findById(existedUser._id).select("-password")
      
    const options = {
        httpOnly: true,
        secure: true
    }

    const che= res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
       new ApiResponse(
            200, 
            {
                Cookie,loggedInUser
            },
            "User logged In Successfully"
        )
    )
    
    return che
    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const logoutUser = async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
}

const refreshAccessToken = async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw Error(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw Error(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw Error(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw Error(401, error?.message || "Invalid refresh token")
    }

}

const changePassword = async(req,res)=>{
    const user = await User.findById(req.user._id);
    if(!user){
        console.log("bhai user hi nahi aa rha")
    }
    else{
        const{oldpassword,newpassword}= req.body;
        const isPassCorrect= user.isPasswordCorrect(oldpassword)
        if(!isPassCorrect){
            
            console.log("wrong password bhai")
        }
       user.password=newpassword;
       user.save({validateBeforeSave:false});

       return res.status(200).json(
        new ApiResponse(200,{},"password is changed")
       )
    }
}


const getCurrentUser = async(req, res) => {
    console.log(req.user)
   
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
}

const updateAccountDetails = async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw Error(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
}

const updateUserAvatar = async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw Error(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw Error(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
}

const updateUserCoverImage = async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw Error(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment


    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw Error(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
}


const getUserChannelProfile =async(req, res) => {
    const _id = req.params
   
    if (!_id) {
        console.log("id is missing")
    }

    const channel = await User.aggregate([
        {
           $match: {
                    _id: new mongoose.Types.ObjectId(_id)
                }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "Channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "Subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user._id, "$subscribers.Subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
       console.log("channel nahu chal rha")
    }
    console.log("channel",channel)

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
}

const getWatchHistory = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user._id);

        const user = await User.aggregate([
            {
                $match: { _id: userId }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project: {
                                            fullName: 1,
                                            username: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields: {
                                owner: { $arrayElemAt: ["$owner", 0] }
                            }
                        }
                    ]
                }
            }
        ]);

        if (!user || user.length === 0) {
            return res.status(404).json(new ApiResponse(404, null, "User not found"));
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "Watch history fetched successfully"
            )
        );
    } catch (error) {
        console.error("Error fetching watch history:", error);
        return res.status(500).json(new ApiResponse(500, null, "An error occurred while fetching watch history"));
    }
};

export { registeredUser,loginUser,logoutUser,refreshAccessToken ,
    changePassword,updateAccountDetails,updateUserAvatar
    ,updateUserCoverImage,getCurrentUser,getWatchHistory,getUserChannelProfile
};
