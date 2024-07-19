import express, { urlencoded } from "express";
import { Cookie } from "express-session";
import cookieParser from 'cookie-parser'
import cors from 'cors'
import bodyParser from "body-parser";

const app=express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());
app.use(bodyParser.json());

import userrouter from './routes/userRoute.js'
import videorouter from './routes/videoRoute.js'
import commentrouter from "./routes/commentRoute.js"
import subscriberouter from './routes/subscription.js'
app.use('/user',userrouter);
app.use('/video',videorouter);
app.use('/comment',commentrouter);
app.use('/sub',subscriberouter);
app.get('/',async (req,res)=>{
    res.status(200).json({message:"server is running"})
})
export {app}