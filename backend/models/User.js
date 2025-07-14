const mongoose = require('mongoose');

// Enhanced User Schema for Registration
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minlength: [2, 'First name must be at least 2 characters'],
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        minlength: [2, 'Last name must be at least 2 characters'],
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    fullName: {
        type: String,
        trim: true
    },
    phoneNumber: {
        type: String,
        trim: true,
        default: null,
        match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    dateOfBirth: {
        type: Date,
        default: null,
        validate: {
            validator: function(value) {
                return !value || value < new Date();
            },
            message: 'Date of birth must be in the past'
        }
    },
    address: {
        street: { 
            type: String, 
            trim: true,
            maxlength: [100, 'Street address cannot exceed 100 characters']
        },
        city: { 
            type: String, 
            trim: true,
            maxlength: [50, 'City name cannot exceed 50 characters']
        },
        state: { 
            type: String, 
            trim: true,
            maxlength: [50, 'State name cannot exceed 50 characters']
        },
        zipCode: { 
            type: String, 
            trim: true,
            match: [/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code']
        },
        country: { 
            type: String, 
            trim: true, 
            default: 'USA',
            maxlength: [50, 'Country name cannot exceed 50 characters']
        }
    },
    profilePicture: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        default: null
    },
    passwordResetToken: {
        type: String,
        default: null
    },
    passwordResetExpires: {
        type: Date,
        default: null
    },
    lastLogin: {
        type: Date,
        default: null
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    },
    registrationIP: {
        type: String,
        default: null
    },
    preferences: {
        currency: {
            type: String,
            default: 'USD',
            enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD']
        },
        notifications: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
            push: { type: Boolean, default: true }
        },
        theme: {
            type: String,
            default: 'light',
            enum: ['light', 'dark']
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Automatically manage createdAt and updatedAt
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1 });

// Pre-save middleware to update fullName and handle updates
userSchema.pre('save', function(next) {
    // Update fullName
    this.fullName = `${this.firstName} ${this.lastName}`;
    
    // Update updatedAt if not using timestamps
    if (!this.isNew) {
        this.updatedAt = new Date();
    }
    
    next();
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Instance method to get user's public profile
userSchema.methods.getPublicProfile = function() {
    return {
        id: this._id,
        firstName: this.firstName,
        lastName: this.lastName,
        fullName: this.fullName,
        email: this.email,
        phoneNumber: this.phoneNumber,
        dateOfBirth: this.dateOfBirth,
        address: this.address,
        isActive: this.isActive,
        isEmailVerified: this.isEmailVerified,
        lastLogin: this.lastLogin,
        preferences: this.preferences,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

// Instance method to get user's basic info
userSchema.methods.getBasicInfo = function() {
    return {
        id: this._id,
        fullName: this.fullName,
        email: this.email,
        isActive: this.isActive
    };
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

// Static method to get user statistics
userSchema.statics.getStats = async function() {
    const totalUsers = await this.countDocuments();
    const activeUsers = await this.countDocuments({ isActive: true });
    const verifiedUsers = await this.countDocuments({ isEmailVerified: true });
    const recentUsers = await this.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });

    return {
        total: totalUsers,
        active: activeUsers,
        verified: verifiedUsers,
        recent: recentUsers
    };
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock account after 5 failed attempts for 2 hours
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
    }
    
    return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

module.exports = mongoose.model('User', userSchema);
