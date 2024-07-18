import { Subscription } from "../models/Subscription.model.js";
import mongoose from "mongoose";
const uploadsub = async(req,res)=>{
    
 try{
     const ObjectId = mongoose.Types.ObjectId;
       const channel_id =  req.params
        console.log("videoid",channel_id);
        if (!channel_id) {
            console.log("video not found");
            return res.status(400).json({ message: "video not found" });
        }
        const subscriber_id = req.user;

        const subscriptions =  await Subscription.create({
              Subscriber: new ObjectId(subscriber_id),
              Channel: new ObjectId(channel_id)
        })
    return res.status(201).json({ message: "Comment created successfully",subscriptions});
 }
 catch(error){
    console.log(error);
 }
}
export{
    uploadsub
}