import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--page-bg)', transition: 'background-color 0.15s ease' }}>
      <Navbar />
      <main className="pt-14 sm:pt-16">
        <Outlet />
      </main>
    </div>
  );
}
