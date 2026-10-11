
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CircleUserRound,
  UserPlus,
  Users
} from 'lucide-react';

import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';


function Dashboard() {
  const { user } = useAuth();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.myClients()
      .then(setClients)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const active = useMemo(
    () => clients.filter((c) => c.status === 'active').length,
    [clients]
  );

  const newClients = useMemo(
    () => clients.filter((c) => c.status === 'new').length,
    [clients]
  );

  return (
    <div>
      <PageHeader
        title={`Добро пожаловать, ${user.name}!`}
        subtitle="Вот что происходит с вашими клиентами сегодня."
        action={
          <Link
            className="button primary"
            to="/clients/new"
          >
            <UserPlus size={18} />
            Новый клиент
          </Link>
        }
      />

      <div className="stats-grid">
        <Stat
          icon={<Users />}
          label="Мои клиенты"
          value={clients.length}
        />

        <Stat
          icon={<UserPlus />}
          label="Новые"
          value={newClients}
        />

        <Stat
          icon={<CircleUserRound />}
          label="Активные"
          value={active}
        />

        <Stat
          icon={<BriefcaseBusiness />}
          label="Конверсия"
          value={
            clients.length
              ? `${Math.round((active / clients.length) * 100)}%`
              : '0%'
          }
        />
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Последние клиенты</h2>
            <p>Ваши последние записи в CRM</p>
          </div>

          <Link
            className="text-link"
            to="/clients"
          >
            Все клиенты
            <ArrowUpRight size={16} />
          </Link>
        </div>

        {error ? (
          <div className="empty error-box">
            {error}
          </div>
        ) : loading ? (
          <div className="empty">
            Загрузка...
          </div>
        ) : clients.length === 0 ? (
          <div className="empty">
            <h3>Клиентов пока нет</h3>

            <p>
              Создайте первую запись, чтобы начать работу.
            </p>

            <Link
              className="button primary"
              to="/clients/new"
            >
              Добавить клиента
            </Link>
          </div>
        ) : (
          <ClientTable
            clients={clients.slice(-5).reverse()}
          />
        )}
      </section>
    </div>
  );
}


function Stat({ icon, label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        {icon}
      </div>

      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}


function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      {action}
    </div>
  );
}


function ClientTable({ clients, onDelete }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Клиент</th>
            <th>Компания</th>
            <th>Статус</th>
            <th>Источник</th>
            <th>Дата</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {clients.map((c) => (
            <tr key={c.id}>
              <td>
                <Link
                  className="client-cell"
                  to={`/clients/${c.id}`}
                >
                  <span className="avatar small">
                    {c.name[0]}
                  </span>

                  <span>
                    <b>{c.name}</b>
                    <small>{c.email}</small>
                  </span>
                </Link>
              </td>

              <td>
                {c.company}
              </td>

              <td>
                <span className={`status ${c.status}`}>
                  {statusName(c.status)}
                </span>
              </td>

              <td>
                {sourceName(c.source)}
              </td>

              <td>
                {new Date(c.createdAt).toLocaleDateString('ru-RU')}
              </td>

              <td>
                {onDelete && (
                  <button
                    className="icon-button danger"
                    onClick={() => onDelete(c.id)}
                  >
                    Удалить
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function statusName(status) {
  return {
    new: 'Новый',
    active: 'Активен',
    paused: 'На паузе',
    closed: 'Закрыт'
  }[status] || status;
}


function sourceName(source) {
  return {
    site: 'Сайт',
    referral: 'Рекомендация',
    social: 'Соцсети',
    ads: 'Реклама',
    other: 'Другое'
  }[source] || source;
}


export default Dashboard;

export {
  PageHeader,
  ClientTable,
  statusName,
  sourceName
};
