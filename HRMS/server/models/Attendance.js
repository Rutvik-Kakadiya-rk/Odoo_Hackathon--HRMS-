const mongoose = require('mongoose');

const attendanceSchema = mongoose.Schema({
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // Format YYYY-MM-DD for easy querying
    check_in: { type: Date },
    check_out: { type: Date },
    status: { type: String, enum: ['Present', 'Absent', 'Half-day', 'Leave'], default: 'Absent' },
    total_hours: { type: Number, default: 0 },
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
