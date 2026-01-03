import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard if unauthorized for this specific route
        if (user.role === 'Admin' || user.role === 'HR Officer') {
            return <Navigate to="/admin-dashboard" replace />;
        }
        return <Navigate to="/employee-dashboard" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
