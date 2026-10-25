import { useState } from 'react';

// Real-world mathematical parser for text fractions, mixed numbers, and decimals
const parseFlexibleQuantity = (inputString) => {
  // 1. Clean up spacing and remove any characters that aren't numbers, dots, slashes, or spaces
  let sanitized = inputString.trim().replace(/[^0-9/. ]/g, '');
  
  if (!sanitized) return NaN;

  // 2. Handle mixed numbers like "1 1/2" -> convert to "1+1/2"
  // It handles multiple spaces by squeezing them down to a single space
  sanitized = sanitized.replace(/\s+/g, ' '); 
  if (sanitized.includes(' ') && sanitized.includes('/')) {
    sanitized = sanitized.replace(' ', '+');
  }

  // 3. Safely evaluate simple fraction or addition tokens without using unsafe eval()
  try {
    // Break expression by additions (e.g. "1+1/2" -> ["1", "1/2"])
    const additionParts = sanitized.split('+');
    let total = 0;

    for (let part of additionParts) {
      if (part.includes('/')) {
        const fractionParts = part.split('/');
        if (fractionParts.length === 2) {
          const numerator = parseFloat(fractionParts[0]);
          const denominator = parseFloat(fractionParts[1]);
          if (denominator === 0 || isNaN(numerator) || isNaN(denominator)) return NaN;
          total += numerator / denominator;
        } else {
          return NaN;
        }
      } else {
        const val = parseFloat(part);
        if (isNaN(val)) return NaN;
        total += val;
      }
    }
    return total;
  } catch {
    return NaN;
  }
};

export default function GroceryForm({ onAddItem }) {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [packageSize, setPackageSize] = useState('');
  const [packageUnit, setPackageUnit] = useState('g');

  const showPackageSize = ['packets', 'pieces', 'bottles', 'boxes', 'cans'].includes(unit);

  const handleQuantityChange = (e) => {
    // Retain spaces, slashes, periods, and numbers so users can type freely
    const val = e.target.value.replace(/[^0-9/. ]/g, '');
    setQuantity(val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!itemName || !quantity) return alert('Please enter item details');

    // Run our real-world robust parsing engine
    const evaluatedQuantity = parseFlexibleQuantity(quantity);

    if (isNaN(evaluatedQuantity) || evaluatedQuantity <= 0) {
      return alert('Please enter a valid amount (e.g., 2, 1.5, 1/2, or 1 1/2)');
    }

    onAddItem({ 
      item_name: itemName.trim(),
      itemName: itemName.trim(), 
      quantity: evaluatedQuantity, // Passes an accurate JS float (e.g. 1.5)
      unit, 
      package_size: showPackageSize ? parseFloat(packageSize) : null,
      packageSize: showPackageSize ? parseFloat(packageSize) : null, 
      package_unit: packageUnit,
      packageUnit 
    });

    setItemName('');
    setQuantity('');
    setPackageSize('');
  };

  return (
    <div className="add-section" style={{ padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '15px' }}>
      {/* display: 'grid' + gridTemplateColumns: '1fr' forces every child element to a new line */}
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
        
        <input 
          style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
          type="text" 
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="Item name (e.g., Rice, Dal)" 
        />

        <input 
          style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
          type="text" 
          value={quantity}
          onChange={handleQuantityChange}
          placeholder="Quantity (e.g., 1 1/2)"
        />

        <select style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} value={unit} onChange={(e) => setUnit(e.target.value)}>
          <option value="kg">kg</option>
          <option value="g">g</option>
          <option value="L">L</option>
          <option value="packets">Packets</option>
          <option value="pieces">Pieces</option>
          <option value="bottles">Bottles</option>
        </select>

        {showPackageSize && (
          <>
            <input 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
              type="number" 
              value={packageSize} 
              onChange={(e) => setPackageSize(e.target.value)} 
              placeholder="Package Size"
            />
            <select style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} value={packageUnit} onChange={(e) => setPackageUnit(e.target.value)}>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
            </select>
          </>
        )}

        <button 
          type="submit" 
          style={{ padding: '12px', background: '#00796b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Add Grocery
        </button>
      </form>
    </div>
  );
}