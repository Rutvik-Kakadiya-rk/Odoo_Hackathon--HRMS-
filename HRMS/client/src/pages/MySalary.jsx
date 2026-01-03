import { useState, useEffect } from 'react';
import api from '../utils/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { DollarSign, Download, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MySalary = () => {
    const { user } = useAuth();
    const [salarySlip, setSalarySlip] = useState(null);
    const [loading, setLoading] = useState(false);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        if (user?.employee_id) {
            fetchSalarySlip();
        }
    }, [user, month, year]);

    const fetchSalarySlip = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/payroll/salary-slip/${user.employee_id}`, {
                params: { month, year }
            });
            setSalarySlip(data.salary_slip);
        } catch (error) {
            console.error(error);
            setSalarySlip(null);
        } finally {
            setLoading(false);
        }
    };

    const downloadSalarySlip = () => {
        if (!salarySlip) return;

        const doc = new jsPDF();

        // Header
        doc.setFillColor(37, 99, 235); // Blue
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('Salary Slip', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`${salarySlip.period.monthName} ${salarySlip.period.year}`, 105, 30, { align: 'center' });

        // User Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.text(`Name: ${salarySlip.employee.name}`, 14, 50);
        doc.text(`Employee ID: ${salarySlip.employee.employee_id}`, 14, 56);
        doc.text(`Department: ${salarySlip.employee.department}`, 14, 62);
        doc.text(`Designation: ${salarySlip.employee.designation}`, 150, 50);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 56);

        // Earnings Table
        autoTable(doc, {
            startY: 70,
            head: [['Earnings', 'Amount (INR)']],
            body: [
                ['Basic Salary', salarySlip.earnings.basic.toLocaleString()],
                ['HRA', salarySlip.earnings.hra.toLocaleString()],
                ['Conveyance', salarySlip.earnings.conveyance.toLocaleString()],
                ['Medical Allowance', salarySlip.earnings.medical.toLocaleString()],
                ['Special Allowance', salarySlip.earnings.special_allowance.toLocaleString()],
                ['Gross Salary', { content: salarySlip.earnings.gross_salary.toLocaleString(), styles: { fontStyle: 'bold' } }],
            ],
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] }
        });

        // Deductions Table
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Deductions', 'Amount (INR)']],
            body: [
                ['Provident Fund', salarySlip.deductions.pf.toLocaleString()],
                ['Professional Tax', salarySlip.deductions.professional_tax.toLocaleString()],
                ['TDS', salarySlip.deductions.tds.toLocaleString()],
                ['Total Deductions', { content: salarySlip.deductions.total_deductions.toLocaleString(), styles: { fontStyle: 'bold' } }],
            ],
            theme: 'grid',
            headStyles: { fillColor: [220, 38, 38] } // Red for deductions
        });

        // Net Salary
        doc.setFontSize(14);
        doc.setTextColor(37, 99, 235);
        doc.text(`Net Salary: INR ${salarySlip.net_salary.toLocaleString()}`, 14, doc.lastAutoTable.finalY + 20);

        doc.save(`SalarySlip_${salarySlip.period.monthName}_${salarySlip.period.year}.pdf`);
        toast.success('Salary slip downloaded successfully');
    };

    return (
        <Layout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Salary</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">View your salary details and download slips</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-8 transition-colors">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-full sm:w-auto">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Month</label>
                        <select
                            value={month}
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full sm:w-auto">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Year</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            {[2023, 2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading salary details...</div>
            ) : salarySlip ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Summary Card */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                <DollarSign className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <p className="text-blue-100 font-medium">Net Salary</p>
                                <h2 className="text-3xl font-bold">₹{salarySlip.net_salary.toLocaleString()}</h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <div>
                                <p className="text-blue-200 text-sm">Earnings</p>
                                <p className="font-bold text-lg">₹{salarySlip.earnings.gross_salary.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-blue-200 text-sm">Deductions</p>
                                <p className="font-bold text-lg">₹{salarySlip.deductions.total_deductions.toLocaleString()}</p>
                            </div>
                        </div>

                        <button
                            onClick={downloadSalarySlip}
                            className="mt-6 w-full py-3 bg-white text-blue-700 rounded-xl font-bold hover:bg-blue-50 transition flex items-center justify-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            Download PDF Salary Slip
                        </button>
                    </div>

                    {/* Details Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between transition-colors">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                                Salary Breakdown
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors">
                                    <span className="text-gray-600 dark:text-gray-400">Basic Pay</span>
                                    <span className="font-medium text-gray-900 dark:text-white">₹{salarySlip.earnings.basic.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors">
                                    <span className="text-gray-600 dark:text-gray-400">House Rent Allowance</span>
                                    <span className="font-medium text-gray-900 dark:text-white">₹{salarySlip.earnings.hra.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors">
                                    <span className="text-gray-600 dark:text-gray-400">Special Allowance</span>
                                    <span className="font-medium text-gray-900 dark:text-white">₹{salarySlip.earnings.special_allowance.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-purple-600" />
                                Attendance
                            </h3>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                                    <p className="text-blue-600 dark:text-blue-400 font-bold">{salarySlip.attendance.working_days}</p>
                                    <p className="text-xs text-blue-500 dark:text-blue-300">Working</p>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                                    <p className="text-green-600 dark:text-green-400 font-bold">{salarySlip.attendance.present_days}</p>
                                    <p className="text-xs text-green-500 dark:text-green-300">Present</p>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                                    <p className="text-red-600 dark:text-red-400 font-bold">{salarySlip.attendance.absent_days}</p>
                                    <p className="text-xs text-red-500 dark:text-red-300">Absent</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 transition-colors">
                    <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No salary slip generated for this month.</p>
                </div>
            )}
        </Layout>
    );
};

export default MySalary;
