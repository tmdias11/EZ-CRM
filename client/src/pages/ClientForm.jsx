import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

import { api } from '../services/api';
import { PageHeader } from './Dashboard';

const empty = {
  name: '',
  email: '',
  phone: '',
  company: '',
  computer: '',
  tariff: '',
  status: 'new',
  source: 'site',
  notes: ''
};

function ClientForm() {
  const { id } = useParams();
  const edit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(edit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (edit) {
      api.client(id)
        .then(setForm)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [id, edit]);

  function change(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  async function submit(e) {
    e.preventDefault();

    setError('');
    setSaving(true);

    try {
      const result = edit
        ? await api.updateClient(id, form)
        : await api.createClient(form);

      navigate(`/clients/${result.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="empty">
        Загрузка...
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={edit ? 'Редактирование клиента' : 'Новый клиент'}
        subtitle={
          edit
            ? 'Измените данные записи'
            : 'Добавьте клиента в вашу CRM'
        }
      />

      <form
        className="form-panel"
        onSubmit={submit}
      >
        <div className="form-grid">
          <label>
            Имя клиента

            <input
              name="name"
              required
              value={form.name}
              onChange={change}
              placeholder="Алексей Иванов"
            />
          </label>

          <label>
            Email

            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={change}
              placeholder="alex@example.com"
            />
          </label>

          <label>
            Телефон

            <input
              name="phone"
              required
              value={form.phone}
              onChange={change}
              placeholder="+7 700 000 00 00"
            />
          </label>

          <label>
            Компания

            <input
              name="company"
              required
              value={form.company}
              onChange={change}
              placeholder="Название компании"
            />
          </label>

          <label>
            Компьютер / VIP-комната

            <input
              name="computer"
              value={form.computer}
              onChange={change}
              placeholder="Например: PC-24 или VIP-03"
            />

            <small className="field-hint">
              Необязательно
            </small>
          </label>

          <label>
            Тариф

            <select
              name="tariff"
              value={form.tariff}
              onChange={change}
            >
              <option value="">
                Не выбран
              </option>

              <option value="standard">
                Стандарт
              </option>

              <option value="vip">
                VIP
              </option>

              <option value="premium">
                Premium
              </option>

              <option value="night">
                Ночной
              </option>

              <option value="hourly">
                Почасовой
              </option>

              <option value="other">
                Другой
              </option>
            </select>

            <small className="field-hint">
              Необязательно
            </small>
          </label>

          <label>
            Статус

            <select
              name="status"
              value={form.status}
              onChange={change}
            >
              <option value="new">
                Новый
              </option>

              <option value="active">
                Активен
              </option>

              <option value="paused">
                На паузе
              </option>

              <option value="closed">
                Закрыт
              </option>
            </select>
          </label>

          <label>
            Источник

            <select
              name="source"
              value={form.source}
              onChange={change}
            >
              <option value="site">
                Сайт
              </option>

              <option value="referral">
                Рекомендация
              </option>

              <option value="social">
                Соцсети
              </option>

              <option value="ads">
                Реклама
              </option>

              <option value="other">
                Другое
              </option>
            </select>
          </label>

          <label className="wide">
            Заметки

            <textarea
              name="notes"
              rows="5"
              value={form.notes}
              onChange={change}
              placeholder="Дополнительная информация о клиенте..."
            />
          </label>
        </div>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <div className="form-actions">
          <Link
            className="button ghost"
            to="/clients"
          >
            <ArrowLeft size={17} />
            Отмена
          </Link>

          <button
            className="button primary"
            disabled={saving}
          >
            <Save size={17} />

            {saving
              ? 'Сохранение...'
              : 'Сохранить клиента'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ClientForm;
