import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Edit2, Save, X, Upload } from 'lucide-react';
import api from '../utils/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { compressImage } from '../utils/imageCompressor';

const EmployeeView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const [employee, setEmployee] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({});
    const [salaryData, setSalaryData] = useState({});

    const isAdminOrHR = authUser?.role === 'Admin' || authUser?.role === 'HR Officer';

    useEffect(() => {
        if (!isAdminOrHR) {
            navigate('/admin-dashboard');
            return;
        }
        fetchEmployee();
    }, [id]);

    const fetchEmployee = async () => {
        try {
            const { data } = await api.get(`/users/${id}`);
            setEmployee(data);
            setFormData({
                full_name: data.profile?.full_name || '',
                first_name: data.profile?.first_name || '',
                last_name: data.profile?.last_name || '',
                phone: data.profile?.phone || '',
                address: data.profile?.address || '',
                date_of_birth: data.profile?.date_of_birth ? new Date(data.profile.date_of_birth).toISOString().split('T')[0] : '',
                gender: data.profile?.gender || '',
                marital_status: data.profile?.marital_status || '',
                job_title: data.profile?.job_title || '',
                designation: data.profile?.designation || '',
                department: data.profile?.department || '',
                date_of_joining: data.profile?.date_of_joining ? new Date(data.profile.date_of_joining).toISOString().split('T')[0] : '',
                bank_account_number: data.profile?.bank_account_number || '',
                pan_number: data.profile?.pan_number || '',
                aadhar_number: data.profile?.aadhar_number || '',
                profile_picture_url: data.profile?.profile_picture_url || '',
            });
            setSalaryData(data.salary_structure || {});
        } catch (error) {
            console.error(error);
            alert('Failed to load employee data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            // Ensure profile_picture_url is included in the update
            const updateData = {
                profile: {
                    ...formData,
                    profile_picture_url: formData.profile_picture_url || employee.profile?.profile_picture_url
                }
            };

            await api.put(`/users/${id}`, updateData);

            // Update global auth context if the updated user is the current user
            if (authUser._id === id) {
                updateUser({
                    name: formData.full_name || employee.profile.full_name,
                    profile_picture: formData.profile_picture_url || employee.profile.profile_picture_url
                });
            }

            setIsEditing(false);
            await fetchEmployee();
            toast.success('Employee profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        }
    };

    const handleSalaryUpdate = async () => {
        try {
            await api.put(`/users/${id}`, {
                salary_structure: salaryData,
            });
            fetchEmployee();
            alert('Salary structure updated successfully');
        } catch (error) {
            alert('Failed to update salary structure');
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">Loading...</div>
            </Layout>
        );
    }

    if (!employee) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">Employee not found</div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="mb-8">

                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-800">Employee Profile</h1>
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            <Edit2 className="w-4 h-4" />
                            Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            >
                                <Save className="w-4 h-4" />
                                Save
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    fetchEmployee();
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Picture & Basic Info */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center mb-4 overflow-hidden border-4 border-white shadow-lg relative">
                                {(formData.profile_picture_url && formData.profile_picture_url.startsWith('data:image')) || employee.profile?.profile_picture_url ? (
                                    <img
                                        src={formData.profile_picture_url || employee.profile.profile_picture_url}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div className={`w-full h-full rounded-full flex items-center justify-center ${(formData.profile_picture_url || employee.profile?.profile_picture_url) ? 'hidden' : ''}`}>
                                    <User className="w-16 h-16 text-blue-600" />
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">{employee.profile?.full_name || 'N/A'}</h2>
                            <p className="text-gray-500">{employee.profile?.job_title || employee.profile?.designation || 'Employee'}</p>
                            <p className="text-sm text-gray-400 mt-1">{employee.profile?.department || 'N/A'}</p>
                        </div>

                        {isEditing && (
                            <div className="mb-4 space-y-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Profile Picture</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    id="employee-profile-upload"
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;

                                        if (file.size > 10 * 1024 * 1024) {
                                            toast.error('File size must be less than 10MB');
                                            e.target.value = '';
                                            return;
                                        }

                                        // Check if it's an image
                                        if (!file.type.startsWith('image/')) {
                                            toast.error('Please select an image file');
                                            e.target.value = '';
                                            return;
                                        }

                                        try {
                                            toast.loading('Compressing image...', { id: 'compress' });
                                            const compressedBase64 = await compressImage(file, 800, 800, 0.8);
                                            setFormData({ ...formData, profile_picture_url: compressedBase64 });
                                            toast.success('Image loaded successfully', { id: 'compress' });
                                        } catch (error) {
                                            toast.error('Error processing image', { id: 'compress' });
                                            e.target.value = '';
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm cursor-pointer"
                                />
                                <p className="text-xs text-gray-500">Upload an image file (Max 5MB). Supports: JPG, PNG, GIF, WebP</p>
                                {formData.profile_picture_url && formData.profile_picture_url.startsWith('data:image') && (
                                    <div className="mt-2">
                                        <p className="text-xs text-green-600 mb-1">✓ Image ready to upload</p>
                                        <img
                                            src={formData.profile_picture_url}
                                            alt="Preview"
                                            className="w-20 h-20 rounded-lg object-cover border border-gray-300"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-3 pt-4 border-t border-gray-100">
                            <div>
                                <p className="text-xs text-gray-500">Employee ID</p>
                                <p className="font-semibold text-gray-800">{employee.employee_id}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="font-semibold text-gray-800">{employee.email}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Role</p>
                                <p className="font-semibold text-gray-800">{employee.role}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Personal & Employment Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Personal Details */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Personal Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {isEditing ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.full_name || ''}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.date_of_birth || ''}
                                            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.gender || ''}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        >
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.marital_status || ''}
                                            onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                                        >
                                            <option value="">Select</option>
                                            <option value="Single">Single</option>
                                            <option value="Married">Married</option>
                                            <option value="Divorced">Divorced</option>
                                            <option value="Widowed">Widowed</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.phone || ''}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                        <textarea
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            rows="2"
                                            value={formData.address || ''}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">Full Name</label>
                                        <p className="font-semibold text-gray-800">{employee.profile?.full_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">Date of Birth</label>
                                        <p className="font-semibold text-gray-800">
                                            {employee.profile?.date_of_birth
                                                ? new Date(employee.profile.date_of_birth).toLocaleDateString()
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">Gender</label>
                                        <p className="font-semibold text-gray-800">{employee.profile?.gender || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">Marital Status</label>
                                        <p className="font-semibold text-gray-800">{employee.profile?.marital_status || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">Phone</label>
                                        <p className="font-semibold text-gray-800">{employee.profile?.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">Address</label>
                                        <p className="font-semibold text-gray-800">{employee.profile?.address || 'N/A'}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Employment Details */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Employment Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {isEditing ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.designation || ''}
                                            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.department || ''}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.job_title || ''}
                                            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.date_of_joining || ''}
                                            onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.bank_account_number || ''}
                                            onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.pan_number || ''}
                                            onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.aadhar_number || ''}
                                            onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value })}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">Designation</label>
                                        <p className="font-semibold text-gray-800">{employee.profile?.designation || employee.profile?.job_title || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">Department</label>
                                        <p className="font-semibold text-gray-800">{employee.profile?.department || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">Date of Joining</label>
                                        <p className="font-semibold text-gray-800">
                                            {employee.profile?.date_of_joining
                                                ? new Date(employee.profile.date_of_joining).toLocaleDateString()
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">Bank Account Number</label>
                                        <p className="font-semibold text-gray-800">{employee.profile?.bank_account_number || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">PAN Number</label>
                                        <p className="font-semibold text-gray-800">{employee.profile?.pan_number || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">Aadhar Number</label>
                                        <p className="font-semibold text-gray-800">{employee.profile?.aadhar_number || 'N/A'}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Salary Info */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Salary Information</h3>
                            {isEditing && (
                                <button
                                    onClick={handleSalaryUpdate}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                                >
                                    Update Salary
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries({
                                basic: 'Basic',
                                hra: 'HRA',
                                conveyance: 'Conveyance',
                                medical: 'Medical',
                                special_allowance: 'Special Allowance',
                                gross_salary: 'Gross Salary',
                                pf: 'PF',
                                professional_tax: 'Professional Tax',
                                tds: 'TDS',
                                net_salary: 'Net Salary',
                            }).map(([key, label]) => (
                                <div key={key}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                                    {isEditing && !['gross_salary', 'net_salary'].includes(key) ? (
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={salaryData[key] || 0}
                                            onChange={(e) => setSalaryData({ ...salaryData, [key]: parseFloat(e.target.value) || 0 })}
                                        />
                                    ) : (
                                        <p className={`font-semibold ${key === 'net_salary' ? 'text-green-600 text-lg' : 'text-gray-800'}`}>
                                            ₹{salaryData[key]?.toLocaleString() || '0'}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default EmployeeView;

