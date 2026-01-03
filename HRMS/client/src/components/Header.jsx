import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, User, Bell, CheckCircle, Info, X } from 'lucide-react';

const Header = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);

    // Dummy notifications
    const notifications = [
        { id: 1, title: 'Leave Request Approved', time: '2 hours ago', type: 'success' },
        { id: 2, title: 'New Team Meeting', time: '5 hours ago', type: 'info' },
        { id: 3, title: 'Payroll Generated', time: '1 day ago', type: 'info' },
    ];

    const getPageTitle = () => {
        const path = location.pathname.substring(1);
        if (!path) return 'Dashboard';
        return path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ');
    };

    // Close notifications when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
            <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 hover:bg-gray-100 rounded-lg lg:hidden text-gray-600"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <h2 className="text-xl font-bold text-gray-800 hidden md:block">
                        {getPageTitle()}
                    </h2>
                </div>

                <div className="flex items-center gap-4">
                    {/* Notification Dropdown Container */}
                    <div className="relative" ref={notificationRef}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`p-2 rounded-lg relative transition-colors ${showNotifications ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>

                        {/* Dropdown Menu */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">3 New</span>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.map((note) => (
                                        <div key={note.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group">
                                            <div className="flex gap-3">
                                                <div className={`mt-1 p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0 ${note.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    {note.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors">{note.title}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{note.time}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 text-center border-t border-gray-50 bg-gray-50/50">
                                    <button className="text-sm text-blue-600 font-medium hover:text-blue-700">Mark all as read</button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-semibold text-gray-700">{user?.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                        </div>
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                            {user?.profile_picture ? (
                                <img
                                    src={user.profile_picture}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="w-5 h-5 text-gray-500" />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
