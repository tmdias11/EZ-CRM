import { useEffect, useState } from 'react';
import {
  Check,
  CheckSquare,
  Clock,
  Pencil,
  Plus,
  Trash2
} from 'lucide-react';

import { api } from '../services/api';

const categories = [
  'Встреча',
  'Дозвон',
  'Документация',
  'Оплата',
  'Презентация',
  'Email',
  'Другое'
];

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData() {
    try {
      const [tasksData, clientsData] = await Promise.all([
        api.tasks(),
        api.myClients()
      ]);

      setTasks(tasksData);
      setClients(clientsData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDelete(id) {
    if (!confirm('Удалить эту задачу?')) {
      return;
    }

    try {
      await api.deleteTask(id);

      setTasks(
        tasks.filter((task) => task.id !== id)
      );
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleToggle(task) {
    try {
      const updated = await api.updateTask(
        task.id,
        {
          ...task,
          status:
            task.status === 'done'
              ? 'planned'
              : 'done'
        }
      );

      setTasks(
        tasks.map((item) =>
          item.id === updated.id
            ? updated
            : item
        )
      );
    } catch (e) {
      setError(e.message);
    }
  }

  function editTask(task) {
    setEditing(task);
    setShowForm(true);
  }

  function createTask() {
    setEditing(null);
    setShowForm(true);
  }

  async function handleSaved(task) {
    if (editing) {
      setTasks(
        tasks.map((item) =>
          item.id === task.id
            ? task
            : item
        )
      );
    } else {
      setTasks([
        ...tasks,
        task
      ]);
    }

    setShowForm(false);
    setEditing(null);
  }

  return (
    <div className="tasks-page">

      <div className="page-header">
        <div>
          <h1>Задачи</h1>
          <p>
            Планирование работы с клиентами
          </p>
        </div>

        <button
          className="button primary"
          onClick={createTask}
        >
          <Plus size={18} />
          Новая задача
        </button>
      </div>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {showForm && (
        <TaskForm
          clients={clients}
          categories={categories}
          task={editing}
          onSaved={handleSaved}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      <section className="panel">

        <div className="panel-head">
          <div>
            <h2>Мои задачи</h2>
            <p>
              Всего задач: {tasks.length}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="empty">
            Загрузка задач...
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty">
            <CheckSquare size={36} />

            <h3>
              Задач пока нет
            </h3>

            <p>
              Создайте первую задачу для работы
              с клиентами.
            </p>

            <button
              className="button primary"
              onClick={createTask}
            >
              Создать задачу
            </button>
          </div>
        ) : (
          <div className="tasks-list">

            {tasks
              .sort((a, b) =>
                `${a.date} ${a.time}`
                  .localeCompare(
                    `${b.date} ${b.time}`
                  )
              )
              .map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  onEdit={editTask}
                  onDelete={handleDelete}
                />
              ))}

          </div>
        )}

      </section>
    </div>
  );
}


function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete
}) {
  return (
    <div
      className={`task-card ${
        task.status === 'done'
          ? 'completed'
          : ''
      }`}
    >

      <button
        className="task-check"
        onClick={() => onToggle(task)}
        title="Изменить статус"
      >
        {task.status === 'done' && (
          <Check size={18} />
        )}
      </button>

      <div className="task-main">

        <div className="task-top">
          <span className="task-category">
            {task.category}
          </span>

          {task.clientName && (
            <span className="task-client">
              {task.clientName}
            </span>
          )}
        </div>

        <h3>{task.title}</h3>

        {task.description && (
          <p>
            {task.description}
          </p>
        )}

        <div className="task-meta">
          <span>
            <Clock size={15} />
            {formatDate(task.date)}
            {' '}
            {task.time}
          </span>
        </div>

      </div>

      <div className="task-actions">

        <button
          className="icon-button"
          onClick={() => onEdit(task)}
          title="Изменить"
        >
          <Pencil size={17} />
        </button>

        <button
          className="icon-button danger"
          onClick={() => onDelete(task.id)}
          title="Удалить"
        >
          <Trash2 size={17} />
        </button>

      </div>

    </div>
  );
}


function TaskForm({
  clients,
  categories,
  task,
  onSaved,
  onCancel
}) {
  const [title, setTitle] = useState(
    task?.title || ''
  );

  const [description, setDescription] = useState(
    task?.description || ''
  );

  const [date, setDate] = useState(
    task?.date || ''
  );

  const [time, setTime] = useState(
    task?.time || ''
  );

  const [category, setCategory] = useState(
    task?.category || categories[0]
  );

  const [clientId, setClientId] = useState(
    task?.clientId || ''
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();

    setSaving(true);
    setError('');

    try {
      const data = {
        title,
        description,
        date,
        time,
        category,
        clientId
      };

      const result = task
        ? await api.updateTask(
            task.id,
            {
              ...data,
              status: task.status
            }
          )
        : await api.createTask(data);

      onSaved(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel task-form-panel">

      <div className="panel-head">
        <div>
          <h2>
            {task
              ? 'Редактирование задачи'
              : 'Новая задача'}
          </h2>
        </div>
      </div>

      <form
        className="task-form"
        onSubmit={submit}
      >

        <div className="form-group">
          <label>Название задачи</label>

          <input
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            placeholder="Например: Позвонить клиенту"
            required
          />
        </div>

        <div className="form-row">

          <div className="form-group">
            <label>Категория</label>

            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
            >
              {categories.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Клиент</label>

            <select
              value={clientId}
              onChange={(e) =>
                setClientId(e.target.value)
              }
            >
              <option value="">
                Без клиента
              </option>

              {clients.map((client) => (
                <option
                  key={client.id}
                  value={client.id}
                >
                  {client.name}
                  {client.company
                    ? ` — ${client.company}`
                    : ''}
                </option>
              ))}
            </select>
          </div>

        </div>

        <div className="form-row">

          <div className="form-group">
            <label>Дата</label>

            <input
              type="date"
              value={date}
              onChange={(e) =>
                setDate(e.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Время</label>

            <input
              type="time"
              value={time}
              onChange={(e) =>
                setTime(e.target.value)
              }
              required
            />
          </div>

        </div>

        <div className="form-group">
          <label>Описание</label>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            placeholder="Дополнительная информация..."
            rows="4"
          />
        </div>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        <div className="form-actions">

          <button
            type="button"
            className="button secondary"
            onClick={onCancel}
          >
            Отмена
          </button>

          <button
            type="submit"
            className="button primary"
            disabled={saving}
          >
            {saving
              ? 'Сохранение...'
              : 'Сохранить'}
          </button>

        </div>

      </form>
    </section>
  );
}


function formatDate(date) {
  if (!date) {
    return '';
  }

  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString('ru-RU');
}

export default Tasks;