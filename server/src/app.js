// src/app.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { getNutritionFromImage } from "./tastyService.js";

dotenv.config();

const app = express();
import cors from "cors";
app.use(cors()); // add this before routes


// Multer storage (temporary)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG and PNG images are allowed"));
    }
    cb(null, true);
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Core endpoint: POST /analyze
// Accepts: multipart/form-data with field "image"
// Returns: nutrition info from TastyAPI
app.post("/analyze", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Image file is required (field name: image)" });
  }

  const imagePath = req.file.path;

  try {
    const nutritionData = await getNutritionFromImage(imagePath);

    // Clean up the local file (optional but good hygiene)
    fs.unlink(imagePath, err => {
      if (err) console.warn("Failed to delete uploaded file:", imagePath);
    });

    return res.json({
      success: true,
      source: "tasty-api",
      data: nutritionData
    });
  } catch (err) {
    console.error("Error in /analyze:", err.message);

    // Clean up on error too
    fs.unlink(imagePath, e => {
      if (e) console.warn("Failed to delete uploaded file after error:", imagePath);
    });

    return res.status(500).json({
      success: false,
      message: "Failed to analyze image",
      error: err.message
    });
  }
});

export default app;
