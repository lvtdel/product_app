const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Kết nối PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// API thêm sản phẩm
app.post('/products', async (req, res) => {
    const { name, price, description } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO products (name, price, description) VALUES ($1, $2, $3) RETURNING *',
            [name, price, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API tìm kiếm sản phẩm theo tên
app.get('/products', async (req, res) => {
    const { name } = req.query;
    try {
        if (name) {
            const result = await pool.query(
                'SELECT * FROM products WHERE name ILIKE $1',
                [`%${name}%`]
            );
            res.json(result.rows);
        } else {
            const result = await pool.query('SELECT * FROM products');
            res.json(result.rows);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API xoá sản phẩm
app.delete('/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Product not found' });
        } else {
            res.status(200).json({ message: 'Product deleted successfully' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API sửa sản phẩm
app.put('/products/:id', async (req, res) => {
    const { id } = req.params;
    const { name, price, description } = req.body;
    try {
        const result = await pool.query(
            'UPDATE products SET name = $1, price = $2, description = $3 WHERE id = $4 RETURNING *',
            [name, price, description, id]
        );
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Product not found' });
        } else {
            res.status(200).json(result.rows[0]);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});