const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
const alphaVantageService = require('./services/alphaVantageService');
const multiApiService = require('./services/multiApiService');
const newsApiService = require('./services/newsApiService');
const { connectDB, getDatabaseStats } = require('./config/database');
const userRoutes = require('./routes/userRoutes');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.set('trust proxy', true); // Trust proxy for proper IP detection

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/users', userRoutes);

// User model is now imported from models/User.js

// Stock Schema with real-time data fields
const stockSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    change: {
        type: Number,
        required: true
    },
    changePercent: {
        type: String,
        required: true
    },
    isPositive: {
        type: Boolean,
        required: true
    },
    volume: {
        type: Number,
        default: 0
    },
    previousClose: {
        type: Number,
        default: 0
    },
    open: {
        type: Number,
        default: 0
    },
    high: {
        type: Number,
        default: 0
    },
    low: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

const Stock = mongoose.model('Stock', stockSchema);

// Portfolio Schema
const portfolioSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    symbol: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    averagePrice: {
        type: Number,
        required: true
    },
    totalInvested: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

// JWT Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Stock Market API is running!',
        version: '1.0.0',
        endpoints: {
            users: '/api/users',
            stocks: '/api/stocks',
            portfolio: '/api/portfolio'
        }
    });
});

// Database stats endpoint
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await getDatabaseStats();
        res.json({
            success: true,
            database: stats
        });
    } catch (error) {
        console.error('Database stats error:', error);
        res.status(500).json({ error: 'Failed to get database statistics' });
    }
});

// User authentication endpoints are now handled by userRoutes

// Get stocks endpoint with real-time data
app.get('/api/stocks', async (req, res) => {
    try {
        const { refresh } = req.query;

        // Get stocks from database first
        let stocks = await Stock.find();

        // If no stocks in database or refresh requested, fetch from Alpha Vantage
        if (stocks.length === 0 || refresh === 'true') {
            console.log('Fetching real-time stock data from Alpha Vantage...');

            const popularSymbols = alphaVantageService.getPopularStocks();
            // Use multi-API service for better reliability
            const realTimeStocks = await multiApiService.getMultipleQuotes(popularSymbols);

            // Update or create stocks in database
            for (const stockData of realTimeStocks) {
                await Stock.findOneAndUpdate(
                    { symbol: stockData.symbol },
                    {
                        ...stockData,
                        lastUpdated: new Date()
                    },
                    { upsert: true, new: true }
                );
            }

            // Fetch updated stocks from database
            stocks = await Stock.find();
        }

        res.json(stocks);
    } catch (error) {
        console.error('Error fetching stocks:', error);
        res.status(500).json({ error: 'Failed to fetch stock data. Please try again later.' });
    }
});

// Search stocks endpoint
app.get('/api/stocks/search', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.status(400).json({ error: 'Search query must be at least 2 characters' });
        }

        const searchResults = await alphaVantageService.searchStocks(q);
        res.json(searchResults);
    } catch (error) {
        console.error('Error searching stocks:', error);
        res.status(500).json({ error: 'Failed to search stocks' });
    }
});

// Get specific stock data
app.get('/api/stocks/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;

        // Try to get from database first
        let stock = await Stock.findOne({ symbol: symbol.toUpperCase() });

        // If not in database or data is old (more than 5 minutes), fetch fresh data
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (!stock || stock.lastUpdated < fiveMinutesAgo) {
            console.log(`Fetching fresh data for ${symbol}...`);

            const stockData = await alphaVantageService.getStockQuote(symbol.toUpperCase());

            stock = await Stock.findOneAndUpdate(
                { symbol: stockData.symbol },
                {
                    ...stockData,
                    lastUpdated: new Date()
                },
                { upsert: true, new: true }
            );
        }

        res.json(stock);
    } catch (error) {
        console.error(`Error fetching stock ${req.params.symbol}:`, error);
        res.status(404).json({ error: error.message || 'Stock not found' });
    }
});

