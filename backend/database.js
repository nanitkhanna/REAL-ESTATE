const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Database connection configuration
const pool = new Pool({
    user: process.env.DB_USER || 'user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'real_estate_db',
    password: process.env.DB_PASSWORD || 'nanit123',
    port: process.env.DB_PORT || 5432,
});

class Database {
    // Authenticate user
    async authenticateUser(email, password) {
        const client = await pool.connect();
        try {
            const userQuery = 'SELECT * FROM users WHERE email = $1';
            const result = await client.query(userQuery, [email]);

            if (result.rows.length > 0) {
                const user = result.rows[0];
                const isValidPassword = await bcrypt.compare(password, user.password_hash);
                
                return isValidPassword ? user : null;
            }
            return null;
        } finally {
            client.release();
        }
    }

    // Get user profile
    async getUserProfile(userId) {
        const client = await pool.connect();
        try {
            const query = `
                SELECT id, name, email, preferences 
                FROM users 
                WHERE id = $1
            `;
            const result = await client.query(query, [userId]);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    // Get properties with optional filtering
    async getProperties(location = '', priceRange = '') {
        const client = await pool.connect();
        try {
            let query = 'SELECT * FROM properties WHERE 1=1';
            const params = [];
            let paramIndex = 1;

            if (location) {
                query += ` AND location = $${paramIndex}`;
                params.push(location);
                paramIndex++;
            }

            if (priceRange) {
                const [min, max] = this.parsePriceRange(priceRange);
                query += ` AND price BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
                params.push(min, max);
            }

            const result = await client.query(query, params);
            return result.rows;
        } finally {
            client.release();
        }
    }

    // Helper method to parse price range
    parsePriceRange(priceRange) {
        switch(priceRange) {
            case '0-500k': return [0, 500000];
            case '500k-1m': return [500000, 1000000];
            case '1m-plus': return [1000000, 100000000];
            default: return [0, 100000000];
        }
    }
}

module.exports = new Database();