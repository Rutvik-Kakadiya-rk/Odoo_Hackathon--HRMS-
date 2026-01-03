const mongoose = require('mongoose');

const teamMemberSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { 
        type: String, 
        enum: ['Team Leader', 'Member', 'Coordinator', 'Contributor'], 
        default: 'Member' 
    },
    joined_at: { type: Date, default: Date.now }
}, { _id: false });

const teamSchema = mongoose.Schema({
    team_name: { type: String, required: true },
    description: { type: String },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    team_leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    members: [teamMemberSchema],
    status: { 
        type: String, 
        enum: ['Pending', 'Approved', 'Rejected'], 
        default: 'Pending' 
    },
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approved_at: { type: Date },
    rejection_reason: { type: String },
}, { timestamps: true });

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;

