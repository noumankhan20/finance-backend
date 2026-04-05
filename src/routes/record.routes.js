import express from "express";
import {createRecord,getRecords,updateRecord,deleteRecord,getDashboardStats} from "../controllers/record.controller.js";
import { isAuthenticated,authorizeRoles } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/create",isAuthenticated,authorizeRoles("admin"),createRecord)
router.get("/get",isAuthenticated,authorizeRoles("admin","analyst"),getRecords)
router.put("/update/:id",isAuthenticated,authorizeRoles("admin"),updateRecord)
router.delete("/delete/:id",isAuthenticated,authorizeRoles("admin"),deleteRecord)
router.get("/dashboard",isAuthenticated,authorizeRoles("admin", "analyst", "viewer"),getDashboardStats)




const recordRoutes = router;
export default recordRoutes;
