// src/services/nutritionService.js

// For now this just wraps TastyAPI’s nutrition.
// Later you can connect to another API like USDA / Edamam if needed.

export async function getCaloriesFromAnalysis(analysis) {
    // If TastyAPI already gave calories:
    if (analysis.estimatedCalories) {
      return {
        calories: analysis.estimatedCalories,
        nutrients: analysis.nutrition || {}
      };
    }
  
    // If not, you could aggregate from ingredients here.
    // Placeholder: return dummy value.
    const estimatedCalories = 400;
  
    return {
      calories: estimatedCalories,
      nutrients: analysis.nutrition || {}
    };
  }
  