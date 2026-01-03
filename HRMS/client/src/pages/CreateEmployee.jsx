import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, UserPlus, Save, Copy, Check, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateEmployee = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [credentials, setCredentials] = useState(null);
    const [copied, setCopied] = useState(false);
    const [teams, setTeams] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        department: '',
        designation: '',
        date_of_joining: new Date().toISOString().split('T')[0],
        gender: '',
        role: 'Employee',
        team: '', // Team assignment
        salary_structure: {
            basic: 0,
            hra: 0,
            conveyance: 0,
            medical: 0,
            special_allowance: 0,
            pf: 0,
            professional_tax: 0,
            tds: 0,
        }
    });

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const { data } = await api.get('/teams');
            // Only show approved teams
            const approvedTeams = (data.teams || []).filter(t => t.status === 'Approved');
            setTeams(approvedTeams);
        } catch (error) {
            console.error('Failed to fetch teams');
        }
    };

    const validatePassword = (password) => {
        if (!password) return 'Password is required';
        const minLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (!minLength) return 'Password must be at least 8 characters long';
        if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
        if (!hasLowerCase) return 'Password must contain at least one lowercase letter';
        if (!hasNumber) return 'Password must contain at least one number';
        if (!hasSpecialChar) return 'Password must contain at least one special character';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate password
        if (formData.password) {
            const passwordErr = validatePassword(formData.password);
            if (passwordErr) {
                setPasswordError(passwordErr);
                toast.error(passwordErr);
                return;
            }
        } else {
            setPasswordError('Password is required');
            toast.error('Password is required');
            return;
        }
        
        setLoading(true);
        setPasswordError('');
        try {
            const { data } = await api.post('/employees', formData);
            setCredentials({
                employee_id: data.employee?.employee_id || data.credentials?.employee_id,
                email: data.employee?.email || data.credentials?.email,
                password: formData.password
            });
            toast.success('Employee created successfully! Save the credentials shown below.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create employee');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const calculateSalary = () => {
        const gross = formData.salary_structure.basic +
            formData.salary_structure.hra +
            formData.salary_structure.conveyance +
            formData.salary_structure.medical +
            formData.salary_structure.special_allowance;
        
        const net = gross -
            formData.salary_structure.pf -
            formData.salary_structure.professional_tax -
            formData.salary_structure.tds;

        return { gross, net };
    };

    const salary = calculateSalary();

    return (
        <Layout>
            <div className="mb-8">
                <button 
                    onClick={() => {
                        const dashboardPath = user?.role === 'Admin' || user?.role === 'HR Officer' 
                            ? '/admin-dashboard' 
                            : '/employee-dashboard';
                        navigate(dashboardPath);
                    }} 
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Dashboard
                </button>
                <h1 className="text-3xl font-bold text-gray-800">Create New Employee</h1>
                <p className="text-gray-500 mt-1">Add a new employee to the system</p>
            </div>

            {credentials ? (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <Check className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Employee Created Successfully!</h2>
                                <p className="text-gray-600">Save these credentials. They will not be shown again.</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Employee ID</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        type="text"
                                        readOnly
                                        value={credentials.employee_id}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(credentials.employee_id)}
                                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                                    >
                                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Email</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        type="text"
                                        readOnly
                                        value={credentials.email}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(credentials.email)}
                                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                                    >
                                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Password</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        type="text"
                                        readOnly
                                        value={credentials.password || 'As set during creation'}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono"
                                    />
                                    {credentials.password && credentials.password !== 'As set during creation' && (
                                        <button
                                            onClick={() => copyToClipboard(credentials.password)}
                                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                                        >
                                            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex gap-3">
                            <button
                                onClick={() => {
                                    setCredentials(null);
                                    setPasswordError('');
                                    setFormData({
                                        first_name: '',
                                        last_name: '',
                                        email: '',
                                        phone: '',
                                        password: '',
                                        department: '',
                                        designation: '',
                                        date_of_joining: new Date().toISOString().split('T')[0],
                                        gender: '',
                                        role: 'Employee',
                                        team: '',
                                        salary_structure: {
                                            basic: 0,
                                            hra: 0,
                                            conveyance: 0,
                                            medical: 0,
                                            special_allowance: 0,
                                            pf: 0,
                                            professional_tax: 0,
                                            tds: 0,
                                        }
                                    });
                                }}
                                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                            >
                                Create Another
                            </button>
                            <button
                                onClick={() => navigate('/admin-dashboard')}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Information */}
                        <div className="md:col-span-2">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Personal Information</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className={`w-full px-4 py-2 border ${passwordError ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10`}
                                    value={formData.password}
                                    onChange={(e) => {
                                        setFormData({ ...formData, password: e.target.value });
                                        if (passwordError) {
                                            const err = validatePassword(e.target.value);
                                            setPasswordError(err || '');
                                        }
                                    }}
                                    placeholder="Enter password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {passwordError && (
                                <p className="text-xs text-red-600 mt-1">{passwordError}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                                Must be 8+ characters with uppercase, lowercase, number & special character
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="tel"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            >
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
                            <input
                                type="date"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.date_of_joining}
                                onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                            />
                        </div>

                        {/* Employment Information */}
                        <div className="md:col-span-2 mt-4">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Employment Information</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.designation}
                                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                            />
                        </div>

                        {user?.role === 'Admin' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="Employee">Employee</option>
                                    <option value="HR Officer">HR Officer</option>
                                </select>
                            </div>
                        )}

                        {formData.role === 'Employee' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Team *</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.team}
                                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                                >
                                    <option value="">Select a Team</option>
                                    {teams.map(team => (
                                        <option key={team._id} value={team._id}>
                                            {team.team_name} {team.team_leader?.profile?.full_name ? `(Leader: ${team.team_leader.profile.full_name})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {teams.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1">No approved teams available. Create a team first.</p>
                                )}
                            </div>
                        )}

                        {/* Salary Structure */}
                        <div className="md:col-span-2 mt-4">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Salary Structure</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.salary_structure.basic}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    salary_structure: { ...formData.salary_structure, basic: parseFloat(e.target.value) || 0 }
                                })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">HRA</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.salary_structure.hra}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    salary_structure: { ...formData.salary_structure, hra: parseFloat(e.target.value) || 0 }
                                })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Conveyance</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.salary_structure.conveyance}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    salary_structure: { ...formData.salary_structure, conveyance: parseFloat(e.target.value) || 0 }
                                })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Medical</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.salary_structure.medical}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    salary_structure: { ...formData.salary_structure, medical: parseFloat(e.target.value) || 0 }
                                })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Special Allowance</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.salary_structure.special_allowance}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    salary_structure: { ...formData.salary_structure, special_allowance: parseFloat(e.target.value) || 0 }
                                })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PF</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.salary_structure.pf}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    salary_structure: { ...formData.salary_structure, pf: parseFloat(e.target.value) || 0 }
                                })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Professional Tax</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.salary_structure.professional_tax}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    salary_structure: { ...formData.salary_structure, professional_tax: parseFloat(e.target.value) || 0 }
                                })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">TDS</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.salary_structure.tds}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    salary_structure: { ...formData.salary_structure, tds: parseFloat(e.target.value) || 0 }
                                })}
                            />
                        </div>

                        {/* Salary Summary */}
                        <div className="md:col-span-2 mt-4 p-4 bg-blue-50 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Gross Salary</label>
                                    <p className="text-xl font-bold text-gray-800">₹{salary.gross.toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Net Salary</label>
                                    <p className="text-xl font-bold text-green-600">₹{salary.net.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 mt-6 flex gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                <UserPlus className="w-5 h-5" />
                                {loading ? 'Creating...' : 'Create Employee'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/admin-dashboard')}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </Layout>
    );
};

export default CreateEmployee;

