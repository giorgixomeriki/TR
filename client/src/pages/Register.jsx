import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';
import FormField from '../components/FormField';
import ErrorBox from '../components/ErrorBox';

export default function Register() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError('All fields are required.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { user, token } = await registerUser(form);
      login(user, token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
          <h1 style={styles.heading}>Start for free</h1>
          <p style={styles.subheading}>Create your account and get things done</p>
        </div>

        {/* Feature pills */}
        <div style={styles.pills}>
          {['Unlimited Tasks', 'Secure & Private', 'Always Free'].map((pill) => (
            <span key={pill} style={styles.pill}>{pill}</span>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <FormField label="Full name">
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Alex Johnson"
              className="input-base"
              autoComplete="name"
            />
          </FormField>

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
              placeholder="Min. 6 characters"
              className="input-base"
              autoComplete="new-password"
            />
            {form.password.length > 0 && (
              <PasswordStrength password={form.password} />
            )}
          </FormField>

          {error && <ErrorBox message={error} />}

          <button
            type="submit"
            disabled={loading}
            className="btn-gradient"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: 4 }}
          >
            {loading ? <LoadingSpinner size={20} /> : 'Create Account →'}
          </button>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            By creating an account, you agree to our Terms of Service.
          </p>
        </form>

        {/* Login link */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>already a member?</span>
          <div style={styles.dividerLine} />
        </div>
        <p style={styles.switchText}>
          <Link
            to="/login"
            style={{ color: 'var(--primary-light)', fontWeight: 600, transition: 'color var(--transition)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-light)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--primary-light)')}
          >
            Sign in to your account →
          </Link>
        </p>
      </div>
    </div>
  );
}

function PasswordStrength({ password }) {
  const getStrength = (pw) => {
    let score = 0;
    if (pw.length >= 6)  score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = getStrength(password);
  const label    = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][strength] || '';
  const colors   = ['', 'var(--danger)', 'var(--warning)', '#a3e635', 'var(--success)', '#6ee7b7'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', gap: 3 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              height: 3,
              flex: 1,
              borderRadius: 2,
              background: i <= strength ? colors[strength] : 'var(--border)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: '0.72rem', color: colors[strength], alignSelf: 'flex-end' }}>
        {label}
      </span>
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
    width: 450,
    height: 450,
    background: 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)',
    top: '-15%',
    right: '-5%',
    animation: 'orb 14s ease-in-out infinite',
  },
  orb2: {
    width: 500,
    height: 500,
    background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)',
    bottom: '-20%',
    left: '-10%',
    animation: 'orb 18s ease-in-out infinite reverse',
  },
  orb3: {
    width: 280,
    height: 280,
    background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
    top: '40%',
    left: '30%',
    animation: 'orb 9s ease-in-out infinite 2s',
  },
  card: {
    width: '100%',
    maxWidth: 460,
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
    marginBottom: 28,
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
  pills: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 28,
    flexWrap: 'wrap',
  },
  pill: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    background: 'rgba(139,92,246,0.12)',
    border: '1px solid rgba(139,92,246,0.2)',
    borderRadius: 'var(--radius-full)',
    padding: '4px 12px',
    letterSpacing: '0.03em',
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
    margin: '24px 0 16px',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: 'var(--border)',
  },
  dividerText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    letterSpacing: '0.06em',
    whiteSpace: 'nowrap',
  },
  switchText: {
    textAlign: 'center',
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
  },
};
