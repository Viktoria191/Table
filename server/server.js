const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'build')));

app.get('/api/items', (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;
  
  let filteredItems = [...state.items];
  
  if (search) {
    const searchTerm = search.toLowerCase();
    filteredItems = filteredItems.filter(item => 
      item.value.toLowerCase().includes(searchTerm) || 
      item.id.toString().includes(searchTerm)
    );
  }
  
  if (state.customOrder) {
    const orderMap = new Map(state.customOrder.map((item, index) => [item.id, index]));
    filteredItems.sort((a, b) => {
      const aOrder = orderMap.has(a.id) ? orderMap.get(a.id) : Infinity;
      const bOrder = orderMap.has(b.id) ? orderMap.get(b.id) : Infinity;
      return aOrder - bOrder;
    });
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);
  
  res.json({
    items: paginatedItems,
    total: filteredItems.length,
    selectedItems: Array.from(state.selectedItems),
    hasMore: endIndex < filteredItems.length
  });
});

app.post('/api/select', (req, res) => {
  const { id, selected } = req.body;
  
  if (selected) {
    state.selectedItems.add(id);
  } else {
    state.selectedItems.delete(id);
  }
  
  res.json({ success: true });
});

app.post('/api/reorder', (req, res) => {
  const { items } = req.body;
  
  if (items && items.length > 0) {
    state.customOrder = items;
  } else {
    state.customOrder = null;
  }
  
  res.json({ success: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});