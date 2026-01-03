import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/Layout';
import { ArrowLeft, BarChart3, Download, FileText, Calendar, TrendingUp, Users, Clock, DollarSign, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import EmployeePerformanceReport from '../components/EmployeePerformanceReport';

const Reports = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('payroll'); // 'payroll', 'attendance'
    const [loading, setLoading] = useState(false);
    const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [payrollReport, setPayrollReport] = useState(null);
    const [attendanceReport, setAttendanceReport] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showPerformanceReport, setShowPerformanceReport] = useState(false);

    useEffect(() => {
        if (activeTab === 'payroll') {
            fetchPayrollReport();
        } else {
            fetchAttendanceReport();
        }
    }, [activeTab, monthFilter, departmentFilter]);

    const fetchPayrollReport = async () => {
        try {
            setLoading(true);
            const params = {
                month: monthFilter.split('-')[1],
                year: monthFilter.split('-')[0],
            };
            if (departmentFilter) {
                params.department = departmentFilter;
            }
            const { data } = await api.get('/payroll/report', { params });
            setPayrollReport(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load payroll report');
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendanceReport = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/attendance?month=${monthFilter}`);
            setAttendanceReport(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load attendance report');
        } finally {
            setLoading(false);
        }
    };

    const downloadPayrollReport = () => {
        if (!payrollReport) return;

        const csv = [
            ['Employee ID', 'Name', 'Department', 'Team', 'Gross Salary', 'Working Days', 'Earned Salary', 'Deductions', 'Net Salary'].join(','),
            ...payrollReport.employees.map(emp => [
                `"${emp.employee_id}"`,
                `"${emp.name}"`,
                `"${emp.department || ''}"`,
                `"${emp.team || ''}"`,
                emp.gross_salary?.toFixed(2) || '0',
                emp.working_days || 0,
                emp.earned_salary?.toFixed(2) || '0',
                emp.deductions?.toFixed(2) || '0',
                emp.net_salary?.toFixed(2) || '0'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payroll-report-${payrollReport.period?.monthName}-${payrollReport.period?.year}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Payroll report downloaded');
    };

    const downloadAttendanceReport = () => {
        if (!attendanceReport || !Array.isArray(attendanceReport)) return;

        const csv = [
            ['Date', 'Employee ID', 'Employee Name', 'Check In', 'Check Out', 'Status', 'Hours'].join(','),
            ...attendanceReport.map(record => [
                new Date(record.date).toLocaleDateString(),
                record.employee_id?.employee_id || '',
                record.employee_id?.profile?.full_name || '',
                record.check_in ? new Date(record.check_in).toLocaleTimeString() : '',
                record.check_out ? new Date(record.check_out).toLocaleTimeString() : '',
                record.status,
                record.total_hours || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance-report-${monthFilter}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Attendance report downloaded');
    };

    return (
        <Layout>
            <div className="mb-8">
                <button 
                    onClick={() => navigate('/admin-dashboard')}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Dashboard
                </button>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
                        <p className="text-gray-500 mt-1">View detailed reports and analytics</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="month"
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {activeTab === 'payroll' && (
                            <input
                                type="text"
                                placeholder="Department (optional)"
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        )}
                        <button
                            onClick={activeTab === 'payroll' ? downloadPayrollReport : downloadAttendanceReport}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                            disabled={loading || (activeTab === 'payroll' ? !payrollReport : !attendanceReport)}
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className="border-b border-gray-100 px-6 py-4 flex gap-6">
                    <button
                        onClick={() => setActiveTab('payroll')}
                        className={`pb-2 text-sm font-medium transition border-b-2 ${
                            activeTab === 'payroll'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Payroll Report
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`pb-2 text-sm font-medium transition border-b-2 ${
                            activeTab === 'attendance'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Attendance Report
                    </button>
                </div>
            </div>

            {/* Payroll Report */}
            {activeTab === 'payroll' && (
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">Loading...</div>
                    ) : payrollReport ? (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Users className="w-5 h-5 text-blue-500" />
                                        <p className="text-sm font-medium text-gray-500">Total Employees</p>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800">
                                        {payrollReport.summary.total_employees}
                                    </h3>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <TrendingUp className="w-5 h-5 text-green-500" />
                                        <p className="text-sm font-medium text-gray-500">Total Gross</p>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800">
                                        ₹{payrollReport.summary.total_gross?.toLocaleString() || '0'}
                                    </h3>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <DollarSign className="w-5 h-5 text-purple-500" />
                                        <p className="text-sm font-medium text-gray-500">Total Earned</p>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800">
                                        ₹{payrollReport.summary.total_earned?.toLocaleString() || '0'}
                                    </h3>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <FileText className="w-5 h-5 text-red-500" />
                                        <p className="text-sm font-medium text-gray-500">Total Net</p>
                                    </div>
                                    <h3 className="text-2xl font-bold text-green-600">
                                        ₹{payrollReport.summary.total_net?.toLocaleString() || '0'}
                                    </h3>
                                </div>
                            </div>

                            {/* Report Period */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <p className="text-sm text-gray-600">
                                    <strong>Period:</strong> {payrollReport.period?.monthName} {payrollReport.period?.year}
                                </p>
                            </div>

                            {/* Employee Payroll Table */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                        <tr>
                                                <th className="px-6 py-4">Employee</th>
                                                <th className="px-6 py-4">Employee ID</th>
                                                <th className="px-6 py-4">Department</th>
                                                <th className="px-6 py-4">Team</th>
                                                <th className="px-6 py-4">Gross Salary</th>
                                                <th className="px-6 py-4">Working Days</th>
                                                <th className="px-6 py-4">Earned Salary</th>
                                                <th className="px-6 py-4">Deductions</th>
                                                <th className="px-6 py-4">Net Salary</th>
                                                <th className="px-6 py-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {payrollReport.employees?.map((emp, idx) => (
                                            <tr 
                                                key={idx} 
                                                className="hover:bg-gray-50 transition cursor-pointer"
                                                onClick={async () => {
                                                    try {
                                                        // Find employee ID from employee list
                                                        const { data } = await api.get('/employees');
                                                        const employees = data.employees || data;
                                                        const employee = employees.find(e => e.employee_id === emp.employee_id || e._id?.toString() === emp.employee_id);
                                                        if (employee && employee._id) {
                                                            setSelectedEmployee({ id: employee._id, name: emp.name });
                                                            setShowPerformanceReport(true);
                                                        } else {
                                                            toast.error('Could not find employee details');
                                                        }
                                                    } catch (err) {
                                                        toast.error('Could not load employee details');
                                                    }
                                                }}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {emp.profile_picture_url ? (
                                                            <img
                                                                src={emp.profile_picture_url}
                                                                alt={emp.name}
                                                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.nextSibling.style.display = 'flex';
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div className={`w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm ${emp.profile_picture_url ? 'hidden' : ''}`}>
                                                            {emp.name?.charAt(0) || 'E'}
                                                        </div>
                                                        <span className="font-medium text-gray-900">{emp.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{emp.employee_id}</td>
                                                <td className="px-6 py-4 text-gray-600">{emp.department || '-'}</td>
                                                <td className="px-6 py-4 text-gray-600">{emp.team || '-'}</td>
                                                <td className="px-6 py-4 font-semibold">
                                                    ₹{emp.gross_salary?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{emp.working_days || 0}</td>
                                                <td className="px-6 py-4 font-semibold">
                                                    ₹{emp.earned_salary?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'}
                                                </td>
                                                <td className="px-6 py-4 text-red-600">
                                                    ₹{emp.deductions?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'}
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-green-600">
                                                    ₹{emp.net_salary?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            try {
                                                                const { data } = await api.get('/employees');
                                                                const employees = data.employees || data;
                                                                const employee = employees.find(e => e.employee_id === emp.employee_id || e._id?.toString() === emp.employee_id);
                                                                if (employee && employee._id) {
                                                                    setSelectedEmployee({ id: employee._id, name: emp.name });
                                                                    setShowPerformanceReport(true);
                                                                } else {
                                                                    toast.error('Could not find employee details');
                                                                }
                                                            } catch (err) {
                                                                toast.error('Could not load employee details');
                                                            }
                                                        }}
                                                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium flex items-center gap-1"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 text-gray-400">No payroll report data available</div>
                    )}
                </div>
            )}

            {/* Attendance Report */}
            {activeTab === 'attendance' && (
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">Loading...</div>
                    ) : attendanceReport && Array.isArray(attendanceReport) ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Employee ID</th>
                                            <th className="px-6 py-4">Employee Name</th>
                                            <th className="px-6 py-4">Department</th>
                                            <th className="px-6 py-4">Check In</th>
                                            <th className="px-6 py-4">Check Out</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {attendanceReport.map((record) => (
                                            <tr key={record._id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4">
                                                    {new Date(record.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {record.employee_id?.employee_id || '-'}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {record.employee_id?.profile?.full_name || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {record.employee_id?.profile?.department || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {record.check_in
                                                        ? new Date(record.check_in).toLocaleTimeString('en-US', {
                                                              hour: '2-digit',
                                                              minute: '2-digit'
                                                          })
                                                        : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {record.check_out
                                                        ? new Date(record.check_out).toLocaleTimeString('en-US', {
                                                              hour: '2-digit',
                                                              minute: '2-digit'
                                                          })
                                                        : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`px-2 py-1 text-xs rounded-full ${
                                                            record.status === 'Present'
                                                                ? 'bg-green-100 text-green-700'
                                                                : record.status === 'Absent'
                                                                ? 'bg-red-100 text-red-700'
                                                                : record.status === 'Half-day'
                                                                ? 'bg-yellow-100 text-yellow-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                        }`}
                                                    >
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {record.total_hours || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">No attendance report data available</div>
                    )}
                </div>
            )}

            {/* Employee Performance Report Modal */}
            {showPerformanceReport && selectedEmployee && (
                <EmployeePerformanceReport
                    employeeId={selectedEmployee.id}
                    employeeName={selectedEmployee.name}
                    onClose={() => {
                        setShowPerformanceReport(false);
                        setSelectedEmployee(null);
                    }}
                />
            )}
        </Layout>
    );
};

export default Reports;

