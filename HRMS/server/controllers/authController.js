const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Password validation
const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!minLength) return { valid: false, message: 'Password must be at least 8 characters long' };
    if (!hasUpperCase) return { valid: false, message: 'Password must contain at least one uppercase letter' };
    if (!hasLowerCase) return { valid: false, message: 'Password must contain at least one lowercase letter' };
    if (!hasNumber) return { valid: false, message: 'Password must contain at least one number' };
    if (!hasSpecialChar) return { valid: false, message: 'Password must contain at least one special character' };

    return { valid: true };
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
// Supports login with email or employee_id
const loginUser = async (req, res) => {
    const { email, employee_id, password } = req.body;

    try {
        // Allow login with either email or employee_id
        let user;
        if (employee_id) {
            user = await User.findOne({ employee_id });
        } else if (email) {
            user = await User.findOne({ email });
        } else {
            return res.status(400).json({ message: 'Please provide either email or employee ID' });
        }

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.profile.full_name,
                email: user.email,
                employee_id: user.employee_id,
                role: user.role,
                profile_picture: user.profile.profile_picture_url,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const Company = require('../models/Company');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const {
        employee_id,
        email,
        password,
        role,
        first_name,
        last_name,
        gender,
        company_name, // For creating a company (Admin)
        company_code, // For joining a company (Employee/HR)
        profile_picture
    } = req.body;

    try {
        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({ message: passwordValidation.message });
        }

        const userExists = await User.findOne({
            $or: [{ email }, { employee_id }]
        });

        if (userExists) {
            return res.status(400).json({ message: 'User with this email or employee ID already exists' });
        }

        let companyId = null;

        // Handle Company Logic
        if (role === 'Admin') {
            if (!company_name) {
                return res.status(400).json({ message: 'Company name is required for Admin registration' });
            }
            // Check if company exists
            const companyExists = await Company.findOne({ company_name });
            if (companyExists) {
                return res.status(400).json({ message: 'Company with this name already exists' });
            }
            const newCompany = await Company.create({
                company_name,
                email
            });
            companyId = newCompany._id;
        } else {
            // Employee or HR Officer joining existing company
            if (company_code) {
                const existingCompany = await Company.findOne({ company_code });
                if (!existingCompany) {
                    return res.status(400).json({ message: 'Invalid company code' });
                }
                companyId = existingCompany._id;
            } else {
                // If no company code provided, try to find a default company (Single Tenant Mode)
                let defaultCompany = await Company.findOne().sort({ createdAt: 1 });

                if (!defaultCompany) {
                    // Auto-create default company for first user if not admin
                    defaultCompany = await Company.create({
                        company_name: 'Dayflow Inc.',
                        description: 'Default Organization',
                        email: 'admin@dayflow.com'
                    });
                }
                companyId = defaultCompany._id;
            }
        }

        // Generate email verification token
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');

        const full_name = `${first_name || ''} ${last_name || ''}`.trim() || email.split('@')[0];

        const user = await User.create({
            employee_id,
            email,
            password,
            role: role || 'Employee',
            company: companyId,
            email_verification_token: emailVerificationToken,
            profile: {
                full_name,
                first_name,
                last_name,
                gender,
                profile_picture_url: profile_picture // Save base64 image
            },
        });

        if (user) {
            // Update company created_by if Admin
            if (role === 'Admin') {
                await Company.findByIdAndUpdate(companyId, { created_by: user._id });
            }

            // In production, send verification email here
            res.status(201).json({
                _id: user._id,
                name: user.profile.full_name,
                email: user.email,
                role: user.role,
                company: companyId,
                profile_picture: user.profile.profile_picture_url,
                email_verified: user.email_verified,
                token: generateToken(user._id),
                message: 'Registration successful. Please verify your email.',
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res) => {
    try {
        const user = await User.findOne({ email_verification_token: req.params.token });

        if (!user) {
            return res.status(400).json({ message: 'Invalid verification token' });
        }

        user.email_verified = true;
        user.email_verification_token = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    loginUser,
    registerUser,
    verifyEmail,
};
