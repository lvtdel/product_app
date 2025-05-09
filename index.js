const express = require('express');
const {Sequelize, DataTypes} = require('sequelize');
const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')

dotenvExpand.expand(dotenv.config())

const app = express();
app.use(express.json());
app.use(express.static('public'));

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

app.post('/products', async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json(product);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

app.get('/products', async (req, res) => {
    try {
        const products = req.query.name
            ? await Product.findAll({where: {name: {[Sequelize.Op.iLike]: `%${req.query.name}%`}}})
            : await Product.findAll();
        res.json(products);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

app.delete('/products/:id', async (req, res) => {
    try {
        const deleted = await Product.destroy({where: {id: req.params.id}});
        if (!deleted) return res.status(404).json({error: 'Product not found'});
        res.json({message: 'Product deleted successfully'});
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

app.put('/products/:id', async (req, res) => {
    try {
        const [updated] = await Product.update(req.body, {where: {id: req.params.id}});
        if (!updated) return res.status(404).json({error: 'Product not found'});
        const updatedProduct = await Product.findByPk(req.params.id);
        res.json(updatedProduct);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

const PORT = 3000;
app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running on port ${PORT}`);
});
