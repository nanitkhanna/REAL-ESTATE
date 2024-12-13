const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const database = require('./database');
const recommendationModel = require('./ml-model/recommendation-model');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Login Route
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await database.authenticateUser(email, password);
        
        if (user) {
            const token = jwt.sign(
                { id: user.id, email: user.email }, 
                JWT_SECRET, 
                { expiresIn: '24h' }
            );

            res.json({ 
                token, 
                user: { 
                    id: user.id, 
                    name: user.name, 
                    email: user.email 
                } 
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Property Listing Route
app.get('/api/properties', authenticateToken, async (req, res) => {
    const { location, priceRange } = req.query;

    try {
        const properties = await database.getProperties(location, priceRange);
        res.json(properties);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching properties' });
    }
});

// Recommendations Route
app.get('/api/recommendations', authenticateToken, async (req, res) => {
    try {
        const user = await database.getUserProfile(req.user.id);
        const recommendations = await recommendationModel.getRecommendations(user);

        res.json({
            user: {
                id: user.id,
                name: user.name
            },
            recommendations
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating recommendations' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});