const mongoose = require('mongoose');

const companySchema = mongoose.Schema({
    company_name: { type: String, required: true, unique: true },
    company_code: { type: String, unique: true },
    description: { type: String },
    address: { type: String },
    phone: { type: String },
    email: { type: String },
    website: { type: String },
    logo_url: { type: String },
    is_active: { type: Boolean, default: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Generate company code before saving
companySchema.pre('save', async function (next) {
    if (!this.company_code) {
        const baseCode = this.company_name
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .substring(0, 6);
        
        let code = baseCode;
        let counter = 1;
        
        while (await mongoose.model('Company').findOne({ company_code: code })) {
            code = `${baseCode}${counter}`.substring(0, 10);
            counter++;
        }
        
        this.company_code = code;
    }
    next();
});

const Company = mongoose.model('Company', companySchema);

module.exports = Company;

