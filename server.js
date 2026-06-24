// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const server = express();

// Middlewares
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use(cors());
server.use("/uploads", express.static("uploads"));


// Test Route
server.get('/', (req, res) => {
    res.send('Server is working fine.');
});

// Admin URLs
require('./app/routes/admin/default.routes.js')(server);


// Website URLs
require('./app/routes/website/order.routes.js')(server);
require('./app/routes/website/payment.routes.js')(server);
require('./app/routes/website/auth.routes.js')(server);

// 404 Route
server.get('*', (req, res) => {
    res.send('Page not found.');
});

// MongoDB Atlas Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("✅ MongoDB Atlas Connected");

  server.listen(process.env.PORT || 5000, () => {
    console.log(`🚀 Server is running on http://localhost:${process.env.PORT || 5000}`);
  });
})
.catch((err) => {
  console.log("❌ Database Connection Error:", err.message);
});