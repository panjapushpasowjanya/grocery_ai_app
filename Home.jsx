import GroceryForm from '../components/GroceryForm';
import GroceryList from '../components/GroceryList';

export default function Home({ items, onAddItem, onIncreaseItem, onDecreaseItem, onDeleteItem }) {
  return (
    <div>
      <GroceryForm onAddItem={onAddItem} />
      
      {/* 🎯 LINKED PIPELINE: Dropping down data values and handlers */}
      <GroceryList 
        items={items} 
        onIncreaseItem={onIncreaseItem}
        onDecreaseItem={onDecreaseItem}
        onDeleteItem={onDeleteItem} 
      />
    </div>
  );
}