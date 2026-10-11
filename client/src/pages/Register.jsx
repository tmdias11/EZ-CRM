import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      await register(form);
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <span className="brand-mark">C</span>
        <strong>ClientFlow</strong>
      </div>

      <div className="auth-box">
        <span className="eyebrow">
          CREATE ACCOUNT
        </span>

        <h1>Создайте аккаунт</h1>

        <p>
          Начните управлять клиентами уже сегодня.
        </p>

        <form className="auth-form" onSubmit={submit}>
          <label>
            Имя

            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm({
                  ...form,
                  name: event.target.value
                })
              }
              placeholder="Ваше имя"
            />
          </label>

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
              placeholder="you@example.com"
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
              placeholder="Минимум 6 символов"
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
            {loading
              ? 'Создание...'
              : 'Создать аккаунт'}
          </button>

          <p className="auth-bottom">
            Уже есть аккаунт?{' '}
            <Link to="/login">
              Войти
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;