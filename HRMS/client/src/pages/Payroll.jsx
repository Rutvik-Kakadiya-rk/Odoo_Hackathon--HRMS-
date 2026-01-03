import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/Layout';
import { ArrowLeft, DollarSign, Download, Eye, Search, FileText, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Payroll = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [payroll, setPayroll] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [salarySlip, setSalarySlip] = useState(null);
    const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
    const [showSlipModal, setShowSlipModal] = useState(false);

    useEffect(() => {
        fetchPayroll();
    }, []);

    const fetchPayroll = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/payroll');
            setPayroll(data.payroll || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load payroll data');
        } finally {
            setLoading(false);
        }
    };

    const fetchSalarySlip = async (employeeId, month, year) => {
        try {
            const { data } = await api.get(`/payroll/salary-slip/${employeeId}`, {
                params: { month, year }
            });
            setSalarySlip(data.salary_slip);
            setShowSlipModal(true);
        } catch (error) {
            toast.error('Failed to generate salary slip');
        }
    };

    const downloadSalarySlip = async (employeeId) => {
        try {
            const [month, year] = monthFilter.split('-');
            const { data } = await api.get(`/payroll/salary-slip/${employeeId}`, {
                params: { month, year }
            });

            // Create a printable HTML format
            const slip = data.salary_slip;
            const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Salary Slip - ${slip.employee.name}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .info { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .total { font-weight: bold; font-size: 18px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Salary Slip</h1>
        <p>${slip.period.monthName} ${slip.period.year}</p>
    </div>
    <div class="info">
        <p><strong>Employee ID:</strong> ${slip.employee.employee_id}</p>
        <p><strong>Name:</strong> ${slip.employee.name}</p>
        <p><strong>Department:</strong> ${slip.employee.department}</p>
        <p><strong>Designation:</strong> ${slip.employee.designation}</p>
        <p><strong>Team:</strong> ${slip.employee.team}</p>
    </div>
    <table>
        <tr><th colspan="2">Attendance</th></tr>
        <tr><td>Total Days</td><td>${slip.attendance.total_days}</td></tr>
        <tr><td>Working Days</td><td>${slip.attendance.working_days}</td></tr>
        <tr><td>Absent Days</td><td>${slip.attendance.absent_days}</td></tr>
        <tr><td>Present Days</td><td>${slip.attendance.present_days}</td></tr>
        <tr><td>Half Days</td><td>${slip.attendance.half_days}</td></tr>
    </table>
    <table>
        <tr><th colspan="2">Earnings</th></tr>
        <tr><td>Basic</td><td>₹${slip.earnings.basic.toLocaleString()}</td></tr>
        <tr><td>HRA</td><td>₹${slip.earnings.hra.toLocaleString()}</td></tr>
        <tr><td>Conveyance</td><td>₹${slip.earnings.conveyance.toLocaleString()}</td></tr>
        <tr><td>Medical</td><td>₹${slip.earnings.medical.toLocaleString()}</td></tr>
        <tr><td>Special Allowance</td><td>₹${slip.earnings.special_allowance.toLocaleString()}</td></tr>
        <tr class="total"><td>Gross Salary</td><td>₹${slip.earnings.gross_salary.toLocaleString()}</td></tr>
        <tr><td>Earned Salary</td><td>₹${slip.earnings.earned_salary.toLocaleString()}</td></tr>
    </table>
    <table>
        <tr><th colspan="2">Deductions</th></tr>
        <tr><td>PF</td><td>₹${slip.deductions.pf.toLocaleString()}</td></tr>
        <tr><td>Professional Tax</td><td>₹${slip.deductions.professional_tax.toLocaleString()}</td></tr>
        <tr><td>TDS</td><td>₹${slip.deductions.tds.toLocaleString()}</td></tr>
        <tr class="total"><td>Total Deductions</td><td>₹${slip.deductions.total_deductions.toLocaleString()}</td></tr>
    </table>
    <div class="total" style="text-align: right; margin-top: 20px;">
        <p>Net Salary: ₹${slip.net_salary.toLocaleString()}</p>
    </div>
</body>
</html>`;

            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `salary-slip-${employeeId}-${monthFilter}.html`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('Salary slip downloaded');
        } catch (error) {
            toast.error('Failed to download salary slip');
        }
    };

    const filteredPayroll = payroll.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">Loading...</div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="mb-8">

                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Payroll Management</h1>
                        <p className="text-gray-500 mt-1">View and manage employee payroll</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="month"
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button
                            onClick={fetchPayroll}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name, employee ID, or department..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Payroll Table */}
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
                                <th className="px-6 py-4">Net Salary</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredPayroll.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                                        No payroll records found.
                                    </td>
                                </tr>
                            ) : (
                                filteredPayroll.map((p) => (
                                    <tr key={p.employee_id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {p.profile_picture_url ? (
                                                    <img
                                                        src={p.profile_picture_url}
                                                        alt={p.name}
                                                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div className={`w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm ${p.profile_picture_url ? 'hidden' : ''}`}>
                                                    {p.name?.charAt(0) || 'E'}
                                                </div>
                                                <span className="font-medium text-gray-900">{p.name || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{p.employee_id}</td>
                                        <td className="px-6 py-4 text-gray-600">{p.department || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">{p.team || '-'}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-800">
                                            ₹{p.gross_salary?.toLocaleString() || '0'}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-green-600">
                                            ₹{p.net_salary?.toLocaleString() || '0'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        const [month, year] = monthFilter.split('-');
                                                        fetchSalarySlip(p.employee_id, month, year);
                                                    }}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                                                >
                                                    <Eye className="w-4 h-4" /> View
                                                </button>
                                                <button
                                                    onClick={() => downloadSalarySlip(p.employee_id)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm font-medium"
                                                >
                                                    <Download className="w-4 h-4" /> Download
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Salary Slip Modal */}
            {showSlipModal && salarySlip && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-2xl font-bold text-gray-800">Salary Slip</h2>
                            <button
                                onClick={() => setShowSlipModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800">Dayflow HRMS</h3>
                                <p className="text-gray-600">Salary Slip for {salarySlip.period.monthName} {salarySlip.period.year}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <p className="text-sm text-gray-500">Employee ID</p>
                                    <p className="font-semibold">{salarySlip.employee.employee_id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Name</p>
                                    <p className="font-semibold">{salarySlip.employee.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Department</p>
                                    <p className="font-semibold">{salarySlip.employee.department}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Designation</p>
                                    <p className="font-semibold">{salarySlip.employee.designation}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Team</p>
                                    <p className="font-semibold">{salarySlip.employee.team}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-bold mb-3">Attendance</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Total Days:</span>
                                            <span className="font-semibold">{salarySlip.attendance.total_days}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Working Days:</span>
                                            <span className="font-semibold text-green-600">{salarySlip.attendance.working_days}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Absent Days:</span>
                                            <span className="font-semibold text-red-600">{salarySlip.attendance.absent_days}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h4 className="font-bold mb-3">Earnings</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Basic:</span>
                                            <span className="font-semibold">₹{salarySlip.earnings.basic.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>HRA:</span>
                                            <span className="font-semibold">₹{salarySlip.earnings.hra.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Gross Salary:</span>
                                            <span className="font-semibold">₹{salarySlip.earnings.gross_salary.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-red-50 p-4 rounded-lg">
                                    <h4 className="font-bold mb-3">Deductions</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>PF:</span>
                                            <span className="font-semibold">₹{salarySlip.deductions.pf.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Professional Tax:</span>
                                            <span className="font-semibold">₹{salarySlip.deductions.professional_tax.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>TDS:</span>
                                            <span className="font-semibold">₹{salarySlip.deductions.tds.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <h4 className="font-bold mb-3">Net Salary</h4>
                                    <div className="text-2xl font-bold text-green-600">
                                        ₹{salarySlip.net_salary.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowSlipModal(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => downloadSalarySlip(salarySlip.employee.employee_id)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Payroll;

