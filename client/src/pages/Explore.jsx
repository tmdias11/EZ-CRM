import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { PageHeader } from './Dashboard';

function Explore() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    const controller = new AbortController();

    try {
      const response = await fetch(
        'https://dummyjson.com/users?limit=20',
        {
          signal: controller.signal
        }
      );

      if (!response.ok) {
        throw new Error('Ошибка загрузки API');
      }

      const data = await response.json();
      setItems(data.users || []);
    } catch (error) {
      if (error.name !== 'AbortError') {
        setError('Не удалось получить данные внешнего API');
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }

  useEffect(() => {
    const controller = new AbortController();

    async function fetchUsers() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          'https://dummyjson.com/users?limit=20',
          {
            signal: controller.signal
          }
        );

        if (!response.ok) {
          throw new Error('Ошибка загрузки API');
        }

        const data = await response.json();
        setItems(data.users || []);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setError('Не удалось получить данные внешнего API');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();

    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const search = q.toLowerCase();

    return items.filter((item) => {
      const text = `
        ${item.firstName}
        ${item.lastName}
        ${item.company?.name || ''}
      `.toLowerCase();

      return text.includes(search);
    });
  }, [items, q]);

  return (
    <div>
      <PageHeader
        title="Внешний API"
        subtitle="Демонстрация GET-запроса к DummyJSON — пример внешних контактов."
        action={
          <button className="button ghost" onClick={load}>
            <RefreshCw size={17} />
            Повторить
          </button>
        }
      />

      <div className="api-note">
        Данные загружаются напрямую через <b>fetch()</b>, имеют состояния
        loading/error/empty и поддерживают локальный поиск.
      </div>

      <div className="toolbar">
        <div className="search">
          <Search size={18} />

          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Поиск внешних контактов..."
          />
        </div>
      </div>

      {loading && (
        <div className="empty">
          Загрузка внешнего API...
        </div>
      )}

      {!loading && error && (
        <div className="empty error-box">
          <h3>{error}</h3>

          <button
            className="button primary"
            onClick={load}
          >
            Повторить запрос
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty">
          Ничего не найдено.
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="api-grid">
          {filtered.map((item) => (
            <div className="api-card" key={item.id}>
              <img src={item.image} alt="" />

              <div>
                <h3>
                  {item.firstName} {item.lastName}
                </h3>

                <p>{item.email}</p>

                <span>
                  {item.company?.name || 'Компания не указана'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Explore;