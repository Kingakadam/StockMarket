const mongoose = require('mongoose');

// MongoDB connection configuration
const connectDB = async () => {
    try {
        const conn = await mongoose.connect('mongodb://localhost:27017/Stockmarket', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database Name: ${conn.connection.name}`);
        
        // Log connection events
        mongoose.connection.on('connected', () => {
            console.log('Mongoose connected to MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            console.error('Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose disconnected from MongoDB');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });

        return conn;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Get database statistics
const getDatabaseStats = async () => {
    try {
        const stats = await mongoose.connection.db.stats();
        return {
            database: mongoose.connection.name,
            collections: stats.collections,
            dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
            storageSize: `${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`,
            indexes: stats.indexes,
            objects: stats.objects
        };
    } catch (error) {
        console.error('Error getting database stats:', error);
        return null;
    }
};

// Check if database is connected
const isConnected = () => {
    return mongoose.connection.readyState === 1;
};

module.exports = {
    connectDB,
    getDatabaseStats,
    isConnected
};
