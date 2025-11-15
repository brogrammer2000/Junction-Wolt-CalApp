// src/routes/mealRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import { authRequired } from "../middleware/authMiddleware.js";
import { meals } from "../data/store.js";
import { analyzeFoodImage } from "../services/tastyService.js";
import { getCaloriesFromAnalysis } from "../services/nutritionService.js";

const router = express.Router();

// Configure Multer for file uploads
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG and PNG images are allowed"));
    }
    cb(null, true);
  }
});

// POST /api/meals – upload image, analyze, log meal
router.post("/", authRequired, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const imagePath = req.file.path;

    // 1) Analyze image with TastyAPI
    const analysis = await analyzeFoodImage(imagePath);

    // 2) Derive calories / nutrition
    const { calories, nutrients } = await getCaloriesFromAnalysis(analysis);

    // 3) Store meal record
    const meal = {
      id: meals.length + 1,
      userId: req.user.id,
      imageUrl: imagePath,
      foodName: analysis.foodName,
      calories,
      nutrients,
      createdAt: new Date().toISOString()
    };

    meals.push(meal);

    return res.status(201).json({
      message: "Meal logged",
      meal
    });
  } catch (err) {
    console.error("Error in /api/meals:", err.message);
    return res.status(500).json({ message: "Failed to process image", error: err.message });
  }
});

// GET /api/meals – list user's meals
router.get("/", authRequired, (req, res) => {
  const userMeals = meals.filter(m => m.userId === req.user.id);
  return res.json({ meals: userMeals });
});

// GET /api/meals/summary?date=YYYY-MM-DD
router.get("/summary", authRequired, (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().slice(0, 10); // default today (UTC date)

  const userMeals = meals.filter(m => m.userId === req.user.id);

  const dayMeals = userMeals.filter(m => m.createdAt.slice(0, 10) === targetDate);
  const totalCalories = dayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);

  return res.json({
    date: targetDate,
    totalCalories,
    meals: dayMeals
  });
});

export default router;
