import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import AuthModal from '../auth/AuthModal';
import { useAuth } from '../../context/AuthContext';

export default function Layout() {
  const { showAuthModal } = useAuth();

  return (
    <div className="min-h-screen overflow-y-auto" style={{ backgroundColor: 'var(--page-bg)', transition: 'background-color 0.15s ease' }}>
      <Navbar />
      <main className="pt-14 sm:pt-16 overflow-y-auto">
        <Outlet />
      </main>
      {showAuthModal && <AuthModal />}
    </div>
  );
}
