import { Comment } from "../models/Comment.model.js";
import mongoose from "mongoose";

const uploadcomment = async(req,res)=>{
    try {
    const videoId =  req.params.id // Assuming the video ID is passed as a URL parameter
    console.log("video",req.params.id);
    const ObjectId = mongoose.Types.ObjectId;
    // Validate videoId before using it
    if (!ObjectId.isValid(videoId)) {
      return res.status(400).json({ message: "Invalid video ID format" });
    }

    const comment = await Comment.create({
      content: req.body.content,
      owner: req.user._id,
      video: new ObjectId(videoId)
    });
    console.log(comment)
    return res.status(201).json({ message: "Comment created successfully", comment });
  }
      catch(error){
        console.log("comment",error)
      }
}

const getcomment = async(req,res)=>{
  try{
         const _id =  req.params
        console.log("videoid",_id)
        if (!_id) {
            console.log("video not found");
            return res.status(400).json({ message: "video not found" });
        }
          const comments = await Comment.aggregate([
            {
               $match:{
                 video: new mongoose.Types.ObjectId(_id)
               }
            },
            {
              $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "commentowner"
              }
            },
            {
               $addFields: {
                    ownerusername: "$commentowner.username",
                    owneravatar: "$commentowner.avatar",
                    ownerId:"$commentowner._id"
                }
            },{
              $project: {
                    commentowner: 0 // Hide the intermediate lookup details
                }
            }

          ])
          res.status(200).json(comments);
  }
  catch(error){
     console.log(error)
  }
}
export{
    uploadcomment,
    getcomment
}