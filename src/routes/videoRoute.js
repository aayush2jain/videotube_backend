
import { Router } from 'express';
import {verifyJWT} from "../middleware/auth.js"
import {upload} from "../middleware/multer.js"
import { getAllVideos, getVideo, getVideos, uploadVideo } from '../contollers/VideoController.js';

const router = Router();
router.use(verifyJWT);
router.route('/upload').post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        uploadVideo
    );
// router.route('/').get(getAllVideos);
router.route('/show').get(getVideos);
router.route('/c/:_id').get(getVideo);
router.route('/all').get(getAllVideos)
export default router;