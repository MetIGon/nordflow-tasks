/* ============================================================
   NordFlow Tasks — data layer, constants, demo data, state
   ============================================================ */
(function () {
  'use strict';
  var NF = (window.NF = window.NF || {});

  /* ---------- Constants ---------- */
  // Version bumped to reset locally modified demo data back to the original seed.
  NF.STORAGE_KEY = 'nordflow_tasks_state_v2';
  NF.SESSION_KEY = 'nordflow_tasks_session_v1';
  NF.THEME_KEY = 'nordflow_tasks_theme';

  NF.ROLES = {
    admin: 'Администратор',
    manager: 'Руководитель проекта',
    employee: 'Сотрудник'
  };

  NF.STATUSES = [
    { id: 'backlog', name: 'Бэклог', short: 'Бэклог', color: '#8A9BAC' },
    { id: 'planned', name: 'Запланировано', short: 'Запланировано', color: '#2F80D8' },
    { id: 'inprogress', name: 'В работе', short: 'В работе', color: '#E89A2B' },
    { id: 'review', name: 'На проверке', short: 'Проверка', color: '#8B5CF6' },
    { id: 'done', name: 'Выполнено', short: 'Выполнено', color: '#2FA36B' }
  ];

  NF.PRIORITIES = {
    low: { name: 'Низкий', color: '#2FA36B', short: 'Низкий' },
    medium: { name: 'Средний', color: '#2F80D8', short: 'Средний' },
    high: { name: 'Высокий', color: '#E8862B', short: 'Высокий' },
    critical: { name: 'Критический', color: '#E23D3D', short: 'Критический' }
  };

  NF.PROJECT_STATUSES = [
    { id: 'planning', name: 'Планируется', color: '#8A9BAC' },
    { id: 'active', name: 'Активный', color: '#2FA36B' },
    { id: 'paused', name: 'Приостановлен', color: '#E89A2B' },
    { id: 'completed', name: 'Завершён', color: '#2F80D8' },
    { id: 'archived', name: 'Архивный', color: '#8A9BAC' }
  ];

  NF.NOTIF_TYPES = {
    assigned: { icon: 'user-plus', color: '#2F80D8' },
    due: { icon: 'calendar', color: '#E8862B' },
    status: { icon: 'refresh', color: '#8B5CF6' },
    comment: { icon: 'message', color: '#0E8C8C' },
    deadline: { icon: 'clock', color: '#E8862B' },
    overdue: { icon: 'alert', color: '#E23D3D' }
  };

  /* ---------- Date / text helpers ---------- */
  NF.toISO = function (date) {
    var d = date || new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  };
  NF.addDays = function (n, base) {
    var d = base ? new Date(base + 'T00:00:00') : new Date();
    d.setDate(d.getDate() + n);
    return NF.toISO(d);
  };
  NF.nowISO = function () { return new Date().toISOString(); };

  NF.formatDate = function (iso, opts) {
    if (!iso) return '—';
    var d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('ru-RU', opts || { day: 'numeric', month: 'short', year: 'numeric' });
  };
  NF.formatShortDate = function (iso) { return NF.formatDate(iso, { day: 'numeric', month: 'short' }); };
  NF.formatDateTime = function (iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };
  NF.daysUntil = function (iso) {
    if (!iso) return null;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var d = new Date(iso + 'T00:00:00'); d.setHours(0, 0, 0, 0);
    return Math.round((d - today) / 86400000);
  };
  NF.isOverdue = function (task) {
    if (!task || !task.dueDate || task.status === 'done') return false;
    return NF.daysUntil(task.dueDate) < 0;
  };
  NF.isDueSoon = function (task) {
    if (!task || !task.dueDate || task.status === 'done') return false;
    var n = NF.daysUntil(task.dueDate);
    return n >= 0 && n <= 3;
  };
  NF.escapeHtml = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  NF.uid = function (prefix) {
    return (prefix || 'id') + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  };
  NF.initials = function (u) {
    if (!u) return '?';
    return ((u.firstName || '')[0] || '') + ((u.lastName || '')[0] || '');
  };
  NF.fullName = function (u) { return u ? (u.firstName + ' ' + u.lastName).trim() : 'Не назначен'; };

  /* ---------- Lookups ---------- */
  NF.getUser = function (id) { return NF.state.users.find(function (u) { return u.id === id; }); };
  NF.getProject = function (id) { return NF.state.projects.find(function (p) { return p.id === id; }); };
  NF.getTask = function (id) { return NF.state.tasks.find(function (t) { return t.id === id; }); };
  NF.currentUser = function () {
    var session = NF.getSession();
    return session ? NF.getUser(session.userId) : null;
  };
  NF.isAdmin = function () { var u = NF.currentUser(); return !!u && u.role === 'admin'; };
  NF.isManager = function () { var u = NF.currentUser(); return !!u && (u.role === 'manager' || u.role === 'admin'); };

  NF.projectTasks = function (projectId) {
    return NF.state.tasks.filter(function (t) { return t.projectId === projectId; });
  };
  NF.userTasks = function (userId) {
    return NF.state.tasks.filter(function (t) { return t.assigneeId === userId; });
  };
  NF.availableProjects = function (user) {
    if (!user) return [];
    if (user.role === 'admin') return NF.state.projects.slice();
    return NF.state.projects.filter(function (p) {
      return p.managerId === user.id || p.memberIds.indexOf(user.id) !== -1;
    });
  };
  NF.canEditTask = function (task) {
    var u = NF.currentUser(); if (!u || !task) return false;
    if (u.role === 'admin') return true;
    var p = NF.getProject(task.projectId);
    if (!p) return false;
    if (u.role === 'manager') return p.managerId === u.id;
    // employee: can change status of own tasks, create if allowed
    return task.assigneeId === u.id;
  };
  NF.canCreateTask = function (project) {
    var u = NF.currentUser(); if (!u || !project) return false;
    if (u.role === 'admin') return true;
    if (u.role === 'manager') return project.managerId === u.id;
    return !!project.allowEmployeeCreate && project.memberIds.indexOf(u.id) !== -1;
  };

  /* ---------- Session ---------- */
  NF.getSession = function () {
    try { return JSON.parse(localStorage.getItem(NF.SESSION_KEY) || 'null'); }
    catch (e) { return null; }
  };
  NF.setSession = function (userId) {
    localStorage.setItem(NF.SESSION_KEY, JSON.stringify({ userId: userId, ts: Date.now() }));
  };
  NF.clearSession = function () { localStorage.removeItem(NF.SESSION_KEY); };

  /* ---------- Persistence ---------- */
  NF.save = function () {
    try { localStorage.setItem(NF.STORAGE_KEY, JSON.stringify(NF.state)); }
    catch (e) { console.error('Save failed', e); }
  };
  NF.load = function () {
    try {
      var raw = localStorage.getItem(NF.STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.users || !parsed.tasks || !parsed.projects) return null;
      return parsed;
    } catch (e) { return null; }
  };
  NF.resetData = function () {
    localStorage.removeItem(NF.STORAGE_KEY);
    NF.state = NF.seed();
    NF.checkDeadlines();
    NF.save();
  };

  /* ---------- Notification engine ---------- */
  NF.notifyUser = function (userId, type, text, taskId, projectId) {
    if (!userId) return null;
    var notif = {
      id: NF.uid('n'), userId: userId, type: type, text: text,
      taskId: taskId || null, projectId: projectId || null,
      read: false, createdAt: NF.nowISO()
    };
    NF.state.notifications.unshift(notif);
    return notif;
  };

  /* Create deadline/overdue alerts once per task per day */
  NF.checkDeadlines = function () {
    var today = NF.toISO();
    var changed = false;
    NF.state.tasks.forEach(function (t) {
      if (t.status === 'done' || !t.dueDate) return;
      var n = NF.daysUntil(t.dueDate);
      var type = null, text = null;
      if (n < 0) {
        type = 'overdue';
        text = 'Задача ' + t.id + ' «' + t.title + '» просрочена на ' + Math.abs(n) + ' дн.';
      } else if (n <= 3) {
        type = 'deadline';
        text = 'Срок задачи ' + t.id + ' «' + t.title + '» истекает ' + (n === 0 ? 'сегодня' : 'через ' + n + ' дн.');
      }
      if (!type) return;
      var key = type + ':' + t.id + ':' + today;
      if (NF.state.notifications.some(function (x) { return x.key === key; })) return;
      var notif = NF.notifyUser(t.assigneeId, type, text, t.id, t.projectId);
      if (notif) { notif.key = key; changed = true; }
    });
    if (changed) NF.save();
  };
  NF.addHistory = function (task, action, field, oldValue, newValue) {
    task.history.unshift({
      id: NF.uid('h'), userId: (NF.currentUser() || {}).id || 'system',
      action: action, field: field || null,
      oldValue: oldValue == null ? null : String(oldValue),
      newValue: newValue == null ? null : String(newValue),
      createdAt: NF.nowISO()
    });
    task.updatedAt = NF.nowISO();
  };

  /* ---------- Demo data ---------- */
  NF.seed = function () {
    var users = [
      { id: 'u1', email: 'anna.volkova@nordflow.ru', password: 'demo123', firstName: 'Анна', lastName: 'Волкова', position: 'Операционный директор', role: 'admin', color: '#0E8C8C', theme: 'light', photo: null },
      { id: 'u2', email: 'maksim.orlov@nordflow.ru', password: 'demo123', firstName: 'Максим', lastName: 'Орлов', position: 'Руководитель проекта', role: 'manager', color: '#2F80D8', theme: 'light', photo: null },
      { id: 'u3', email: 'elena.sokolova@nordflow.ru', password: 'demo123', firstName: 'Елена', lastName: 'Соколова', position: 'Дизайнер', role: 'employee', color: '#8B5CF6', theme: 'light', photo: null },
      { id: 'u4', email: 'ilya.morozov@nordflow.ru', password: 'demo123', firstName: 'Илья', lastName: 'Морозов', position: 'Frontend-разработчик', role: 'employee', color: '#0EA5A5', theme: 'light', photo: null },
      { id: 'u5', email: 'viktor.lebedev@nordflow.ru', password: 'demo123', firstName: 'Виктор', lastName: 'Лебедев', position: 'Backend-разработчик', role: 'employee', color: '#E8862B', theme: 'light', photo: null },
      { id: 'u6', email: 'olga.krylova@nordflow.ru', password: 'demo123', firstName: 'Ольга', lastName: 'Крылова', position: 'Руководитель маркетинга', role: 'manager', color: '#E2558A', theme: 'light', photo: null },
      { id: 'u7', email: 'dmitry.frolov@nordflow.ru', password: 'demo123', firstName: 'Дмитрий', lastName: 'Фролов', position: 'Тестировщик', role: 'employee', color: '#2FA36B', theme: 'light', photo: null },
      { id: 'u8', email: 'maria.belova@nordflow.ru', password: 'demo123', firstName: 'Мария', lastName: 'Белова', position: 'Аналитик', role: 'employee', color: '#2F80D8', theme: 'light', photo: null }
    ];

    var projects = [
      {
        id: 'p1', name: 'Разработка сайта для клиента «GreenStone»',
        description: 'Создание корпоративного сайта с каталогом услуг, блогом и формой обратной связи. Полный цикл: от дизайна до запуска.',
        managerId: 'u2', memberIds: ['u2', 'u3', 'u4', 'u5', 'u7', 'u8', 'u1'],
        startDate: NF.addDays(-20), endDate: NF.addDays(21), status: 'active',
        allowEmployeeCreate: true, color: '#2FB6DE', createdAt: NF.addDays(-20), updatedAt: NF.addDays(-1)
      },
      {
        id: 'p2', name: 'Запуск рекламной кампании NordFlow',
        description: 'Комплексная рекламная кампания в digital-каналах: контекст, таргет, контент-маркетинг и email-рассылки.',
        managerId: 'u6', memberIds: ['u6', 'u3', 'u8', 'u1'],
        startDate: NF.addDays(-14), endDate: NF.addDays(10), status: 'active',
        allowEmployeeCreate: false, color: '#0E8C8C', createdAt: NF.addDays(-14), updatedAt: NF.addDays(-2)
      },
      {
        id: 'p3', name: 'Внутренняя автоматизация отдела продаж',
        description: 'Оптимизация и автоматизация процессов обработки заявок, внедрение CRM и интеграция с телефонией.',
        managerId: 'u2', memberIds: ['u2', 'u5', 'u8', 'u1', 'u7'],
        startDate: NF.addDays(-5), endDate: NF.addDays(45), status: 'planning',
        allowEmployeeCreate: false, color: '#8B5CF6', createdAt: NF.addDays(-5), updatedAt: NF.addDays(-1)
      }
    ];

    // [id, title, project, assignee, reporter, status, priority, dueOffset, tags, description, attachments]
    var defs = [
      ['NDF-101', 'Согласование технического задания с клиентом', 'p1', 'u2', 'u1', 'done', 'high', -12, ['ТЗ', 'клиент'], 'Согласовать объём работ, сроки и критерии приёмки с представителем GreenStone.', []],
      ['NDF-102', 'Разработка дизайн-концепции главной страницы', 'p1', 'u3', 'u2', 'done', 'medium', -8, ['дизайн'], 'Подготовить 2 варианта дизайн-концепции для обсуждения с клиентом.', [{ name: 'Макеты главной (Figma)', type: 'link', url: 'https://figma.com' }]],
      ['NDF-103', 'Подготовка библиотеки UI-компонентов', 'p1', 'u4', 'u2', 'review', 'high', 2, ['frontend', 'UI'], 'Собрать переиспользуемые компоненты: кнопки, формы, карточки, навигацию.', []],
      ['NDF-104', 'Вёрстка главной страницы', 'p1', 'u4', 'u2', 'inprogress', 'critical', 1, ['frontend', 'вёрстка'], 'Сверстать главную страницу по утверждённому макету с соблюдением адаптивности.', []],
      ['NDF-105', 'Реализация формы обратной связи', 'p1', 'u5', 'u2', 'planned', 'high', 6, ['backend'], 'Реализовать отправку заявок с формы на почту менеджера и в CRM.', []],
      ['NDF-106', 'Интеграция CMS', 'p1', 'u5', 'u2', 'backlog', 'medium', 14, ['backend', 'CMS'], 'Подключить и настроить CMS для управления контентом сайта.', []],
      ['NDF-107', 'Адаптивная верстка для мобильных устройств', 'p1', 'u4', 'u2', 'backlog', 'high', 12, ['frontend', 'адаптив'], 'Обеспечить корректное отображение сайта на смартфонах и планшетах.', []],
      ['NDF-108', 'Написание тест-кейсов', 'p1', 'u7', 'u2', 'inprogress', 'medium', 4, ['тестирование'], 'Подготовить тест-кейсы на основные пользовательские сценарии сайта.', []],
      ['NDF-109', 'Функциональное тестирование сайта', 'p1', 'u7', 'u2', 'backlog', 'high', 18, ['тестирование'], 'Провести функциональное и кросс-браузерное тестирование.', []],
      ['NDF-110', 'Подготовка контента для раздела «О компании»', 'p1', 'u8', 'u2', 'done', 'low', -3, ['контент'], 'Собрать и отредактировать тексты для раздела «О компании».', []],
      ['NDF-111', 'Исправление замечаний по дизайну', 'p1', 'u3', 'u2', 'review', 'medium', 3, ['дизайн'], 'Внести правки по комментариям клиента после первого раза.', []],
      ['NDF-112', 'Оптимизация скорости загрузки страниц', 'p1', 'u5', 'u2', 'backlog', 'low', 20, ['backend', 'оптимизация'], 'Оптимизировать изображения и кэширование для ускорения загрузки.', []],
      ['NDF-113', 'Деплой на тестовый сервер', 'p1', 'u5', 'u2', 'planned', 'medium', 8, ['DevOps'], 'Настроить автоматический деплой на тестовый стенд.', []],
      ['NDF-114', 'Подготовка презентации для клиента', 'p1', 'u1', 'u2', 'inprogress', 'critical', -5, ['презентация', 'клиент'], 'Подготовить презентацию о прогрессе проекта для встречи с клиентом.', []],
      ['NDF-115', 'Разработка медиаплана', 'p2', 'u6', 'u1', 'done', 'high', -6, ['медиаплан'], 'Спланировать каналы, бюджет и тайминг рекламной кампании.', []],
      ['NDF-116', 'Создание креативов для соцсетей', 'p2', 'u3', 'u6', 'inprogress', 'high', 2, ['дизайн', 'SMM'], 'Подготовить набор визуальных креативов для публикаций.', []],
      ['NDF-117', 'Настройка таргетированной рекламы', 'p2', 'u6', 'u1', 'inprogress', 'critical', 1, ['реклама'], 'Настроить кампании в кабинетах соцсетей, определить аудитории.', []],
      ['NDF-118', 'Подготовка текстов для рассылки', 'p2', 'u8', 'u6', 'review', 'medium', 3, ['контент', 'email'], 'Написать тексты для трёх писем в рамках email-кампании.', []],
      ['NDF-119', 'Анализ конкурентов', 'p2', 'u8', 'u6', 'done', 'low', -10, ['исследование'], 'Провести анализ рекламных активностей конкурентов.', []],
      ['NDF-120', 'Дизайн баннеров для контекстной рекламы', 'p2', 'u3', 'u6', 'backlog', 'medium', 9, ['дизайн'], 'Сделать баннеры нескольких размеров для контекстной рекламы.', []],
      ['NDF-121', 'Согласование бюджета кампании', 'p2', 'u6', 'u1', 'inprogress', 'critical', -4, ['бюджет'], 'Согласовать финальный бюджет кампании с финансовым отделом.', []],
      ['NDF-122', 'Настройка аналитики и метрик', 'p2', 'u8', 'u6', 'planned', 'high', 5, ['аналитика'], 'Настроить отслеживание конверсий и ключевых метрик кампании.', []],
      ['NDF-123', 'Подготовка промежуточного отчёта', 'p2', 'u6', 'u1', 'backlog', 'low', 15, ['отчёт'], 'Подготовить отчёт о результатах первой недели кампании.', []],
      ['NDF-124', 'Обследование бизнес-процессов отдела продаж', 'p3', 'u8', 'u2', 'inprogress', 'high', 5, ['исследование'], 'Описать текущие процессы работы с заявками и клиентами.', []],
      ['NDF-125', 'Проектирование схемы автоматизации', 'p3', 'u2', 'u1', 'planned', 'high', 10, ['проектирование'], 'Спроектировать целевую схему взаимодействий и автоматизаций.', []],
      ['NDF-126', 'Выбор CRM-системы', 'p3', 'u2', 'u1', 'backlog', 'medium', 20, ['CRM'], 'Сравнить варианты CRM и подготовить рекомендацию.', []],
      ['NDF-127', 'Настройка интеграции с телефонией', 'p3', 'u5', 'u2', 'backlog', 'low', 30, ['интеграция'], 'Интегрировать CRM с телефонной системой компании.', []],
      ['NDF-128', 'Разработка регламента работы с заявками', 'p3', 'u8', 'u2', 'planned', 'medium', 14, ['регламент'], 'Описать регламент обработки заявок в новой системе.', []],
      ['NDF-129', 'Сбор требований от отдела продаж', 'p3', 'u8', 'u2', 'inprogress', 'critical', -2, ['требования'], 'Собрать и зафиксировать требования от сотрудников отдела продаж.', []],
      ['NDF-130', 'Обучение пользователей новой системы', 'p3', 'u7', 'u2', 'backlog', 'low', 35, ['обучение'], 'Провести обучающие сессии для сотрудников отдела продаж.', []],
      ['NDF-131', 'Утверждение квартального плана работ', 'p1', 'u1', 'u2', 'planned', 'high', 2, ['планирование'], 'Согласовать квартальный план работ и контрольные точки с заказчиком.', []]
    ];

    var tasks = defs.map(function (d, i) {
      var created = NF.addDays(-Math.max(3, Math.abs(Number(d[7])) + 6));
      return {
        id: d[0], title: d[1], projectId: d[2], assigneeId: d[3], reporterId: d[4],
        status: d[5], priority: d[6], dueDate: NF.addDays(Number(d[7])),
        tags: d[8] || [], description: d[9] || '', attachments: d[10] || [],
        createdAt: created, updatedAt: NF.addDays(-(i % 4)),
        comments: [], history: [{
          id: NF.uid('h'), userId: d[4], action: 'created', field: null,
          oldValue: null, newValue: null, createdAt: created
        }]
      };
    });

    // Demo comments
    function addComment(taskId, authorId, text, agoDays) {
      var t = tasks.find(function (x) { return x.id === taskId; });
      if (!t) return;
      t.comments.push({
        id: NF.uid('c'), authorId: authorId, text: text,
        createdAt: new Date(Date.now() - agoDays * 86400000).toISOString()
      });
    }
    addComment('NDF-104', 'u2', 'Илья, обрати внимание на адаптивность мобильной версии.', 1);
    addComment('NDF-104', 'u4', 'Принял, сделаю в первую очередь.', 1);
    addComment('NDF-117', 'u1', 'Нужно уложиться в бюджет, утверждённый на встрече.', 2);
    addComment('NDF-114', 'u1', 'Напоминаю: встреча с клиентом в четверг.', 1);
    addComment('NDF-129', 'u8', 'Опросила 5 человек из отдела, требования собираю в таблицу.', 2);
    addComment('NDF-103', 'u2', 'Компоненты выглядят хорошо, осталось добавить состояния hover.', 1);
    addComment('NDF-121', 'u1', 'Финансы просят уточнить сумму до конца недели.', 1);

    // A couple of extra history events for realism
    function addHist(taskId, userId, action, field, oldV, newV, ago) {
      var t = tasks.find(function (x) { return x.id === taskId; });
      if (t) t.history.unshift({
        id: NF.uid('h'), userId: userId, action: action, field: field,
        oldValue: oldV, newValue: newV,
        createdAt: new Date(Date.now() - ago * 86400000).toISOString()
      });
    }
    addHist('NDF-104', 'u2', 'status', 'status', 'Запланировано', 'В работе', 3);
    addHist('NDF-104', 'u2', 'priority', 'priority', 'Средний', 'Критический', 3);
    addHist('NDF-117', 'u1', 'due', 'dueDate', null, NF.addDays(1), 2);
    addHist('NDF-129', 'u2', 'status', 'status', 'Запланировано', 'В работе', 2);

    var notifications = [
      { id: NF.uid('n'), userId: 'u4', type: 'assigned', text: 'Вам назначена задача NDF-104 «Вёрстка главной страницы»', taskId: 'NDF-104', projectId: 'p1', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: NF.uid('n'), userId: 'u4', type: 'comment', text: 'Максим Орлов прокомментировал задачу NDF-104', taskId: 'NDF-104', projectId: 'p1', read: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
      { id: NF.uid('n'), userId: 'u6', type: 'overdue', text: 'Задача NDF-121 «Согласование бюджета кампании» просрочена', taskId: 'NDF-121', projectId: 'p2', read: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: NF.uid('n'), userId: 'u8', type: 'deadline', text: 'Срок задачи NDF-129 истекает через 2 дня', taskId: 'NDF-129', projectId: 'p3', read: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: NF.uid('n'), userId: 'u1', type: 'status', text: 'Задача NDF-114 переведена в статус «В работе»', taskId: 'NDF-114', projectId: 'p1', read: false, createdAt: new Date(Date.now() - 172800000).toISOString() }
    ];

    return { version: 1, users: users, projects: projects, tasks: tasks, notifications: notifications };
  };

  /* ---------- Init state ---------- */
  NF.state = NF.load() || NF.seed();
  if (!NF.load()) NF.save();
})();
