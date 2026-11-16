/* ============================================================
   NordFlow Tasks — shared UI components
   ============================================================ */
(function () {
  'use strict';
  var NF = window.NF;

  /* ---------- Icons (Feather-style, 24x24) ---------- */
  var paths = {
    home: '<path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    tasks: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 9 2 2 4-4M8 16h8"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M17.94 17.94A10 10 0 0 1 12 20c-7 0-11-8-11-8a18 18 0 0 1 5.06-5.94M9.9 4.24A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    more: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    message: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/>',
    paperclip: '<path d="M21.4 11.6 12.3 20.7a6 6 0 0 1-8.5-8.5l9-9a4 4 0 0 1 5.7 5.7l-9 9a2 2 0 0 1-2.8-2.8l8.4-8.5"/>',
    tag: '<path d="M20.6 13.4 12 22l-9-9V4a1 1 0 0 1 1-1h9z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/>',
    check: '<path d="m20 6-11 11-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    edit: '<path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 15a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    filter: '<path d="M4 5h16M7 12h10M10 19h4"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    columns: '<rect x="3" y="4" width="6" height="16" rx="1"/><rect x="10" y="4" width="6" height="11" rx="1"/><rect x="17" y="4" width="4" height="14" rx="1"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v13"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
    briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
    'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>',
    userPlus: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M19 8v6M22 11h-6"/>',
    folderPlus: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 11v6M9 14h6"/>',
    play: '<path d="m6 4 14 8-14 8z"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
    spark: '<path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>'
  };

  NF.icon = function (name, size) {
    var p = paths[name] || paths.info;
    var s = size || 18;
    return '<svg class="icon" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  };

  /* ---------- Avatar ---------- */
  NF.avatar = function (user, size, showName) {
    var s = size || 32;
    var html = '';
    if (user && user.photo) {
      html = '<img class="avatar" style="width:' + s + 'px;height:' + s + 'px" src="' + user.photo + '" alt="">';
    } else {
      var color = (user && user.color) || '#0E8C8C';
      html = '<span class="avatar" style="width:' + s + 'px;height:' + s + 'px;background:' + color + '">' + NF.escapeHtml(NF.initials(user)) + '</span>';
    }
    if (showName) html += '<span class="avatar-name">' + NF.escapeHtml(NF.fullName(user)) + '</span>';
    return html;
  };

  /* ---------- Badges ---------- */
  NF.statusBadge = function (statusId) {
    var st = NF.STATUSES.find(function (s) { return s.id === statusId; }) || NF.STATUSES[0];
    return '<span class="badge badge-status" style="--badge:' + st.color + '"><span class="dot"></span>' + st.name + '</span>';
  };
  NF.priorityBadge = function (p) {
    var pr = NF.PRIORITIES[p] || NF.PRIORITIES.medium;
    return '<span class="badge badge-priority" style="--badge:' + pr.color + '"><span class="dot"></span>' + pr.name + '</span>';
  };
  NF.projectStatusBadge = function (s) {
    var st = NF.PROJECT_STATUSES.find(function (x) { return x.id === s; }) || NF.PROJECT_STATUSES[0];
    return '<span class="badge badge-status" style="--badge:' + st.color + '"><span class="dot"></span>' + st.name + '</span>';
  };
  NF.dueLabel = function (task) {
    if (!task.dueDate) return '<span class="muted">без срока</span>';
    if (NF.isOverdue(task)) {
      var n = Math.abs(NF.daysUntil(task.dueDate));
      return '<span class="due overdue">' + NF.icon('alert', 13) + ' ' + NF.formatShortDate(task.dueDate) + ' · ' + n + ' дн.</span>';
    }
    if (NF.isDueSoon(task)) {
      var d = NF.daysUntil(task.dueDate);
      return '<span class="due soon">' + NF.icon('clock', 13) + ' ' + (d === 0 ? 'сегодня' : 'через ' + d + ' дн.') + '</span>';
    }
    return '<span class="due">' + NF.icon('calendar', 13) + ' ' + NF.formatShortDate(task.dueDate) + '</span>';
  };

  /* ---------- Task card ---------- */
  NF.taskCard = function (task, opts) {
    opts = opts || {};
    var pr = NF.PRIORITIES[task.priority] || NF.PRIORITIES.medium;
    var assignee = NF.getUser(task.assigneeId);
    var tags = (task.tags || []).slice(0, 2).map(function (t) {
      return '<span class="tag">' + NF.escapeHtml(t) + '</span>';
    }).join('');
    var overdueClass = NF.isOverdue(task) ? ' is-overdue' : '';
    return '' +
      '<div class="task-card' + overdueClass + '" draggable="' + (NF.canEditTask(task) ? 'true' : 'false') + '" data-task-id="' + task.id + '" data-action="open-task" tabindex="0" role="button">' +
        '<span class="task-priority-bar" style="background:' + pr.color + '" title="' + pr.name + ' приоритет"></span>' +
        '<div class="task-card-top"><span class="task-id">' + NF.escapeHtml(task.id) + '</span>' +
          (opts.showProject ? '<span class="task-card-project">' + NF.escapeHtml((NF.getProject(task.projectId) || {}).name || '') + '</span>' : '') +
          '<button class="card-more" data-action="task-quick-menu" data-id="' + task.id + '" aria-label="Действия">' + NF.icon('more', 16) + '</button>' +
        '</div>' +
        '<div class="task-card-title">' + NF.escapeHtml(task.title) + '</div>' +
        (tags ? '<div class="task-tags">' + tags + '</div>' : '') +
        '<div class="task-card-footer">' +
          '<span class="task-assignee" title="Исполнитель: ' + NF.escapeHtml(NF.fullName(assignee)) + '">' + NF.avatar(assignee, 24) + '</span>' +
          '<span class="task-due">' + NF.dueLabel(task) + '</span>' +
          '<span class="task-meta">' +
            (task.comments && task.comments.length ? '<span title="Комментарии">' + NF.icon('message', 13) + ' ' + task.comments.length + '</span>' : '') +
            (task.attachments && task.attachments.length ? '<span title="Вложения">' + NF.icon('paperclip', 13) + ' ' + task.attachments.length + '</span>' : '') +
          '</span>' +
        '</div>' +
      '</div>';
  };

  /* ---------- Modal ---------- */
  NF.openModal = function (opts) {
    opts = opts || {};
    var root = document.getElementById('modal-root');
    var sizeClass = opts.size === 'lg' ? ' modal-lg' : (opts.size === 'sm' ? ' modal-sm' : '');
    root.innerHTML =
      '<div class="modal-backdrop" data-action="close-modal"></div>' +
      '<div class="modal' + sizeClass + '" role="dialog" aria-modal="true">' +
        '<div class="modal-header"><h3>' + NF.escapeHtml(opts.title || '') + '</h3>' +
          '<button class="icon-btn" data-action="close-modal" aria-label="Закрыть">' + NF.icon('x', 20) + '</button></div>' +
        '<div class="modal-body">' + (opts.body || '') + '</div>' +
        (opts.footer ? '<div class="modal-footer">' + opts.footer + '</div>' : '') +
      '</div>';
    document.body.classList.add('modal-open');
    if (typeof opts.onMount === 'function') opts.onMount(root);
    var first = root.querySelector('input, select, textarea, button:not([data-action="close-modal"])');
    if (first && !opts.noFocus) setTimeout(function () { first.focus(); }, 30);
  };
  NF.closeModal = function () {
    var root = document.getElementById('modal-root');
    root.innerHTML = '';
    document.body.classList.remove('modal-open');
  };
  NF.confirm = function (message, onConfirm, confirmText) {
    NF.openModal({
      title: 'Подтверждение', size: 'sm',
      body: '<p class="confirm-text">' + NF.escapeHtml(message) + '</p>',
      footer: '<button class="btn btn-ghost" data-action="close-modal">Отмена</button>' +
              '<button class="btn btn-danger" data-action="confirm-yes">' + NF.escapeHtml(confirmText || 'Удалить') + '</button>',
      onMount: function () { NF._confirmCallback = onConfirm; }
    });
  };

  /* ---------- Toast ---------- */
  NF.toast = function (message, type) {
    var root = document.getElementById('toast-root');
    var el = document.createElement('div');
    el.className = 'toast toast-' + (type || 'success');
    var iconName = type === 'error' ? 'alert' : 'checkCircle';
    el.innerHTML = NF.icon(iconName, 18) + '<span>' + NF.escapeHtml(message) + '</span>';
    root.appendChild(el);
    setTimeout(function () {
      el.classList.add('toast-out');
      setTimeout(function () { el.remove(); }, 300);
    }, 3200);
  };

  /* ---------- Empty state ---------- */
  NF.empty = function (iconName, title, text) {
    return '<div class="empty-state"><div class="empty-icon">' + NF.icon(iconName || 'folder', 34) + '</div>' +
      '<h3>' + NF.escapeHtml(title || 'Ничего не найдено') + '</h3>' +
      (text ? '<p>' + NF.escapeHtml(text) + '</p>' : '') + '</div>';
  };

  /* ---------- Sidebar ---------- */
  NF.sidebarNav = function (active) {
    var u = NF.currentUser();
    var items = [
      { id: 'home', label: 'Главная', icon: 'home', hash: '#/' },
      { id: 'mytasks', label: 'Мои задачи', icon: 'tasks', hash: '#/my-tasks' },
      { id: 'projects', label: 'Проекты', icon: 'folder', hash: '#/projects' },
      { id: 'team', label: 'Команда', icon: 'users', hash: '#/team' },
      { id: 'notifications', label: 'Уведомления', icon: 'bell', hash: '#/notifications' },
      { id: 'profile', label: 'Настройки профиля', icon: 'settings', hash: '#/profile' }
    ];
    if (u && u.role === 'admin') items.splice(5, 0, { id: 'users', label: 'Пользователи', icon: 'shield', hash: '#/users' });
    return items.map(function (it) {
      return '<a href="' + it.hash + '" class="nav-item' + (active === it.id ? ' active' : '') + '">' +
        NF.icon(it.icon, 19) + '<span>' + it.label + '</span>' +
        (it.id === 'notifications' ? '<span class="nav-badge" id="nav-notif-badge"></span>' : '') +
        '</a>';
    }).join('');
  };

  /* ---------- App shell ---------- */
  NF.renderShell = function (activeNav, contentHtml) {
    var u = NF.currentUser();
    return '' +
    '<div class="app-shell">' +
      '<aside class="sidebar" id="sidebar">' +
        '<div class="brand"><div class="brand-mark">' + NF.icon('spark', 22) + '</div>' +
          '<div class="brand-text"><strong>NordFlow</strong><span>Tasks</span></div></div>' +
        '<nav class="nav">' + NF.sidebarNav(activeNav) + '</nav>' +
        '<div class="sidebar-foot">' +
          '<div class="sidebar-user">' + NF.avatar(u, 36) +
            '<div class="sidebar-user-info"><strong>' + NF.escapeHtml(NF.fullName(u)) + '</strong>' +
            '<span>' + NF.escapeHtml(NF.ROLES[u.role]) + '</span></div></div>' +
          '<button class="btn-logout" data-action="logout" title="Выйти">' + NF.icon('logout', 18) + '</button>' +
        '</div>' +
      '</aside>' +
      '<div class="sidebar-overlay" data-action="close-sidebar"></div>' +
      '<div class="main-wrap">' +
        '<header class="topbar">' +
          '<button class="icon-btn hamburger" data-action="toggle-sidebar" aria-label="Меню">' + NF.icon('menu', 22) + '</button>' +
          '<div class="global-search" id="global-search">' +
            NF.icon('search', 18) +
            '<input type="text" id="search-input" placeholder="Поиск проектов, задач, сотрудников…" autocomplete="off">' +
            '<div class="search-results" id="search-results"></div>' +
          '</div>' +
          '<div class="topbar-actions">' +
            '<button class="icon-btn notif-btn" data-action="goto" data-hash="#/notifications" aria-label="Уведомления">' +
              NF.icon('bell', 20) + '<span class="notif-dot" id="topbar-notif-dot"></span></button>' +
            '<button class="topbar-user" data-action="user-menu">' + NF.avatar(u, 32) +
              '<span class="topbar-user-name">' + NF.escapeHtml((u.firstName || '')) + '</span>' + NF.icon('chevronDown', 15) + '</button>' +
            '<div class="user-menu" id="user-menu"></div>' +
          '</div>' +
        '</header>' +
        '<main class="content" id="content">' + contentHtml + '</main>' +
      '</div>' +
    '</div>';
  };

  /* ---------- Page header ---------- */
  NF.pageHeader = function (title, subtitle, actionsHtml) {
    return '<div class="page-head"><div><h1>' + NF.escapeHtml(title) + '</h1>' +
      (subtitle ? '<p class="page-subtitle">' + NF.escapeHtml(subtitle) + '</p>' : '') + '</div>' +
      (actionsHtml ? '<div class="page-actions">' + actionsHtml + '</div>' : '') + '</div>';
  };

  /* ---------- Stat card ---------- */
  NF.statCard = function (opts) {
    return '<div class="stat-card" style="--stat-color:' + (opts.color || '#0E8C8C') + '">' +
      '<div class="stat-icon">' + NF.icon(opts.icon || 'activity', 22) + '</div>' +
      '<div class="stat-body"><span class="stat-value">' + opts.value + '</span>' +
      '<span class="stat-label">' + NF.escapeHtml(opts.label) + '</span></div>' +
      (opts.hint ? '<span class="stat-hint">' + NF.escapeHtml(opts.hint) + '</span>' : '') +
      '</div>';
  };
})();
