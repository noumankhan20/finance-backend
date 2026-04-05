import express from "express";
import {createUser,loginUser,logoutUser,deactivateUser,activateUser, getAllUsers} from "../controllers/user.controller.js";
import { isAuthenticated,authorizeRoles } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/create",isAuthenticated,authorizeRoles("admin"),createUser)
router.post("/login",loginUser)
router.post("/logout",logoutUser)
router.get("/getall",isAuthenticated,authorizeRoles("admin"),getAllUsers)
router.patch("/deactivate/:id",isAuthenticated,authorizeRoles("admin"),deactivateUser);
router.patch("/activate/:id",isAuthenticated,authorizeRoles("admin"),activateUser);
const userRoutes = router;
export default userRoutes;