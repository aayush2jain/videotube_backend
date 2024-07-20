import mongoose from "mongoose";
import { app } from "../app.js";


const connectDb=async()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}/fullstack`)
         app.listen(process.env.PORT || 4000,()=>{
          console.log(`server is running at ${process.env.PORT}`)
        })
    }
    catch(error){
      console.log('error in db connection',error)
    }
}
export default connectDb