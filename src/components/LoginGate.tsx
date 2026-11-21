import React, { useState, useEffect } from 'react';

interface LoginGateProps {
  expectedPassword?: string;
  storageKey: string;
  title: string;
  children: React.ReactNode;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30000;
const SALT_PREFIX = 'fnb_zero_trust_2026::';

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function LoginGate({ expectedPassword, storageKey, title, children }: LoginGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);

  const expectedToken = expectedPassword
    ? (expectedPassword.startsWith('sha256:') ? expectedPassword.slice(7) : expectedPassword)
    : '';

  useEffect(() => {
    const savedState = sessionStorage.getItem(storageKey);
    if (savedState && expectedToken && savedState === expectedToken) {
      setIsAuthenticated(true);
    }
  }, [storageKey, expectedToken]);

  if (!expectedPassword) {
    return <>{children}</>;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    if (lockedUntil > now) {
      const waitSec = Math.ceil((lockedUntil - now) / 1000);
      setError(`Tạm khóa đăng nhập do nhập sai nhiều lần. Vui lòng thử lại sau ${waitSec}s.`);
      return;
    }

    let matched = false;
    if (expectedPassword.startsWith('sha256:')) {
      const candidateHash = await sha256Hex(SALT_PREFIX + password);
      matched = candidateHash === expectedPassword.slice(7);
    } else {
      matched = password === expectedPassword;
    }

    if (matched) {
      setIsAuthenticated(true);
      sessionStorage.setItem(storageKey, expectedToken);
      setFailedAttempts(0);
      setError('');
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= MAX_ATTEMPTS) {
        setLockedUntil(now + LOCKOUT_MS);
        setFailedAttempts(0);
        setError('Nhập sai 5 lần! Hệ thống tạm khóa 30 giây để bảo mật.');
      } else {
        setError(`Mật khẩu không chính xác! (Còn ${MAX_ATTEMPTS - nextAttempts} lần thử)`);
      }
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ marginTop: 0, color: '#10b981' }}>{title}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Vui lòng nhập mật khẩu để truy cập (Zero-Trust SHA-256)</p>
        <form onSubmit={handleLogin} autoComplete="off">
          <input
            type="password"
            className="input-field"
            placeholder="Nhập mật khẩu..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginBottom: '1rem' }}
          />
          {error && <p style={{ color: '#ef4444', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            Mở Khóa
          </button>
        </form>
      </div>
    </div>
  );
}
