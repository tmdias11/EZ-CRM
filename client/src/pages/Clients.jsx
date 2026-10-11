import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Filter,
  Plus,
  Search
} from 'lucide-react';

import { api } from '../services/api';
import {
  PageHeader,
  ClientTable
} from './Dashboard';


function Clients() {
  const [clients, setClients] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.clients()
      .then(setClients)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return clients
      .filter((client) =>
        `${client.name} ${client.email} ${client.company}`
          .toLowerCase()
          .includes(q.toLowerCase())
      )
      .filter(
        (client) =>
          status === 'all' || client.status === status
      );
  }, [clients, q, status]);

  return (
    <div className="clients-page">

      <PageHeader
        title="Клиенты"
        subtitle="Поиск и управление клиентской базой"
        action={
          <Link
            className="button primary"
            to="/clients/new"
          >
            <Plus size={18} />
            Добавить клиента
          </Link>
        }
      />

      <div className="toolbar">

        <div className="search">
          <Search size={18} />

          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по имени, email или компании..."
          />
        </div>

        <div className="select-wrap">
          <Filter size={17} />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">
              Все статусы
            </option>

            <option value="new">
              Новые
            </option>

            <option value="active">
              Активные
            </option>

            <option value="paused">
              На паузе
            </option>

            <option value="closed">
              Закрытые
            </option>
          </select>
        </div>

      </div>

      <section className="panel clients-panel">

        <div className="panel-head">
          <div>
            <h2>Клиентская база</h2>

            <p>
              Найдено клиентов: {filtered.length}
            </p>
          </div>
        </div>

        {loading && (
          <div className="empty">
            Загрузка клиентов...
          </div>
        )}

        {!loading && error && (
          <div className="empty error-box">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="empty">
            <h3>
              Клиенты не найдены
            </h3>

            <p>
              Попробуйте изменить поиск или фильтр.
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <ClientTable clients={filtered} />
        )}

      </section>

    </div>
  );
}


export default Clients;