import { Brand } from './components/Brand';
import { AuthProvider, useAuth } from './lib/auth';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';

function SplashScreen() {
  return (
    <div className="splash" role="status" aria-live="polite">
      <Brand />
      <span className="spinner" aria-hidden="true" />
      <p>جارٍ استعادة الجلسة…</p>
    </div>
  );
}

function AppContent() {
  const { status, user, logout } = useAuth();

  if (status === 'loading') {
    return <SplashScreen />;
  }

  if (status === 'guest' || !user) {
    return <LoginPage />;
  }

  return <DashboardPage user={user} onLogout={logout} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
