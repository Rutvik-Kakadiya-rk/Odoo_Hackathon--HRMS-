import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Clock, Calendar, FileText, User, LogOut, UserPlus, UsersRound, CheckSquare, Menu, X, DollarSign, BarChart3 } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path) => location.pathname === path;

    const NavItem = ({ to, icon: Icon, label }) => (
        <Link
            to={to}
            onClick={() => onClose && onClose()} // Close sidebar on navigation on mobile
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive(to)
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400'
                } `}
        >
            <Icon className={`w-5 h-5 ${isActive(to) ? 'text-white' : 'text-gray-500 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'} `} />
            <span className="font-medium">{label}</span>
        </Link>
    );

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`w-64 bg-white dark:bg-gray-800 h-screen border-r border-gray-200 dark:border-gray-700 flex flex-col fixed left-0 top-0 z-30 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                } `}>
                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">D</span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Dayflow</h1>
                    </div>

                    <nav className="space-y-2">
                        {user?.role === 'Admin' || user?.role === 'HR Officer' ? (
                            <>
                                <NavItem to="/admin-dashboard" icon={LayoutDashboard} label="Dashboard" />
                                <NavItem to="/create-employee" icon={UserPlus} label="Create Employee" />
                                <NavItem to="/teams" icon={UsersRound} label="Teams" />
                                <NavItem to="/payroll" icon={DollarSign} label="Payroll" />
                                <NavItem to="/leave-management" icon={CheckSquare} label="Leave Management" />
                                <NavItem to="/reports" icon={BarChart3} label="Reports" />
                                <NavItem to="/profile" icon={User} label="My Profile" />
                            </>
                        ) : (
                            <>
                                <NavItem to="/employee-dashboard" icon={LayoutDashboard} label="Dashboard" />
                                <NavItem to="/my-attendance" icon={Clock} label="Attendance" />
                                <NavItem to="/my-leaves" icon={Calendar} label="Leaves" />
                                <NavItem to="/my-salary" icon={DollarSign} label="My Salary" />
                                <NavItem to="/profile" icon={User} label="My Profile" />
                            </>
                        )}
                    </nav>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-700 pb-8">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        {user?.profile_picture ? (
                            <img
                                src={user.profile_picture}
                                alt="Profile"
                                className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold">
                                {user?.name?.charAt(0)}
                            </div>
                        )}
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            logout();
                            navigate('/login');
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
