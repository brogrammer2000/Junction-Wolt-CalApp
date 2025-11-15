// src/tastyService.js
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import FormData from "form-data";

dotenv.config();

const TASTY_API_KEY = process.env.TASTY_API_KEY;
const TASTY_API_BASE_URL = process.env.TASTY_API_BASE_URL;

// Sends image file to TastyAPI and returns nutrition info
export async function getNutritionFromImage(imagePath) {
  const form = new FormData();
  // Adjust "image" if TastyAPI expects a different field name
  form.append("image", fs.createReadStream(imagePath));

  try {
    const response = await axios.post(
      // Adjust this path to match the real Tasty endpoint
      `${TASTY_API_BASE_URL}/food/analyze-image`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${TASTY_API_KEY}`
        }
      }
    );

    // You can either:
    // 1. Return the full response as-is, or
    // 2. Map it to a smaller object.
    // For now, just return what Tasty gives you:
    return response.data;
  } catch (err) {
    console.error("Error calling TastyAPI:", err.response?.data || err.message);
    throw new Error("Failed to get nutrition from TastyAPI");
  }
}
