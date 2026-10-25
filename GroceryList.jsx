export default function GroceryList({ items = [], onIncreaseItem, onDecreaseItem }) {
  
  // Helper to format numeric values nicely without forced trailing zeros
  const formatQuantity = (qty) => {
    const num = parseFloat(qty);
    if (isNaN(num)) return "0";
    // Returns clean formatting up to 2 decimal places naturally (e.g., 0.5, 1.25, 3)
    return Number(num.toFixed(2)).toString();
  };

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginTop: '15px' }}>
      <h4 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px', borderBottom: '2px solid #f0f0f0', paddingBottom: '8px' }}>
        🗒️ Current Grocery List
      </h4>
      
      <ul id="groceryList" style={{ padding: 0, margin: 0, listStyleType: 'none' }}>
        {items.length === 0 ? (
          <li style={{ color: '#999', textAlign: 'center', padding: '20px 0', fontSize: '14px' }}>
            No items in cart yet. Start adding above!
          </li>
        ) : (
          items.map((item) => (
            <li 
              key={item.id || item._id} 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '12px 0', 
                borderBottom: '1px solid #f5f5f5' 
              }}
            >
              {/* Left Side: Item Name and package details if applicable */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                <span style={{ color: '#00796b', fontWeight: 'bold' }}>●</span>
                <strong style={{ color: '#2c3e50', textTransform: 'capitalize' }}>
                  {item.item_name || item.itemName || "Unnamed Item"}
                </strong> 
                {item.package_size || item.packageSize ? (
                  <span style={{ color: '#95a5a6', fontSize: '12px', marginLeft: '5px' }}>
                    ({item.package_size || item.packageSize} {item.package_unit || item.packageUnit || 'g'}/pack)
                  </span>
                ) : ''}
              </div>

              {/* Right Side: Stepper controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Decrease Button (-) */}
                <button 
                  onClick={() => onDecreaseItem && onDecreaseItem(item.id || item._id)}
                  style={{ 
                    border: '1px solid #ced4da', 
                    background: '#fff', 
                    color: '#495057',
                    borderRadius: '6px', 
                    width: '30px', 
                    height: '30px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 'bold',
                    fontSize: '16px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.borderColor = '#adb5bd'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#ced4da'; }}
                >
                  -
                </button>
                
                {/* Quantity & Unit Display Badge */}
                <span style={{ 
                  color: '#2c3e50', 
                  background: '#f1f3f5', 
                  padding: '5px 12px', 
                  borderRadius: '20px', 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  minWidth: '65px', 
                  textAlign: 'center' 
                }}>
                  {formatQuantity(item.quantity)} {item.unit || 'kg'}
                </span>

                {/* Increase Button (+) */}
                <button 
                  onClick={() => onIncreaseItem && onIncreaseItem(item.id || item._id)}
                  style={{ 
                    border: '1px solid #ced4da', 
                    background: '#fff', 
                    color: '#495057',
                    borderRadius: '6px', 
                    width: '30px', 
                    height: '30px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 'bold',
                    fontSize: '16px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.borderColor = '#adb5bd'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#ced4da'; }}
                >
                  +
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}