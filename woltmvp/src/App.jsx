import { useState } from "react";

const API_URL = "https://junction-wolt-calapp.onrender.com/analyze";


const getNutritionFromResult = (result) => {
  if (!result) return null;

  // Your backend shape: { success, source, data: { analysis: { ... } } }
  const analysis = result.data?.analysis;
  if (!analysis) return null;

  const nutrients = analysis.nutrients || {};
  const daily = analysis.dailyValuePercentages || {};

  const getAmount = (node) =>
    typeof node === "object" && node !== null ? node.amount ?? null : null;

  const calories = getAmount(nutrients.calories);
  const protein = getAmount(nutrients.protein);
  const carbs = getAmount(nutrients.carbohydrates);
  const fat = getAmount(nutrients.fat);

  // Optional: daily % values
  const caloriesPct = daily.calories ?? null;
  const proteinPct = daily.protein ?? null;
  const carbsPct = daily.carbohydrates ?? null;
  const fatPct = daily.fat ?? null;

  if (
    calories == null &&
    protein == null &&
    carbs == null &&
    fat == null
  ) {
    return null;
  }

  return {
    calories,
    protein,
    carbs,
    fat,
    caloriesPct,
    proteinPct,
    carbsPct,
    fatPct,
    foodName: analysis.foodName,
    servingSize: analysis.servingSize,
  };
};



