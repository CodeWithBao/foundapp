import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute, RoleRoute } from './routes/guards';
import { ROLES } from './constants';

// Layouts
import UserLayout from './components/layout/UserLayout';
import StaffLayout from './components/layout/StaffLayout';
import AdminLayout from './components/layout/AdminLayout';

// Public Pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import SearchPage from './pages/public/SearchPage';
import ItemDetailPage from './pages/public/ItemDetailPage';
import GuidePage from './pages/public/GuidePage';

// User Pages
import ReportLostPage from './pages/user/ReportLostPage';
import ReportFoundPage from './pages/user/ReportFoundPage';
import ProfilePage from './pages/user/ProfilePage';
import MyPostsPage from './pages/user/MyPostsPage';
import MyClaimsPage from './pages/user/MyClaimsPage';
import MatchesPage from './pages/user/MatchesPage';
import NotificationsPage from './pages/user/NotificationsPage';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffItems from './pages/staff/StaffItems';
import StaffClaims from './pages/staff/StaffClaims';
import StaffClaimDetail from './pages/staff/StaffClaimDetail';
import StaffHandovers from './pages/staff/StaffHandovers';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';
import AdminLocations from './pages/admin/AdminLocations';
import AdminPosts from './pages/admin/AdminPosts';
import AdminClaims from './pages/admin/AdminClaims';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminStatistics from './pages/admin/AdminStatistics';

import AdminSettings from './pages/admin/AdminSettings';

// Error Pages
import ForbiddenPage from './pages/error/ForbiddenPage';
import NotFoundPage from './pages/error/NotFoundPage';

export default function App() {
  return (
    <Routes>
      {/* Public Pages wrapped in UserLayout */}
          <Route element={<UserLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/items/:id" element={<ItemDetailPage />} />
            <Route path="/guide" element={<GuidePage />} />

            {/* Protected User Routes inside UserLayout */}
            <Route path="/report-lost" element={<ProtectedRoute><ReportLostPage /></ProtectedRoute>} />
            <Route path="/report-found" element={<ProtectedRoute><ReportFoundPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/my-posts" element={<ProtectedRoute><MyPostsPage /></ProtectedRoute>} />
            <Route path="/my-claims" element={<ProtectedRoute><MyClaimsPage /></ProtectedRoute>} />
            <Route path="/matches" element={<ProtectedRoute><MatchesPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          </Route>

          {/* Standalone Public Pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

      {/* Staff Routes */}
      <Route path="/staff" element={<RoleRoute roles={[ROLES.STAFF, ROLES.ADMIN]}><StaffLayout /></RoleRoute>}>
            <Route index element={<StaffDashboard />} />
            <Route path="items" element={<StaffItems />} />
            <Route path="claims" element={<StaffClaims />} />
            <Route path="claims/:id" element={<StaffClaimDetail />} />
            <Route path="handovers" element={<StaffHandovers />} />
          </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<RoleRoute roles={[ROLES.ADMIN]}><AdminLayout /></RoleRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="locations" element={<AdminLocations />} />
        <Route path="posts" element={<AdminPosts />} />
        <Route path="claims" element={<AdminClaims />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
        <Route path="statistics" element={<AdminStatistics />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Error Routes */}
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
