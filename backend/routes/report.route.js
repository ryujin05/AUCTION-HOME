import express from "express";
import { createReport } from "../controllers/report.controller.js";
import { verifyToken } from "../middleware/verifyToken.js"; // <--- QUAN TRỌNG

const router = express.Router();

// Bảo vệ route này bằng middleware verifyToken
router.post("/createReport", verifyToken, createReport);

export default router;