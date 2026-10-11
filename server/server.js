import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import cors from 'cors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || 'crm-client-secret-2026';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

app.use(cors({
  origin: 'https://tmdias11.github.io',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

function readDb() {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

  if (!Array.isArray(db.users)) db.users = [];
  if (!Array.isArray(db.clubs)) db.clubs = [];
  if (!Array.isArray(db.clients)) db.clients = [];
  if (!Array.isArray(db.tasks)) db.tasks = [];

  return db;
}


function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createToken(user) {
  return jwt.sign({id: user.id, role: user.role, name: user.name}, SECRET, {expiresIn: '7d'});
}

function auth(req, res, next) {
  const token = req.cookies.crm_token;
  if (!token) return res.status(401).json({message: 'Требуется авторизация'});
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({message: 'Сессия истекла'});
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({message: 'Доступ только для администратора'});
  next();
}

function membership(user, clubId) {
  return (user.clubMemberships || []).find((item) => item.clubId === clubId);
}
function canAccessClub(user, clubId) {
  return Boolean(user && clubId && (user.role === 'admin' || membership(user, clubId)));
}
function selectedClub(req, db) {
  const user = db.users.find((u) => u.id === req.user.id);
  const requestedId = String(req.headers['x-club-id'] || '');
  if (requestedId) return canAccessClub(user, requestedId) ? requestedId : null;
  // First visit: choose an accessible club without exposing any other club's data.
  const accessible = (db.clubs || []).find((club) => canAccessClub(user, club.id));
  return accessible?.id || null;
}
function requireClub(req, res, db) {
  const clubId = selectedClub(req, db);
  if (!clubId) {
    res.status(403).json({ message: 'Выберите клуб, к которому у вас есть доступ' });
    return null;
  }
  return clubId;
}
function publicUser(user) {
  const { password, ...safe } = user;
  return { ...safe, username: safe.username || safe.email?.split('@')[0] || '' };
}

function parseDurationHours(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const hours = Number(value);
  if (!Number.isFinite(hours) || hours < 0.1 || hours > 168) return null;
  return Math.round(hours * 10) / 10;
}

function hasValidDurationHours(value) {
  if (value === undefined || value === null || String(value).trim() === '') return true;
  const hours = Number(value);
  return Number.isFinite(hours) && hours >= 0.1 && hours <= 168;
}

function validateClient(body) {
  const required = [
    'name',
    'email',
    'phone',
    'company',
    'status',
    'source'
  ];

  return required.every((field) =>
    String(body[field] ?? '').trim()
  );
}

function publicClient(client, db) {
  const owner = db.users.find(
    (user) => user.id === client.ownerId
  );

  return {
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    company: client.company,
    computer: client.computer || '',
    tariff: client.tariff || '',
    tariffDurationHours: client.tariffDurationHours ?? '',
    tariffEndsAt: client.tariffEndsAt || null,
    tariffType: client.tariffType || 'timed',
    tariffState: client.tariffState || 'active',
    status: client.status,
    source: client.source,
    notes: client.notes,
    createdAt: client.createdAt,
    ownerName: owner?.name || 'Неизвестно'
  };
}

app.post('/api/auth/register', async (req, res) => {
  const {name, email, password} = req.body;
  if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
    return res.status(400).json({message: 'Заполните имя, email и пароль минимум из 6 символов'});
  }
  const db = readDb();
  const normalizedEmail = email.trim().toLowerCase();
  if (db.users.some((user) => user.email === normalizedEmail)) {
    return res.status(409).json({message: 'Пользователь с таким email уже существует'});
  }
  const user = {
    id: createId('user'),
    name: name.trim(),
    email: normalizedEmail,
    username: normalizedEmail.split('@')[0],
    clubMemberships: [],
    password: await bcrypt.hash(password, 10),
    role: db.users.length === 0 ? 'admin' : 'user',
    avatar: '',
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  writeDb(db);
  const token = createToken(user);
  res.cookie('crm_token', token, COOKIE_OPTIONS);
  res.status(201).json({id: user.id, name: user.name, email: user.email, username: user.username, role: user.role});
});

app.post('/api/auth/login', async (req, res) => {
  const {email, username, password} = req.body;
  const db = readDb();
  const login = String(username || email || '').trim().toLowerCase();
  const user = db.users.find((item) => item.email === login || (item.username || item.email.split('@')[0]).toLowerCase() === login);
  if (!user || !(await bcrypt.compare(password || '', user.password))) {
    return res.status(401).json({message: 'Неверный email или пароль'});
  }
  const token = createToken(user);
  res.cookie('crm_token', token, COOKIE_OPTIONS);
  res.json({id: user.id, name: user.name, email: user.email, username: user.username, role: user.role});
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('crm_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });
  res.json({message: 'Вы вышли из системы'});
});

app.get('/api/auth/me', auth, (req, res) => {
  const db = readDb();

  const user = db.users.find(
    (item) => item.id === req.user.id
  );

  if (!user) {
    return res.status(401).json({
      message: 'Пользователь не найден'
    });
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username || user.email.split('@')[0],
    role: user.role,
    clubMemberships: user.clubMemberships || [],
    avatar: user.avatar || ''
  });
});

app.put('/api/auth/me', auth, async (req, res) => {
  const db = readDb();

  const index = db.users.findIndex(
    (item) => item.id === req.user.id
  );

  if (index === -1) {
    return res.status(404).json({
      message: 'Пользователь не найден'
    });
  }

  const user = db.users[index];

  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const avatar = String(req.body.avatar || '');

  if (!name || !email) {
    return res.status(400).json({
      message: 'Имя и email обязательны'
    });
  }

  const emailExists = db.users.some(
    (item) =>
      item.email === email &&
      item.id !== user.id
  );

  if (emailExists) {
    return res.status(409).json({
      message: 'Пользователь с таким email уже существует'
    });
  }

  user.name = name;
  user.email = email;
  user.avatar = avatar;

  if (req.body.password) {
    if (req.body.password.length < 6) {
      return res.status(400).json({
        message: 'Новый пароль должен содержать минимум 6 символов'
      });
    }

    user.password = await bcrypt.hash(
      req.body.password,
      10
    );
  }

  db.users[index] = user;

  writeDb(db);

  const token = createToken(user);

  res.cookie('crm_token', token, COOKIE_OPTIONS);

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username || user.email.split('@')[0],
    role: user.role,
    clubMemberships: user.clubMemberships || [],
    avatar: user.avatar || ''
  });
});


app.get('/api/clients', auth, (req, res) => {
  const db = readDb(); const clubId = requireClub(req, res, db); if (!clubId) return;
  res.json(db.clients.filter((client) => client.clubId === clubId).map((client) => publicClient(client, db)));
});
app.get('/api/clients/:id', auth, (req, res) => {
  const db = readDb(); const clubId = requireClub(req, res, db); if (!clubId) return;
  const client = db.clients.find((item) => item.id === req.params.id && item.clubId === clubId);
  if (!client) return res.status(404).json({message: 'Клиент не найден'});
  res.json(publicClient(client, db));
});
app.get('/api/my/clients', auth, (req, res) => {
  const db = readDb(); const clubId = requireClub(req, res, db); if (!clubId) return;
  res.json(db.clients.filter((client) => client.clubId === clubId && client.ownerId === req.user.id).map((client) => publicClient(client, db)));
});
app.post('/api/clients', auth, (req, res) => {
  const db = readDb(); const clubId = requireClub(req, res, db); if (!clubId) return;
  if (!validateClient(req.body)) return res.status(400).json({message: 'Заполните все обязательные поля'});
  if (!hasValidDurationHours(req.body.durationHours)) return res.status(400).json({ message: 'Время тарифа должно быть от 0.1 до 168 часов' });
  const client = { id: createId('client'), clubId, ownerId: req.user.id,
    name: req.body.name.trim(), email: req.body.email.trim().toLowerCase(),
    phone: req.body.phone.trim(), company: req.body.company.trim(),
    computer: String(req.body.computer || '').trim(), tariff: String(req.body.tariff || '').trim(),
    tariffDurationHours: parseDurationHours(req.body.durationHours),
    tariffType: 'timed',
    tariffEndsAt: parseDurationHours(req.body.durationHours) !== null
      ? new Date(Date.now() + parseDurationHours(req.body.durationHours) * 3600000).toISOString()
      : null,
    tariffState: 'active',
    status: req.body.status, source: req.body.source, notes: String(req.body.notes || '').trim(),
    createdAt: new Date().toISOString() };
  db.clients.push(client); writeDb(db); res.status(201).json(publicClient(client, db));
});
app.put('/api/clients/:id', auth, (req, res) => {
  const db = readDb(); const clubId = requireClub(req, res, db); if (!clubId) return;
  const index = db.clients.findIndex((item) => item.id === req.params.id && item.clubId === clubId);
  if (index === -1) return res.status(404).json({message: 'Клиент не найден'});
  if (!validateClient(req.body)) return res.status(400).json({message: 'Заполните все обязательные поля'});
  if (!hasValidDurationHours(req.body.durationHours)) return res.status(400).json({ message: 'Время тарифа должно быть от 0.1 до 168 часов' });
  const client = db.clients[index];
  const requestedDuration = parseDurationHours(req.body.durationHours);
  const oldDuration = client.tariffDurationHours ?? null;
  const durationChanged = requestedDuration !== oldDuration;
  db.clients[index] = { ...client, name: req.body.name.trim(), email: req.body.email.trim().toLowerCase(),
    phone: req.body.phone.trim(), company: req.body.company.trim(), computer: String(req.body.computer || '').trim(),
    tariff: String(req.body.tariff || '').trim(),
    tariffDurationHours: requestedDuration,
    ...(durationChanged ? {
      tariffType: 'timed',
      tariffEndsAt: requestedDuration !== null ? new Date(Date.now() + requestedDuration * 3600000).toISOString() : null,
      tariffState: 'active'
    } : {}),
    status: req.body.status, source: req.body.source, notes: String(req.body.notes || '').trim() };
  writeDb(db); res.json(publicClient(db.clients[index], db));
});
app.delete('/api/clients/:id', auth, (req, res) => {
  const db = readDb(); const clubId = requireClub(req, res, db); if (!clubId) return;
  const client = db.clients.find((item) => item.id === req.params.id && item.clubId === clubId);
  if (!client) return res.status(404).json({message: 'Клиент не найден'});
  db.clients = db.clients.filter((item) => item.id !== req.params.id); writeDb(db);
  res.json({message: 'Клиент удалён'});
});


app.get('/api/clubs', auth, (req, res) => {
  const db = readDb(); const user = db.users.find((u) => u.id === req.user.id);
  res.json((db.clubs || []).filter((club) => req.user.role === 'admin' || canAccessClub(user, club.id)).map((club) => ({
    ...club,
    myRole: req.user.role === 'admin' ? 'admin' : membership(user, club.id)?.role
  })));
});
app.post('/api/clubs', auth, (req, res) => {
  const { name, address, contact, description, photos, socialLinks } = req.body;
  if (!String(name || '').trim() || !String(address || '').trim() || !String(contact || '').trim())
    return res.status(400).json({ message: 'Название, адрес и контактные данные обязательны' });
  const db = readDb(); db.clubs ||= [];
  const club = { id: createId('club'), name: String(name).trim(), address: String(address).trim(),
    contact: String(contact).trim(), description: String(description || '').trim(),
    photos: Array.isArray(photos) ? photos.slice(0, 10) : [],
    socialLinks: Array.isArray(socialLinks) ? socialLinks.slice(0, 10) : [],
    createdBy: req.user.id, createdAt: new Date().toISOString() };
  db.clubs.push(club);
  const user = db.users.find((u) => u.id === req.user.id);
  user.clubMemberships ||= []; user.clubMemberships.push({ clubId: club.id, role: 'manager' });
  writeDb(db); res.status(201).json({ ...club, myRole: 'manager' });
});

app.get('/api/clubs/users/search', auth, (req, res) => {
  const db = readDb();
  const clubId = String(req.headers['x-club-id'] || '');
  const user = db.users.find((u) => u.id === req.user.id);

  if (
    !clubId ||
    (req.user.role !== 'admin' &&
      membership(user, clubId)?.role !== 'manager')
  ) {
    return res.status(403).json({
      message: 'Добавлять менеджеров могут администраторы сайта и менеджеры этого клуба'
    });
  }

  const q = String(req.query.q || '').trim().toLowerCase();

  if (q.length < 2) return res.json([]);

  const results = db.users
    .filter((u) => {
      if (u.id === req.user.id) return false;

      const username = String(
        u.username || u.email?.split('@')[0] || ''
      ).toLowerCase();

      const email = String(u.email || '').trim().toLowerCase();

      return username.includes(q) || email.includes(q);
    })
    .slice(0, 20)
    .map((u) => ({
      id: u.id,
      username: u.username || u.email?.split('@')[0] || '',
      name: u.name,
      email: u.email,
      isManager: Boolean(membership(u, clubId))
    }));

  res.json(results);
});

app.post('/api/clubs/:id/managers', auth, (req, res) => {
  const db = readDb(); const clubId = req.params.id; const user = db.users.find((u) => u.id === req.user.id);
  if (req.user.role !== 'admin' && membership(user, clubId)?.role !== 'manager')
    return res.status(403).json({ message: 'Нет прав на добавление менеджеров в этот клуб' });
  const target = db.users.find((u) => u.id === req.body.userId);
  if (!target) return res.status(404).json({ message: 'Пользователь не найден' });
  if (!(db.clubs || []).some((c) => c.id === clubId)) return res.status(404).json({ message: 'Клуб не найден' });
  target.clubMemberships ||= [];
  if (membership(target, clubId)) return res.status(409).json({ message: 'Пользователь уже состоит в клубе' });
  target.clubMemberships.push({ clubId, role: 'manager' }); writeDb(db);
  res.status(201).json({ message: 'Менеджер добавлен', userId: target.id });
});



// Club floor: synthetic walk-in leads are sourced from DummyJSON every 25 seconds.
const FLOOR_INTERVAL_MS = 25_000;
let dummyUsers = [];
let dummyCursor = 0;
let floorSyncRunning = false;
async function syncDummyLeads() {
  if (floorSyncRunning) return;
  floorSyncRunning = true;
  try {
    if (!dummyUsers.length) {
      const response = await fetch('https://dummyjson.com/users?limit=100');
      if (!response.ok) throw new Error(`DummyJSON HTTP ${response.status}`);
      const payload = await response.json();
      dummyUsers = Array.isArray(payload.users) ? payload.users : [];
    }
    if (!dummyUsers.length) return;
    const db = readDb();
    const clubs = db.clubs || [];
    if (!clubs.length) return;
    db.clubQueue ||= [];
    // One incoming visitor per club on each 25-second tick.
    for (const club of clubs) {
      const source = dummyUsers[dummyCursor % dummyUsers.length];
      dummyCursor += 1;
      db.clubQueue.push({
        id: createId('walkin'), clubId: club.id, dummyUserId: source.id,
        name: `${source.firstName || ''} ${source.lastName || ''}`.trim() || source.username || 'Новый клиент',
        email: source.email || '', phone: source.phone || '', company: 'Посетитель клуба',
        status: 'pending', createdAt: new Date().toISOString()
      });
    }
    writeDb(db);
  } catch (error) {
    console.warn('Не удалось получить новых клиентов из DummyJSON:', error.message);
  } finally { floorSyncRunning = false; }
}
setInterval(syncDummyLeads, FLOOR_INTERVAL_MS).unref();

function normalizeClubResource(value, resourceType) {
  const raw = String(value || '').trim().toUpperCase();
  const type = resourceType === 'vip' || raw.startsWith('VIP') || raw.startsWith('VIP-КОМНАТА') ? 'VIP' : 'PC';
  const match = raw.match(/(\d+)/);
  if (!match) return null;
  return `${type}-${String(Number(match[1])).padStart(2, '0')}`;
}

function floorPermission(req, res, db) {
  const clubId = requireClub(req, res, db);
  if (!clubId) return null;
  const user = db.users.find((u) => u.id === req.user.id);
  if (req.user.role !== 'admin' && membership(user, clubId)?.role !== 'manager') {
    res.status(403).json({ message: 'Управлять посетителями могут только менеджеры этого клуба и администраторы сайта' });
    return null;
  }
  return clubId;
}
function expireClubTariffs(db, clubId) {
  const now = Date.now();
  for (const client of db.clients.filter((item) => item.clubId === clubId && item.closed !== true && item.tariffType !== 'unlimited' && item.tariffEndsAt)) {
    if (new Date(client.tariffEndsAt).getTime() <= now && client.tariffState !== 'expired') {
      client.tariffState = 'expired';
      client.status = 'expired';
    }
  }
}
app.get('/api/club-floor', auth, (req, res) => {
  const db = readDb(); const clubId = floorPermission(req, res, db); if (!clubId) return;
  expireClubTariffs(db, clubId); writeDb(db);
  const queue = (db.clubQueue || []).filter((item) => item.clubId === clubId && item.status === 'pending');
  const clients = db.clients.filter((item) => item.clubId === clubId && item.closed !== true)
    .sort((a, b) => (a.tariffState === 'expired' ? -1 : 0) - (b.tariffState === 'expired' ? -1 : 0) || new Date(a.createdAt) - new Date(b.createdAt))
    .map((item) => ({ ...publicClient(item, db), computer: item.computer || '', tariff: item.tariff || '', tariffType: item.tariffType || 'timed', tariffEndsAt: item.tariffEndsAt || null, tariffState: item.tariffState || 'active', resourceType: item.resourceType || 'computer', closed: false }));
  const mapConfig = db.club || { pcCount: 20, vipCount: 3 };
  res.json({ queue, clients, mapConfig: { pcCount: mapConfig.pcCount || 20, vipCount: Number.isFinite(mapConfig.vipCount) ? mapConfig.vipCount : 3 }, serverTime: new Date().toISOString() });
});
app.post('/api/club-floor/:id/accept', auth, (req, res) => {
  const db = readDb(); const clubId = floorPermission(req, res, db); if (!clubId) return;
  const lead = (db.clubQueue || []).find((item) => item.id === req.params.id && item.clubId === clubId && item.status === 'pending');
  if (!lead) return res.status(404).json({ message: 'Новый клиент уже обработан или не найден' });
  const { resourceType, resource, tariff, durationHours } = req.body;
  if (!['computer', 'vip'].includes(resourceType) || !String(resource || '').trim() || !String(tariff || '').trim()) return res.status(400).json({ message: 'Выберите компьютер/ VIP-комнату и тариф' });
  const unlimited = tariff === 'Безлимит';
  const hours = Number(durationHours);
  if (!unlimited && (!Number.isFinite(hours) || hours <= 0 || hours > 168)) return res.status(400).json({ message: 'Укажите длительность от 0.1 до 168 часов' });
  const normalizedResource = normalizeClubResource(resource, resourceType);
  if (!normalizedResource) return res.status(400).json({ message: 'Неверно указано место' });
  const occupied = db.clients.some((item) => item.clubId === clubId && item.closed !== true && normalizeClubResource(item.computer, item.resourceType || (String(item.computer || '').toUpperCase().startsWith('VIP') ? 'vip' : 'computer')) === normalizedResource);
  if (occupied) return res.status(409).json({ message: `Место ${normalizedResource} уже занято. Обновите список свободных мест.` });
  const resourceName = normalizedResource;
  const client = { id: createId('client'), clubId, ownerId: req.user.id, name: lead.name, email: lead.email || `${lead.dummyUserId}@dummyjson.local`, phone: lead.phone || 'Не указан', company: 'Посетитель клуба', computer: resourceName, resourceType, tariff, tariffType: unlimited ? 'unlimited' : 'timed', tariffEndsAt: unlimited ? null : new Date(Date.now() + hours * 3600000).toISOString(), tariffState: 'active', closed: false, status: 'active', source: 'DummyJSON', notes: `Импортирован из DummyJSON (ID ${lead.dummyUserId})`, createdAt: new Date().toISOString() };
  db.clients.push(client); lead.status = 'accepted'; lead.processedAt = new Date().toISOString(); lead.clientId = client.id; writeDb(db);
  res.status(201).json({ client: { ...publicClient(client, db), computer: client.computer, resourceType, tariff, tariffType: client.tariffType, tariffEndsAt: client.tariffEndsAt, tariffState: client.tariffState } });
});
app.post('/api/club-floor/:id/reject', auth, (req, res) => {
  const db = readDb(); const clubId = floorPermission(req, res, db); if (!clubId) return;
  const lead = (db.clubQueue || []).find((item) => item.id === req.params.id && item.clubId === clubId && item.status === 'pending');
  if (!lead) return res.status(404).json({ message: 'Новый клиент уже обработан или не найден' });
  lead.status = 'rejected'; lead.processedAt = new Date().toISOString(); writeDb(db); res.json({ message: 'Клиент отклонён' });
});
app.post('/api/club-floor/clients/:id/extend', auth, (req, res) => {
  const db = readDb(); const clubId = floorPermission(req, res, db); if (!clubId) return;
  const client = db.clients.find((item) => item.id === req.params.id && item.clubId === clubId && item.closed !== true);
  if (!client) return res.status(404).json({ message: 'Клиент не найден' });
  const hours = Number(req.body.durationHours);
  if (!Number.isFinite(hours) || hours <= 0 || hours > 168) return res.status(400).json({ message: 'Укажите длительность от 0.1 до 168 часов' });
  const base = client.tariffEndsAt && new Date(client.tariffEndsAt).getTime() > Date.now() ? new Date(client.tariffEndsAt).getTime() : Date.now();
  client.tariffEndsAt = new Date(base + hours * 3600000).toISOString(); client.tariffType = 'timed'; client.tariffState = 'active'; client.status = 'active';
  if (req.body.tariff) client.tariff = String(req.body.tariff).slice(0, 80);
  writeDb(db); res.json({ client: { ...publicClient(client, db), computer: client.computer || '', resourceType: client.resourceType || 'computer', tariffType: client.tariffType, tariffEndsAt: client.tariffEndsAt, tariffState: client.tariffState } });
});
app.post('/api/club-floor/clients/:id/close', auth, (req, res) => {
  const db = readDb(); const clubId = floorPermission(req, res, db); if (!clubId) return;
  const client = db.clients.find((item) => item.id === req.params.id && item.clubId === clubId && item.closed !== true);
  if (!client) return res.status(404).json({ message: 'Клиент не найден' });
  client.closed = true; client.closedAt = new Date().toISOString(); client.status = 'closed'; writeDb(db); res.json({ message: 'Клиент закрыт' });
});

app.get('/api/admin/users', auth, adminOnly, (req, res) => {
  const db = readDb();
  res.json(db.users.map(({password, ...user}) => user));
});

app.get('/api/admin/stats', auth, adminOnly, (req, res) => {
  const db = readDb();
  res.json({users: db.users.length, clients: db.clients.length, admins: db.users.filter((u) => u.role === 'admin').length});
});

function publicTask(task, db) {
  const client = db.clients.find(
    (item) => item.id === task.clientId
  );

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    date: task.date,
    time: task.time,
    category: task.category,
    status: task.status,
    clientId: task.clientId,
    clientName: client?.name || 'Без клиента',
    createdAt: task.createdAt
  };
}

