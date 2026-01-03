const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const importData = async () => {
    try {
        // Connect to database first
        await connectDB();
        
        // Wait a bit for connection to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await User.deleteMany();

        const users = [
            {
                employee_id: 'ADMIN001',
                email: 'admin@dayflow.com',
                password: 'Admin@123',
                role: 'Admin',
                email_verified: true,
                profile: {
                    full_name: 'System Administrator',
                    first_name: 'System',
                    last_name: 'Administrator',
                    phone: '+91-9876543210',
                    address: 'Headquarters, Dayflow Office',
                    date_of_birth: new Date('1985-01-15'),
                    gender: 'Male',
                    marital_status: 'Married',
                    job_title: 'System Administrator',
                    designation: 'Administrator',
                    department: 'IT',
                    date_of_joining: new Date('2020-01-01'),
                    bank_account_number: '1234567890123456',
                    pan_number: 'ABCDE1234F',
                    aadhar_number: '1234-5678-9012',
                },
                salary_structure: {
                    basic: 50000,
                    hra: 20000,
                    conveyance: 5000,
                    medical: 5000,
                    special_allowance: 20000,
                    gross_salary: 100000,
                    pf: 6000,
                    professional_tax: 200,
                    tds: 10000,
                    net_salary: 83800,
                },
            },
            {
                employee_id: 'HR001',
                email: 'hr@dayflow.com',
                password: 'HR@12345',
                role: 'HR Officer',
                email_verified: true,
                profile: {
                    full_name: 'Sarah Johnson',
                    first_name: 'Sarah',
                    last_name: 'Johnson',
                    phone: '+91-9876543211',
                    address: '123 HR Street, City',
                    date_of_birth: new Date('1990-05-20'),
                    gender: 'Female',
                    marital_status: 'Single',
                    job_title: 'HR Manager',
                    designation: 'HR Manager',
                    department: 'Human Resources',
                    date_of_joining: new Date('2021-03-15'),
                    bank_account_number: '2345678901234567',
                    pan_number: 'FGHIJ5678K',
                    aadhar_number: '2345-6789-0123',
                },
                salary_structure: {
                    basic: 40000,
                    hra: 16000,
                    conveyance: 4000,
                    medical: 4000,
                    special_allowance: 16000,
                    gross_salary: 80000,
                    pf: 4800,
                    professional_tax: 200,
                    tds: 8000,
                    net_salary: 67000,
                },
            },
            {
                employee_id: 'EMP001',
                email: 'john.doe@dayflow.com',
                password: 'Emp@1234',
                role: 'Employee',
                email_verified: true,
                profile: {
                    full_name: 'John Doe',
                    first_name: 'John',
                    last_name: 'Doe',
                    phone: '+91-9876543212',
                    address: '456 Employee Avenue, City',
                    date_of_birth: new Date('1992-08-10'),
                    gender: 'Male',
                    marital_status: 'Married',
                    job_title: 'Software Engineer',
                    designation: 'Software Engineer',
                    department: 'Engineering',
                    date_of_joining: new Date('2022-01-10'),
                    bank_account_number: '3456789012345678',
                    pan_number: 'KLMNO9012P',
                    aadhar_number: '3456-7890-1234',
                },
                salary_structure: {
                    basic: 30000,
                    hra: 12000,
                    conveyance: 3000,
                    medical: 3000,
                    special_allowance: 12000,
                    gross_salary: 60000,
                    pf: 3600,
                    professional_tax: 200,
                    tds: 6000,
                    net_salary: 50200,
                },
            },
            {
                employee_id: 'EMP002',
                email: 'jane.smith@dayflow.com',
                password: 'Emp@1234',
                role: 'Employee',
                email_verified: true,
                profile: {
                    full_name: 'Jane Smith',
                    first_name: 'Jane',
                    last_name: 'Smith',
                    phone: '+91-9876543213',
                    address: '789 Developer Road, City',
                    date_of_birth: new Date('1993-11-25'),
                    gender: 'Female',
                    marital_status: 'Single',
                    job_title: 'Frontend Developer',
                    designation: 'Frontend Developer',
                    department: 'Engineering',
                    date_of_joining: new Date('2022-06-01'),
                    bank_account_number: '4567890123456789',
                    pan_number: 'PQRST3456U',
                    aadhar_number: '4567-8901-2345',
                },
                salary_structure: {
                    basic: 28000,
                    hra: 11200,
                    conveyance: 2800,
                    medical: 2800,
                    special_allowance: 11200,
                    gross_salary: 56000,
                    pf: 3360,
                    professional_tax: 200,
                    tds: 5600,
                    net_salary: 46840,
                },
            },
            {
                employee_id: 'EMP003',
                email: 'mike.wilson@dayflow.com',
                password: 'Emp@1234',
                role: 'Employee',
                email_verified: true,
                profile: {
                    full_name: 'Mike Wilson',
                    first_name: 'Mike',
                    last_name: 'Wilson',
                    phone: '+91-9876543214',
                    address: '321 Designer Lane, City',
                    date_of_birth: new Date('1991-03-15'),
                    gender: 'Male',
                    marital_status: 'Married',
                    job_title: 'UI/UX Designer',
                    designation: 'UI/UX Designer',
                    department: 'Design',
                    date_of_joining: new Date('2021-09-15'),
                    bank_account_number: '5678901234567890',
                    pan_number: 'UVWXY7890Z',
                    aadhar_number: '5678-9012-3456',
                },
                salary_structure: {
                    basic: 32000,
                    hra: 12800,
                    conveyance: 3200,
                    medical: 3200,
                    special_allowance: 12800,
                    gross_salary: 64000,
                    pf: 3840,
                    professional_tax: 200,
                    tds: 6400,
                    net_salary: 53560,
                },
            },
        ];

        await User.create(users);

        console.log('✅ Data Imported Successfully!');
        console.log('\n📋 Test Credentials:');
        console.log('Admin: admin@dayflow.com / Admin@123');
        console.log('HR Officer: hr@dayflow.com / HR@12345');
        console.log('Employee: john.doe@dayflow.com / Emp@1234');
        console.log('Employee: jane.smith@dayflow.com / Emp@1234');
        console.log('Employee: mike.wilson@dayflow.com / Emp@1234');
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
};

importData();
