import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Users,
  BriefcaseBusiness,
} from 'lucide-react';

import { api } from '../services/api';
import { PageHeader } from './Dashboard';

function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  

  useEffect(() => {
    Promise.all([
      api.adminStats(),
      api.adminUsers()
    ])
      .then(([s, u]) => {
        setStats(s);
        setUsers(u);
      })
      .catch((e) => {
        setError(e.message);
      })
      ;
  }, []);


  return (
    <div>
      <PageHeader
        title="Администрирование"
        subtitle="Системная информация и пользователи платформы"
      />

      {error ? (
        <div className="empty error-box">
          {error}
        </div>
      ) : (
        <>
          {/* ================================
              СТАТИСТИКА
          ================================= */}

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <Users />
              </div>

              <span>Пользователи</span>

              <strong>
                {stats?.users ?? '—'}
              </strong>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <BriefcaseBusiness />
              </div>

              <span>Клиенты</span>

              <strong>
                {stats?.clients ?? '—'}
              </strong>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <ShieldCheck />
              </div>

              <span>Администраторы</span>

              <strong>
                {stats?.admins ?? '—'}
              </strong>
            </div>
          </div>

          {/* ================================
              ПОЛЬЗОВАТЕЛИ
          ================================= */}

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Пользователи системы</h2>

                <p>
                  Роли и дата регистрации
                </p>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Имя</th>
                    <th>Email</th>
                    <th>Роль</th>
                    <th>Регистрация</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <b>{u.name}</b>
                      </td>

                      <td>{u.email}</td>

                      <td>
                        <span className="status active">
                          {u.role === 'admin'
                            ? 'Администратор'
                            : 'Пользователь'}
                        </span>
                      </td>

                      <td>
                        {new Date(
                          u.createdAt
                        ).toLocaleDateString(
                          'ru-RU'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Admin;