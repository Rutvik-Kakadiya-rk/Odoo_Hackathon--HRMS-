import { useState, useEffect } from 'react';
import api from '../utils/api';
import { ArrowLeft, Calendar, FileText, Paperclip, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

const LeaveManagement = () => {
    const navigate = useNavigate();
    const [leaves, setLeaves] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        leave_type: 'Paid',
        start_date: '',
        end_date: '',
        reason: '',
        attachment_url: '',
    });

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const { data } = await api.get('/leaves/my-status');
            setLeaves(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch leave history');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/leaves', formData);
            setFormData({ leave_type: 'Paid', start_date: '', end_date: '', reason: '', attachment_url: '' });
            fetchLeaves();
            toast.success('Leave request submitted successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error submitting request');
        } finally {
            setIsLoading(false);
        }
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
            case 'Approved': return <CheckCircle className="w-4 h-4 mr-1" />;
            case 'Rejected': return <XCircle className="w-4 h-4 mr-1" />;
            default: return <Clock className="w-4 h-4 mr-1" />;
        }
    };


    return (
        <Layout>
            <div className="min-h-screen bg-gray-50/50">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Apply Form */}
                        <div className="lg:col-span-5">
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Apply for Leave</h2>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Leave Type</label>
                                        <select
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-gray-700 cursor-pointer hover:bg-white"
                                            value={formData.leave_type}
                                            onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                                        >
                                            <option value="Paid">Paid Leave</option>
                                            <option value="Sick">Sick Leave</option>
                                            <option value="Unpaid">Unpaid Leave</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-700"
                                                value={formData.start_date}
                                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-700"
                                                value={formData.end_date}
                                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                                        <textarea
                                            required
                                            rows="3"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-700 resize-none"
                                            placeholder="Please explain the reason for your leave..."
                                            value={formData.reason}
                                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Attachment URL <span className="text-gray-400 font-normal">(Optional)</span>
                                        </label>
                                        <div className="relative">
                                            <Paperclip className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="url"
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-700 placeholder-gray-400"
                                                placeholder="https://example.com/document.pdf"
                                                value={formData.attachment_url}
                                                onChange={(e) => setFormData({ ...formData, attachment_url: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary-600/30 hover:shadow-primary-600/40 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        {isLoading ? (
                                            <>Processing...</>
                                        ) : (
                                            <>Submit Request</>
                                        )}
                                    </button>
                                </form>
                            </div >
                        </div >

                        {/* History */}
                        < div className="lg:col-span-7" >
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full max-h-[800px]">
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900">Leave History</h2>
                                    </div>
                                    <span className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                                        {leaves.length} Requests
                                    </span>
                                </div>

                                <div className="overflow-y-auto p-6 space-y-4">
                                    {leaves.length > 0 ? (
                                        leaves.map((leave) => (
                                            <div key={leave._id} className="group p-5 border border-gray-200 rounded-xl hover:border-primary-200 hover:shadow-md transition-all bg-white">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="font-bold text-gray-800 text-lg">{leave.leave_type}</h3>
                                                        <p className="text-sm text-gray-500 flex items-center mt-1">
                                                            <Calendar className="w-3 h-3 mr-1.5" />
                                                            {new Date(leave.start_date).toLocaleDateString()}
                                                            <span className="mx-2 text-gray-300">|</span>
                                                            {new Date(leave.end_date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className={`flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(leave.status)}`}>
                                                        {getStatusIcon(leave.status)}
                                                        {leave.status}
                                                    </div>
                                                </div>

                                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-4">
                                                    <p className="text-sm text-gray-600 leading-relaxed">{leave.reason}</p>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                                                    {leave.attachment_url && (
                                                        <a
                                                            href={leave.attachment_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline flex items-center bg-primary-50 px-3 py-1.5 rounded-md transition-colors"
                                                        >
                                                            <Paperclip className="w-3 h-3 mr-1.5" />
                                                            View Attachment
                                                        </a>
                                                    )}

                                                    {leave.admin_remarks && (
                                                        <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-md">
                                                            <AlertCircle className="w-3 h-3 mr-1.5 text-gray-400" />
                                                            <span className="font-semibold mr-1">Admin:</span> {leave.admin_remarks}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-20">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                                <FileText className="w-8 h-8" />
                                            </div>
                                            <p className="text-gray-500 font-medium">No leave requests found.</p>
                                            <p className="text-sm text-gray-400 mt-1">Your leave history will appear here.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div >
                    </div >
                </div >
            </div >
        </Layout >
    );
};

export default LeaveManagement;
