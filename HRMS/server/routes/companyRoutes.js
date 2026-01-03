const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const { protect, adminOrHR } = require('../middleware/authMiddleware');

// @desc    Get all companies
// @route   GET /api/companies
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const companies = await Company.find({ is_active: true }).sort({ company_name: 1 });
        res.json({
            success: true,
            count: companies.length,
            companies
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create company (Admin only)
// @route   POST /api/companies
// @access  Private/Admin
router.post('/', protect, async (req, res) => {
    try {
        const { company_name, description, address, phone, email, website } = req.body;

        if (!company_name) {
            return res.status(400).json({ message: 'Company name is required' });
        }

        const company = await Company.create({
            company_name,
            description,
            address,
            phone,
            email,
            website,
            created_by: req.user._id
        });

        res.status(201).json({
            success: true,
            company
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

