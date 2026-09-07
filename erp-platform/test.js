const data = {
  code: "TEST-02",
  name: "Prueba 2",
  category: "Audio",
  type: "Hardware",
  unit: "Unidad",
  stock: 10,
  minStock: 2,
  costUSD: 10,
  priceUSD: 20,
  status: "ACTIVO"
};

fetch('http://localhost:3001/api/inventory/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
