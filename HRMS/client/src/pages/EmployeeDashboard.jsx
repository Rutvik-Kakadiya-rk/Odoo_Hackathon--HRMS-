import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/Layout';
import { Clock, Calendar, CheckCircle, AlertCircle, Timer } from 'lucide-react';

const EmployeeDashboard = () => {
    const navigate = useNavigate();
    const [attendance, setAttendance] = useState(null);
    const [leaveStatus, setLeaveStatus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [monthlyStats, setMonthlyStats] = useState({ worked: 0, target: 160 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [attendanceRes, leaveRes, historyRes] = await Promise.all([
                api.get('/attendance/today').catch(() => ({ data: null })),
                api.get('/leaves/my-status'),
                api.get('/attendance').catch(() => ({ data: [] }))
            ]);

            setAttendance(attendanceRes.data);
            setLeaveStatus(leaveRes.data);

            // Calculate monthly stats
            const currentMonth = new Date().getMonth();
            const monthlyRecords = historyRes.data.filter(record =>
                new Date(record.date).getMonth() === currentMonth && record.total_hours
            );

            const totalWorked = monthlyRecords.reduce((acc, curr) => acc + parseFloat(curr.total_hours || 0), 0);

            // Calculate target (assuming 8 hours per working day)
            const now = new Date();
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const workingDays = Array.from({ length: daysInMonth }, (_, i) => {
                const day = new Date(now.getFullYear(), now.getMonth(), i + 1).getDay();
                return day !== 0 && day !== 6; // Exclude weekends
            }).filter(Boolean).length;

            setMonthlyStats({
                worked: totalWorked.toFixed(1),
                target: workingDays * 8
            });

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        try {
            await api.post('/attendance/checkin');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message);
        }
    };

    const handleCheckOut = async () => {
        try {
            await api.put('/attendance/checkout');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message);
        }
    };

    if (loading) return <div className="flex h-screen justify-center items-center">Loading...</div>;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const progressPercentage = Math.min((monthlyStats.worked / monthlyStats.target) * 100, 100);

    return (
        <Layout>
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">{getGreeting()}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm md:text-base">Here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Attendance Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Attendance</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                                {attendance?.status || 'Not Checked In'}
                            </h3>
                        </div>
                        <div className={`p-3 rounded-xl ${attendance?.status === 'Present' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}`}>
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="mt-4">
                        {!attendance ? (
                            <button onClick={handleCheckIn} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 rounded-xl transition shadow-lg shadow-blue-200">
                                Check In Now
                            </button>
                        ) : !attendance.check_out ? (
                            <div className="space-y-3">
                                <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Checking in at {new Date(attendance.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <button onClick={handleCheckOut} className="w-full bg-white dark:bg-gray-700 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium py-2.5 rounded-xl transition">
                                    Check Out
                                </button>
                            </div>
                        ) : (
                            <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-3 rounded-xl text-center font-medium border border-green-100 dark:border-green-800">
                                Completed ({attendance.total_hours} hrs)
                            </div>
                        )}
                    </div>
                </div>

                {/* Leave Balance Card */}
                <button
                    onClick={() => navigate('/my-leaves')}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-purple-200 transition-all cursor-pointer text-left w-full"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Requests</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                                {leaveStatus.filter(l => l.status === 'Pending').length}
                            </h3>
                        </div>
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                            <Calendar className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-400 mt-4">You have {12 - leaveStatus.filter(l => l.status === 'Approved').length} days of leave remaining.</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 font-medium">Click to view all leaves →</p>
                </button>

                {/* Quick Stat */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-indigo-100 font-medium">Monthly Work Hours</p>
                            <h3 className="text-2xl font-bold mt-1">{monthlyStats.worked} / {monthlyStats.target} Hrs</h3>
                        </div>
                        <Timer className="w-6 h-6 text-indigo-200" />
                    </div>
                    <p className="text-sm text-indigo-100">Target for this month.</p>
                    <div className="mt-4 w-full bg-black/20 rounded-full h-2">
                        <div className="bg-white h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Recent Activity Section */}
            <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Leave History</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4 text-left">Type</th>
                            <th className="px-6 py-4 text-left">Period</th>
                            <th className="px-6 py-4 text-left">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {leaveStatus.slice(0, 5).map(leave => (
                            <tr key={leave._id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 font-medium text-gray-800">{leave.leave_type}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${leave.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                        leave.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                        {leave.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {leaveStatus.length === 0 && (
                            <tr>
                                <td colSpan="3" className="px-6 py-8 text-center text-gray-400">No leave history found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Layout>
    );
};

export default EmployeeDashboard;
