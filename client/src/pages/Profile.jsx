import { useEffect, useState } from 'react';
import { Camera, Save } from 'lucide-react';

import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Profile() {
  const { user, setUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.me()
      .then((data) => {
        setName(data.name || '');
        setEmail(data.email || '');
        setAvatar(data.avatar || '');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function handlePhoto(e) {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Можно загрузить только изображение');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Размер фотографии не должен превышать 2 МБ');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setAvatar(reader.result);
      setError('');
    };

    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const data = await api.updateProfile({
        name,
        email,
        password,
        avatar
      });

      setUser(data);

      setName(data.name);
      setEmail(data.email);
      setAvatar(data.avatar || '');
      setPassword('');

      setMessage('Профиль успешно обновлён');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="empty">
        Загрузка профиля...
      </div>
    );
  }

  return (
    <div className="profile-page">

      <div className="page-header">
        <div>
          <h1>Профиль</h1>
          <p>
            Управление информацией вашего аккаунта
          </p>
        </div>
      </div>

      <section className="panel profile-panel">

        <div className="profile-photo-section">

          <div className="profile-photo">
            {avatar ? (
              <img
                src={avatar}
                alt="Фото профиля"
              />
            ) : (
              <span>
                {name[0]?.toUpperCase()}
              </span>
            )}
          </div>

          <label className="photo-button">
            <Camera size={17} />
            Изменить фото

            <input
              type="file"
              accept="image/*"
              onChange={handlePhoto}
            />
          </label>

          <small>
            JPG, PNG или WEBP. Максимум 2 МБ.
          </small>

        </div>

        <form
          className="profile-form"
          onSubmit={handleSubmit}
        >

          <div className="form-group">
            <label>Имя</label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Новый пароль</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Оставьте пустым, если менять не нужно"
              minLength={6}
            />
          </div>

          <div className="profile-info">
            <span>Роль</span>
            <strong>
              {user?.role === 'admin'
                ? 'Администратор'
                : 'Менеджер'}
            </strong>
          </div>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          {message && (
            <div className="success-box">
              {message}
            </div>
          )}

          <button
            className="button primary"
            type="submit"
            disabled={saving}
          >
            <Save size={18} />

            {saving
              ? 'Сохранение...'
              : 'Сохранить изменения'}
          </button>

        </form>

      </section>
    </div>
  );
}

export default Profile;