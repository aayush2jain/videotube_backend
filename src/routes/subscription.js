import { Router } from "express";
import { verifyJWT } from "../middleware/auth.js";
import { uploadsub } from "../contollers/Subscription.js";

const router = Router();
router.use(verifyJWT);
router.route('/c/:id').post(uploadsub);

export default router