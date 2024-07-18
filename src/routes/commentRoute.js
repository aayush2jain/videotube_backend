import { Router } from "express";
import { verifyJWT } from "../middleware/auth.js";
import { getcomment, uploadcomment } from "../contollers/Comment.Controller.js";
const router = Router();
router.use(verifyJWT);
router.route('/c/:id').post(uploadcomment);
router.route('/video/c/:id').get(getcomment)
export default router