const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

// Validation schemas using Joi
const registerSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const register = async (req, res) => {
    try {
        console.log("Request received:", req.body); // Log incoming request data

        // Validate request body
        const { error } = registerSchema.validate(req.body);
        if (error) {
            console.log("Validation error:", error.details[0].message);
            return res.status(400).send(error.details[0].message);
        }

        const { firstName, lastName, username, email, password } = req.body;

        // Check if the user already exists
        console.log("Checking if user exists...");
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        console.log("User exists:", userExists);
        if (userExists) return res.status(400).send('User with this email or username already exists');

        // Hash password
        console.log("Hashing password...");
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Password hashed");

        // Create new user
        console.log("Creating new user...");
        const user = new User({
            firstName,
            lastName,
            username,
            email,
            password: hashedPassword,
        });
        await user.save();
        console.log("User created");

        // Generate token
        const token = jwt.sign(
            { id: user._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '1h' }
        );
        console.log("Token generated:", token);

        // Set cookie with token
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
        });

        console.log("Cookie set. Registration successful.");

        // Send success response
        res.status(201).json({
            message: "User registered successfully",
            token: token
        });
        
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).send('Server error');
    }
};


const login = async (req, res) => {
    try {
        // Validate request body
        const { error } = loginSchema.validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) return res.status(400).send("Invalid credentials");

        // Compare passwords
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).send("Invalid credentials");

        // Generate token
        const token = jwt.sign(
            { id: user._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '1h' }
        );

        // Set cookie with token
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
        });

        // Send success response
        res.status(200).json({
            message: "Login successful",
            token: token
        });
        
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).send("Server error");
    }
};

const logout = (req, res) => {
    // Clear the JWT cookie
    res.cookie("jwt", "", { maxAge: 1 });
    res.send("Logged out successfully");
};

module.exports = {
    register,
    login,
    logout,
};
