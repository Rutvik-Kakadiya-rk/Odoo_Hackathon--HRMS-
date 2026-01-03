import { useState, useEffect } from 'react';
import api from '../utils/api';
import Layout from '../components/Layout';
import { CheckCircle, XCircle, Clock, Search, Filter, Paperclip, AlertCircle, FileText, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminLeaveManagement = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('Pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchLeaves();
    }, [filterStatus]);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/leaves?status=${filterStatus}`);
            setLeaves(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch leave requests');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this leave request?`)) return;

        const remarks = prompt("Enter remarks (optional):");

        try {
            setActionLoading(id);
            await api.put(`/leaves/${id}/status`, {
                status,
                admin_remarks: remarks
            });
            toast.success(`Leave request ${status.toLowerCase()} successfully`);
            fetchLeaves();
        } catch (error) {
            console.error(error);
            toast.error(`Failed to ${status.toLowerCase()} request`);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-700 border-green-200';
            case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        }
    };

    const filteredLeaves = leaves.filter(leave =>
        leave.employee_id?.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leave.employee_id?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Leave Management</h1>
                <p className="text-gray-500 mt-1">Manage employee leave requests</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['Pending', 'Approved', 'Rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filterStatus === status
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search employee..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                </div>
            </div>

            {/* Leaves List */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading requests...</div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {filteredLeaves.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <FileText className="w-8 h-8" />
                            </div>
                            <p className="text-gray-500 font-medium">No {filterStatus.toLowerCase()} requests found.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredLeaves.map((leave) => (
                                <div key={leave._id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0">
                                                {leave.employee_id?.profile?.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-lg">
                                                    {leave.employee_id?.profile?.full_name || 'Unknown User'}
                                                </h3>
                                                <p className="text-sm text-gray-500 mb-2">
                                                    {leave.employee_id?.email} • {leave.leave_type} Leave
                                                </p>

                                                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg w-fit">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(leave.start_date).toLocaleDateString()}
                                                    <span className="text-gray-400 mx-1">➜</span>
                                                    {new Date(leave.end_date).toLocaleDateString()}
                                                </div>

                                                <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200 text-gray-700 text-sm max-w-2xl">
                                                    <span className="font-semibold block mb-1">Reason:</span>
                                                    {leave.reason}
                                                </div>

                                                {leave.attachment_url && (
                                                    <a
                                                        href={leave.attachment_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 mt-3 text-sm text-blue-600 hover:underline"
                                                    >
                                                        <Paperclip className="w-4 h-4" />
                                                        View Attachment
                                                    </a>
                                                )}

                                                {leave.admin_remarks && (
                                                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Remarks: {leave.admin_remarks}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-3 min-w-[140px]">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center ${getStatusColor(leave.status)}`}>
                                                {leave.status === 'Approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                                                {leave.status === 'Rejected' && <XCircle className="w-3 h-3 mr-1" />}
                                                {leave.status === 'Pending' && <Clock className="w-3 h-3 mr-1" />}
                                                {leave.status}
                                            </span>

                                            {leave.status === 'Pending' && (
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => handleStatusUpdate(leave._id, 'Approved')}
                                                        disabled={actionLoading === leave._id}
                                                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(leave._id, 'Rejected')}
                                                        disabled={actionLoading === leave._id}
                                                        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Layout>
    );
};

export default AdminLeaveManagement;
