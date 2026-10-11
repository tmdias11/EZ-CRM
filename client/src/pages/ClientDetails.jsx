import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Mail,
  Phone,
  Trash2,
  Monitor,
  Crown
} from 'lucide-react';

import { api } from '../services/api';
import { statusName, sourceName } from './Dashboard';

function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.client(id)
      .then(setClient)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function remove() {
    if (!confirm('Удалить этого клиента?')) {
      return;
    }

    try {
      await api.deleteClient(id);
      navigate('/clients');
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) {
    return (
      <div className="empty">
        Загрузка клиента...
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty error-box">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="detail-top">
        <Link className="back-link" to="/clients">
          <ArrowLeft size={17} />
          Назад к клиентам
        </Link>

        <div className="detail-actions">
          <Link
            className="button ghost"
            to={`/clients/${id}/edit`}
          >
            <Edit3 size={17} />
            Редактировать
          </Link>

          <button
            className="button danger-button"
            onClick={remove}
          >
            <Trash2 size={17} />
            Удалить
          </button>
        </div>
      </div>

      <section className="profile-card">
        <div className="profile-main">
          <div className="avatar huge">
            {client.name[0]}
          </div>

          <div>
            <span className={`status ${client.status}`}>
              {statusName(client.status)}
            </span>

            <h1>{client.name}</h1>
            <p>{client.company}</p>
          </div>
        </div>

        <div className="contact-grid">
          <div>
            <Mail size={18} />

            <span>
              Email
              <strong>{client.email}</strong>
            </span>
          </div>

          <div>
            <Phone size={18} />

            <span>
              Телефон
              <strong>{client.phone}</strong>
            </span>
          </div>
        </div>
      </section>

      <section className="panel detail-panel">
        <div className="gaming-detail-item">
          <Monitor size={18} />

          <span>
            <span className="detail-label">
              Игровое место
            </span>

            <strong>
              {client.computer || 'Не указано'}
            </strong>
          </span>
        </div>

        <div className="gaming-detail-item">
          <Crown size={18} />

          <span>
            <span className="detail-label">
              Тариф
            </span>

            <strong>
              {client.tariff
                ? {
                    standard: 'Стандарт',
                    vip: 'VIP',
                    premium: 'Premium',
                    night: 'Ночной',
                    hourly: 'Почасовой',
                    other: 'Другой'
                  }[client.tariff] || client.tariff
                : 'Не выбран'}
            </strong>
          </span>
        </div>
      </section>
    </div>
  );
}

export default ClientDetails;
