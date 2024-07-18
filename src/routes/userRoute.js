import { Router } from "express";
import { changePassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, registeredUser } from "../contollers/registeruser.js";
import {upload} from '../middleware/multer.js'
import { verifyJWT } from "../middleware/auth.js";
const router = Router();
router.route('/register').post(
    upload.fields([
        {
            name:'avatar',
            maxCount:1
        },
        {
            name:'coverImage',
            maxCount:1
        }
    ]),
    registeredUser);
router.route('/').post(loginUser);
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/auth").post(verifyJWT);
router.route("/changepass").post(verifyJWT,changePassword);
router.route('/getuser').get(verifyJWT,getCurrentUser);
router.route("/c/:id").get(verifyJWT, getUserChannelProfile)
router.route("/logout").get(verifyJWT,logoutUser)
router.route('/history').get(verifyJWT,getWatchHistory);
// router.route("/refresh-token").post(refreshAccessToken);
export default router