import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/Layout';
import { Users, FileText, CheckCircle, XCircle, TrendingUp, Clock, Eye, Search, UserPlus, BarChart3, Activity, Calendar, Download, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminDashboardEnhanced = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [users, setUsers] = useState([]);
    const [allLeaveRequests, setAllLeaveRequests] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [dailyData, setDailyData] = useState(null);
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'overview'); // 'overview', 'daily', 'leaves', 'employees', 'attendance'
    const [searchTerm, setSearchTerm] = useState('');
    const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
    const [statusFilter, setStatusFilter] = useState('Pending');
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Auto-refresh data every 30 seconds
    useEffect(() => {
        fetchData();
        fetchAnalytics();
        if (activeTab === 'daily') {
            fetchDailyData();
        }

        if (autoRefresh) {
            const interval = setInterval(() => {
                fetchData();
                fetchAnalytics();
                if (activeTab === 'daily') {
                    fetchDailyData();
                }
            }, 10000); // 10 seconds for faster updates

            return () => clearInterval(interval);
        }
    }, [activeTab, monthFilter, statusFilter, dateFilter, autoRefresh]);

    const fetchData = async () => {
        try {
            if (activeTab === 'employees') {
                const { data } = await api.get('/employees');
                setUsers(data.employees || data);
            } else if (activeTab === 'attendance') {
                const { data } = await api.get(`/attendance?month=${monthFilter}`);
                setAttendance(data);
            } else if (activeTab === 'leaves') {
                const { data } = await api.get(`/leaves?status=${statusFilter}`);
                setAllLeaveRequests(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const { data } = await api.get('/analytics/dashboard');
            setAnalytics(data.analytics);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    const fetchDailyData = async () => {
        try {
            const { data } = await api.get(`/analytics/daily-data?date=${dateFilter}`);
            setDailyData(data);
        } catch (error) {
            console.error('Error fetching daily data:', error);
        }
    };

    const handleLeaveAction = async (id, status, remarks = '') => {
        try {
            await api.put(`/leaves/${id}/status`, { status, admin_remarks: remarks });
            fetchData();
            fetchAnalytics();
        } catch (error) {
            alert('Action failed');
        }
    };

    const viewEmployeeProfile = (employeeId) => {
        // Store that we came from employee list
        if (activeTab === 'employees') {
            sessionStorage.setItem('fromEmployeeList', 'true');
        }
        navigate(`/employee/${employeeId}`);
    };

    // Check if we need to switch to employees tab from navigation state
    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
            // Clear the state after using it
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const filteredUsers = users.filter(user =>
        user.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredLeaves = allLeaveRequests.filter(leave =>
        leave.employee_id?.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leave.employee_id?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredAttendance = attendance.filter(record =>
        record.employee_id?.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employee_id?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pendingLeaves = allLeaveRequests.filter(l => l.status === 'Pending');

    return (
        <Layout>
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                        {user?.role === 'HR Officer' ? 'HR Dashboard' : 'Admin Overview'}
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm md:text-base">Live data updates every 10 seconds</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                        <span className="text-sm text-gray-600">
                            {autoRefresh ? 'Live' : 'Paused'}
                        </span>
                    </div>
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                    >
                        {autoRefresh ? 'Pause' : 'Resume'}
                    </button>
                    <button
                        onClick={() => {
                            fetchData();
                            fetchAnalytics();
                            if (activeTab === 'daily') {
                                fetchDailyData();
                            }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                        <Activity className="w-4 h-4" />
                        Refresh Now
                    </button>
                </div>
            </div>

            {/* Overview Tab - Analytics Dashboard */}
            {activeTab === 'overview' && analytics && (
                <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <button
                            onClick={() => setActiveTab('employees')}
                            className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer text-left"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs md:text-sm font-medium text-gray-500">Total Employees</p>
                                <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-800">{analytics.employees?.total || 0}</h3>
                            <p className="text-xs text-gray-400 mt-1">{analytics.employees?.active || 0} active</p>
                            <p className="text-xs text-blue-600 mt-2 font-medium hidden md:block">Click to view details →</p>
                        </button>

                        <button
                            onClick={() => setActiveTab('attendance')}
                            className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all cursor-pointer text-left"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs md:text-sm font-medium text-gray-500">Today Present</p>
                                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-800">{analytics.todayAttendance?.present || 0}</h3>
                            <p className="text-xs text-gray-400 mt-1">{analytics.todayAttendance?.absent || 0} absent</p>
                            <p className="text-xs text-green-600 mt-2 font-medium hidden md:block">Click to view details →</p>
                        </button>

                        <button
                            onClick={() => setActiveTab('leaves')}
                            className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-amber-200 transition-all cursor-pointer text-left"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs md:text-sm font-medium text-gray-500">Pending Leaves</p>
                                <FileText className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-800">{analytics.leaves?.pending || 0}</h3>
                            <p className="text-xs text-gray-400 mt-1">{analytics.leaves?.approved || 0} approved</p>
                            <p className="text-xs text-amber-600 mt-2 font-medium hidden md:block">Click to view details →</p>
                        </button>

                        <button
                            onClick={() => navigate('/payroll')}
                            className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 md:p-6 rounded-2xl shadow-sm border-2 border-purple-200 hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer text-left group"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs md:text-sm font-medium text-purple-700">Payroll Management</p>
                                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-purple-600 group-hover:scale-110 transition-transform" />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-purple-800">Manage</h3>
                            <p className="text-xs text-purple-600 mt-1">View salary slips & reports</p>
                            <p className="text-xs text-purple-700 mt-2 font-medium hidden md:block group-hover:translate-x-1 transition-transform inline-block">Click to view →</p>
                        </button>
                    </div>

                    {/* Department Distribution */}
                    {analytics.departmentStats && analytics.departmentStats.length > 0 && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Department Distribution</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {analytics.departmentStats.map((dept, idx) => (
                                    <div key={idx} className="p-4 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-gray-600">{dept._id || 'N/A'}</p>
                                        <p className="text-2xl font-bold text-blue-600">{dept.count}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Employees on Leave Today */}
                    {analytics.recentActivities?.leaves && analytics.recentActivities.leaves.length > 0 && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                Employees on Leave Today
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {analytics.recentActivities.leaves
                                    .filter(leave => {
                                        const today = new Date().toISOString().split('T')[0];
                                        const startDate = new Date(leave.start_date).toISOString().split('T')[0];
                                        const endDate = new Date(leave.end_date).toISOString().split('T')[0];
                                        return leave.status === 'Approved' && today >= startDate && today <= endDate;
                                    })
                                    .slice(0, 6)
                                    .map((leave) => (
                                        <div key={leave._id} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                            <p className="font-medium text-gray-800">{leave.employee_id?.profile?.full_name || leave.employee_id?.email || 'Unknown'}</p>
                                            <p className="text-sm text-gray-600 mt-1">{leave.employee_id?.employee_id || ''}</p>
                                            <p className="text-xs text-blue-600 mt-2">{leave.leave_type}</p>
                                        </div>
                                    ))}
                                {analytics.recentActivities.leaves.filter(leave => {
                                    const today = new Date().toISOString().split('T')[0];
                                    const startDate = new Date(leave.start_date).toISOString().split('T')[0];
                                    const endDate = new Date(leave.end_date).toISOString().split('T')[0];
                                    return leave.status === 'Approved' && today >= startDate && today <= endDate;
                                }).length === 0 && (
                                    <p className="text-gray-500 col-span-full text-center py-4">No employees on leave today</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('/create-employee')}
                                    className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    <UserPlus className="w-5 h-5" />
                                    Create New Employee
                                </button>
                                <button
                                    onClick={() => setActiveTab('daily')}
                                    className="w-full flex items-center gap-3 px-4 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                                >
                                    <Calendar className="w-5 h-5" />
                                    View Daily Employee Data
                                </button>
                                <button
                                    onClick={() => setActiveTab('leaves')}
                                    className="w-full flex items-center gap-3 px-4 py-3 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition"
                                >
                                    <FileText className="w-5 h-5" />
                                    Review Pending Leaves ({analytics.leaves?.pending || 0})
                                </button>
                                <button
                                    onClick={() => navigate('/reports')}
                                    className="w-full flex items-center gap-3 px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                                >
                                    <BarChart3 className="w-5 h-5" />
                                    View Reports
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Today's Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Present</span>
                                    <span className="font-bold text-green-600">{analytics.todayAttendance?.present || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Absent</span>
                                    <span className="font-bold text-red-600">{analytics.todayAttendance?.absent || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">On Leave</span>
                                    <span className="font-bold text-blue-600">{analytics.todayAttendance?.onLeave || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Half Day</span>
                                    <span className="font-bold text-yellow-600">{analytics.todayAttendance?.halfDay || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Daily Data Tab */}
            {activeTab === 'daily' && dailyData && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Daily Employee Data</h2>
                                <p className="text-gray-500 text-sm mt-1">All employees' activities for {new Date(dateFilter).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-3 items-center">
                                <input
                                    type="date"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button
                                    onClick={() => {
                                        const dataStr = JSON.stringify(dailyData, null, 2);
                                        const dataBlob = new Blob([dataStr], { type: 'application/json' });
                                        const url = URL.createObjectURL(dataBlob);
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.download = `daily-data-${dateFilter}.json`;
                                        link.click();
                                    }}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Export
                                </button>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Present</p>
                                <p className="text-2xl font-bold text-green-600">{dailyData.summary.present}</p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Absent</p>
                                <p className="text-2xl font-bold text-red-600">{dailyData.summary.absent}</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">On Leave</p>
                                <p className="text-2xl font-bold text-blue-600">{dailyData.summary.on_leave}</p>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Half Day</p>
                                <p className="text-2xl font-bold text-yellow-600">{dailyData.summary.half_day}</p>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search by name, employee ID, or department..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Employee Table */}
                        <div className="overflow-x-auto -mx-4 md:mx-0">
                            <div className="inline-block min-w-full align-middle">
                                <table className="w-full min-w-[800px]">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Info</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {dailyData.employees
                                        .filter(emp => 
                                            emp.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            emp.department.toLowerCase().includes(searchTerm.toLowerCase())
                                        )
                                        .map((emp, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{emp.employee_name}</p>
                                                        <p className="text-sm text-gray-500">{emp.employee_id}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{emp.department}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                        emp.daily_status === 'Present' ? 'bg-green-100 text-green-800' :
                                                        emp.daily_status === 'Absent' ? 'bg-red-100 text-red-800' :
                                                        emp.daily_status === 'Half-day' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {emp.daily_status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {emp.attendance?.check_in 
                                                        ? new Date(emp.attendance.check_in).toLocaleTimeString()
                                                        : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {emp.attendance?.check_out 
                                                        ? new Date(emp.attendance.check_out).toLocaleTimeString()
                                                        : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {emp.attendance?.total_hours || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {emp.leave ? (
                                                        <div>
                                                            <p className="font-medium">{emp.leave.leave_type}</p>
                                                            <p className="text-xs text-gray-500">{emp.leave.status}</p>
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Other Tabs - Existing functionality */}
            {activeTab !== 'overview' && activeTab !== 'daily' && (
                <>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="border-b border-gray-100 px-4 md:px-6 py-4 flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center justify-between">
                            <div className="flex flex-wrap gap-3 md:gap-6 w-full md:w-auto overflow-x-auto">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`pb-2 text-sm font-medium transition border-b-2 ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setActiveTab('daily')}
                                    className={`pb-2 text-sm font-medium transition border-b-2 ${activeTab === 'daily' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Daily Data
                                </button>
                                <button
                                    onClick={() => setActiveTab('leaves')}
                                    className={`pb-2 text-sm font-medium transition border-b-2 ${activeTab === 'leaves' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Leave Requests
                                </button>
                                <button
                                    onClick={() => setActiveTab('employees')}
                                    className={`pb-2 text-sm font-medium transition border-b-2 ${activeTab === 'employees' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Employee Directory
                                </button>
                                <button
                                    onClick={() => setActiveTab('attendance')}
                                    className={`pb-2 text-sm font-medium transition border-b-2 ${activeTab === 'attendance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Attendance
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                                {activeTab === 'attendance' && (
                                    <input
                                        type="month"
                                        value={monthFilter}
                                        onChange={(e) => setMonthFilter(e.target.value)}
                                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-auto"
                                    />
                                )}
                                {activeTab === 'leaves' && (
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-auto"
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Rejected">Rejected</option>
                                        <option value="">All</option>
                                    </select>
                                )}
                                <div className="relative w-full md:w-auto flex-1 md:flex-initial">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-48"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Table Content */}
                        <div className="p-4 md:p-6 overflow-x-auto">
                            {activeTab === 'leaves' && (
                                <div className="min-w-full">
                                    <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">Employee</th>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4">Dates</th>
                                            <th className="px-6 py-4">Reason</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredLeaves.length === 0 ? (
                                            <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400">No leave requests found.</td></tr>
                                        ) : (
                                            filteredLeaves.map((req) => (
                                                <tr key={req._id} className="hover:bg-gray-50 transition">
                                                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                                                            {req.employee_id?.profile?.full_name?.charAt(0) || req.employee_id?.email?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{req.employee_id?.profile?.full_name || req.employee_id?.email || 'Unknown'}</p>
                                                            <p className="text-xs text-gray-500">{req.employee_id?.employee_id || ''}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">{req.leave_type}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{req.reason}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                            req.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                            'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {req.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 flex justify-end gap-2">
                                                        {req.status === 'Pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        const remarks = prompt('Add remarks (optional):');
                                                                        if (remarks !== null) {
                                                                            handleLeaveAction(req._id, 'Approved', remarks);
                                                                        }
                                                                    }}
                                                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm font-medium"
                                                                >
                                                                    <CheckCircle className="w-4 h-4" /> Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        const remarks = prompt('Add rejection remarks (optional):');
                                                                        if (remarks !== null) {
                                                                            handleLeaveAction(req._id, 'Rejected', remarks);
                                                                        }
                                                                    }}
                                                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                                                                >
                                                                    <XCircle className="w-4 h-4" /> Reject
                                                                </button>
                                                            </>
                                                        )}
                                                        {req.admin_remarks && (
                                                            <span className="text-xs text-gray-500 italic">({req.admin_remarks})</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === 'employees' && (
                                <div className="min-w-full">
                                    <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">Name</th>
                                            <th className="px-6 py-4">Employee ID</th>
                                            <th className="px-6 py-4">Email</th>
                                            <th className="px-6 py-4">Department</th>
                                            <th className="px-6 py-4">Designation</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredUsers.length === 0 ? (
                                            <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400">No employees found.</td></tr>
                                        ) : (
                                            filteredUsers.map((u) => (
                                                <tr key={u._id} className="hover:bg-gray-50 transition">
                                                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                                        {u.profile?.profile_picture_url ? (
                                                            <img
                                                                src={u.profile.profile_picture_url}
                                                                alt={u.profile?.full_name}
                                                                className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.nextSibling.style.display = 'flex';
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div className={`w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-bold ${u.profile?.profile_picture_url ? 'hidden' : ''}`}>
                                                            {u.profile?.full_name?.charAt(0) || 'U'}
                                                        </div>
                                                        {u.profile?.full_name || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600">{u.employee_id}</td>
                                                    <td className="px-6 py-4 text-gray-600">{u.email}</td>
                                                    <td className="px-6 py-4 text-gray-600">{u.profile?.department || '-'}</td>
                                                    <td className="px-6 py-4 text-gray-600">{u.profile?.designation || '-'}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => viewEmployeeProfile(u._id)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium ml-auto"
                                                        >
                                                            <Eye className="w-4 h-4" /> View Profile
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                                </div>
                            )}

                            {activeTab === 'attendance' && (
                                <div className="min-w-full">
                                    <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Employee</th>
                                            <th className="px-6 py-4">Check In</th>
                                            <th className="px-6 py-4">Check Out</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredAttendance.length === 0 ? (
                                            <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400">No attendance records found.</td></tr>
                                        ) : (
                                            filteredAttendance.map((record) => (
                                                <tr key={record._id} className="hover:bg-gray-50 transition">
                                                    <td className="px-6 py-4">{new Date(record.date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs font-bold">
                                                            {record.employee_id?.profile?.full_name?.charAt(0) || record.employee_id?.email?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{record.employee_id?.profile?.full_name || record.employee_id?.email || 'Unknown'}</p>
                                                            <p className="text-xs text-gray-500">{record.employee_id?.employee_id || ''}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {record.check_in ? new Date(record.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {record.check_out ? new Date(record.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            record.status === 'Present' ? 'bg-green-100 text-green-700' :
                                                            record.status === 'Absent' ? 'bg-red-100 text-red-700' :
                                                            record.status === 'Half-day' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                            {record.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{record.total_hours || '-'}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </Layout>
    );
};

export default AdminDashboardEnhanced;

