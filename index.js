const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const redis = require('redis'); // Import the redis library

dotenvExpand.expand(dotenv.config());

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Initialize Redis client
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

// Connect Redis client
redisClient.connect().catch((err) => console.error('Redis connection error:', err));

const sequelize = new Sequelize(
    process.env.DB_DATABASE || 'product_db',
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });

const Product = sequelize.define('Product', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
    },
}, {
    tableName: 'products',
    timestamps: false,
});

sequelize.sync();

const updateRedisWithProductCount = async () => {
    try {
        const totalProducts = await Product.count(); // Count all rows in the 'products' table
        await redisClient.set('total_products', totalProducts); // Set the count in Redis
        console.log(`Redis initialized with total products: ${totalProducts}`);
    } catch (error) {
        console.error('Error updating Redis with product count:', error.message);
    }
};

(async () => {
    await updateRedisWithProductCount(); // Ensure Redis is synced when starting
})();

// Add Product API
app.post('/products', async (req, res) => {
    try {
        const product = await Product.create(req.body);

        // Increment product count in Redis
        await redisClient.incr('total_products');

        res.status(201).json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all Products API
app.get('/products', async (req, res) => {
    try {
        const products = req.query.name
            ? await Product.findAll({ where: { name: { [Sequelize.Op.iLike]: `%${req.query.name}%` } } })
            : await Product.findAll();

        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Total Product Count API
app.get('/products/count', async (req, res) => {
    try {
        let totalProducts = await redisClient.get('total_products'); // Try to fetch from Redis

        if (totalProducts === null) {
            totalProducts = await Product.count();
            await redisClient.set('total_products', totalProducts);
        }

        res.json({ totalProducts: parseInt(totalProducts) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Product API
app.delete('/products/:id', async (req, res) => {
    try {
        const deleted = await Product.destroy({ where: { id: req.params.id } });

        if (!deleted) return res.status(404).json({ error: 'Product not found' });

        // Decrement product count in Redis
        await redisClient.decr('total_products');

        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Product API
app.put('/products/:id', async (req, res) => {
    try {
        const [updated] = await Product.update(req.body, { where: { id: req.params.id } });
        if (!updated) return res.status(404).json({ error: 'Product not found' });
        const updatedProduct = await Product.findByPk(req.params.id);
        res.json(updatedProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running on port ${PORT}`);
});