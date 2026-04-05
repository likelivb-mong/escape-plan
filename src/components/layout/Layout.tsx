import { Outlet, useSearchParams } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get('embed') === 'true';

  if (isEmbed) {
    return (
      <div className="min-h-screen overflow-y-auto bg-[var(--page-bg)]">
        <main className="overflow-y-auto">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-[var(--page-bg)]">
      <Navbar />
      <main className="pt-12 pb-13 md:pb-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
