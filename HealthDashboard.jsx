import { useState, useEffect } from "react";

function MetricCard({ title, value }) {
  return (
    <div style={{ background: "#fff", borderRadius: "12px", padding: "15px", textAlign: "center", border: "1px solid #e5e7eb" }}>
      <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>{title}</div>
      <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1f2937" }}>{value}</div>
    </div>
  );
}

export default function HealthDashboard() {
  const [weight, setWeight] = useState(70);
  const [goal, setGoal] = useState("Maintain Weight");

  const [steps, setSteps] = useState(0);
  const [heartPoints, setHeartPoints] = useState(0);
  const [moveMinutes, setMoveMinutes] = useState(0);
  const [distance, setDistance] = useState(0);

  const [tracking, setTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [lastPosition, setLastPosition] = useState(null);

  const [nutritionData, setNutritionData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/health-report", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setNutritionData(data))
      .catch((err) => console.error(err));
  }, []);

  const fakeWalk = () => {
    setSteps((prev) => prev + 50);
    setHeartPoints((prev) => prev + 2);
    setMoveMinutes((prev) => prev + 1);
    setDistance((prev) => Number((prev + 0.04).toFixed(2)));
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert("GPS not supported");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (lastPosition) {
          const traveled = calculateDistance(lastPosition.latitude, lastPosition.longitude, latitude, longitude);
          if (traveled > 0.001) {
            setDistance((prev) => Number((prev + traveled).toFixed(2)));
            setSteps((prev) => prev + Math.floor(traveled * 1300));
            setHeartPoints((prev) => prev + 1);
            setMoveMinutes((prev) => prev + 1);
          }
        }
        setLastPosition({ latitude, longitude });
      },
      (err) => console.log(err),
      { enableHighAccuracy: true }
    );
    setWatchId(id);
    setTracking(true);
  };

  const stopTracking = () => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    setTracking(false);
    setLastPosition(null);
  };

  //const progress = Math.min((steps / 10000) * 100, 100);

  return (
    <div style={{ maxWidth: "420px", margin: "0 auto", padding: "15px", background: "#f3f4f6", minHeight: "100vh" }}>
      
      {/* RING SECTION */}
      <div
        style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "20px",
        textAlign: "center",
        marginBottom: "12px",
        }}
      >
        <div style={{ position: "relative", width: "160px", height: "160px", margin: "0 auto" }}>
          <svg width="160" height="160" viewBox="0 0 160 160">
            {/* Outer Ring: Steps (Green) */}
            <circle cx="80" cy="80" r="70" stroke="#e5e7eb" strokeWidth="8" fill="none" />
            <circle
              cx="80" cy="80" r="70"
              stroke="#22c55e" strokeWidth="8" fill="none"
              strokeDasharray={2 * Math.PI * 70}
              strokeDashoffset={2 * Math.PI * 70 * (1 - Math.min(steps / 10000, 1))}
              strokeLinecap="round" transform="rotate(-90 80 80)"
              />
              {/* Inner Ring: Heart Points (Red) */}
              <circle cx="80" cy="80" r="55" stroke="#fee2e2" strokeWidth="8" fill="none" />
              <circle
                  cx="80" cy="80" r="55"
                  stroke="#dc2626" strokeWidth="8" fill="none"
                  strokeDasharray={2 * Math.PI * 55}
                  strokeDashoffset={2 * Math.PI * 55 * (1 - Math.min(heartPoints / 1000, 1))}
                  strokeLinecap="round" transform="rotate(-90 80 80)"
              />
              </svg>
              {/* CENTER TEXT */}
              <div
                style={{
                  position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  lineHeight: "1.1"
                }}
              >
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "#dc2626" }}>{heartPoints}<br/>HP</div>
              <div style={{ fontSize: "12px", color: "#999", margin: "4px 0" }}>—</div>
              <div style={{ fontSize: "16px", fontWeight: "bold" }}>{steps}</div>
              <div style={{ fontSize: "10px", color: "#666" }}>/ 1000</div>
              <div style={{ fontSize: "12px", fontWeight: "bold", marginTop: "4px" }}>{distance} <span style={{fontSize: "10px"}}>km</span></div>
              <div style={{ fontSize: "10px", color: "#999" }}>({Math.round(distance * 1000)}m)</div>
            </div>
          </div>
        </div>

      {/* ALERT */}
      <div style={{ background: "#fff7ed", border: "1px solid #fdba74", color: "#c2410c", padding: "10px", borderRadius: "10px", fontSize: "12px", marginBottom: "12px" }}>
        ⚠️ You didn't meet your daily goal yet! Go on a short walk to stay active.
      </div>

      {/* FITNESS PROFILE */}
      <div style={{ background: "#fff", borderRadius: "16px", padding: "15px", marginBottom: "12px" }}>
        <h4 style={{ marginTop: 0 }}>🎯 Set Your Fitness Profile</h4>
        <div style={{ display: "flex", gap: "10px" }}>
          <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value) || 0)} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }} />
          <select value={goal} onChange={(e) => setGoal(e.target.value)} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }}>
            <option>Maintain Weight</option><option>Lose Weight</option><option>Gain Weight</option>
          </select>
        </div>
      </div>

      {/* STATISTICS */}
      <div style={{ background: "#fff", borderRadius: "16px", padding: "15px", marginBottom: "12px" }}>
        <h4 style={{ marginTop: 0 }}>📊 Today's Statistics</h4>
        <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
          <div><b>0</b><br />Consumed</div>
          <div><b>0</b><br />Expended</div>
          <div><b>0</b><br />Balance</div>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "15px" }}>
        <MetricCard title="👣 Steps Walked" value={steps} />
        <MetricCard title="❤️ Heart Points" value={heartPoints} />
        <MetricCard title="🚶 Move Minutes" value={moveMinutes} />
        <MetricCard title="📍 Kilometers" value={distance} />
      </div>

      {/* TELEMETRY */}
      <div style={{ border: "2px dashed #60a5fa", borderRadius: "16px", padding: "15px", background: "#f8fbff", marginBottom: "15px" }}>
        <h4 style={{ marginTop: 0, color: "#2563eb" }}>🛰️ Live Telemetry Tracking Engine</h4>
        <button onClick={tracking ? stopTracking : startTracking} style={{ width: "100%", background: tracking ? "#dc2626" : "#16a34a", color: "#fff", border: "none", padding: "12px", borderRadius: "30px", marginBottom: "10px", cursor: "pointer", fontWeight: "bold" }}>
          {tracking ? "🛑 Stop Tracking" : "📍 Tracking Live... Walk with your Phone!"}
        </button>
        <button onClick={fakeWalk} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>⚡ Fake Walk Step</button>
      </div>

     {/* GROCERY REPORT */}
     <h4>🌾 Grocery Nutrition Report</h4>
     <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", 
          gap: "15px" 
        }}
      >
        {nutritionData.map((item) => {
          const isWarning = item.calories > 500 || item.fat_g > 50; 
          return (
            <div key={item.id} style={{ background: "#fff", borderRadius: "16px", padding: "15px", border: "1px solid #e5e7eb", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
            <h5 style={{ margin: "0 0 5px 0", fontSize: "16px", textTransform: "capitalize" }}>{item.item_name}</h5>
            <div style={{ fontSize: "11px", color: "#666" }}>Vol: {item.quantity} {item.unit || ""}</div>
            </div>
          <div style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: "6px", fontWeight: "bold", fontSize: "11px" }}>
            {item.grade || "B"}
          </div>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "12px", fontSize: "12px" }}>
          <div>🔥 {item.calories}k</div>
          <div>🍭 {item.sugar_g}g</div>
          <div>🥑 {item.fat_g}g</div>
          <div>🧂 {item.sodium_mg || 0}m</div>
        </div>

        <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px solid #f0f0f0", fontSize: "11px", color: isWarning ? "#b91c1c" : "#15803d", fontWeight: "bold" }}>
          {isWarning ? "● Warning" : "● Healthy Choice"}
        </div>
      </div>
    );
  })}
      </div>
    </div>
  );
}