app.get('/api/tasks', auth, (req, res) => {
  const db = readDb();

  const clubId = requireClub(req, res, db); if (!clubId) return;
  const tasks = db.tasks
    .filter((task) => task.clubId === clubId)
    .map((task) => publicTask(task, db));

  res.json(tasks);
});

app.post('/api/tasks', auth, (req, res) => {
  const {
    title,
    description,
    date,
    time,
    category,
    clientId
  } = req.body;

  if (
    !String(title || '').trim() ||
    !date ||
    !time ||
    !category
  ) {
    return res.status(400).json({
      message: 'Название, дата, время и категория обязательны'
    });
  }

  const db = readDb();
  const clubId = requireClub(req, res, db); if (!clubId) return;

  if (clientId) {
    const client = db.clients.find(
      (item) =>
        item.id === clientId && item.clubId === clubId &&
        (
          item.ownerId === req.user.id ||
          req.user.role === 'admin'
        )
    );

    if (!client) {
      return res.status(404).json({
        message: 'Клиент не найден'
      });
    }
  }

  const task = {
    id: createId('task'),
    ownerId: req.user.id,
    clubId,
    clientId: clientId || null,
    title: title.trim(),
    description: String(description || '').trim(),
    date,
    time,
    category,
    status: 'planned',
    createdAt: new Date().toISOString()
  };

  db.tasks.push(task);

  writeDb(db);

  res.status(201).json(
    publicTask(task, db)
  );
});

