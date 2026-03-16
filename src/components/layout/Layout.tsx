import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen overflow-y-auto bg-[var(--page-bg)]">
      <Navbar />
      <main className="pt-12 pb-13 md:pb-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
