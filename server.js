/**
 * Drone Community Marketplace - Server
 * 
 * SECURITY NOTE: This is a development/demonstration version.
 * Before deploying to production, implement:
 * - Rate limiting (express-rate-limit)
 * - CSRF protection (csurf)
 * - HTTPS with secure cookies
 * - Additional input validation and sanitization
 * - Security headers (helmet)
 */

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'drone-marketplace-secret-key-change-in-production';

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// Simple file-based database
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

// Initialize data files
function initDataFiles() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]), 'utf8');
    }
    if (!fs.existsSync(SERVICES_FILE)) {
        fs.writeFileSync(SERVICES_FILE, JSON.stringify([]), 'utf8');
    }
    if (!fs.existsSync(REVIEWS_FILE)) {
        fs.writeFileSync(REVIEWS_FILE, JSON.stringify([]), 'utf8');
    }
}

// Helper functions to read/write data
function readData(file) {
    try {
        const data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function writeData(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const token = req.session.token;
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Routes

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// User registration
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const users = readData(USERS_FILE);
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
        id: Date.now().toString(),
        username,
        email,
        password: hashedPassword,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeData(USERS_FILE, users);

    res.json({ message: 'Registration successful', userId: newUser.id });
});

// User login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    const users = readData(USERS_FILE);
    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    req.session.token = token;
    req.session.userId = user.id;

    res.json({ 
        message: 'Login successful', 
        user: { id: user.id, username: user.username, email: user.email },
        token 
    });
});

// User logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logout successful' });
});

// Get current user
app.get('/api/user', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

// Get all services
app.get('/api/services', (req, res) => {
    const services = readData(SERVICES_FILE);
    const reviews = readData(REVIEWS_FILE);
    
    // Calculate average ratings for each service
    const servicesWithRatings = services.map(service => {
        const serviceReviews = reviews.filter(r => r.serviceId === service.id);
        const avgRating = serviceReviews.length > 0
            ? serviceReviews.reduce((sum, r) => sum + r.rating, 0) / serviceReviews.length
            : 0;
        return {
            ...service,
            averageRating: avgRating.toFixed(1),
            reviewCount: serviceReviews.length
        };
    });

    res.json(servicesWithRatings);
});

// Get single service
app.get('/api/services/:id', (req, res) => {
    const services = readData(SERVICES_FILE);
    const service = services.find(s => s.id === req.params.id);
    
    if (!service) {
        return res.status(404).json({ error: 'Service not found' });
    }

    const reviews = readData(REVIEWS_FILE);
    const serviceReviews = reviews.filter(r => r.serviceId === service.id);
    const avgRating = serviceReviews.length > 0
        ? serviceReviews.reduce((sum, r) => sum + r.rating, 0) / serviceReviews.length
        : 0;

    res.json({
        ...service,
        averageRating: avgRating.toFixed(1),
        reviewCount: serviceReviews.length,
        reviews: serviceReviews
    });
});

// Create service listing
app.post('/api/services', authenticateToken, (req, res) => {
    const { title, description, category, price } = req.body;

    if (!title || !description || !category) {
        return res.status(400).json({ error: 'Title, description, and category are required' });
    }

    const services = readData(SERVICES_FILE);
    
    const newService = {
        id: Date.now().toString(),
        userId: req.user.id,
        username: req.user.username,
        title,
        description,
        category,
        price: price || 'Contact for pricing',
        createdAt: new Date().toISOString()
    };

    services.push(newService);
    writeData(SERVICES_FILE, services);

    res.json({ message: 'Service created successfully', service: newService });
});

// Update service
app.put('/api/services/:id', authenticateToken, (req, res) => {
    const services = readData(SERVICES_FILE);
    const serviceIndex = services.findIndex(s => s.id === req.params.id);

    if (serviceIndex === -1) {
        return res.status(404).json({ error: 'Service not found' });
    }

    if (services[serviceIndex].userId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to update this service' });
    }

    const { title, description, category, price } = req.body;
    services[serviceIndex] = {
        ...services[serviceIndex],
        title: title || services[serviceIndex].title,
        description: description || services[serviceIndex].description,
        category: category || services[serviceIndex].category,
        price: price || services[serviceIndex].price,
        updatedAt: new Date().toISOString()
    };

    writeData(SERVICES_FILE, services);
    res.json({ message: 'Service updated successfully', service: services[serviceIndex] });
});

// Delete service
app.delete('/api/services/:id', authenticateToken, (req, res) => {
    const services = readData(SERVICES_FILE);
    const serviceIndex = services.findIndex(s => s.id === req.params.id);

    if (serviceIndex === -1) {
        return res.status(404).json({ error: 'Service not found' });
    }

    if (services[serviceIndex].userId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to delete this service' });
    }

    services.splice(serviceIndex, 1);
    writeData(SERVICES_FILE, services);

    res.json({ message: 'Service deleted successfully' });
});

// Get reviews for a service
app.get('/api/services/:id/reviews', (req, res) => {
    const reviews = readData(REVIEWS_FILE);
    const serviceReviews = reviews.filter(r => r.serviceId === req.params.id);
    res.json(serviceReviews);
});

// Add review (only for verified purchases - simplified: users who are logged in)
app.post('/api/services/:id/reviews', authenticateToken, (req, res) => {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const services = readData(SERVICES_FILE);
    const service = services.find(s => s.id === req.params.id);

    if (!service) {
        return res.status(404).json({ error: 'Service not found' });
    }

    const reviews = readData(REVIEWS_FILE);
    
    // Check if user already reviewed this service
    const existingReview = reviews.find(
        r => r.serviceId === req.params.id && r.userId === req.user.id
    );

    if (existingReview) {
        return res.status(400).json({ error: 'You have already reviewed this service' });
    }

    const newReview = {
        id: Date.now().toString(),
        serviceId: req.params.id,
        userId: req.user.id,
        username: req.user.username,
        rating: parseInt(rating),
        comment: comment || '',
        verified: true, // Simplified - in real app, would check purchase history
        createdAt: new Date().toISOString()
    };

    reviews.push(newReview);
    writeData(REVIEWS_FILE, reviews);

    res.json({ message: 'Review added successfully', review: newReview });
});

// Search services
app.get('/api/search', (req, res) => {
    const { q, category } = req.query;
    let services = readData(SERVICES_FILE);

    if (category) {
        services = services.filter(s => s.category.toLowerCase() === category.toLowerCase());
    }

    if (q) {
        const query = q.toLowerCase();
        services = services.filter(s => 
            s.title.toLowerCase().includes(query) || 
            s.description.toLowerCase().includes(query)
        );
    }

    const reviews = readData(REVIEWS_FILE);
    const servicesWithRatings = services.map(service => {
        const serviceReviews = reviews.filter(r => r.serviceId === service.id);
        const avgRating = serviceReviews.length > 0
            ? serviceReviews.reduce((sum, r) => sum + r.rating, 0) / serviceReviews.length
            : 0;
        return {
            ...service,
            averageRating: avgRating.toFixed(1),
            reviewCount: serviceReviews.length
        };
    });

    res.json(servicesWithRatings);
});

// Initialize data files on startup
initDataFiles();

// Start server
app.listen(PORT, () => {
    console.log(`Drone Marketplace server running on http://localhost:${PORT}`);
});
