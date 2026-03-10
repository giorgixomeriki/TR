import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';
import FormField from '../components/FormField';
import ErrorBox from '../components/ErrorBox';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const { user, token } = await loginUser(form);
      login(user, token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Animated background orbs */}
      <div style={{ ...styles.orb, ...styles.orb1 }} />
      <div style={{ ...styles.orb, ...styles.orb2 }} />
      <div style={{ ...styles.orb, ...styles.orb3 }} />

      {/* Card */}
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>⚡</div>
          <span style={styles.logoText}>TaskFlow</span>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={styles.heading}>Welcome back</h1>
          <p style={styles.subheading}>Sign in to your account to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <FormField label="Email address">
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="input-base"
              autoComplete="email"
            />
          </FormField>

          <FormField label="Password">
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="input-base"
              autoComplete="current-password"
            />
          </FormField>

          {error && <ErrorBox message={error} />}

          <button
            type="submit"
            disabled={loading}
            className="btn-gradient"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: 4 }}
          >
            {loading ? <LoadingSpinner size={20} /> : 'Sign In →'}
          </button>
        </form>

        {/* Divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Register link */}
        <p style={styles.switchText}>
          Don't have an account?{' '}
          <Link
            to="/register"
            style={{ color: 'var(--primary-light)', fontWeight: 600, transition: 'color var(--transition)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-light)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--primary-light)')}
          >
            Create one free →
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    pointerEvents: 'none',
  },
  orb1: {
    width: 500,
    height: 500,
    background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)',
    top: '-20%',
    left: '-10%',
    animation: 'orb 12s ease-in-out infinite',
  },
  orb2: {
    width: 400,
    height: 400,
    background: 'radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 70%)',
    bottom: '-15%',
    right: '-10%',
    animation: 'orb 15s ease-in-out infinite reverse',
  },
  orb3: {
    width: 300,
    height: 300,
    background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
    top: '50%',
    left: '60%',
    animation: 'orb 10s ease-in-out infinite 3s',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    background: 'rgba(18, 11, 40, 0.85)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(139,92,246,0.2)',
    borderRadius: 'var(--radius-2xl)',
    padding: '44px 40px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 80px rgba(124,58,237,0.1)',
    animation: 'fadeInUp 0.5s var(--ease)',
    position: 'relative',
    zIndex: 1,
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
  },
  logoIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: 'var(--gradient-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    boxShadow: '0 6px 20px rgba(124,58,237,0.45)',
  },
  logoText: {
    fontSize: '1.4rem',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    background: 'var(--gradient-text)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heading: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: 'var(--text)',
    letterSpacing: '-0.02em',
    marginBottom: 8,
  },
  subheading: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '24px 0',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: 'var(--border)',
  },
  dividerText: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    letterSpacing: '0.08em',
  },
  switchText: {
    textAlign: 'center',
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
  },
};