app.put('/api/tasks/:id', auth, (req, res) => {
  const db = readDb();

  const index = db.tasks.findIndex(
    (item) => item.id === req.params.id
  );

  if (index === -1) {
    return res.status(404).json({
      message: 'Задача не найдена'
    });
  }

  const task = db.tasks[index];
  const clubId = requireClub(req, res, db); if (!clubId) return;
  if (task.clubId !== clubId) {
    return res.status(403).json({
      message: 'Нет прав на изменение задачи'
    });
  }

  const {
    title,
    description,
    date,
    time,
    category,
    clientId,
    status
  } = req.body;

  if (
    !String(title || '').trim() ||
    !date ||
    !time ||
    !category
  ) {
    return res.status(400).json({
      message: 'Название, дата, время и категория обязательны'
    });
  }

  if (clientId && !db.clients.some((item) => item.id === clientId && item.clubId === clubId)) {
    return res.status(404).json({ message: 'Клиент не найден в выбранном клубе' });
  }

  db.tasks[index] = {
    ...task,
    title: title.trim(),
    description: String(description || '').trim(),
    date,
    time,
    category,
    clientId: clientId || null,
    status: status || 'planned'
  };

  writeDb(db);

  res.json(
    publicTask(db.tasks[index], db)
  );
});

app.delete('/api/tasks/:id', auth, (req, res) => {
  const db = readDb();

  const task = db.tasks.find(
    (item) => item.id === req.params.id
  );

  if (!task) {
    return res.status(404).json({
      message: 'Задача не найдена'
    });
  }

  const clubId = requireClub(req, res, db); if (!clubId) return;
  if (task.clubId !== clubId) {
    return res.status(403).json({
      message: 'Нет прав на удаление задачи'
    });
  }

  db.tasks = db.tasks.filter(
    (item) => item.id !== req.params.id
  );

  writeDb(db);

  res.json({
    message: 'Задача удалена'
  });
});

app.get('/api/admin/club', auth, adminOnly, (req, res) => {
  const db = readDb();

  // Если настройки ещё не создавались — используем значения по умолчанию
  const club = db.club || {
    pcCount: 20,
    vipCount: 3
  };

  res.json({
    pcCount: club.pcCount,
    vipCount: club.vipCount
  });
});

app.put('/api/admin/club', auth, adminOnly, (req, res) => {
  const pcCount = Math.max(
    1,
    Math.min(200, Number(req.body.pcCount) || 1)
  );

  const vipCount = Math.max(
    0,
    Math.min(50, Number(req.body.vipCount) || 0)
  );

  const db = readDb();

  db.club = {
    pcCount,
    vipCount
  };

  writeDb(db);

  res.json(db.club);
});

app.listen(PORT, () => console.log(`CRM server: http://localhost:${PORT}`));