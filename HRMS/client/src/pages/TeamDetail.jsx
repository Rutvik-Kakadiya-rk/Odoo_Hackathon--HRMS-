import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Users, Crown, UserPlus, Edit2, Trash2, Mail, Phone, Building, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

const TeamDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [team, setTeam] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTeam();
        fetchEmployees(); // All users need employees list for editing
    }, [id, user]);

    const fetchTeam = async () => {
        try {
            const { data } = await api.get(`/teams/${id}`);
            setTeam(data.team);
        } catch (error) {
            toast.error('Failed to fetch team details');
            navigate('/teams');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            // Try to get employees - may fail for regular employees, that's ok
            const { data } = await api.get('/employees').catch(() => ({ data: { employees: [] } }));
            setEmployees(data.employees || []);
        } catch (error) {
            console.error('Failed to fetch employees');
            setEmployees([]);
        }
    };

    const handleUpdateTeam = async (updatedMembers, updatedLeader) => {
        try {
            await api.put(`/teams/${id}/members`, {
                members: updatedMembers,
                team_leader: updatedLeader
            });
            toast.success('Team updated successfully');
            setShowEditModal(false);
            fetchTeam();
        } catch (error) {
            toast.error('Failed to update team');
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'Team Leader': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Coordinator': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Contributor': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading team details...</div>
                </div>
            </Layout>
        );
    }

    if (!team) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-gray-500">Team not found</p>
                </div>
            </Layout>
        );
    }

    const canEdit = team.created_by?._id === user?._id ||
        team.team_leader?._id === user?._id ||
        user?.role === 'Admin' ||
        user?.role === 'HR Officer';

    return (
        <Layout>
            <div className="mb-6 md:mb-8">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">{team.team_name}</h1>
                        <p className="text-gray-500 mt-1 text-sm md:text-base">{team.description || 'No description'}</p>
                    </div>
                    {canEdit && (
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm md:text-base"
                        >
                            <Edit2 className="w-4 h-4" />
                            Edit Team
                        </button>
                    )}
                </div>
            </div>

            {/* Team Leader Section */}
            {team.team_leader && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 md:p-6 shadow-sm border border-purple-100 mb-4 md:mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Crown className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                        <h2 className="text-lg md:text-xl font-bold text-gray-800">Team Leader</h2>
                    </div>
                    <div className="bg-white rounded-lg p-3 md:p-4 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xl md:text-2xl font-bold">
                            {team.team_leader.profile?.full_name?.charAt(0) || 'L'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-800 text-base md:text-lg truncate">{team.team_leader.profile?.full_name || team.team_leader.email}</h3>
                            <p className="text-xs md:text-sm text-gray-600">{team.team_leader.employee_id}</p>
                            <div className="flex flex-wrap gap-2 md:gap-4 mt-2 text-xs md:text-sm text-gray-500">
                                {team.team_leader.profile?.department && (
                                    <span className="flex items-center gap-1">
                                        <Building className="w-4 h-4" />
                                        {team.team_leader.profile.department}
                                    </span>
                                )}
                                {team.team_leader.profile?.designation && (
                                    <span className="flex items-center gap-1">
                                        <Briefcase className="w-4 h-4" />
                                        {team.team_leader.profile.designation}
                                    </span>
                                )}
                            </div>
                        </div>
                        <span className="px-2 md:px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs md:text-sm font-medium border border-purple-200 whitespace-nowrap">
                            Team Leader
                        </span>
                    </div>
                </div>
            )}

            {/* Team Members Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <Users className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-800">Team Members ({team.members?.length || 0})</h2>
                    </div>
                </div>

                {team.members && team.members.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        {team.members.map((member, index) => (
                            <div key={member.user?._id || index} className="border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition">
                                <div className="flex items-start gap-2 md:gap-3">
                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-base md:text-lg font-bold flex-shrink-0 ${member.role === 'Team Leader' ? 'bg-purple-100 text-purple-600' :
                                            member.role === 'Coordinator' ? 'bg-blue-100 text-blue-600' :
                                                member.role === 'Contributor' ? 'bg-green-100 text-green-600' :
                                                    'bg-gray-100 text-gray-600'
                                        }`}>
                                        {member.user?.profile?.full_name?.charAt(0) || member.user?.email?.charAt(0) || 'M'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-800 truncate text-sm md:text-base">
                                            {member.user?.profile?.full_name || member.user?.email || 'Unknown'}
                                        </h3>
                                        <p className="text-xs text-gray-500 truncate">{member.user?.employee_id || ''}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {member.user?.profile?.department && (
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Building className="w-3 h-3" />
                                                    {member.user.profile.department}
                                                </span>
                                            )}
                                        </div>
                                        <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full border ${getRoleColor(member.role)}`}>
                                            {member.role}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No members in this team yet</p>
                    </div>
                )}
            </div>

            {/* Team Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6">
                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Team Information</h3>
                    <div className="space-y-3 text-sm">
                        <div>
                            <p className="text-gray-500">Created by</p>
                            <p className="font-medium text-gray-800">{team.created_by?.profile?.full_name || team.created_by?.email}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Status</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${team.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                    team.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'
                                }`}>
                                {team.status}
                            </span>
                        </div>
                        {team.approved_by && (
                            <div>
                                <p className="text-gray-500">Approved by</p>
                                <p className="font-medium text-gray-800">{team.approved_by.profile?.full_name || team.approved_by.email}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Team Statistics</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Total Members</span>
                            <span className="font-medium text-gray-800">{team.members?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Team Leaders</span>
                            <span className="font-medium text-gray-800">
                                {team.members?.filter(m => m.role === 'Team Leader').length || 0}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Coordinators</span>
                            <span className="font-medium text-gray-800">
                                {team.members?.filter(m => m.role === 'Coordinator').length || 0}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Regular Members</span>
                            <span className="font-medium text-gray-800">
                                {team.members?.filter(m => m.role === 'Member').length || 0}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && employees.length > 0 && (
                <EditTeamModal
                    team={team}
                    employees={employees}
                    onClose={() => setShowEditModal(false)}
                    onSave={handleUpdateTeam}
                />
            )}
        </Layout>
    );
};

const EditTeamModal = ({ team, employees, onClose, onSave }) => {
    const [members, setMembers] = useState(
        team.members.map(m => ({
            user: m.user._id,
            role: m.role
        }))
    );
    const [teamLeader, setTeamLeader] = useState(team.team_leader?._id || '');

    const toggleMember = (employeeId) => {
        setMembers(prev => {
            const exists = prev.find(m => m.user === employeeId);
            if (exists) {
                return prev.filter(m => m.user !== employeeId);
            } else {
                return [...prev, { user: employeeId, role: 'Member' }];
            }
        });
    };

    const updateMemberRole = (employeeId, role) => {
        setMembers(prev => prev.map(m =>
            m.user === employeeId ? { ...m, role } : m
        ));
    };

    const handleSave = () => {
        onSave(members, teamLeader);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
            <div className="bg-white rounded-2xl p-4 md:p-6 max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Edit Team</h2>

                <div className="space-y-4 md:space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Team Leader</label>
                        <select
                            value={teamLeader}
                            onChange={(e) => setTeamLeader(e.target.value)}
                            className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm md:text-base"
                        >
                            <option value="">Select Team Leader</option>
                            {employees.map(emp => (
                                <option key={emp._id} value={emp._id}>
                                    {emp.profile?.full_name || emp.email} ({emp.employee_id})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Team Members</label>
                        <div className="max-h-64 md:max-h-96 overflow-y-auto border border-gray-300 rounded-lg p-2 md:p-4 space-y-2">
                            {employees.map(emp => {
                                const isSelected = members.some(m => m.user === emp._id);
                                const member = members.find(m => m.user === emp._id);
                                return (
                                    <div key={emp._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 md:p-3 border border-gray-200 rounded-lg hover:bg-gray-50 gap-2">
                                        <label className="flex items-center gap-2 md:gap-3 cursor-pointer flex-1 min-w-0">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleMember(emp._id)}
                                                className="rounded flex-shrink-0"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-gray-800 truncate text-sm md:text-base">{emp.profile?.full_name || emp.email}</p>
                                                <p className="text-xs text-gray-500 truncate">{emp.employee_id} • {emp.profile?.department || 'N/A'}</p>
                                            </div>
                                        </label>
                                        {isSelected && (
                                            <select
                                                value={member?.role || 'Member'}
                                                onChange={(e) => updateMemberRole(emp._id, e.target.value)}
                                                className="w-full sm:w-auto px-2 md:px-3 py-1 border border-gray-300 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-6">
                    <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm md:text-base"
                    >
                        Save Changes
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm md:text-base"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeamDetail;

