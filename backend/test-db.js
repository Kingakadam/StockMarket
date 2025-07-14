const mongoose = require('mongoose');
const User = require('./models/User');
const { connectDB } = require('./config/database');

// Test script to verify MongoDB connection and User model
async function testDatabase() {
    try {
        console.log('🔄 Testing MongoDB connection...');
        
        // Connect to database
        await connectDB();
        
        console.log('✅ MongoDB connection successful!');
        
        // Test User model
        console.log('🔄 Testing User model...');
        
        // Check if users collection exists
        const userCount = await User.countDocuments();
        console.log(`📊 Current users in database: ${userCount}`);
        
        // Get user statistics
        const stats = await User.getStats();
        console.log('📈 User Statistics:', stats);
        
        // Test creating a sample user (only if no users exist)
        if (userCount === 0) {
            console.log('🔄 Creating test user...');
            
            const testUser = new User({
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                password: 'hashedpassword123', // In real app, this would be hashed
                phoneNumber: '1234567890',
                registrationIP: '127.0.0.1'
            });
            
            await testUser.save();
            console.log('✅ Test user created successfully!');
            console.log('👤 User Profile:', testUser.getPublicProfile());
        }
        
        // List all users (basic info only)
        const users = await User.find({}, 'firstName lastName email createdAt').limit(5);
        console.log('👥 Recent users:');
        users.forEach(user => {
            console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - ${user.createdAt}`);
        });
        
        console.log('✅ Database test completed successfully!');
        
    } catch (error) {
        console.error('❌ Database test failed:', error);
    } finally {
        // Close connection
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
}

// Run the test
testDatabase();
