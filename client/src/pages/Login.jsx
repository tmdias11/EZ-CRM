import { useState } from 'react';
import {
  Link,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || '/dashboard';

  async function submit(event) {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPage
      title="С возвращением"
      text="Войдите, чтобы продолжить работу с клиентами."
    >
      <form className="auth-form" onSubmit={submit}>
        <label>
          Email

          <input
            type="email"
            required
            value={form.email}
            onChange={(event) =>
              setForm({
                ...form,
                email: event.target.value
              })
            }
            placeholder="you@example.com или username"
          />
        </label>

        <label>
          Пароль

          <input
            type="password"
            required
            minLength="6"
            value={form.password}
            onChange={(event) =>
              setForm({
                ...form,
                password: event.target.value
              })
            }
            placeholder="••••••••"
          />
        </label>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <button
          className="button primary full"
          disabled={loading}
        >
          {loading ? 'Вход...' : 'Войти в систему'}
        </button>

        <p className="auth-bottom">
          Нет аккаунта?{' '}
          <Link to="/register">
            Зарегистрироваться
          </Link>
        </p>
      </form>
    </AuthPage>
  );
}

function AuthPage({ title, text, children }) {
  return (
    <div className="auth-page">
      <div className="auth-brand">
        <span className="brand-mark">C</span>
        <strong>EZ CRM</strong>
      </div>

      <div className="auth-box">
        <span className="eyebrow">
          CRM ACCESS
        </span>

        <h1>{title}</h1>

        <p>{text}</p>

        {children}
      </div>
    </div>
  );
}

export default Login;