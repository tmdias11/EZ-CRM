import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Gamepad2,
  ShieldCheck,
  UsersRound,
  Zap,
  Trophy,
  Monitor
} from 'lucide-react';

function Home() {
  return (
    <div className="landing gaming-landing">
      <header className="landing-header">
        <div className="brand">
          <span className="brand-mark">
            <Gamepad2 size={21} />
          </span>

          <strong>EZ CRM</strong>

          <span className="brand-badge">
            CLUB CRM
          </span>
        </div>

        <div className="landing-header-actions">
          <Link className="button ghost" to="/login">
            Войти
          </Link>

          <Link className="button primary" to="/register">
            Запустить систему
            <ArrowRight size={17} />
          </Link>
        </div>
      </header>

      <section className="hero gaming-hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <Zap size={14} />
            GAMING CLUB MANAGEMENT SYSTEM
          </span>

          <h1>
            Управляй клубом.
            <br />
            <span>Играй по своим правилам.</span>
          </h1>

          <p>
            CRM для компьютерных клубов и игровых пространств.
            Клиенты, игровые места, активность команды и вся
            операционная информация — в одной системе.
          </p>

          <div className="hero-actions">
            <Link
              className="button primary large"
              to="/register"
            >
              Создать аккаунт
              <ArrowRight size={18} />
            </Link>

            <Link className="text-link" to="/clients">
              Открыть базу клиентов
            </Link>
          </div>

          <div className="hero-features">
            <span>
              <Gamepad2 size={15} />
              Gaming CRM
            </span>

            <span>
              <Monitor size={15} />
              Управление клубом
            </span>

            <span>
              <Zap size={15} />
              Real-time контроль
            </span>
          </div>
        </div>

        <div className="hero-card gaming-dashboard">
          <div className="mini-card-top">
            <div>
              <span className="dashboard-label">
                CLUB CONTROL
              </span>

              <strong>Обзор клуба</strong>
            </div>

            <div className="dashboard-icon">
              <Gamepad2 size={20} />
            </div>
          </div>

          <div className="mini-stats">
            <div>
              <span>Игроки онлайн</span>
              <strong>128</strong>
            </div>

            <div>
              <span>Загрузка клуба</span>
              <strong>87%</strong>
            </div>
          </div>

          <div className="progress gaming-progress">
            <span style={{ width: '87%' }} />
          </div>

          <div className="dashboard-section-title">
            <span>Активные игроки</span>
            <span className="live-indicator">
              <i />
              LIVE
            </span>
          </div>

          <div className="fake-row">
            <div className="avatar small gaming-avatar">
              A
            </div>

            <div>
              <b>Алексей Морозов</b>
              <small>PC #24 · Valorant</small>
            </div>

            <span className="status active">
              Online
            </span>
          </div>

          <div className="fake-row">
            <div className="avatar small gaming-avatar">
              И
            </div>

            <div>
              <b>Иван Петров</b>
              <small>PC #17 · CS2</small>
            </div>

            <span className="status new">
              Новый
            </span>
          </div>

          <div className="fake-row">
            <div className="avatar small gaming-avatar">
              М
            </div>

            <div>
              <b>Максим Ким</b>
              <small>VIP #03 · Dota 2</small>
            </div>

            <span className="status active">
              Online
            </span>
          </div>
        </div>
      </section>

      <section className="features gaming-features">
        <div>
          <div className="feature-icon">
            <UsersRound size={22} />
          </div>

          <h3>Игроки и клиенты</h3>

          <p>
            Единая база игроков, история взаимодействий,
            контакты и информация о постоянных клиентах.
          </p>
        </div>

        <div>
          <div className="feature-icon">
            <Monitor size={22} />
          </div>

          <h3>Контроль клуба</h3>

          <p>
            Следите за активностью, загрузкой клуба и
            состоянием игровых мест из одной панели.
          </p>
        </div>

        <div>
          <div className="feature-icon">
            <BarChart3 size={22} />
          </div>

          <h3>Статистика</h3>

          <p>
            Анализируйте активность игроков и эффективность
            работы команды на основе данных CRM.
          </p>
        </div>

        <div>
          <div className="feature-icon">
            <Trophy size={22} />
          </div>

          <h3>VIP & Loyalty</h3>

          <p>
            Работайте с постоянными игроками, VIP-клиентами
            и формируйте долгосрочную аудиторию клуба.
          </p>
        </div>

        <div>
          <div className="feature-icon">
            <ShieldCheck size={22} />
          </div>

          <h3>Безопасность</h3>

          <p>
            Защищённые маршруты, авторизация и разграничение
            прав доступа для сотрудников клуба.
          </p>
        </div>

        <div>
          <div className="feature-icon">
            <Gamepad2 size={22} />
          </div>

          <h3>Gaming First</h3>

          <p>
            Интерфейс создан именно для компьютерных клубов,
            а не адаптирован из обычной бизнес-системы.
          </p>
        </div>
      </section>

      <section className="gaming-cta">
        <div>
          <span className="eyebrow">
            READY PLAYER ONE
          </span>

          <h2>
            Твой клуб.
            <br />
            Твоя система.
          </h2>

          <p>
            Подключи ClientFlow и управляй клубом
            без лишней рутины.
          </p>
        </div>

        <Link className="button primary large" to="/register">
          Начать работу
          <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  );
}

export default Home;