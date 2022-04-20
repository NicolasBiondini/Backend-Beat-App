import { Router } from "express";
import { handleRefreshToken } from "../controllers/refreshToken.controller";
import { signUp, signIn } from "../controllers/users.controllers";
import { handleLogout } from "../controllers/logout.controller";

const router = Router();

router.post("/signup", signUp);
router.post("/signin", signIn);
router.get("/refresh", handleRefreshToken);
router.get("/logout", handleLogout);

export default router;
