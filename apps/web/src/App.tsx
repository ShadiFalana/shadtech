import { useEffect, useState } from 'react';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';

const SESSION_KEY = 'shadtech.preview.email';

function App() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      setEmail(stored);
    }
  }, []);

  function handleLogin(nextEmail: string) {
    sessionStorage.setItem(SESSION_KEY, nextEmail);
    setEmail(nextEmail);
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setEmail(null);
  }

  if (!email) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <DashboardPage email={email} onLogout={handleLogout} />;
}

export default App;
