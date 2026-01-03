const mongoose = require('mongoose');

const leaveRequestSchema = mongoose.Schema({
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    leave_type: { type: String, enum: ['Paid', 'Sick', 'Unpaid'], required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    reason: { type: String, required: true },
    attachment_url: { type: String },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    admin_remarks: { type: String },
}, { timestamps: true });

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

module.exports = LeaveRequest;
