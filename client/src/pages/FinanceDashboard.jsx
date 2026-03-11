import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/financeService';

/* ── Constants ────────────────────────────────────────── */
const CURRENCY = '₾';

const CATEGORIES = ['Food', 'Transport', 'Rent', 'Entertainment', 'Education', 'Subscriptions', 'Health', 'Other'];

const CAT_COLOR = {
  Food:          '#f59e0b',
  Transport:     '#3b82f6',
  Rent:          '#ef4444',
  Entertainment: '#8b5cf6',
  Education:     '#10b981',
  Subscriptions: '#06b6d4',
  Health:        '#ec4899',
  Other:         '#64748b',
};

const CAT_ICON = {
  Food: '🍽️', Transport: '🚗', Rent: '🏠', Entertainment: '🎬',
  Education: '📚', Subscriptions: '🔄', Health: '❤️', Other: '📦',
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ── Helpers ──────────────────────────────────────────── */
function fmt(n) {
  const num = parseFloat(n) || 0;
  return `${num % 1 === 0 ? num.toLocaleString('en') : num.toFixed(2)}${CURRENCY}`;
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function daysUntil(d) {
  const diff = Math.ceil((new Date(d) - Date.now()) / 86_400_000);
  return diff;
}

/* ── UI atoms ─────────────────────────────────────────── */
function Card({ children, style = {} }) {
  return (
    <div style={{
      background:   'var(--surface-alt)',
      border:       '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding:      '20px 22px',
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)',
      letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14,
    }}>
      {children}
    </p>
  );
}

function ProgressBar({ value, max, color = 'var(--primary)' }) {
  const pct    = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const barCol = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : color;
  return (
    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${pct}%`, background: barCol,
        borderRadius: 'var(--radius-full)', boxShadow: `0 0 8px ${barCol}60`,
        transition: 'width 0.6s var(--ease)',
      }} />
    </div>
  );
}

function DeleteBtn({ onClick }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: 26, height: 26, borderRadius: 'var(--radius-sm)', border: 'none',
        background: h ? 'var(--danger-bg)' : 'transparent',
        color: h ? 'var(--danger)' : 'var(--text-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        transition: 'all var(--transition-sm)', flexShrink: 0,
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      </svg>
    </button>
  );
}

/* ── Summary cards ────────────────────────────────────── */
function SummaryCard({ label, value, color, icon, sub }) {
  return (
    <div style={{
      flex: 1, padding: '20px 22px',
      background: 'var(--surface-alt)',
      border: `1px solid var(--border)`,
      borderTop: `3px solid ${color}`,
      borderRadius: 'var(--radius-lg)',
      animation: 'fadeInUp 0.35s var(--ease) both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <p style={{ fontSize: '1.6rem', fontWeight: 800, color, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6 }}>{sub}</p>}
    </div>
  );
}

/* ── Tab bar ──────────────────────────────────────────── */
const TABS = [
  { key: 'overview',       label: 'Overview'      },
  { key: 'expenses',       label: 'Expenses'       },
  { key: 'income',         label: 'Income'         },
  { key: 'budgets',        label: 'Budgets'        },
  { key: 'goals',          label: 'Goals'          },
  { key: 'subscriptions',  label: 'Subscriptions'  },
];

function TabBar({ active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
      {TABS.map(({ key, label }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
              border: 'none',
              background: isActive ? 'var(--surface-hover)' : 'transparent',
              color: isActive ? 'var(--text)' : 'var(--text-muted)',
              fontSize: '0.84rem', fontWeight: isActive ? 600 : 400,
              cursor: 'pointer', transition: 'all var(--transition-sm)',
              borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
            }}
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Add form shell ───────────────────────────────────── */
function FormShell({ title, onSubmit, onCancel, submitting, children }) {
  return (
    <Card style={{ marginBottom: 20, border: '1px solid rgba(59,130,246,0.2)', animation: 'slideUp 0.22s var(--ease)' }}>
      <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>{title}</p>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
        {children}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="submit" disabled={submitting}
            className="btn-gradient"
            style={{ padding: '9px 20px', fontSize: '0.82rem', opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button" onClick={onCancel}
            style={{ padding: '9px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)', color: 'var(--text)',
  fontSize: '0.875rem', padding: '8px 12px', outline: 'none',
  fontFamily: 'inherit', transition: 'border-color var(--transition)',
};

/* ── ExpenseList ──────────────────────────────────────── */
function ExpenseList({ expenses, onDelete }) {
  if (expenses.length === 0) {
    return <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>No expenses this month</p>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {expenses.map((e) => (
        <div
          key={e.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 14px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderLeft: `3px solid ${CAT_COLOR[e.category] || 'var(--border)'}`,
            borderRadius: 'var(--radius-md)',
            animation: 'staggerIn 0.2s var(--ease) both',
          }}
        >
          <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{CAT_ICON[e.category] || '📦'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {e.title}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {e.category} · {fmtDate(e.date)}
            </p>
          </div>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ef4444', flexShrink: 0 }}>
            -{fmt(e.amount)}
          </span>
          <DeleteBtn onClick={() => onDelete(e.id)} />
        </div>
      ))}
    </div>
  );
}

/* ── IncomeList ───────────────────────────────────────── */
function IncomeList({ income, onDelete }) {
  if (income.length === 0) {
    return <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>No income recorded this month</p>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {income.map((inc) => (
        <div
          key={inc.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 14px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderLeft: '3px solid #10b981',
            borderRadius: 'var(--radius-md)',
            animation: 'staggerIn 0.2s var(--ease) both',
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>💰</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>{inc.source}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{fmtDate(inc.date)}</p>
          </div>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10b981', flexShrink: 0 }}>
            +{fmt(inc.amount)}
          </span>
          <DeleteBtn onClick={() => onDelete(inc.id)} />
        </div>
      ))}
    </div>
  );
}

/* ── BudgetProgress ───────────────────────────────────── */
function BudgetProgress({ budgets }) {
  if (budgets.length === 0) {
    return <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>No budgets set for this month</p>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {budgets.map((b) => {
        const pct = b.limit > 0 ? Math.min(100, (b.spent / b.limit) * 100) : 0;
        const col = CAT_COLOR[b.category] || 'var(--primary)';
        return (
          <div key={b.id} style={{ padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1rem' }}>{CAT_ICON[b.category] || '📦'}</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>{b.category}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : 'var(--text)' }}>
                  {fmt(b.spent)}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}> / {fmt(b.limit)}</span>
              </div>
            </div>
            <ProgressBar value={b.spent} max={b.limit} color={col} />
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 5, textAlign: 'right' }}>
              {fmt(Math.max(0, b.limit - b.spent))} remaining · {Math.round(pct)}%
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ── GoalCard ─────────────────────────────────────────── */
function GoalCard({ goal, onAddFunds, onDelete }) {
  const [adding,  setAdding]  = useState(false);
  const [amount,  setAmount]  = useState('');
  const [loading, setLoading] = useState(false);

  const pct = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
  const done = goal.currentAmount >= goal.targetAmount;

  const handleAdd = async (e) => {
    e.preventDefault();
    const add = parseFloat(amount);
    if (!add || add <= 0) return;
    setLoading(true);
    await onAddFunds(goal.id, Math.min(goal.currentAmount + add, goal.targetAmount));
    setAmount('');
    setAdding(false);
    setLoading(false);
  };

  return (
    <div style={{
      background: 'var(--surface-alt)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px 22px',
      animation: 'fadeInUp 0.3s var(--ease) both',
      borderTop: done ? '3px solid #10b981' : '3px solid var(--primary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.2rem' }}>{done ? '🏆' : '🎯'}</span>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>{goal.title}</h3>
          </div>
          {done && (
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-full)', padding: '2px 8px', display: 'inline-block', marginTop: 4 }}>
              Goal Reached!
            </span>
          )}
        </div>
        <DeleteBtn onClick={() => onDelete(goal.id)} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: done ? '#10b981' : 'var(--text)' }}>
          {fmt(goal.currentAmount)}
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>of {fmt(goal.targetAmount)}</span>
      </div>
      <ProgressBar value={goal.currentAmount} max={goal.targetAmount} color="#10b981" />
      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6 }}>
        {Math.round(pct)}% saved · {fmt(Math.max(0, goal.targetAmount - goal.currentAmount))} to go
      </p>

      {!done && (
        <div style={{ marginTop: 14 }}>
          {adding ? (
            <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number" min="0.01" step="0.01"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder={`Amount (${CURRENCY})`} autoFocus
                style={{ ...inputStyle, flex: 1, padding: '7px 10px', fontSize: '0.82rem' }}
              />
              <button type="submit" disabled={loading} className="btn-gradient" style={{ padding: '7px 14px', fontSize: '0.8rem' }}>
                {loading ? '…' : 'Add'}
              </button>
              <button type="button" onClick={() => setAdding(false)} style={{ padding: '7px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}>
                ✕
              </button>
            </form>
          ) : (
            <button
              onClick={() => setAdding(true)}
              style={{
                width: '100%', padding: '8px', borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border)', background: 'transparent',
                color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer',
                transition: 'all var(--transition-sm)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary-light)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              + Add Funds
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── SubscriptionList ─────────────────────────────────── */
function SubscriptionList({ subscriptions, onDelete }) {
  if (subscriptions.length === 0) {
    return <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>No subscriptions tracked</p>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {subscriptions.map((s) => {
        const days   = daysUntil(s.nextPaymentDate);
        const urgent = days >= 0 && days <= 7;
        return (
          <div
            key={s.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              background: 'var(--surface)', border: `1px solid ${urgent ? 'rgba(245,158,11,0.25)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)',
              animation: 'staggerIn 0.2s var(--ease) both',
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '1rem' }}>🔄</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>{s.serviceName}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {s.billingCycle} ·{' '}
                <span style={{ color: urgent ? '#f59e0b' : 'var(--text-muted)' }}>
                  {days < 0 ? 'Overdue' : days === 0 ? 'Due today' : `Due in ${days}d`}
                </span>
                {' '}· {fmtDate(s.nextPaymentDate)}
              </p>
            </div>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', flexShrink: 0 }}>
              {fmt(s.amount)}
            </span>
            <DeleteBtn onClick={() => onDelete(s.id)} />
          </div>
        );
      })}
    </div>
  );
}

