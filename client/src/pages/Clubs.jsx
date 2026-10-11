import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Search, Users, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from './Dashboard';

const initial = { name: '', address: '', contact: '', description: '', photosText: '', socialsText: '' };

function linkLabel(url, fallback) { try { return new URL(url).hostname; } catch { return fallback; } }

export default function Clubs() {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [form, setForm] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [activeId, setActiveId] = useState(localStorage.getItem('activeClubId') || '');
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const data = await api.clubs();
      setClubs(data);
      const saved = localStorage.getItem('activeClubId');
      if (saved && data.some((c) => c.id === saved)) setActiveId(saved);
      else if (data[0]) { setActiveId(data[0].id); localStorage.setItem('activeClubId', data[0].id); }
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  function chooseClub(id) {
    setActiveId(id);
    localStorage.setItem('activeClubId', id);
    setNotice('Активный клуб изменён. Данные CRM будут загружаться для выбранного клуба.');
  }

  async function createClub(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const photos = form.photosText.split('\n').map(x => x.trim()).filter(Boolean);
      const socialLinks = form.socialsText.split('\n').map(x => x.trim()).filter(Boolean);
      const club = await api.createClub({ name: form.name, address: form.address, contact: form.contact,
        description: form.description, photos, socialLinks });
      localStorage.setItem('activeClubId', club.id); setActiveId(club.id);
      setForm(initial); setShowForm(false); setNotice('Клуб создан. Вы назначены его менеджером.');
      await load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function searchUsers(e) {
    e.preventDefault(); setError(''); setNotice('');
    try { setResults(await api.searchClubUsers(q)); }
    catch (e) { setError(e.message); }
  }
  async function addManager(userId) {
    setError(''); setNotice('');
    try {
      await api.addClubManager(activeId, userId);
      setResults(old => old.map(u => u.id === userId ? { ...u, isManager: true } : u));
      setNotice('Пользователь добавлен менеджером этого клуба.');
    } catch (e) { setError(e.message); }
  }

  const activeClub = clubs.find(c => c.id === activeId);
  return <div className="clubs-page">
    <PageHeader title="Клубы" subtitle="Создавайте клубы и управляйте доступом к их CRM."
      action={<button className="button primary" onClick={() => setShowForm(v => !v)}><Plus size={17} /> Добавить клуб</button>} />
    {error && <div className="form-error">{error}</div>}
    {notice && <div className="club-notice"><CheckCircle2 size={17} />{notice}</div>}
    {showForm && <form className="form-panel club-form" onSubmit={createClub}>
      <h2>Новый клуб</h2>
      <p className="muted">Название, адрес и контактные данные обязательны. Остальные поля можно заполнить позже.</p>
      <div className="form-grid">
        <label>Название клуба *<input required value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Например, Cyber Arena" /></label>
        <label>Адрес *<input required value={form.address} onChange={e => setForm({...form,address:e.target.value})} placeholder="Город, улица, дом" /></label>
        <label>Контактные данные *<input required value={form.contact} onChange={e => setForm({...form,contact:e.target.value})} placeholder="Телефон или email" /></label>
        <label>Описание<textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="Информация о клубе" /></label>
        <label>Ссылки на фотографии <small className="field-hint">По одной ссылке на строку, необязательно</small><textarea value={form.photosText} onChange={e => setForm({...form,photosText:e.target.value})} placeholder="https://..." /></label>
        <label>Социальные сети <small className="field-hint">По одной ссылке на строку, необязательно</small><textarea value={form.socialsText} onChange={e => setForm({...form,socialsText:e.target.value})} placeholder="https://instagram.com/..." /></label>
      </div>
      <div className="form-actions"><button className="button primary" disabled={busy}>{busy ? 'Создание...' : 'Создать клуб'}</button><button type="button" className="button ghost" onClick={() => setShowForm(false)}>Отмена</button></div>
    </form>}
    <section className="club-grid">
      {clubs.map(club => <article className={`panel club-card ${activeId === club.id ? 'selected' : ''}`} key={club.id}>
        <div className="club-card-icon"><Building2 size={22}/></div>
        <div className="club-card-heading"><h2>{club.name}</h2>{activeId === club.id && <span className="club-active">Активный</span>}</div>
        <p>{club.address}</p><p>{club.contact}</p>
        {club.description && <p className="muted">{club.description}</p>}
        {club.photos?.length > 0 && <p className="club-links">Фото: {club.photos.map((url, i) => <a key={url + i} href={url} target="_blank" rel="noreferrer">Ссылка {i + 1}</a>)}</p>}
        {club.socialLinks?.length > 0 && <p className="club-links">Соцсети: {club.socialLinks.map((url, i) => <a key={url + i} href={url} target="_blank" rel="noreferrer">{linkLabel(url, `Ссылка ${i + 1}`)}</a>)}</p>}
        <div className="club-meta"><span><Users size={15}/> {club.myRole === 'admin' ? 'Администратор сайта' : 'Менеджер клуба'}</span></div>
        <button className={`button ${activeId === club.id ? 'ghost' : 'primary'} full`} onClick={() => chooseClub(club.id)}>{activeId === club.id ? 'Выбран' : 'Выбрать клуб'}</button>
      </article>)}
      {!clubs.length && <div className="empty">У вас пока нет доступных клубов. Создайте клуб, чтобы начать работу.</div>}
    </section>
    {activeClub && <section className="panel manager-panel">
      <div className="panel-head"><div><h2>Менеджеры клуба «{activeClub.name}»</h2><p>Найдите зарегистрированного пользователя по логину и предоставьте ему доступ только к этому клубу.</p></div></div>
      <form className="toolbar" onSubmit={searchUsers}>
        <div className="search"><Search size={18}/><input value={q} onChange={e => setQ(e.target.value)} minLength={2} placeholder="Логин пользователя (минимум 2 символа)"/></div>
        <button className="button primary" disabled={q.trim().length < 2}>Найти</button>
      </form>
      {results.map(user => <div className="manager-result" key={user.id}>
        <div className="avatar">{user.name?.[0]?.toUpperCase()}</div><div className="manager-info"><strong>{user.name}</strong><span>@{user.username} · {user.email}</span></div>
        {user.isManager ? <span className="club-active">Уже менеджер</span> : <button className="button primary" onClick={() => addManager(user.id)}>Добавить</button>}
      </div>)}
      {results.length === 0 && <p className="muted">Поиск учитывает логин, а не email или имя.</p>}
    </section>}
  </div>;
}
