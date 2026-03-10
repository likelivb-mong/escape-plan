import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen overflow-y-auto bg-[var(--page-bg)]">
      <Navbar />
      <main className="pt-12 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
