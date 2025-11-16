// server.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: "*",
  })
);

const PORT = process.env.PORT || 4001;
const TASTY_API_KEY = process.env.TASTY_API_KEY;
const TASTY_API_URL = process.env.TASTY_API_URL || "https://tastyapi.com/analyze-image";

// Ensure uploads folder exists
if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

// Multer storage (file upload handler)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random()}${ext}`);
  },
});

const upload = multer({ storage });

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Core route: POST /analyze
app.post("/analyze", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Image file is required (field name: image)",
    });
  }

  const imagePath = req.file.path;

  try {
    const form = new FormData();
    form.append("image", fs.createReadStream(imagePath));

    const response = await axios.post(TASTY_API_URL, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${TASTY_API_KEY}`,
      },
    });

    // Delete file after sending
    fs.unlink(imagePath, () => {});

    return res.json({
      success: true,
      source: "tasty-api",
      data: response.data,
    });
  } catch (error) {
    fs.unlink(imagePath, () => {});
    console.error("TastyAPI error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to analyze image",
      error: error.response?.data || error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
