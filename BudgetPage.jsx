import { useState, useEffect, useCallback } from 'react';

export default function BudgetPage() {
  const [budgetItems, setBudgetItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState({ totalSpent: 0, totalMarket: 0, netDifference: 0, status: 'neutral' });

  // Use useCallback to prevent infinite render loops
  const fetchBudgetReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3000/budget-report', { credentials: 'include' });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setBudgetItems(data);
        
        // Calculate totals locally here
        const spent = data.reduce((acc, item) => acc + item.total_spent, 0);
        const market = data.reduce((acc, item) => acc + item.market_price, 0);
        const diff = spent - market;
        
        setSummary({
          totalSpent: spent,
          totalMarket: market,
          netDifference: Math.abs(diff),
          status: diff > 5 ? 'overpaid' : diff < -5 ? 'saved' : 'fair'
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Defer the fetch to avoid calling setState synchronously within the effect
    const timer = setTimeout(() => {
      fetchBudgetReport();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchBudgetReport]);

  if (isLoading) {
    return (
      <div className="page" style={{ padding: '20px' }}>
        <h3>📊 Smart Budget Analysis</h3>
        <p>Loading budget report...</p>
      </div>
    );
  }

  return (
    <div className="page" style={{ padding: '20px' }}>
      <h3>📊 Smart Budget Analysis</h3>
      
      {/* Summary Card */}
      {budgetItems.length > 0 && (
        <div style={{ background: '#f0f0f0', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h4>Summary</h4>
          <p>Spent: ₹{summary.totalSpent.toFixed(2)} | Market Est: ₹{summary.totalMarket.toFixed(2)}</p>
        </div>
      )}

      {/* Grid */}
      {budgetItems.length === 0 ? (
        <p>No items found. Please add products to your ledger.</p>
      ) : (
        budgetItems.map(item => (
          <div key={item.id} style={{ 
            marginBottom: '15px', 
            padding: '15px', 
            borderLeft: `5px solid ${
              item.status === 'overpaid' ? 'red' : 
              item.status === 'good' ? 'green' : '#ccc'
            }`,
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{item.item_name}</strong>
      {/* ADDED THIS LINE TO SHOW THE MARKET PRICE */}
      {item.market_price > 0 && (
        <span style={{ fontSize: '0.85em', color: '#666' }}>Market Est: ₹{item.market_price}</span>
      )}
    </div>
    
    <p style={{ margin: '10px 0' }}>{item.advisory}</p>
    
    <small>Total Spent: <strong>₹{item.total_spent.toFixed(2)}</strong></small>
  </div>
))
      )}
    </div>
  );
}