function App() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const macros = getNutritionFromResult(result);


  const validateImage = (imageFile) => {
    if (!imageFile) return false;

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(imageFile.type)) {
      setError("Only JPG and PNG images are allowed.");
      setFile(null);
      setPreviewUrl(null);
      return false;
    }
    return true;
  };

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    if (!validateImage(selected)) return;

    setError("");
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setResult(null);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const dropped = event.dataTransfer.files?.[0];
    if (!dropped) return;

    if (!validateImage(dropped)) return;

    setError("");
    setFile(dropped);
    setPreviewUrl(URL.createObjectURL(dropped));
    setResult(null);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!file) {
      setError("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file); // must match backend field name

    try {
      setIsLoading(true);
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Failed to analyze image";
        try {
          const errorData = await response.json();
          if (errorData?.message) errorMessage = errorData.message;
        } catch {
          // ignore JSON parse error
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      // err is unknown, so we guard the access
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      // eslint-disable-next-line no-console
      console.error(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError("");
  };

  const handleChooseImageClick = () => {
    const input = document.getElementById("image-input");
    if (input) {
      input.click();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#0f172a",
        padding: "1.5rem",
        color: "#e5e7eb",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          background: "#020617",
          borderRadius: "1.5rem",
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.9)",
          padding: "1.75rem",
          border: "1px solid rgba(148, 163, 184, 0.25)",
        }}
      >
        <header style={{ marginBottom: "1.5rem" }}>
          <h1
            style={{
              fontSize: "1.8rem",
              fontWeight: 700,
              marginBottom: "0.35rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
          WoltCalorie Analyzer
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#9ca3af" }}>
            Upload a food image and get nutrition data via your AI-powered
            backend.
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          {/* Upload area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            style={{
              border: "1.5px dashed rgba(148, 163, 184, 0.7)",
              borderRadius: "1rem",
              padding: "1.5rem",
              marginBottom: "1rem",
              background:
                "radial-gradient(circle at top left, rgba(56, 189, 248, 0.08), transparent 55%), #020617",
            }}
          >
            <label
              htmlFor="image-input"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.75rem",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: "2rem" }}>📷</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 600, marginBottom: "0.2rem" }}>
                  Drag &amp; drop a food photo here
                </div>
                <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                  or click to browse JPG / PNG (max 5MB)
                </div>
              </div>
              <button
                type="button"
                onClick={handleChooseImageClick}
                style={{
                  marginTop: "0.25rem",
                  padding: "0.5rem 1.1rem",
                  borderRadius: "999px",
                  border: "none",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "#f9fafb",
                  boxShadow: "0 10px 25px rgba(22, 163, 74, 0.45)",
                  cursor: "pointer",
                }}
              >
                Choose Image
              </button>
            </label>
            <input
              id="image-input"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>

          {/* Preview + actions */}
          {previewUrl && file && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1.8fr",
                gap: "1rem",
                alignItems: "stretch",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  borderRadius: "0.85rem",
                  overflow: "hidden",
                  border: "1px solid rgba(148, 163, 184, 0.35)",
                  background: "#020617",
                }}
              >
                <img
                  src={previewUrl}
                  alt="Food preview"
                  style={{
                    width: "100%",
                    height: "220px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
                    Selected file
                  </div>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 500,
                      marginTop: "0.2rem",
                      wordBreak: "break-all",
                    }}
                  >
                    {file.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#6b7280",
                      marginTop: "0.1rem",
                    }}
                  >
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginTop: "0.6rem",
                  }}
                >
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      flex: 1,
                      padding: "0.55rem 1rem",
                      borderRadius: "999px",
                      border: "none",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      background: isLoading
                        ? "rgba(59, 130, 246, 0.45)"
                        : "linear-gradient(135deg, #3b82f6, #2563eb)",
                      color: "#f9fafb",
                      cursor: isLoading ? "default" : "pointer",
                      boxShadow: isLoading
                        ? "none"
                        : "0 10px 25px rgba(37, 99, 235, 0.5)",
                    }}
                  >
                    {isLoading ? "Analyzing..." : "Analyze with WoltAI"}
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={isLoading}
                    style={{
                      padding: "0.55rem 1rem",
                      borderRadius: "999px",
                      border: "1px solid rgba(148, 163, 184, 0.7)",
                      background: "transparent",
                      color: "#e5e7eb",
                      fontSize: "0.9rem",
                      cursor: isLoading ? "default" : "pointer",
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                marginBottom: "0.75rem",
                padding: "0.6rem 0.7rem",
                borderRadius: "0.75rem",
                background: "rgba(220, 38, 38, 0.1)",
                border: "1px solid rgba(248, 113, 113, 0.4)",
                fontSize: "0.85rem",
                color: "#fecaca",
              }}
            >
              ⚠️ {error}
            </div>
          )}
        </form>

        {/* Result */}
        {result && (
  <section
    style={{
      marginTop: "1.1rem",
      padding: "0.9rem 1rem",
      borderRadius: "1rem",
      background:
        "radial-gradient(circle at top right, rgba(56, 189, 248, 0.08), transparent 55%), #020617",
      border: "1px solid rgba(148, 163, 184, 0.4)",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "0.6rem",
      }}
    >
      <h2
        style={{
          fontSize: "1rem",
          fontWeight: 600,
        }}
      >
        Nutrition result
      </h2>
      <span
        style={{
          fontSize: "0.75rem",
          padding: "0.1rem 0.6rem",
          borderRadius: "999px",
          background: "rgba(34, 197, 94, 0.15)",
          border: "1px solid rgba(34, 197, 94, 0.5)",
          color: "#bbf7d0",
        }}
      >
        from AI powered backend
      </span>
    </div>

    {/* Macro cards */}
    {macros ? (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "0.6rem",
          marginBottom: "0.8rem",
        }}
      >
        <div
          style={{
            padding: "0.6rem 0.7rem",
            borderRadius: "0.75rem",
            background: "linear-gradient(135deg, rgba(250, 204, 21, 0.1), rgba(250, 204, 21, 0.02))",
            border: "1px solid rgba(250, 204, 21, 0.4)",
          }}
        >
          <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#eab308" }}>
            Calories
          </div>
          <div style={{ fontSize: "1.05rem", fontWeight: 700 }}>
            {macros.calories ?? "—"}
            {macros.calories != null && (
              <span style={{ fontSize: "0.7rem", marginLeft: "0.2rem", color: "#9ca3af" }}>
                kcal
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            padding: "0.6rem 0.7rem",
            borderRadius: "0.75rem",
            background: "linear-gradient(135deg, rgba(52, 211, 153, 0.1), rgba(52, 211, 153, 0.02))",
            border: "1px solid rgba(52, 211, 153, 0.4)",
          }}
        >
          <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#22c55e" }}>
            Protein
          </div>
          <div style={{ fontSize: "1.05rem", fontWeight: 700 }}>
            {macros.protein ?? "—"}
            {macros.protein != null && (
              <span style={{ fontSize: "0.7rem", marginLeft: "0.2rem", color: "#9ca3af" }}>
                g
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            padding: "0.6rem 0.7rem",
            borderRadius: "0.75rem",
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.02))",
            border: "1px solid rgba(59, 130, 246, 0.4)",
          }}
        >
          <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#60a5fa" }}>
            Carbs
          </div>
          <div style={{ fontSize: "1.05rem", fontWeight: 700 }}>
            {macros.carbs ?? "—"}
            {macros.carbs != null && (
              <span style={{ fontSize: "0.7rem", marginLeft: "0.2rem", color: "#9ca3af" }}>
                g
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            padding: "0.6rem 0.7rem",
            borderRadius: "0.75rem",
            background: "linear-gradient(135deg, rgba(248, 113, 113, 0.1), rgba(248, 113, 113, 0.02))",
            border: "1px solid rgba(248, 113, 113, 0.4)",
          }}
        >
          <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#f97373" }}>
            Fat
          </div>
          <div style={{ fontSize: "1.05rem", fontWeight: 700 }}>
            {macros.fat ?? "—"}
            {macros.fat != null && (
              <span style={{ fontSize: "0.7rem", marginLeft: "0.2rem", color: "#9ca3af" }}>
                g
              </span>
            )}
          </div>
        </div>
      </div>
    ) : (
      <p
        style={{
          fontSize: "0.8rem",
          color: "#9ca3af",
          marginBottom: "0.8rem",
        }}
      >
        No macro fields (calories / protein / carbs / fat) were found in the response.
      </p>
    )}

    {/* Raw JSON in a collapsible area */}
    <details>
      <summary
        style={{
          fontSize: "0.8rem",
          color: "#9ca3af",
          cursor: "pointer",
          marginBottom: "0.3rem",
        }}
      >
        Show raw response
      </summary>
      <pre
        style={{
          marginTop: "0.3rem",
          maxHeight: "260px",
          overflow: "auto",
          fontSize: "0.8rem",
          lineHeight: 1.4,
          background: "#020617",
          borderRadius: "0.75rem",
          padding: "0.7rem 0.8rem",
          border: "1px solid rgba(30, 64, 175, 0.6)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {JSON.stringify(result, null, 2)}
      </pre>
    </details>
  </section>
)}


        {!result && !previewUrl && (
          <p
            style={{
              marginTop: "0.6rem",
              fontSize: "0.8rem",
              color: "#6b7280",
              textAlign: "center",
            }}
          >
            Drop an image above to get nutrition data from your AI powered backend.
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
