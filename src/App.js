import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

function App() {
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [dragItem, setDragItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const ghostRef = useRef(null);

  const fetchItems = useCallback(async (reset = false) => {
    if (loading) return;
    
    setLoading(true);
    const currentPage = reset ? 1 : page;
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/items?page=${currentPage}&limit=20&search=${searchTerm}`
      );
      const data = await response.json();
      
      setItems(prev => reset ? data.items : [...prev, ...data.items]);
      setSelectedItems(new Set(data.selectedItems));
      setTotalItems(data.total);
      setHasMore(data.hasMore);
      setPage(currentPage + 1);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, searchTerm]);

  useEffect(() => {
    fetchItems(true);
  }, [searchTerm, fetchItems]);

  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop !==
      document.documentElement.offsetHeight ||
      loading ||
      !hasMore
    ) {
      return;
    }
    fetchItems();
  }, [loading, hasMore, fetchItems]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleSelect = async (id) => {
    const newSelected = new Set(selectedItems);
    const isSelected = newSelected.has(id);
    
    if (isSelected) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    
    setSelectedItems(newSelected);
    
    try {
      await fetch('http://localhost:5000/api/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          selected: !isSelected
        }),
      });
    } catch (error) {
      console.error('Error updating selection:', error);
    }
  };

  const handleDragStart = (e, index) => {
    const item = items[index];
    setDragItem(item);
    
    const ghost = e.target.cloneNode(true);
    ghost.classList.add('item-ghost');
    document.body.appendChild(ghost);
    ghostRef.current = ghost;
    
    const rect = e.target.getBoundingClientRect();
    ghost.style.width = `${rect.width}px`;
    ghost.style.left = `${e.clientX - rect.width/2}px`;
    ghost.style.top = `${e.clientY - rect.height/2}px`;
    
    e.dataTransfer.setDragImage(ghost, 0, 0);
    e.target.classList.add('dragging-source');
  };

  const handleDrag = (e) => {
    if (ghostRef.current) {
      ghostRef.current.style.left = `${e.clientX - ghostRef.current.offsetWidth/2}px`;
      ghostRef.current.style.top = `${e.clientY - ghostRef.current.offsetHeight/2}px`;
    }
  };

  const handleDragEnd = (e) => {
    if (ghostRef.current) {
      document.body.removeChild(ghostRef.current);
      ghostRef.current = null;
    }
    document.querySelectorAll('.dragging-source').forEach(el => {
      el.classList.remove('dragging-source');
    });
    setDragItem(null);
    setDragOverItem(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    const draggedOverItem = items[index];
    if (draggedOverItem === dragItem) return;
    setDragOverItem(draggedOverItem);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (!dragItem || !dragOverItem || dragItem.id === dragOverItem.id) return;
    
    const newItems = [...items];
    const dragIndex = newItems.findIndex(item => item.id === dragItem.id);
    const dragOverIndex = newItems.findIndex(item => item.id === dragOverItem.id);
    
    newItems.splice(dragIndex, 1);
    newItems.splice(dragOverIndex, 0, dragItem);
    
    setItems(newItems);
    
    try {
      await fetch('http://localhost:5000/api/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: newItems.slice(0, 20)
        }),
      });
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  return (
    <div className="App">
      <h1>Items List (1 - 1,000,000)</h1>
      <div className="controls">
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="info">
          Showing {items.length} of {totalItems} items
        </div>
      </div>
      <ul className="items-list">
        {items.map((item, index) => (
          <li
            key={item.id}
            className={`item ${selectedItems.has(item.id) ? 'selected' : ''} ${
              dragOverItem?.id === item.id ? 'drag-over' : ''
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={handleDrop}
          >
            <input
              type="checkbox"
              checked={selectedItems.has(item.id)}
              onChange={() => handleSelect(item.id)}
            />
            <div className="item-content">
              <span className="item-value">{item.value}</span>
              <span className="item-additional">{item.additional}</span>
              <span className="item-random">Random: {item.random}</span>
            </div>
          </li>
        ))}
      </ul>
      {loading && <div className="loading">Loading more items...</div>}
      {!loading && !hasMore && <div className="loading">No more items to load</div>}
    </div>
  );
}

export default App;