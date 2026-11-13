import { Brand } from './components/Brand';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Icon } from './components/Icon';
import { AuthProvider, useAuth } from './lib/auth';
import { TenancyProvider, useTenancy } from './lib/tenancy';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';

function SplashScreen({ label = 'جارٍ استعادة الجلسة…' }: { label?: string }) {
  return (
    <div className="splash" role="status" aria-live="polite">
      <Brand />
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

function TenancyErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { logout } = useAuth();
  return (
    <div className="splash" role="alert">
      <Brand />
      <p className="splash-error">{message}</p>
      <div className="splash-actions">
        <button type="button" className="button button-primary" onClick={onRetry}>
          <Icon name="refresh" size={16} /> إعادة المحاولة
        </button>
        <button type="button" className="button" onClick={() => void logout()}>
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const { status, user, logout } = useAuth();
  const tenancy = useTenancy();

  if (status === 'loading') {
    return <SplashScreen />;
  }

  if (status === 'guest' || !user) {
    return <LoginPage />;
  }

  if (tenancy.status === 'idle' || tenancy.status === 'loading') {
    return <SplashScreen label="جارٍ تحميل مساحات العمل…" />;
  }

  if (tenancy.status === 'error') {
    return (
      <TenancyErrorScreen
        message={tenancy.error ?? 'تعذر تحميل مساحات العمل.'}
        onRetry={() => void tenancy.refresh()}
      />
    );
  }

  if (tenancy.memberships.length === 0) {
    return <OnboardingPage />;
  }

  return <DashboardPage user={user} onLogout={logout} />;
}

function App() {
  return (
    <AuthProvider>
      <TenancyProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </TenancyProvider>
    </AuthProvider>
  );
}

export default App;
