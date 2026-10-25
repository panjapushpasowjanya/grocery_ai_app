import { useState, useEffect } from 'react';

export default function TrendsPage() {
  const [trends, setTrends] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/monthly-trend', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setTrends(data))
      .catch((err) => console.error("Trends fetch failed:", err));
  }, []);

  return (
    <div className="page" style={{ padding: '20px' }}>
      <h3>📈 Monthly Family Spending & Consumption Trends</h3>
      {trends.length === 0 ? (
        <p>Analyzing usage matrix...</p>
      ) : (
        trends.map((report, idx) => (
          <div key={idx} style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            backgroundColor: '#fff'
          }}>
            <strong style={{ fontSize: '1.2em' }}>{report.item_name}</strong>
            <div style={{ color: report.status === 'high' ? 'red' : 'green', fontWeight: 'bold', margin: '5px 0' }}>
              {report.status === 'high' ? 'High Volume' : 'Healthy Volume'}
            </div>
            <div>Total Purchased: {report.total_qty} {report.unit}</div>
            <div style={{ fontStyle: 'italic', color: '#555', marginTop: '5px' }}>
              🎯 {report.advisory}
            </div>
          </div>
        ))
      )}
    </div>
  );
}