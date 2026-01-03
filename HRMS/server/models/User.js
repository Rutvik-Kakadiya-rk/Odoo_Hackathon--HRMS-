const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    employee_id: { type: String, required: true }, // Will be unique per company
    email: { type: String, required: true }, // Will be unique per company
    password: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'HR Officer', 'Employee'], default: 'Employee' },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }, // Company reference (optional for backward compatibility)
    email_verified: { type: Boolean, default: false },
    email_verification_token: { type: String },
    profile: {
        full_name: { type: String, required: true },
        first_name: { type: String },
        last_name: { type: String },
        phone: { type: String },
        address: { type: String },
        date_of_birth: { type: Date },
        gender: { type: String, enum: ['Male', 'Female', 'Other'] },
        marital_status: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'] },
        job_title: { type: String },
        designation: { type: String },
        department: { type: String },
        date_of_joining: { type: Date },
        profile_picture_url: { type: String },
        bank_account_number: { type: String },
        pan_number: { type: String },
        aadhar_number: { type: String },
    },
    salary_structure: {
        basic: { type: Number, default: 0 },
        hra: { type: Number, default: 0 },
        conveyance: { type: Number, default: 0 },
        medical: { type: Number, default: 0 },
        special_allowance: { type: Number, default: 0 },
        gross_salary: { type: Number, default: 0 },
        pf: { type: Number, default: 0 },
        professional_tax: { type: Number, default: 0 },
        tds: { type: Number, default: 0 },
        net_salary: { type: Number, default: 0 },
    },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }, // Team assignment
}, { timestamps: true });

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

module.exports = User;
