import mongoose, {Schema} from "mongoose";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
           
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
           
        },
        fullName: {
            type: String,
        },
        avatar: {
            type: String, // cloudinary url
            required: true,
        },
        coverImage: {
            type: String, // cloudinary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        }

    },
    {
        timestamps: true
    }
)
userSchema.pre('save',function(next){
    if(!this.isModified('password')){
        return next();
    }
    else{
        this.password=bcrypt.hash(this.password,10);
        next();
    }
})
userSchema.methods.isPasswordCorrect = async function(password){
    if(password==this.password){
        // console.log("password",password,"this_password",this.password)
        return true
    }
    else{
        return false
    }
}
userSchema.methods.generateacessToken = async function(){
    return  jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullName
        },
         process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken =async function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}




export const User = mongoose.model("User", userSchema)