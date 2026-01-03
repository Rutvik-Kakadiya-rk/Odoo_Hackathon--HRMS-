import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { UsersRound, Plus, CheckCircle, XCircle, Clock, UserPlus, Trash2, ArrowLeft, Eye, Crown } from 'lucide-react';
import toast from 'react-hot-toast';

const Teams = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [teams, setTeams] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [formData, setFormData] = useState({
        team_name: '',
        description: '',
        members: [],
        team_leader: ''
    });

    useEffect(() => {
        fetchTeams();
        fetchEmployees(); // All users need employees list for team creation
    }, [user]);

    const fetchTeams = async () => {
        try {
            const { data } = await api.get('/teams');
            setTeams(data.teams || []);
        } catch (error) {
            toast.error('Failed to fetch teams');
        }
    };

    const fetchEmployees = async () => {
        try {
            // All users can fetch employees for team creation
            const { data } = await api.get('/employees');
            setEmployees(data.employees || []);
        } catch (error) {
            console.error('Failed to fetch employees');
            setEmployees([]);
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        try {
            await api.post('/teams', formData);
            toast.success('Team created successfully! Waiting for approval.');
            setShowCreateModal(false);
            setFormData({ team_name: '', description: '', members: [] });
            fetchTeams();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create team');
        }
    };

    const handleApproveReject = async (status, rejectionReason = '') => {
        try {
            await api.put(`/teams/${selectedTeam._id}/status`, { 
                status, 
                rejection_reason: rejectionReason 
            });
            toast.success(`Team ${status.toLowerCase()} successfully`);
            setShowApprovalModal(false);
            setSelectedTeam(null);
            fetchTeams();
        } catch (error) {
            toast.error('Failed to update team status');
        }
    };

    const handleDeleteTeam = async (teamId) => {
        if (!window.confirm('Are you sure you want to delete this team?')) return;
        
        try {
            await api.delete(`/teams/${teamId}`);
            toast.success('Team deleted successfully');
            fetchTeams();
        } catch (error) {
            toast.error('Failed to delete team');
        }
    };

    const toggleMember = (employeeId) => {
        setFormData(prev => {
            const exists = prev.members.find(m => 
                (typeof m === 'object' ? m.user : m) === employeeId
            );
            if (exists) {
                return {
                    ...prev,
                    members: prev.members.filter(m => 
                        (typeof m === 'object' ? m.user : m) !== employeeId
                    )
                };
            } else {
                return {
                    ...prev,
                    members: [...prev.members, { user: employeeId, role: 'Member' }]
                };
            }
        });
    };

    const updateMemberRole = (employeeId, role) => {
        setFormData(prev => ({
            ...prev,
            members: prev.members.map(m => {
                const memberId = typeof m === 'object' ? m.user : m;
                return memberId === employeeId ? { user: employeeId, role } : m;
            })
        }));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-700 border-green-200';
            case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved': return <CheckCircle className="w-4 h-4" />;
            case 'Rejected': return <XCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const pendingTeams = teams.filter(t => t.status === 'Pending');
    const myTeams = teams.filter(t => 
        t.created_by?._id === user?._id || 
        t.members?.some(m => m._id === user?._id)
    );

    return (
        <Layout>
            <div className="mb-6 md:mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Teams</h1>
                        <p className="text-gray-500 mt-1 text-sm md:text-base">Create and manage teams</p>
                    </div>
                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        {(user?.role === 'Admin' || user?.role === 'HR Officer') && pendingTeams.length > 0 && (
                            <button
                                onClick={() => {
                                    setSelectedTeam(pendingTeams[0]);
                                    setShowApprovalModal(true);
                                }}
                                className="px-3 md:px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition flex items-center gap-2 text-sm md:text-base"
                            >
                                <Clock className="w-4 h-4" />
                                <span className="hidden sm:inline">Pending Approvals</span>
                                <span className="sm:hidden">Pending</span>
                                <span className="bg-amber-700 px-2 py-0.5 rounded-full text-xs">({pendingTeams.length})</span>
                            </button>
                        )}
                        {(user?.role === 'Admin' || user?.role === 'HR Officer') && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm md:text-base flex-1 md:flex-initial"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Create Team</span>
                                <span className="sm:hidden">Create</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Pending Teams for Admin/HR */}
            {(user?.role === 'Admin' || user?.role === 'HR Officer') && pendingTeams.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Pending Approvals</h2>
                    <div className="space-y-4">
                        {pendingTeams.map(team => (
                            <div key={team._id} className="p-4 border border-amber-200 rounded-lg bg-amber-50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{team.team_name}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Created by: {team.created_by?.profile?.full_name || team.created_by?.email}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Members: {team.members?.length || 0}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedTeam(team);
                                                setShowApprovalModal(true);
                                            }}
                                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                        >
                                            Review
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* My Teams */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4">My Teams</h2>
                {myTeams.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No teams found. Create your first team!</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myTeams.map(team => (
                            <div key={team._id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800">{team.team_name}</h3>
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{team.description || 'No description'}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full border flex items-center gap-1 whitespace-nowrap ${getStatusColor(team.status)}`}>
                                        {getStatusIcon(team.status)}
                                        {team.status}
                                    </span>
                                </div>
                                
                                {team.team_leader && (
                                    <div className="flex items-center gap-2 mb-2 p-2 bg-purple-50 rounded-lg">
                                        <Crown className="w-4 h-4 text-purple-600" />
                                        <p className="text-xs text-gray-600 truncate">
                                            Leader: {team.team_leader.profile?.full_name || team.team_leader.email}
                                        </p>
                                    </div>
                                )}
                                
                                <div className="mt-3 space-y-2">
                                    <p className="text-xs text-gray-500">
                                        Created by: {team.created_by?.profile?.full_name || team.created_by?.email}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Members: {team.members?.length || 0}
                                    </p>
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={() => navigate(`/teams/${team._id}`)}
                                            className="flex-1 px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center justify-center gap-1"
                                        >
                                            <Eye className="w-3 h-3" />
                                            View Details
                                        </button>
                                        {(team.created_by?._id === user?._id || user?.role === 'Admin' || user?.role === 'HR Officer') && (
                                            <button
                                                onClick={() => handleDeleteTeam(team._id)}
                                                className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Team Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
                    <div className="bg-white rounded-2xl p-4 md:p-6 max-w-2xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Create New Team</h2>
                        <form onSubmit={handleCreateTeam} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.team_name}
                                    onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Team Leader *</label>
                                <select
                                    required
                                    value={formData.team_leader}
                                    onChange={(e) => setFormData({ ...formData, team_leader: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">Select Team Leader</option>
                                    {employees.map(emp => (
                                        <option key={emp._id} value={emp._id}>
                                            {emp.profile?.full_name || emp.email} ({emp.employee_id})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {employees.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Members</label>
                                    <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-2">
                                        {employees.map(emp => {
                                            const isSelected = formData.members.some(m => 
                                                (typeof m === 'object' ? m.user : m) === emp._id
                                            );
                                            const member = formData.members.find(m => 
                                                (typeof m === 'object' ? m.user : m) === emp._id
                                            );
                                            return (
                                    <div key={emp._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 hover:bg-gray-50 rounded gap-2">
                                        <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleMember(emp._id)}
                                                className="rounded flex-shrink-0"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs md:text-sm font-medium text-gray-800 truncate">{emp.profile?.full_name || emp.email}</p>
                                                <p className="text-xs text-gray-500 truncate">{emp.employee_id} • {emp.profile?.department || 'N/A'}</p>
                                            </div>
                                        </label>
                                        {isSelected && (
                                            <select
                                                value={member?.role || 'Member'}
                                                onChange={(e) => updateMemberRole(emp._id, e.target.value)}
                                                className="w-full sm:w-auto px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="Member">Member</option>
                                                <option value="Coordinator">Coordinator</option>
                                                <option value="Contributor">Contributor</option>
                                                <option value="Team Leader">Team Leader</option>
                                            </select>
                                        )}
                                    </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm md:text-base"
                                >
                                    Create Team
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setFormData({ team_name: '', description: '', members: [], team_leader: '' });
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm md:text-base"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Approval Modal */}
            {showApprovalModal && selectedTeam && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
                    <div className="bg-white rounded-2xl p-4 md:p-6 max-w-lg w-full max-h-[95vh] overflow-y-auto">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Review Team</h2>
                        <div className="space-y-4 mb-6">
                            <div>
                                <p className="text-sm text-gray-600">Team Name</p>
                                <p className="font-medium">{selectedTeam.team_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Description</p>
                                <p className="font-medium">{selectedTeam.description || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Created by</p>
                                <p className="font-medium">{selectedTeam.created_by?.profile?.full_name || selectedTeam.created_by?.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Team Leader</p>
                                <p className="font-medium">
                                    {selectedTeam.team_leader?.profile?.full_name || selectedTeam.team_leader?.email || 'Not assigned'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Members</p>
                                <p className="font-medium">{selectedTeam.members?.length || 0} members</p>
                                {selectedTeam.members && selectedTeam.members.length > 0 && (
                                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                                        {selectedTeam.members.slice(0, 5).map((member, idx) => (
                                            <p key={idx} className="text-xs text-gray-500">
                                                • {member.user?.profile?.full_name || member.user?.email} ({member.role})
                                            </p>
                                        ))}
                                        {selectedTeam.members.length > 5 && (
                                            <p className="text-xs text-gray-400">+ {selectedTeam.members.length - 5} more</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => handleApproveReject('Approved')}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm md:text-base"
                            >
                                Approve
                            </button>
                            <button
                                onClick={() => {
                                    const reason = prompt('Enter rejection reason (optional):');
                                    if (reason !== null) {
                                        handleApproveReject('Rejected', reason);
                                    }
                                }}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm md:text-base"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => {
                                    setShowApprovalModal(false);
                                    setSelectedTeam(null);
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm md:text-base"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Teams;

