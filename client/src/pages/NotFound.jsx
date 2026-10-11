import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="error-page">
      <span>404</span>

      <h1>Страница не найдена</h1>

      <p>
        Похоже, такого адреса в ClientFlow нет.
      </p>

      <Link className="button primary" to="/">
        Вернуться на главную
      </Link>
    </div>
  );
}

function Forbidden() {
  return (
    <div className="error-page">
      <span>403</span>

      <h1>Доступ запрещён</h1>

      <p>
        У вашей учётной записи нет прав для этой страницы.
      </p>

      <Link className="button primary" to="/dashboard">
        В кабинет
      </Link>
    </div>
  );
}

export default NotFound;
export { Forbidden };