// Get intraday chart data
app.get('/api/stocks/:symbol/chart', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { interval = '5min' } = req.query;

        console.log(`Fetching chart data for ${symbol} with interval ${interval}`);

        try {
            const chartData = await alphaVantageService.getIntradayData(symbol.toUpperCase(), interval);

            if (chartData && chartData.length > 0) {
                console.log(`Successfully fetched ${chartData.length} data points for ${symbol}`);
                res.json(chartData);
            } else {
                console.log(`No data from Alpha Vantage for ${symbol}, generating mock data`);
                const mockData = generateMockChartData(symbol);
                res.json(mockData);
            }
        } catch (apiError) {
            console.log(`Alpha Vantage API error for ${symbol}:`, apiError.message);
            console.log(`Generating mock data for ${symbol}`);

            // Generate mock data as fallback
            const mockData = generateMockChartData(symbol);
            res.json(mockData);
        }

    } catch (error) {
        console.error(`Error in chart endpoint for ${symbol}:`, error);
        res.status(500).json({ error: error.message || 'Failed to fetch chart data' });
    }
});

// Helper function to generate mock chart data
function generateMockChartData(symbol) {
    const now = new Date();
    const mockData = [];

    // Base price varies by symbol
    const basePrices = {
        'AAPL': 175,
        'GOOGL': 2800,
        'MSFT': 340,
        'TSLA': 250,
        'AMZN': 3100
    };

    const basePrice = basePrices[symbol] || 150;

    // Generate 50 data points over the last 4 hours
    for (let i = 49; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000); // 5 minutes apart

        // Create realistic price movement
        const volatility = basePrice * 0.02; // 2% volatility
        const trend = Math.sin(i * 0.1) * volatility * 0.5; // Slight trend
        const randomWalk = (Math.random() - 0.5) * volatility;
        const price = basePrice + trend + randomWalk;

        mockData.push({
            timestamp: timestamp.toISOString(),
            open: price * 0.999,
            high: price * 1.002,
            low: price * 0.998,
            close: price,
            volume: Math.floor(Math.random() * 1000000) + 500000
        });
    }

    console.log(`Generated ${mockData.length} mock data points for ${symbol}`);
    return mockData;
}

// News endpoints
app.get('/api/news/market', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const news = await newsApiService.getMarketNews(parseInt(limit));

        res.json({
            success: true,
            count: news.length,
            news
        });
    } catch (error) {
        console.error('Market news error:', error);
        res.status(500).json({ error: 'Failed to fetch market news' });
    }
});

app.get('/api/news/company/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { limit = 5 } = req.query;

        const news = await newsApiService.getCompanyNews(symbol.toUpperCase(), parseInt(limit));

        res.json({
            success: true,
            symbol: symbol.toUpperCase(),
            count: news.length,
            news
        });
    } catch (error) {
        console.error(`Company news error for ${req.params.symbol}:`, error);
        res.status(500).json({ error: 'Failed to fetch company news' });
    }
});