/* ── Overview tab ─────────────────────────────────────── */
function OverviewTab({ budgets, expenses, subscriptions }) {
  const recentExpenses = expenses.slice(0, 6);
  const upcomingSubs   = subscriptions.filter((s) => daysUntil(s.nextPaymentDate) <= 30 && daysUntil(s.nextPaymentDate) >= 0).slice(0, 4);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      {/* Budget progress */}
      <div>
        <SectionLabel>Budget Progress</SectionLabel>
        {budgets.length > 0
          ? <BudgetProgress budgets={budgets} />
          : <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>No budgets set — add them in the Budgets tab.</p>
        }
      </div>

      {/* Right column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Recent expenses */}
        <div>
          <SectionLabel>Recent Expenses</SectionLabel>
          {recentExpenses.length > 0
            ? <ExpenseList expenses={recentExpenses} onDelete={() => {}} />
            : <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>No expenses this month.</p>
          }
        </div>

        {/* Upcoming subscriptions */}
        {upcomingSubs.length > 0 && (
          <div>
            <SectionLabel>Upcoming Payments</SectionLabel>
            <SubscriptionList subscriptions={upcomingSubs} onDelete={() => {}} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Dashboard ───────────────────────────────────── */
export default function FinanceDashboard() {
  const now = new Date();
  const [month,  setMonth]  = useState(now.getMonth() + 1);
  const [year,   setYear]   = useState(now.getFullYear());
  const [tab,    setTab]    = useState('overview');

  const [summary,       setSummary]       = useState({ totalIncome: 0, totalExpenses: 0, balance: 0 });
  const [expenses,      setExpenses]      = useState([]);
  const [income,        setIncome]        = useState([]);
  const [budgets,       setBudgets]       = useState([]);
  const [goals,         setGoals]         = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading,       setLoading]       = useState(true);

  /* ── Form visibility ── */
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showIncomeForm,  setShowIncomeForm]  = useState(false);
  const [showBudgetForm,  setShowBudgetForm]  = useState(false);
  const [showGoalForm,    setShowGoalForm]    = useState(false);
  const [showSubForm,     setShowSubForm]     = useState(false);

  /* ── Form state ── */
  const [expForm, setExpForm] = useState({ title: '', amount: '', category: 'Food', date: todayISO() });
  const [incForm, setIncForm] = useState({ source: '', amount: '', date: todayISO() });
  const [budForm, setBudForm] = useState({ category: 'Food', limit: '', month, year });
  const [goalForm, setGoalForm] = useState({ title: '', targetAmount: '' });
  const [subForm,  setSubForm]  = useState({ serviceName: '', amount: '', billingCycle: 'monthly', nextPaymentDate: todayISO() });
  const [saving,   setSaving]   = useState(false);

  /* ── Fetch all ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, exp, inc, bud, gls, subs] = await Promise.all([
        api.getSummary(month, year),
        api.getExpenses(month, year),
        api.getIncome(month, year),
        api.getBudgets(month, year),
        api.getGoals(),
        api.getSubscriptions(),
      ]);
      setSummary(sum);
      setExpenses(exp);
      setIncome(inc);
      setBudgets(bud);
      setGoals(gls);
      setSubscriptions(subs);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Month nav ── */
  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  /* ── Expense handlers ── */
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expForm.title || !expForm.amount) return;
    setSaving(true);
    try {
      const created = await api.createExpense({ ...expForm, month, year });
      setExpenses((prev) => [created, ...prev]);
      setSummary((s) => ({ ...s, totalExpenses: s.totalExpenses + created.amount, balance: s.balance - created.amount }));
      setExpForm({ title: '', amount: '', category: 'Food', date: todayISO() });
      setShowExpenseForm(false);
    } catch { /* silent */ } finally { setSaving(false); }
  };

  const handleDeleteExpense = async (id) => {
    const exp = expenses.find((e) => e.id === id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (exp) setSummary((s) => ({ ...s, totalExpenses: s.totalExpenses - exp.amount, balance: s.balance + exp.amount }));
    try { await api.deleteExpense(id); } catch { fetchAll(); }
  };

  /* ── Income handlers ── */
  const handleAddIncome = async (e) => {
    e.preventDefault();
    if (!incForm.source || !incForm.amount) return;
    setSaving(true);
    try {
      const created = await api.createIncome(incForm);
      setIncome((prev) => [created, ...prev]);
      setSummary((s) => ({ ...s, totalIncome: s.totalIncome + created.amount, balance: s.balance + created.amount }));
      setIncForm({ source: '', amount: '', date: todayISO() });
      setShowIncomeForm(false);
    } catch { /* silent */ } finally { setSaving(false); }
  };

  const handleDeleteIncome = async (id) => {
    const inc = income.find((i) => i.id === id);
    setIncome((prev) => prev.filter((i) => i.id !== id));
    if (inc) setSummary((s) => ({ ...s, totalIncome: s.totalIncome - inc.amount, balance: s.balance - inc.amount }));
    try { await api.deleteIncome(id); } catch { fetchAll(); }
  };

  /* ── Budget handlers ── */
  const handleUpsertBudget = async (e) => {
    e.preventDefault();
    if (!budForm.category || !budForm.limit) return;
    setSaving(true);
    try {
      const updated = await api.upsertBudget({ ...budForm, month, year });
      setBudgets((prev) => {
        const idx = prev.findIndex((b) => b.category === updated.category);
        if (idx >= 0) { const next = [...prev]; next[idx] = { ...updated, spent: prev[idx].spent }; return next; }
        return [...prev, { ...updated, spent: 0 }];
      });
      setBudForm({ category: 'Food', limit: '', month, year });
      setShowBudgetForm(false);
    } catch { /* silent */ } finally { setSaving(false); }
  };

  /* ── Goal handlers ── */
  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!goalForm.title || !goalForm.targetAmount) return;
    setSaving(true);
    try {
      const created = await api.createGoal(goalForm);
      setGoals((prev) => [created, ...prev]);
      setGoalForm({ title: '', targetAmount: '' });
      setShowGoalForm(false);
    } catch { /* silent */ } finally { setSaving(false); }
  };

  const handleAddFunds = async (id, newAmount) => {
    const updated = await api.updateGoal(id, { currentAmount: newAmount });
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
  };

  const handleDeleteGoal = async (id) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    try { await api.deleteGoal(id); } catch { fetchAll(); }
  };

  /* ── Subscription handlers ── */
  const handleAddSub = async (e) => {
    e.preventDefault();
    if (!subForm.serviceName || !subForm.amount || !subForm.nextPaymentDate) return;
    setSaving(true);
    try {
      const created = await api.createSubscription(subForm);
      setSubscriptions((prev) => [...prev, created].sort((a, b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate)));
      setSubForm({ serviceName: '', amount: '', billingCycle: 'monthly', nextPaymentDate: todayISO() });
      setShowSubForm(false);
    } catch { /* silent */ } finally { setSaving(false); }
  };

  const handleDeleteSub = async (id) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    try { await api.deleteSubscription(id); } catch { fetchAll(); }
  };

  /* ── Derived ── */
  const monthlySubCost = subscriptions
    .filter((s) => s.billingCycle === 'monthly')
    .reduce((sum, s) => sum + s.amount, 0);

  /* ── Render ── */
  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, padding: '32px 28px 64px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>

        {/* ── Header ── */}
        <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, animation: 'fadeInDown 0.35s var(--ease)' }}>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>
              Personal Finance
            </p>
            <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Finance Hub
            </h1>
          </div>

          {/* Month navigator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '6px 6px 6px 14px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', minWidth: 90, textAlign: 'center' }}>
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button onClick={prevMonth} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all var(--transition-sm)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button onClick={nextMonth} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all var(--transition-sm)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </header>

        {/* ── Summary cards ── */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <SummaryCard
            label="Income" icon="💰"
            value={fmt(summary.totalIncome)}
            color="#10b981"
            sub={`${income.length} entr${income.length !== 1 ? 'ies' : 'y'} this month`}
          />
          <SummaryCard
            label="Expenses" icon="💸"
            value={fmt(summary.totalExpenses)}
            color="#ef4444"
            sub={`${expenses.length} transaction${expenses.length !== 1 ? 's' : ''} this month`}
          />
          <SummaryCard
            label="Balance" icon={summary.balance >= 0 ? '📈' : '📉'}
            value={fmt(Math.abs(summary.balance))}
            color={summary.balance >= 0 ? '#3b82f6' : '#ef4444'}
            sub={summary.balance >= 0 ? 'Surplus this month' : 'Deficit this month'}
          />
          {monthlySubCost > 0 && (
            <SummaryCard
              label="Subscriptions" icon="🔄"
              value={fmt(monthlySubCost)}
              color="#8b5cf6"
              sub={`${subscriptions.length} active subscription${subscriptions.length !== 1 ? 's' : ''}`}
            />
          )}
        </div>

        {/* ── Tabs ── */}
        <TabBar active={tab} onChange={setTab} />

        {/* ── Tab content ── */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* ── Overview ── */}
            {tab === 'overview' && (
              <OverviewTab budgets={budgets} expenses={expenses} subscriptions={subscriptions} />
            )}

            {/* ── Expenses ── */}
            {tab === 'expenses' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <SectionLabel>Expenses — {MONTH_NAMES[month - 1]} {year}</SectionLabel>
                  <button onClick={() => setShowExpenseForm((v) => !v)} className="btn-gradient" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                    {showExpenseForm ? '✕ Cancel' : '+ Add Expense'}
                  </button>
                </div>

                {showExpenseForm && (
                  <FormShell title="New Expense" onSubmit={handleAddExpense} onCancel={() => setShowExpenseForm(false)} submitting={saving}>
                    <Field label="Title">
                      <input value={expForm.title} onChange={(e) => setExpForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Coffee" required style={{ ...inputStyle, width: 180 }} />
                    </Field>
                    <Field label={`Amount (${CURRENCY})`}>
                      <input type="number" min="0.01" step="0.01" value={expForm.amount} onChange={(e) => setExpForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" required style={{ ...inputStyle, width: 110 }} />
                    </Field>
                    <Field label="Category">
                      <select value={expForm.category} onChange={(e) => setExpForm((f) => ({ ...f, category: e.target.value }))} style={{ ...inputStyle, width: 150 }}>
                        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="Date">
                      <input type="date" value={expForm.date} onChange={(e) => setExpForm((f) => ({ ...f, date: e.target.value }))} style={{ ...inputStyle, width: 150 }} />
                    </Field>
                  </FormShell>
                )}

                <ExpenseList expenses={expenses} onDelete={handleDeleteExpense} />
              </div>
            )}

            {/* ── Income ── */}
            {tab === 'income' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <SectionLabel>Income — {MONTH_NAMES[month - 1]} {year}</SectionLabel>
                  <button onClick={() => setShowIncomeForm((v) => !v)} className="btn-gradient" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                    {showIncomeForm ? '✕ Cancel' : '+ Add Income'}
                  </button>
                </div>

                {showIncomeForm && (
                  <FormShell title="New Income" onSubmit={handleAddIncome} onCancel={() => setShowIncomeForm(false)} submitting={saving}>
                    <Field label="Source">
                      <input value={incForm.source} onChange={(e) => setIncForm((f) => ({ ...f, source: e.target.value }))} placeholder="e.g. Salary" required style={{ ...inputStyle, width: 200 }} />
                    </Field>
                    <Field label={`Amount (${CURRENCY})`}>
                      <input type="number" min="0.01" step="0.01" value={incForm.amount} onChange={(e) => setIncForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" required style={{ ...inputStyle, width: 120 }} />
                    </Field>
                    <Field label="Date">
                      <input type="date" value={incForm.date} onChange={(e) => setIncForm((f) => ({ ...f, date: e.target.value }))} style={{ ...inputStyle, width: 150 }} />
                    </Field>
                  </FormShell>
                )}

                <IncomeList income={income} onDelete={handleDeleteIncome} />
              </div>
            )}

            {/* ── Budgets ── */}
            {tab === 'budgets' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <SectionLabel>Monthly Budgets — {MONTH_NAMES[month - 1]} {year}</SectionLabel>
                  <button onClick={() => setShowBudgetForm((v) => !v)} className="btn-gradient" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                    {showBudgetForm ? '✕ Cancel' : '+ Set Budget'}
                  </button>
                </div>

                {showBudgetForm && (
                  <FormShell title="Set Category Budget" onSubmit={handleUpsertBudget} onCancel={() => setShowBudgetForm(false)} submitting={saving}>
                    <Field label="Category">
                      <select value={budForm.category} onChange={(e) => setBudForm((f) => ({ ...f, category: e.target.value }))} style={{ ...inputStyle, width: 160 }}>
                        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label={`Limit (${CURRENCY})`}>
                      <input type="number" min="1" step="1" value={budForm.limit} onChange={(e) => setBudForm((f) => ({ ...f, limit: e.target.value }))} placeholder="e.g. 600" required style={{ ...inputStyle, width: 120 }} />
                    </Field>
                  </FormShell>
                )}

                <BudgetProgress budgets={budgets} />
              </div>
            )}

            {/* ── Goals ── */}
            {tab === 'goals' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <SectionLabel>Financial Goals</SectionLabel>
                  <button onClick={() => setShowGoalForm((v) => !v)} className="btn-gradient" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                    {showGoalForm ? '✕ Cancel' : '+ New Goal'}
                  </button>
                </div>

                {showGoalForm && (
                  <FormShell title="New Financial Goal" onSubmit={handleAddGoal} onCancel={() => setShowGoalForm(false)} submitting={saving}>
                    <Field label="Goal Title">
                      <input value={goalForm.title} onChange={(e) => setGoalForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Emergency Fund" required style={{ ...inputStyle, width: 220 }} />
                    </Field>
                    <Field label={`Target (${CURRENCY})`}>
                      <input type="number" min="1" step="1" value={goalForm.targetAmount} onChange={(e) => setGoalForm((f) => ({ ...f, targetAmount: e.target.value }))} placeholder="e.g. 5000" required style={{ ...inputStyle, width: 140 }} />
                    </Field>
                  </FormShell>
                )}

                {goals.length === 0 && !showGoalForm ? (
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No goals yet — set your first financial target!</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {goals.map((g) => (
                      <GoalCard key={g.id} goal={g} onAddFunds={handleAddFunds} onDelete={handleDeleteGoal} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Subscriptions ── */}
            {tab === 'subscriptions' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <SectionLabel>Subscriptions</SectionLabel>
                  <button onClick={() => setShowSubForm((v) => !v)} className="btn-gradient" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                    {showSubForm ? '✕ Cancel' : '+ Add Subscription'}
                  </button>
                </div>

                {showSubForm && (
                  <FormShell title="Track Subscription" onSubmit={handleAddSub} onCancel={() => setShowSubForm(false)} submitting={saving}>
                    <Field label="Service Name">
                      <input value={subForm.serviceName} onChange={(e) => setSubForm((f) => ({ ...f, serviceName: e.target.value }))} placeholder="e.g. Netflix" required style={{ ...inputStyle, width: 180 }} />
                    </Field>
                    <Field label={`Amount (${CURRENCY})`}>
                      <input type="number" min="0.01" step="0.01" value={subForm.amount} onChange={(e) => setSubForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" required style={{ ...inputStyle, width: 100 }} />
                    </Field>
                    <Field label="Cycle">
                      <select value={subForm.billingCycle} onChange={(e) => setSubForm((f) => ({ ...f, billingCycle: e.target.value }))} style={{ ...inputStyle, width: 120 }}>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </Field>
                    <Field label="Next Payment">
                      <input type="date" value={subForm.nextPaymentDate} onChange={(e) => setSubForm((f) => ({ ...f, nextPaymentDate: e.target.value }))} style={{ ...inputStyle, width: 150 }} />
                    </Field>
                  </FormShell>
                )}

                {/* Monthly cost banner */}
                {subscriptions.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
                    <span style={{ fontSize: '1rem' }}>📊</span>
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      Monthly subscription total: {' '}
                      <strong style={{ color: '#8b5cf6' }}>{fmt(monthlySubCost)}</strong>
                    </span>
                  </div>
                )}

                <SubscriptionList subscriptions={subscriptions} onDelete={handleDeleteSub} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
