import express from "express";
import { 
  createPropertyType, 
  deletePropertyType, 
  getAllPropertyTypes, 
  getPropertyTypeById, 
  updatePropertyType 
} from "../controllers/property_type.controller.js";
import { verifyToken } from "../middleware/verifyToken.js"; // <--- QUAN TRỌNG

const router = express.Router();

router.get("/getPropertyType", getAllPropertyTypes);
router.get("/:id", getPropertyTypeById); 

router.post("/createPropertyType", verifyToken, createPropertyType);
router.put("/updatePropertyType/:id", verifyToken, updatePropertyType);
router.delete("/deletePropertyType/:id", verifyToken, deletePropertyType);

export default router;