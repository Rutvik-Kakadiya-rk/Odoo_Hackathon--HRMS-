import { useState, useEffect } from 'react';
import api from '../utils/api';
import { X, Calendar, TrendingUp, Clock, FileText, DollarSign, User, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeePerformanceReport = ({ employeeId, employeeName, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [performance, setPerformance] = useState(null);
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [employee, setEmployee] = useState(null);

    useEffect(() => {
        fetchEmployeeData();
        fetchPerformance();
    }, [employeeId, startDate, endDate]);

    const fetchEmployeeData = async () => {
        try {
            // employeeId can be either MongoDB _id or employee_id string
            // Try to fetch by _id first, then by employee_id
            try {
                const { data } = await api.get(`/users/${employeeId}`);
                if (data) {
                    setEmployee(data);
                    return;
                }
            } catch (err) {
                // If not found by _id, try by employee_id
            }
            
            // Fetch all employees and find by employee_id
            const { data } = await api.get('/employees');
            const employees = data.employees || data || [];
            const emp = employees.find(e => {
                const id = e._id?.toString();
                const empId = employeeId?.toString();
                return id === empId || e.employee_id === employeeId || e.employee_id === empId;
            });
            if (emp) {
                setEmployee(emp);
            }
        } catch (error) {
            console.error('Error fetching employee:', error);
        }
    };

    const fetchPerformance = async () => {
        try {
            setLoading(true);
            // Get the actual employee MongoDB _id
            let empId = employeeId;
            if (employee && employee._id) {
                empId = employee._id;
            } else {
                // If we have employee_id string, fetch the user to get _id
                try {
                    const { data: employeesData } = await api.get('/employees');
                    const employees = employeesData.employees || employeesData || [];
                    const emp = employees.find(e => e._id?.toString() === employeeId || e.employee_id === employeeId);
                    if (emp && emp._id) {
                        empId = emp._id;
                    }
                } catch (err) {
                    console.error('Error finding employee ID:', err);
                }
            }

            // Fetch attendance for the period
            const attendanceRes = await api.get(`/attendance`, {
                params: {
                    employee_id: empId,
                    startDate: startDate,
                    endDate: endDate
                }
            });

            // Fetch leaves for the period
            const leavesRes = await api.get('/leaves', {
                params: {
                    employee_id: empId,
                    startDate: startDate,
                    endDate: endDate
                }
            });

            const attendance = Array.isArray(attendanceRes.data) ? attendanceRes.data : [];
            const leaves = Array.isArray(leavesRes.data) ? leavesRes.data : [];

            // Calculate statistics
            const presentDays = attendance.filter(a => a.status === 'Present').length;
            const absentDays = attendance.filter(a => a.status === 'Absent').length;
            const halfDays = attendance.filter(a => a.status === 'Half-day').length;
            const approvedLeaves = leaves.filter(l => l.status === 'Approved').length;
            const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
            const rejectedLeaves = leaves.filter(l => l.status === 'Rejected').length;

            // Calculate total working hours
            const totalHours = attendance.reduce((sum, a) => {
                return sum + (parseFloat(a.total_hours) || 0);
            }, 0);

            // Calculate attendance rate
            const totalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
            const attendanceRate = totalDays > 0 ? ((presentDays + halfDays * 0.5) / totalDays * 100).toFixed(1) : 0;

            // Get salary data if available
            let salaryData = null;
            if (employee?.salary_structure) {
                const monthlySalary = employee.salary_structure.gross_salary || 0;
                const workingDays = presentDays + (halfDays * 0.5) + approvedLeaves;
                const earnedSalary = totalDays > 0 ? (monthlySalary / 30) * workingDays : 0;
                salaryData = {
                    gross: monthlySalary,
                    earned: earnedSalary,
                    deductions: employee.salary_structure.pf + employee.salary_structure.professional_tax + employee.salary_structure.tds,
                    net: earnedSalary - (employee.salary_structure.pf + employee.salary_structure.professional_tax + employee.salary_structure.tds)
                };
            }

            setPerformance({
                attendance: {
                    present: presentDays,
                    absent: absentDays,
                    halfDay: halfDays,
                    totalDays,
                    totalHours: totalHours.toFixed(2),
                    attendanceRate
                },
                leaves: {
                    approved: approvedLeaves,
                    pending: pendingLeaves,
                    rejected: rejectedLeaves,
                    total: leaves.length
                },
                salary: salaryData,
                attendanceRecords: attendance,
                leaveRecords: leaves
            });
        } catch (error) {
            console.error('Error fetching performance:', error);
            toast.error('Failed to load performance data');
        } finally {
            setLoading(false);
        }
    };

    const downloadReport = () => {
        if (!performance || !employee) return;

        const reportData = {
            Employee: employeeName || employee.profile?.full_name || 'Unknown',
            EmployeeID: employee.employee_id || 'N/A',
            Period: `${startDate} to ${endDate}`,
            Attendance: {
                'Present Days': performance.attendance.present,
                'Absent Days': performance.attendance.absent,
                'Half Days': performance.attendance.halfDay,
                'Total Working Days': performance.attendance.totalDays,
                'Total Hours': performance.attendance.totalHours,
                'Attendance Rate': `${performance.attendance.attendanceRate}%`
            },
            Leaves: {
                'Approved': performance.leaves.approved,
                'Pending': performance.leaves.pending,
                'Rejected': performance.leaves.rejected,
                'Total': performance.leaves.total
            }
        };

        if (performance.salary) {
            reportData.Salary = {
                'Gross Salary': `₹${performance.salary.gross.toLocaleString()}`,
                'Earned Salary': `₹${performance.salary.earned.toLocaleString()}`,
                'Deductions': `₹${performance.salary.deductions.toLocaleString()}`,
                'Net Salary': `₹${performance.salary.net.toLocaleString()}`
            };
        }

        const csv = Object.entries(reportData).map(([key, value]) => {
            if (typeof value === 'object') {
                return [key, '', ...Object.entries(value).map(([k, v]) => `${k},${v}`)].join('\n');
            }
            return `${key},${value}`;
        }).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `performance-report-${employee.employee_id}-${startDate}-to-${endDate}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Report downloaded');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Employee Performance Report</h2>
                        <p className="text-sm text-gray-500 mt-1">{employeeName || 'Employee'}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Date Range Selection */}
                    <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                <label className="text-sm font-medium text-gray-700">From:</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">To:</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <button
                                onClick={fetchPerformance}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                            >
                                Update Report
                            </button>
                            {performance && (
                                <button
                                    onClick={downloadReport}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="text-gray-500">Loading performance data...</div>
                        </div>
                    ) : performance ? (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-5 h-5 text-green-600" />
                                        <p className="text-sm font-medium text-gray-600">Present Days</p>
                                    </div>
                                    <p className="text-2xl font-bold text-green-600">{performance.attendance.present}</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <X className="w-5 h-5 text-red-600" />
                                        <p className="text-sm font-medium text-gray-600">Absent Days</p>
                                    </div>
                                    <p className="text-2xl font-bold text-red-600">{performance.attendance.absent}</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-5 h-5 text-blue-600" />
                                        <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-600">{performance.attendance.attendanceRate}%</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-5 h-5 text-purple-600" />
                                        <p className="text-sm font-medium text-gray-600">Total Hours</p>
                                    </div>
                                    <p className="text-2xl font-bold text-purple-600">{performance.attendance.totalHours}</p>
                                </div>
                            </div>

                            {/* Leaves Summary */}
                            <div className="bg-white p-6 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Leave Summary
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <p className="text-sm text-gray-600">Approved</p>
                                        <p className="text-2xl font-bold text-green-600">{performance.leaves.approved}</p>
                                    </div>
                                    <div className="text-center p-3 bg-amber-50 rounded-lg">
                                        <p className="text-sm text-gray-600">Pending</p>
                                        <p className="text-2xl font-bold text-amber-600">{performance.leaves.pending}</p>
                                    </div>
                                    <div className="text-center p-3 bg-red-50 rounded-lg">
                                        <p className="text-sm text-gray-600">Rejected</p>
                                        <p className="text-2xl font-bold text-red-600">{performance.leaves.rejected}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Salary Information */}
                            {performance.salary && (
                                <div className="bg-white p-6 rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <DollarSign className="w-5 h-5" />
                                        Estimated Salary
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Gross Salary</p>
                                            <p className="text-xl font-bold text-gray-800">₹{performance.salary.gross.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Earned</p>
                                            <p className="text-xl font-bold text-blue-600">₹{performance.salary.earned.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Deductions</p>
                                            <p className="text-xl font-bold text-red-600">₹{performance.salary.deductions.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Net Salary</p>
                                            <p className="text-xl font-bold text-green-600">₹{performance.salary.net.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Attendance Records */}
                            {performance.attendanceRecords.length > 0 && (
                                <div className="bg-white p-6 rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Attendance</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left">Date</th>
                                                    <th className="px-4 py-2 text-left">Check In</th>
                                                    <th className="px-4 py-2 text-left">Check Out</th>
                                                    <th className="px-4 py-2 text-left">Hours</th>
                                                    <th className="px-4 py-2 text-left">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {performance.attendanceRecords.slice(0, 10).map((record, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2">{new Date(record.date).toLocaleDateString()}</td>
                                                        <td className="px-4 py-2">
                                                            {record.check_in ? new Date(record.check_in).toLocaleTimeString() : '-'}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {record.check_out ? new Date(record.check_out).toLocaleTimeString() : '-'}
                                                        </td>
                                                        <td className="px-4 py-2">{record.total_hours || '-'}</td>
                                                        <td className="px-4 py-2">
                                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                                record.status === 'Present' ? 'bg-green-100 text-green-700' :
                                                                record.status === 'Absent' ? 'bg-red-100 text-red-700' :
                                                                'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                                {record.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">No performance data available</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeePerformanceReport;

