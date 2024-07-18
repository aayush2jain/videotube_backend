import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";


export const verifyJWT = async (req,_, next) => {
    try {
        // console.log(req.cookies);
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
      
        if (!token) {
            console.log("401 Unauthorized request - No token provided");  
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        console.log("sahi chal rha hai")
        if (!user) {
            console.log("401 Invalid Access Token - User not found");
          
        }
    
        req.user = user;
        console.log("user is",req.user);
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            console.log("401 Invalid Access Token - JWT error:", error.message);
          
        } else if (error.name === 'TokenExpiredError') {
            console.log("401 Access Token Expired - JWT error:", error.message);
            
        } else {
            console.log("500 Internal Server Error:", error);
           
        }
    }
};