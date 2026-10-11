import {
  NavLink,
  Outlet,
  useNavigate
} from 'react-router-dom';

import {
  LayoutDashboard,
  Users,
  Globe2,
  LogOut,
  PlusCircle,
  ShieldCheck,
  CheckSquare,
  UserCircle,
  Building2,
  Monitor
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            C
          </span>

          <div>
            <strong>EZ CRM</strong>
            <small>CRM SYSTEM</small>
          </div>
        </div>

        <nav className="nav-list">
          <NavLink to="/dashboard">
            <LayoutDashboard size={19} />
            Обзор
          </NavLink>

          <NavLink to="/clients">
            <Users size={19} />
            Клиенты
          </NavLink>

          <NavLink to="/clubs">
            <Building2 size={19} />
            Клубы / Добавить клуб
          </NavLink>

          <NavLink to="/club-floor">
            <Monitor size={19} />
            Работа клуба
          </NavLink>

          <NavLink to="/clients/new">
            <PlusCircle size={19} />
            Добавить клиента
          </NavLink>

          <NavLink to="/tasks">
            <CheckSquare size={19} />
            Задачи
          </NavLink>

          <NavLink to="/profile">
            <UserCircle size={19} />
            Профиль
          </NavLink>

          <NavLink to="/explore">
            <Globe2 size={19} />
            Внешний API
          </NavLink>

          {user?.role === 'admin' && (
            <NavLink to="/admin">
              <ShieldCheck size={19} />
              Администрирование
            </NavLink>
          )}
        </nav>

        <div className="sidebar-user">
          <div className="avatar">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Фото профиля"
              />
            ) : (
              user?.name?.[0]?.toUpperCase()
            )}
          </div>

          <div>
            <strong>
              {user?.name}
            </strong>

            <small>
              {user?.role === 'admin' ? 'Администратор сайта' : 'Пользователь'}
            </small>
          </div>

          <button
            onClick={handleLogout}
            title="Выйти"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;