// API status endpoint
app.get('/api/status', async (req, res) => {
    try {
        const apiStatus = multiApiService.getApiStatus();

        res.json({
            success: true,
            apis: apiStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('API status error:', error);
        res.status(500).json({ error: 'Failed to get API status' });
    }
});

// Portfolio endpoints
app.get('/api/portfolio/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Verify user can only access their own portfolio
        if (req.user.id !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const portfolio = await Portfolio.find({ userId });

        // Calculate portfolio summary
        let totalValue = 0;
        let totalInvested = 0;

        const portfolioWithCurrentPrices = await Promise.all(
            portfolio.map(async (holding) => {
                const stock = await Stock.findOne({ symbol: holding.symbol });
                const currentValue = stock ? stock.price * holding.quantity : 0;
                totalValue += currentValue;
                totalInvested += holding.totalInvested;

                return {
                    ...holding.toObject(),
                    currentPrice: stock ? stock.price : 0,
                    currentValue,
                    gainLoss: currentValue - holding.totalInvested,
                    gainLossPercent: holding.totalInvested > 0 ?
                        ((currentValue - holding.totalInvested) / holding.totalInvested * 100).toFixed(2) : 0
                };
            })
        );

        res.json({
            holdings: portfolioWithCurrentPrices,
            summary: {
                totalValue: totalValue.toFixed(2),
                totalInvested: totalInvested.toFixed(2),
                totalGainLoss: (totalValue - totalInvested).toFixed(2),
                totalGainLossPercent: totalInvested > 0 ?
                    ((totalValue - totalInvested) / totalInvested * 100).toFixed(2) : 0
            }
        });
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Buy stock endpoint
app.post('/api/portfolio/buy', authenticateToken, async (req, res) => {
    try {
        const { symbol, quantity, price } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!symbol || !quantity || !price || quantity <= 0 || price <= 0) {
            return res.status(400).json({ error: 'Invalid input data' });
        }

        // Check if stock exists
        const stock = await Stock.findOne({ symbol });
        if (!stock) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        // Check if user already has this stock
        let portfolio = await Portfolio.findOne({ userId, symbol });

        if (portfolio) {
            // Update existing holding
            const newQuantity = portfolio.quantity + quantity;
            const newTotalInvested = portfolio.totalInvested + (quantity * price);
            const newAveragePrice = newTotalInvested / newQuantity;

            portfolio.quantity = newQuantity;
            portfolio.totalInvested = newTotalInvested;
            portfolio.averagePrice = newAveragePrice;
            portfolio.updatedAt = new Date();
        } else {
            // Create new holding
            portfolio = new Portfolio({
                userId,
                symbol,
                quantity,
                averagePrice: price,
                totalInvested: quantity * price
            });
        }

        await portfolio.save();

        res.json({
            message: 'Stock purchased successfully',
            portfolio: portfolio.toObject()
        });
    } catch (error) {
        console.error('Error buying stock:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Sell stock endpoint
app.post('/api/portfolio/sell', authenticateToken, async (req, res) => {
    try {
        const { symbol, quantity, price } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!symbol || !quantity || !price || quantity <= 0 || price <= 0) {
            return res.status(400).json({ error: 'Invalid input data' });
        }

        // Find user's holding
        const portfolio = await Portfolio.findOne({ userId, symbol });
        if (!portfolio) {
            return res.status(404).json({ error: 'Stock not found in portfolio' });
        }

        if (portfolio.quantity < quantity) {
            return res.status(400).json({ error: 'Insufficient shares to sell' });
        }

        if (portfolio.quantity === quantity) {
            // Sell all shares - remove from portfolio
            await Portfolio.deleteOne({ userId, symbol });
        } else {
            // Partial sell - update portfolio
            const remainingQuantity = portfolio.quantity - quantity;
            const soldValue = quantity * portfolio.averagePrice;
            const newTotalInvested = portfolio.totalInvested - soldValue;

            portfolio.quantity = remainingQuantity;
            portfolio.totalInvested = newTotalInvested;
            portfolio.updatedAt = new Date();
            await portfolio.save();
        }

        res.json({
            message: 'Stock sold successfully',
            soldQuantity: quantity,
            soldPrice: price,
            totalValue: quantity * price
        });
    } catch (error) {
        console.error('Error selling stock:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Function to update stock prices with real Alpha Vantage data
const updateStockPrices = async () => {
    try {
        const stocks = await Stock.find();

        if (stocks.length === 0) {
            console.log('No stocks in database to update');
            return;
        }

        // Update one stock at a time to respect rate limits
        const randomStock = stocks[Math.floor(Math.random() * stocks.length)];

        try {
            console.log(`Updating real-time data for ${randomStock.symbol}...`);
            const updatedData = await alphaVantageService.getStockQuote(randomStock.symbol);

            await Stock.findOneAndUpdate(
                { symbol: randomStock.symbol },
                {
                    ...updatedData,
                    lastUpdated: new Date()
                }
            );

            // Get all updated stocks and emit to clients
            const allStocks = await Stock.find();
            io.emit('stockUpdate', allStocks);

        } catch (error) {
            console.error(`Failed to update ${randomStock.symbol}:`, error.message);
        }

    } catch (error) {
        console.error('Error in updateStockPrices:', error);
    }
};

// Update stock prices every 30 seconds (to respect Alpha Vantage rate limits)
setInterval(updateStockPrices, 30000);

// Initial stock data load
const initializeStocks = async () => {
    try {
        const stockCount = await Stock.countDocuments();
        if (stockCount === 0) {
            console.log('Initializing stock data...');
            const popularSymbols = alphaVantageService.getPopularStocks().slice(0, 5); // Start with 5 stocks
            const initialStocks = await alphaVantageService.getMultipleQuotes(popularSymbols);

            for (const stockData of initialStocks) {
                await Stock.create(stockData);
            }

            console.log(`Initialized ${initialStocks.length} stocks`);
        }
    } catch (error) {
        console.error('Error initializing stocks:', error);
    }
};

// Initialize stocks on server start
initializeStocks();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log('Real-time stock updates enabled');
});