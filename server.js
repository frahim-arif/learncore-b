
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const server = express();

server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(cors());
server.use("/uploads", express.static("uploads"));

// Test Route
server.get('/', (req, res) => {
    res.send('Server is working fine.');
});

// Admin URLs
require('./app/routes/admin/default.routes.js')(server);
require('./app/routes/admin/auth.routes.js')(server);
require('./app/routes/admin/student.routes.js')(server);
require('./app/routes/admin/course.routes.js')(server);
require('./app/routes/admin/skill.routes.js')(server);
require('./app/routes/admin/lesson.routes.js')(server);
require('./app/routes/admin/enrollment.routes.js')(server);

// Website URLs
require('./app/routes/website/order.routes.js')(server);
require('./app/routes/website/payment.routes.js')(server);
require('./app/routes/website/auth.routes.js')(server);
require('./app/routes/website/studentAuth.routes.js')(server);
require('./app/routes/website/course.routes.js')(server);
require('./app/routes/website/progress.routes.js')(server);
require('./app/routes/website/coursePayment.routes.js')(server);
require('./app/routes/website/enrollment.routes.js')(server);
require('./app/routes/website/publicCourse.routes.js')(server);

// 404 Route
server.use((req, res) => {
    res.status(404).send('Page not found.');
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("✅ MongoDB Atlas Connected");

    server.listen(process.env.PORT || 5000, () => {
        console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
})
.catch((err) => {
    console.log("❌ Database Connection Error:", err.message);
});
