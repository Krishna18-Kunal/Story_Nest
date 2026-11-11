
import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';

export default function AuthModal({
  mode,
  onModeChange,
  onClose,
  onLogin,
  onRegister,
  onGoogleLogin
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      if (mode === 'register') {
        await onRegister({ name, email, password });
      } else {
        await onLogin({ email, password });
      }

      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSuccess(response) {
    if (!response.credential) {
      setError('Google authentication failed. Please try again.');
      return;
    }

    setError('');
    setBusy(true);

    try {
      await onGoogleLogin(response.credential);
      onClose();
    } catch (err) {
      setError(err.message || 'Google login failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="auth-overlay"
      role="presentation"
      onMouseDown={e => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <section
        className="auth-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <button
          className="auth-close"
          type="button"
          onClick={onClose}
          aria-label="Close"
          disabled={busy}
        >
          ×
        </button>

        <p className="eyebrow">WELCOME TO STORY NEST</p>

        <h2 id="auth-title">
          {mode === 'register' ? 'Create your account' : 'Welcome back'}
        </h2>

        <p className="section-subtitle">
          Join the community. Your content stays yours.
        </p>

        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <label>
              Full name
              <input
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                minLength="2"
                maxLength="60"
                required
                placeholder="Your name"
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </label>

          <label className="password-label">
            Password

            <div className="password-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={
                  mode === 'register' ? 'new-password' : 'current-password'
                }
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength="8"
                required
                placeholder="At least 8 characters"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(prev => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </label>

          {error && <div className="alert error">{error}</div>}

          <button className="btn primary" disabled={busy} type="submit">
            {busy
              ? 'Please wait…'
              : mode === 'register'
                ? 'Create account'
                : 'Log in'}
          </button>
        </form>

        {mode === 'login' && (
          <>
            <div className="auth-divider">
              <span>OR CONTINUE WITH</span>
            </div>

            <div className="google-login-wrap">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setError('Google login failed. Please try again.');
                }}
                text="continue_with"
                shape="rectangular"
                theme="outline"
                size="large"
                width="350"
              />
            </div>
          </>
        )}

        <p className="auth-switch">
          {mode === 'register'
            ? 'Already have an account?'
            : 'New to Story Nest?'}{' '}
          <button
            type="button"
            onClick={() => {
              setError('');
              setShowPassword(false);
              onModeChange(mode === 'register' ? 'login' : 'register');
            }}
          >
            {mode === 'register' ? 'Log in' : 'Create account'}
          </button>
        </p>
      </section>
    </div>
  );
}
