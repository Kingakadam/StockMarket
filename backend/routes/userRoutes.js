const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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

// Helper function to generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user._id, 
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { 
            firstName, 
            lastName, 
            email, 
            password, 
            phoneNumber, 
            dateOfBirth,
            address 
        } = req.body;

        // Validation
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ 
                error: 'First name, last name, email, and password are required' 
            });
        }

        // Email validation
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Please enter a valid email address' });
        }

        // Password validation
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ 
                error: 'User already exists with this email address' 
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Get client IP address
        const clientIP = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

        // Create new user with enhanced data
        const userData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            registrationIP: clientIP
        };

        // Add optional fields if provided
        if (phoneNumber) userData.phoneNumber = phoneNumber.trim();
        if (dateOfBirth) userData.dateOfBirth = new Date(dateOfBirth);
        if (address) userData.address = address;

        const user = new User(userData);
        await user.save();

        console.log('New user registered:', {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            createdAt: user.createdAt
        });

        // Generate JWT token
        const token = generateToken(user);

        // Return success response with user profile
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle MongoDB validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: validationErrors 
            });
        }

        // Handle duplicate key error (email already exists)
        if (error.code === 11000) {
            return res.status(400).json({ 
                error: 'Email address is already registered' 
            });
        }

        res.status(500).json({ 
            error: 'Internal server error. Please try again later.' 
        });
    }
});

// @route   POST /api/users/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({ error: 'Account is deactivated. Please contact support.' });
        }

        // Check if account is locked
        if (user.isLocked) {
            return res.status(401).json({ error: 'Account is temporarily locked due to too many failed login attempts. Please try again later.' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            // Increment login attempts
            await user.incLoginAttempts();
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Reset login attempts on successful login
        if (user.loginAttempts > 0) {
            await user.resetLoginAttempts();
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        console.log('User logged in:', {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            lastLogin: user.lastLogin
        });

        // Generate JWT token
        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: user.getPublicProfile()
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error. Please try again later.' });
    }
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user: user.getPublicProfile()
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber, dateOfBirth, address, preferences } = req.body;
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update fields if provided
        if (firstName) user.firstName = firstName.trim();
        if (lastName) user.lastName = lastName.trim();
        if (phoneNumber) user.phoneNumber = phoneNumber.trim();
        if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
        if (address) user.address = { ...user.address, ...address };
        if (preferences) user.preferences = { ...user.preferences, ...preferences };

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: user.getPublicProfile()
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// @route   GET /api/users/all
// @desc    Get all users (admin only - for testing)
// @access  Private
router.get('/all', authenticateToken, async (req, res) => {
    try {
        const users = await User.find({}, '-password').sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: users.length,
            users: users.map(user => user.getPublicProfile())
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await User.getStats();
        
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// @route   DELETE /api/users/account
// @desc    Delete user account (soft delete)
// @access  Private
router.delete('/account', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Soft delete - deactivate account
        user.isActive = false;
        await user.save();

        res.json({
            success: true,
            message: 'Account deactivated successfully'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
