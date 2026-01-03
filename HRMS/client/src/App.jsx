import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminDashboardEnhanced from './pages/AdminDashboardEnhanced';
import Profile from './pages/Profile';
import LeaveManagement from './pages/LeaveManagement';
import AttendanceHistory from './pages/AttendanceHistory';
import EmployeeView from './pages/EmployeeView';
import CreateEmployee from './pages/CreateEmployee';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import Payroll from './pages/Payroll';
import Reports from './pages/Reports';
import ForgotPassword from './pages/ForgotPassword';
import AdminLeaveManagement from './pages/AdminLeaveManagement';
import MySalary from './pages/MySalary';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" reverseOrder={false} />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Employee Routes */}
          <Route element={<ProtectedRoute allowedRoles={['Employee', 'Admin', 'HR Officer']} />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/teams/:id" element={<TeamDetail />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Employee']} />}>
            <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
            <Route path="/my-attendance" element={<AttendanceHistory />} />
            <Route path="/my-leaves" element={<LeaveManagement />} />
            <Route path="/my-salary" element={<MySalary />} />
          </Route>

          {/* Admin/HR Routes */}
          <Route element={<ProtectedRoute allowedRoles={['Admin', 'HR Officer']} />}>
            <Route path="/admin-dashboard" element={<AdminDashboardEnhanced />} />
            <Route path="/employee/:id" element={<EmployeeView />} />
            <Route path="/create-employee" element={<CreateEmployee />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/leave-management" element={<AdminLeaveManagement />} />
          </Route>

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
