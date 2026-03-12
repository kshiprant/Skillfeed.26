import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FeedPage from './pages/FeedPage';
import IdeasPage from './pages/IdeasPage';
import FindPeoplePage from './pages/FindPeoplePage';
import MessagesPage from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={!token ? <LandingPage /> : <Navigate to="/feed" replace />}
      />

      <Route
        path="/login"
        element={!token ? <LoginPage /> : <Navigate to="/feed" replace />}
      />

      <Route
        path="/register"
        element={!token ? <RegisterPage /> : <Navigate to="/feed" replace />}
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/ideas" element={<IdeasPage />} />
        <Route path="/people" element={<FindPeoplePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
      </Route>

      <Route
        path="*"
        element={<Navigate to={token ? '/feed' : '/'} replace />}
      />
    </Routes>
  );
}
