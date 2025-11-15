import React, { useState } from 'react';
import './MealUploader.css';

const API_BASE = 'http://localhost:4000';

function MealUploader() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [todayTotal, setTodayTotal] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0] || null;
    setFile(selectedFile);
    setResult(null);
    setError('');

    // Create preview
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose an image first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);

      const formData = new FormData();
      formData.append('image', file);

      const resp = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        body: formData,
      });

      const data = await resp.json();

      if (!resp.ok || data.error) {
        setError(data.error || 'Unknown error');
        return;
      }

      // Handle the backend response structure
      if (data.foods && data.foods.length > 0) {
        setResult({
          foods: data.foods,
          totalCalories: data.totalCalories || 0,
        });
        setTodayTotal(data.todayTotal ?? null);
      } else {
        setError(data.error || 'No food detected in image');
      }
    } catch (err) {
      console.error(err);
      setError('Network or server error. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const formatNutrition = (nutrition) => {
    if (!nutrition || Object.keys(nutrition).length === 0) return null;
    
    const items = [];
    if (nutrition.calories) items.push(`Calories: ${Math.round(nutrition.calories)} kcal`);
    if (nutrition.protein) items.push(`Protein: ${Math.round(nutrition.protein)}g`);
    if (nutrition.carbohydrate) items.push(`Carbs: ${Math.round(nutrition.carbohydrate)}g`);
    if (nutrition.fat) items.push(`Fat: ${Math.round(nutrition.fat)}g`);
    
    return items.length > 0 ? items.join(' • ') : null;
  };

  return (
    <div className="meal-uploader">
      <div className="container">
        <header className="header">
          <h1>🍽️ Meal Analyzer</h1>
          <p className="subtitle">Upload a photo of your meal to get instant calorie and nutrition information</p>
        </header>

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="file-input-wrapper">
            <input 
              type="file" 
              id="image-upload"
              accept="image/jpeg,image/jpg,image/png,image/webp" 
              onChange={handleFileChange}
              className="file-input"
            />
            <label htmlFor="image-upload" className="file-label">
              {file ? file.name : 'Choose an image (JPG, PNG, WebP)'}
            </label>
          </div>

          {preview && (
            <div className="preview-container">
              <img src={preview} alt="Preview" className="preview-image" />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !file}
            className="analyze-button"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Analyzing…
              </>
            ) : (
              'Analyze Meal'
            )}
          </button>
        </form>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {result && result.foods && result.foods.length > 0 && (
          <div className="results">
            <div className="results-header">
              <h2>Detected Foods</h2>
              <div className="total-calories-badge">
                {Math.round(result.totalCalories)} kcal total
              </div>
            </div>

            <div className="foods-list">
              {result.foods.map((food, index) => (
                <div key={food.food_id || index} className="food-card">
                  <div className="food-header">
                    <h3 className="food-name">{food.food_entry_name || 'Unknown Food'}</h3>
                    <span className="food-calories">
                      {Math.round(food.calories)} kcal
                    </span>
                  </div>
                  
                  {food.nutrition && Object.keys(food.nutrition).length > 0 && (
                    <div className="nutrition-info">
                      {formatNutrition(food.nutrition) && (
                        <p className="nutrition-text">
                          {formatNutrition(food.nutrition)}
                        </p>
                      )}
                    </div>
                  )}

                  {food.suggested_serving && (
                    <div className="serving-info">
                      <p className="serving-text">
                        Suggested serving: {food.suggested_serving.serving_description || 'Standard serving'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {todayTotal != null && (
          <div className="today-summary">
            <h2>Today's Total</h2>
            <div className="today-calories">
              {Math.round(todayTotal)} kcal
            </div>
            <p className="today-note">Total calories logged today</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MealUploader;
