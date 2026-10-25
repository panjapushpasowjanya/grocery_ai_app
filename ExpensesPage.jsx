import { useState, useEffect } from 'react';

export default function ExpensesPage({ items = [], onSave }) {
  const [prices, setPrices] = useState({});
  const [isSaving, setIsSaving] = useState(false);


useEffect(() => {
  setPrices(prevPrices => {
    const nextPrices = { ...prevPrices };
    items.forEach(item => {
      const dbPrice = (item.price && Number(item.price) > 0) ? item.price : '';
      
      // ONLY update if the price is currently empty or different 
      // This prevents overwriting user input while they are typing
      if (nextPrices[item.id] === undefined || nextPrices[item.id] === '') {
        nextPrices[item.id] = dbPrice;
      }
    });
    return nextPrices;
  });
}, [items]); // Only re-runs when the items array identity changes

  const handlePriceChange = (itemId, value) => {
    // Allows only numbers and one decimal dot
    const cleanValue = value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple dots
    const parts = cleanValue.split('.');
    const validatedValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleanValue;

    setPrices(prev => ({
      ...prev,
      [itemId]: validatedValue
    }));
  };

  const calculateTotalSpent = () => {
    return Object.values(prices).reduce((sum, val) => {
      return sum + (parseFloat(val) || 0);
    }, 0).toFixed(2);
  };

  const handleSavePrices = async () => {
    if (isSaving) return;
    setIsSaving(true);
    
    // Prepare payload ensuring we send a number or 0
    const pricePayload = items.map(item => ({
      id: item.id,
      price: prices[item.id] === '' || prices[item.id] === undefined ? 0 : parseFloat(prices[item.id])
    }));

    try {
      const response = await fetch('http://localhost:3000/save-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prices: pricePayload })
      });

      const data = await response.json();
      if (data.success) {
        alert("💰 Prices saved successfully!");
        if (onSave) onSave(); // Refresh data from parent
      } else {
        alert("Failed to sync: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please check your server.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ background: '#004d40', color: '#fff', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
        <p>TOTAL EXPENDITURE</p>
        <strong style={{ fontSize: '32px' }}>₹{calculateTotalSpent()}</strong>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h4>Financial Ledger</h4>
          <button 
            onClick={handleSavePrices} 
            disabled={isSaving}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            {isSaving ? "Saving..." : "💾 Save Ledger"}
          </button>
        </div>

        {items.map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', padding: '10px', borderBottom: '1px solid #eee' }}>
            <span>{item.item_name}</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={prices[item.id] ?? ''}
              onChange={(e) => handlePriceChange(item.id, e.target.value)}
              style={{ width: '80px', textAlign: 'right', padding: '5px' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}