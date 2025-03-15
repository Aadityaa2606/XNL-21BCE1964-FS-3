import ProtectedRoute from '@/components/ProtectedRoute';
import NavBar from '@/components/NavBar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
