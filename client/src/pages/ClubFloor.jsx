import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Clock3, Monitor, RefreshCw, ShieldAlert, X, Crown, Settings2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { PageHeader } from './Dashboard';

const emptyAssignment = { resourceType: 'computer', resource: 'PC-01', tariff: 'Стандартный', durationHours: '2' };
const normalizePlace = value => { const raw = String(value || '').trim().toUpperCase(); const type = raw.startsWith('VIP') ? 'VIP' : 'PC'; const match = raw.match(/(\d+)/); return match ? `${type}-${String(Number(match[1])).padStart(2, '0')}` : raw; };
const tariffOptions = ['Стандартный', 'Премиум', 'Ночной', 'Безлимит'];

export default function ClubFloor() {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [clients, setClients] = useState([]);
  const [mapConfig, setMapConfig] = useState({ pcCount: 20, vipCount: 3 });
  const [pcCount, setPcCount] = useState('20');
  const [vipCount, setVipCount] = useState('3');
  const [mapSaving, setMapSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [selected, setSelected] = useState(null);
  const [assignment, setAssignment] = useState(emptyAssignment);
  const [busy, setBusy] = useState(false);
  const [extendClient, setExtendClient] = useState(null);
  const [extendHours, setExtendHours] = useState('1');
  const expiredSeen = useRef(new Set());
  const hasInitialSnapshot = useRef(false);

  const load = useCallback(async (initial = false) => {
    try {
      const data = await api.clubFloor();
      setQueue(data.queue || []);
      setClients(data.clients || []);
      const config = data.mapConfig || { pcCount: 20, vipCount: 3 };
      setMapConfig(config); setPcCount(String(config.pcCount)); setVipCount(String(config.vipCount));
      const expired = (data.clients || []).filter(c => c.tariffState === 'expired');
      const newExpired = expired.filter(c => !expiredSeen.current.has(c.id));
      if (hasInitialSnapshot.current && newExpired.length) setToast(`У клиента «${newExpired[0].name}» истёк тариф`);
      expiredSeen.current = new Set(expired.map(c => c.id));
      hasInitialSnapshot.current = true;
      setError('');
    } catch (e) { setError(e.message); }
    finally { if (initial) setLoading(false); }
  }, []);

  useEffect(() => {
    load(true);
    const timer = setInterval(() => load(false), 5000);
    return () => clearInterval(timer);
  }, [load]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  function getAvailableResource(type) {
    const count = type === 'vip' ? mapConfig.vipCount : mapConfig.pcCount;
    for (let i = 1; i <= count; i++) { const name = `${type === 'vip' ? 'VIP' : 'PC'}-${String(i).padStart(2, '0')}`; if (!clients.some(c => normalizePlace(c.computer) === normalizePlace(name))) return name; }
    return '';
  }
  function openAccept(lead) { const resource = getAvailableResource('computer'); setSelected(lead); setAssignment({ ...emptyAssignment, resource }); setError(''); }
  async function accept() {
    if (!selected) return;
    setBusy(true); setError('');
    try {
      await api.acceptWalkIn(selected.id, assignment);
      setSelected(null); setToast(`Клиент «${selected.name}» принят в клуб`); await load(false);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function reject(id) {
    try { await api.rejectWalkIn(id); await load(false); }
    catch (e) { setError(e.message); }
  }
  async function closeClient(client) {
    try { await api.closeClubClient(client.id); setToast(`Клиент «${client.name}» закрыт`); await load(false); }
    catch (e) { setError(e.message); }
  }
  async function extend() {
    if (!extendClient) return;
    setBusy(true);
    try { await api.extendClubClient(extendClient.id, { durationHours: extendHours }); setToast(`Время клиента «${extendClient.name}» продлено`); setExtendClient(null); await load(false); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  const occupiedResources = new Set(clients.map(c => normalizePlace(c.computer)).filter(Boolean));
  const allResourceOptions = assignment.resourceType === 'vip'
    ? Array.from({ length: mapConfig.vipCount }, (_, i) => `VIP-${String(i + 1).padStart(2, '0')}`)
    : Array.from({ length: mapConfig.pcCount }, (_, i) => `PC-${String(i + 1).padStart(2, '0')}`);
  const resourceOptions = allResourceOptions.filter(name => !occupiedResources.has(normalizePlace(name)));
  const getClientForPlace = name => clients.find(c => normalizePlace(c.computer) === normalizePlace(name));
  const isOccupied = name => Boolean(getClientForPlace(name));
  async function saveMapConfig() {
    setMapSaving(true); setError('');
    try { const saved = await api.updateAdminClub({ pcCount: Number(pcCount), vipCount: Number(vipCount) }); setMapConfig(saved); setPcCount(String(saved.pcCount)); setVipCount(String(saved.vipCount)); }
    catch (e) { setError(e.message); } finally { setMapSaving(false); }
  }

  const mapStats = { occupiedPcs: Array.from({length: mapConfig.pcCount}, (_, i) => `PC-${String(i + 1).padStart(2, '0')}`).filter(isOccupied).length, occupiedVips: Array.from({length: mapConfig.vipCount}, (_, i) => `VIP-${String(i + 1).padStart(2, '0')}`).filter(isOccupied).length };
  mapStats.freePcs = mapConfig.pcCount - mapStats.occupiedPcs; mapStats.freeVips = mapConfig.vipCount - mapStats.occupiedVips;

  return <div className="club-floor-page">
    <PageHeader title="Работа клуба" subtitle="Новые посетители, назначение мест и контроль времени тарифа." action={<button className="button ghost" onClick={() => load(false)}><RefreshCw size={16}/> Обновить</button>} />
    {error && <div className="form-error">{error}</div>}
    {toast && <div className="floor-toast"><Check size={18}/>{toast}<button aria-label="Закрыть уведомление" onClick={() => setToast('')}><X size={16}/></button></div>}
    <section className="floor-section club-floor-map-section">
      <div className="floor-section-title"><div><h2>Карта клуба</h2><p>{mapConfig.pcCount} компьютеров · {mapConfig.vipCount} VIP-комнат. Зелёные места свободны, красные заняты.</p></div><Monitor size={22}/></div>
      {user?.role === 'admin' && <div className="club-map-settings floor-map-settings">
        <label><span>Количество ПК</span><input type="number" min="1" max="200" value={pcCount} onChange={e => setPcCount(e.target.value)}/></label>
        <label><span>VIP-комнаты</span><input type="number" min="0" max="50" value={vipCount} onChange={e => setVipCount(e.target.value)}/></label>
        <button type="button" className="button primary" onClick={saveMapConfig} disabled={mapSaving}>{mapSaving ? 'Сохранение...' : <><Settings2 size={16}/> Сохранить карту</>}</button>
      </div>}
      <div className="club-map-summary">
        <div className="map-summary-item"><Monitor size={18}/><div><span>ПК свободно</span><strong>{mapStats.freePcs}</strong></div></div>
        <div className="map-summary-item busy-summary"><Monitor size={18}/><div><span>ПК занято</span><strong>{mapStats.occupiedPcs}</strong></div></div>
        <div className="map-summary-item"><Crown size={18}/><div><span>VIP свободно</span><strong>{mapStats.freeVips}</strong></div></div>
        <div className="map-summary-item busy-summary"><Crown size={18}/><div><span>VIP занято</span><strong>{mapStats.occupiedVips}</strong></div></div>
      </div>
      <div className="club-map">
        <div className="map-zone"><div className="map-zone-title"><Monitor size={18}/><span>Игровой зал</span></div><div className="pc-map-grid">
          {Array.from({length: mapConfig.pcCount}, (_, i) => { const name = `PC-${String(i + 1).padStart(2, '0')}`; const client = getClientForPlace(name); const busy = Boolean(client); return <div key={name} className={`map-place pc-place ${busy ? 'busy' : 'free'}`} title={busy ? `${name} — ${client.name}` : `${name} — Свободно`}><div className="place-screen"><Monitor size={20}/></div><strong>{name}</strong><span>{busy ? client.name : 'Свободно'}</span><i className="place-light"/></div>; })}
        </div></div>
        {mapConfig.vipCount > 0 && <div className="map-zone vip-zone"><div className="map-zone-title"><Crown size={18}/><span>VIP-комнаты</span></div><div className="vip-map-grid">
          {Array.from({length: mapConfig.vipCount}, (_, i) => { const name = `VIP-${String(i + 1).padStart(2, '0')}`; const client = getClientForPlace(name); const busy = Boolean(client); return <div key={name} className={`map-place vip-place ${busy ? 'busy' : 'free'}`} title={busy ? `${name} — ${client.name}` : `${name} — Свободно`}><Crown size={26}/><strong>{name}</strong><span>{busy ? client.name : 'Свободно'}</span><i className="place-light"/></div>; })}
        </div></div>}
      </div>
    </section>
    <section className="floor-section">
      <div className="floor-section-title"><div><h2>Новые клиенты</h2><p>Новые записи поступают из DummyJSON каждые 25 секунд.</p></div><span className="floor-count">{queue.length}</span></div>
      {loading ? <p className="muted">Загрузка...</p> : queue.length === 0 ? <div className="floor-empty">Пока новых клиентов нет. Проверьте снова через несколько секунд.</div> : <div className="floor-leads">
        {queue.map(lead => <article className="floor-lead" key={lead.id}>
          <div className="floor-avatar">{lead.name?.[0]?.toUpperCase() || '?'}</div><div className="floor-person"><strong>{lead.name}</strong><span>{lead.email || 'Email не указан'}</span><small>Поступил {new Date(lead.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</small></div>
          <div className="floor-actions"><button className="button primary" onClick={() => openAccept(lead)}><Check size={16}/> Принять</button><button className="button danger" onClick={() => reject(lead.id)}><X size={16}/> Отклонить</button></div>
        </article>)}
      </div>}
    </section>

    <section className="floor-section">
      <div className="floor-section-title"><div><h2>Текущие клиенты</h2><p>Клиенты с истёкшим тарифом автоматически поднимаются вверх. Закрытые клиенты скрыты.</p></div><span className="floor-count">{clients.length}</span></div>
      {!clients.length ? <div className="floor-empty">В клубе пока нет текущих клиентов. Принимайте посетителей из списка выше.</div> : <div className="floor-current-list">
        {clients.map(client => <article className={`floor-current ${client.tariffState === 'expired' ? 'expired' : ''}`} key={client.id}>
          <div className="floor-current-icon">{client.resourceType === 'vip' ? <Crown size={20}/> : <Monitor size={20}/>}</div>
          <div className="floor-person"><strong>{client.name}</strong><span>{client.computer || 'Место не указано'} · {client.tariff || 'Тариф не указан'}</span><small>{client.tariffType === 'unlimited' ? 'Безлимитный тариф' : client.tariffEndsAt ? `До ${new Date(client.tariffEndsAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : 'Время тарифа не задано'}</small></div>
          {client.tariffState === 'expired' ? <><span className="floor-expired"><ShieldAlert size={15}/> Тариф истёк</span><div className="floor-actions"><button className="button primary" onClick={() => { setExtendClient(client); setExtendHours('1'); }}>Добавить время</button><button className="button danger" onClick={() => closeClient(client)}>Закрыть клиента</button></div></> : <span className="floor-active"><Clock3 size={15}/>{client.tariffType === 'unlimited' ? 'Безлимит' : 'Активен'}</span>}
        </article>)}
      </div>}
    </section>

    {selected && <div className="floor-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setSelected(null); }}><section className="floor-modal" role="dialog" aria-modal="true" aria-labelledby="accept-title">
      <button className="floor-modal-close" onClick={() => setSelected(null)} aria-label="Закрыть"><X size={18}/></button><h2 id="accept-title">Принять клиента</h2><p className="muted">{selected.name} · назначьте место и тариф</p>
      <label>Тип места<select value={assignment.resourceType} onChange={e => { const resourceType = e.target.value; setAssignment(a => ({ ...a, resourceType, resource: getAvailableResource(resourceType) })); }}><option value="computer">Компьютер</option><option value="vip">VIP-комната</option></select></label>
      <label>Место<select value={assignment.resource} onChange={e => setAssignment(a => ({ ...a, resource: e.target.value }))}>{resourceOptions.length ? resourceOptions.map(r => <option key={r} value={r}>{r}</option>) : <option value="">Нет свободных мест</option>}</select></label>
      <label>Тариф<select value={assignment.tariff} onChange={e => setAssignment(a => ({ ...a, tariff: e.target.value }))}>{tariffOptions.map(t => <option key={t}>{t}</option>)}</select></label>
      {assignment.tariff !== 'Безлимит' && <label>Длительность (часов)<input type="number" min="0.1" max="168" step="0.1" required value={assignment.durationHours} onChange={e => setAssignment(a => ({ ...a, durationHours: e.target.value }))}/></label>}
      {error && <div className="form-error">{error}</div>}<div className="form-actions"><button className="button ghost" onClick={() => setSelected(null)}>Отмена</button><button className="button primary" disabled={busy || !assignment.resource || resourceOptions.length === 0} onClick={accept}>{busy ? 'Сохранение...' : 'Принять клиента'}</button></div>
    </section></div>}

    {extendClient && <div className="floor-modal-backdrop"><section className="floor-modal" role="dialog" aria-modal="true"><button className="floor-modal-close" onClick={() => setExtendClient(null)} aria-label="Закрыть"><X size={18}/></button><h2>Добавить время</h2><p className="muted">Клиент: {extendClient.name}</p><label>Дополнительное время (часов)<input type="number" min="0.1" max="168" step="0.1" value={extendHours} onChange={e => setExtendHours(e.target.value)} /></label><div className="form-actions"><button className="button ghost" onClick={() => setExtendClient(null)}>Отмена</button><button className="button primary" disabled={busy} onClick={extend}>Продлить тариф</button></div></section></div>}
  </div>;
}
