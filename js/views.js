/* ============================================================
   NordFlow Tasks — views
   ============================================================ */
(function () {
  'use strict';
  var NF = window.NF;
  var V = (NF.views = {});
  function esc(s) { return NF.escapeHtml(s); }

  /* ================= Login ================= */
  V.login = function () {
    return '' +
    '<div class="auth-page">' +
      '<div class="auth-bg"></div>' +
      '<div class="auth-card">' +
        '<div class="auth-logo"><span class="auth-logo-mark">' + NF.icon('spark', 24) + '</span>' +
          '<span><strong>NordFlow</strong> Tasks</span></div>' +
        '<h1>Вход в систему</h1>' +
        '<p class="auth-subtitle">Введите данные для доступа к рабочему пространству</p>' +
        '<form id="login-form" class="auth-form" onsubmit="return false">' +
          '<div class="field"><label>Электронная почта</label>' +
            '<div class="input-icon">' + NF.icon('mail', 18) + '<input type="email" id="login-email" placeholder="name@nordflow.ru" autocomplete="username"></div></div>' +
          '<div class="field"><label>Пароль</label>' +
            '<div class="input-icon">' + NF.icon('lock', 18) + '<input type="password" id="login-pass" placeholder="Введите пароль" autocomplete="current-password">' +
            '<button type="button" class="input-icon-btn" data-action="toggle-pass" aria-label="Показать пароль">' + NF.icon('eye', 18) + '</button></div></div>' +
          '<div class="auth-error" id="auth-error"></div>' +
          '<button type="submit" class="btn btn-primary btn-block">Войти ' + NF.icon('arrowRight', 17) + '</button>' +
        '</form>' +
        '<div class="auth-demo"><div class="auth-demo-title">Демо-доступ</div>' +
          '<div>Администратор: <code>anna.volkova@nordflow.ru</code></div>' +
          '<div>Пароль для всех пользователей: <code>demo123</code></div></div>' +
      '</div>' +
      '<div class="auth-footer">© 2026 NordFlow · Внутренняя система управления задачами</div>' +
    '</div>';
  };

  /* ================= Home ================= */
  V.home = function () {
    var u = NF.currentUser();
    var myTasks = NF.userTasks(u.id).filter(function (t) { return t.status !== 'done'; });
    var overdue = myTasks.filter(function (t) { return NF.isOverdue(t); });
    var week = myTasks.filter(function (t) {
      var n = NF.daysUntil(t.dueDate); return n !== null && n >= 0 && n <= 7;
    });
    var deadlines = myTasks.slice().filter(function (t) { return !!t.dueDate; })
      .sort(function (a, b) { return a.dueDate.localeCompare(b.dueDate); }).slice(0, 5);
    var recent = NF.state.tasks.slice().sort(function (a, b) {
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    }).slice(0, 5);
    var myProjects = NF.availableProjects(u).filter(function (p) { return p.status !== 'archived'; }).slice(0, 4);

    var html = NF.pageHeader('Здравствуйте, ' + u.firstName + '!', 'Краткий обзор вашей работы на сегодня',
      NF.isManager() ? '<button class="btn btn-primary" data-action="new-task">' + NF.icon('plus', 17) + ' Новая задача</button>' : '');

    html += '<div class="stats-grid">' +
      NF.statCard({ label: 'Активные задачи', value: myTasks.length, icon: 'tasks', color: '#0E8C8C' }) +
      NF.statCard({ label: 'Просрочено', value: overdue.length, icon: 'alert', color: '#E23D3D' }) +
      NF.statCard({ label: 'На этой неделе', value: week.length, icon: 'calendar', color: '#E8862B' }) +
      NF.statCard({ label: 'Мои проекты', value: myProjects.length, icon: 'folder', color: '#2F80D8' }) +
      '</div>';

    html += '<div class="home-grid"><div class="home-main">';

    html += '<section class="panel"><div class="panel-head"><h2>' + NF.icon('clock', 18) + ' Ближайшие дедлайны</h2>' +
      '<a href="#/my-tasks" class="link">Все задачи ' + NF.icon('chevronRight', 14) + '</a></div>' +
      '<div class="panel-body">' + (deadlines.length ? deadlines.map(function (t) {
        return '<a class="deadline-row" href="#/tasks/' + t.id + '">' +
          '<div class="deadline-date' + (NF.isOverdue(t) ? ' overdue' : '') + '">' + NF.formatShortDate(t.dueDate) + '</div>' +
          '<div class="deadline-info"><strong>' + esc(t.title) + '</strong>' +
          '<span><b class="task-id-inline">' + esc(t.id) + '</b> · ' + esc((NF.getProject(t.projectId) || {}).name || '') + '</span></div>' +
          '<span class="priority-pill" style="--badge:' + NF.PRIORITIES[t.priority].color + '">' + NF.PRIORITIES[t.priority].short + '</span>' +
          '</a>';
      }).join('') : NF.empty('checkCircle', 'Дедлайнов нет', 'Все задачи в работе без срока')) + '</div></section>';

    html += '<section class="panel"><div class="panel-head"><h2>' + NF.icon('activity', 18) + ' Последние обновления</h2></div>' +
      '<div class="panel-body">' + recent.map(function (t) {
        var who = NF.getUser((t.history[0] || {}).userId);
        return '<a class="update-row" href="#/tasks/' + t.id + '">' + NF.avatar(who, 30) +
          '<div><strong>' + esc(who ? NF.fullName(who) : 'Система') + '</strong> ' +
          esc(historyText(t.history[0])) + ' <b>' + esc(t.id) + '</b>' +
          '<span>' + esc(t.title) + '</span></div>' +
          '<time>' + NF.formatShortDate(t.updatedAt) + '</time></a>';
      }).join('') + '</div></section>';

    if (NF.isManager()) {
      var managed = NF.state.projects.filter(function (p) { return p.managerId === u.id; });
      var memberIds = [];
      managed.forEach(function (p) { p.memberIds.forEach(function (id) { if (memberIds.indexOf(id) === -1) memberIds.push(id); }); });
      html += '<section class="panel"><div class="panel-head"><h2>' + NF.icon('users', 18) + ' Сводка по команде</h2>' +
        '<span class="muted small">Проекты под вашим руководством</span></div><div class="panel-body table-scroll">' +
        '<table class="data-table"><thead><tr><th>Сотрудник</th><th>Активных</th><th>Просрочено</th><th>Загрузка</th></tr></thead><tbody>' +
        memberIds.map(function (id) {
          var m = NF.getUser(id); var tasks = NF.userTasks(id);
          var active = tasks.filter(function (t) { return t.status !== 'done'; }).length;
          var od = tasks.filter(function (t) { return NF.isOverdue(t); }).length;
          return '<tr><td>' + NF.avatar(m, 28, true) + '</td><td>' + active + '</td><td>' + (od ? '<span class="text-danger">' + od + '</span>' : '0') + '</td>' +
            '<td>' + workloadBar(active) + '</td></tr>';
        }).join('') + '</tbody></table></div></section>';
    }

    html += '</div><div class="home-side">';

    html += '<section class="panel"><div class="panel-head"><h2>' + NF.icon('folder', 18) + ' Мои проекты</h2></div>' +
      '<div class="panel-body">' + (myProjects.length ? myProjects.map(function (p) {
        var pts = NF.projectTasks(p.id);
        var done = pts.filter(function (t) { return t.status === 'done'; }).length;
        var pct = pts.length ? Math.round(done / pts.length * 100) : 0;
        return '<a class="mini-project" href="#/projects/' + p.id + '">' +
          '<span class="mini-project-dot" style="background:' + p.color + '"></span>' +
          '<div><strong>' + esc(p.name) + '</strong><span>' + pts.length + ' задач · ' + pct + '% готово</span></div>' +
          NF.projectStatusBadge(p.status) + '</a>';
      }).join('') : NF.empty('folder', 'Нет проектов', 'Вы не добавлены ни в один проект')) + '</div></section>';

    html += '<section class="panel accent-panel"><div class="panel-head"><h2>' + NF.icon('spark', 18) + ' nordflow</h2></div>' +
      '<div class="panel-body"><p class="muted">Трекер задач помогает команде держать фокус на важном. Актуальные статусы, понятные дедлайны и вся работа — в одном месте.</p></div></section>';

    html += '</div></div>';
    return html;
  };

  function historyText(h) {
    if (!h) return 'создал(а) задачу';
    var map = { created: 'создал(а)', status: 'изменил(а) статус', priority: 'изменил(а) приоритет', due: 'изменил(а) срок', update: 'обновил(а) задачу', comment: 'прокомментировал(а)' };
    return (map[h.action] || 'обновил(а)') + ' задачу';
  }
  function workloadBar(active) {
    var pct = Math.min(100, active * 18);
    var color = active >= 5 ? '#E23D3D' : active >= 3 ? '#E89A2B' : '#2FA36B';
    return '<div class="workload"><div class="workload-track"><div class="workload-fill" style="width:' + pct + '%;background:' + color + '"></div></div><span>' + pct + '%</span></div>';
  }
  NF.workloadBar = workloadBar;

  /* ================= My tasks ================= */
  V.mytasks = function () {
    var u = NF.currentUser();
    var ui = NF.app.ui.my;
    var tasks = NF.userTasks(u.id);
    var projects = NF.availableProjects(u);

    var html = NF.pageHeader('Мои задачи', 'Все задачи, назначенные вам (' + tasks.length + ')',
      '<div class="view-toggle">' +
        '<button class="vt-btn' + (ui.view === 'list' ? ' active' : '') + '" data-action="my-view" data-view="list" title="Список">' + NF.icon('list', 17) + ' Список</button>' +
        '<button class="vt-btn' + (ui.view === 'board' ? ' active' : '') + '" data-action="my-view" data-view="board" title="Доска">' + NF.icon('columns', 17) + ' Доска</button>' +
      '</div>' + (NF.canCreateTask(projects[0]) ? '<button class="btn btn-primary" data-action="new-task">' + NF.icon('plus', 17) + ' Новая задача</button>' : ''));

    html += '<div class="filters" id="my-filters">' +
      '<div class="filter-search">' + NF.icon('search', 17) + '<input id="my-q" placeholder="Поиск по названию…" value="' + esc(ui.q) + '"></div>' +
      '<select id="my-status" data-filter><option value="">Все статусы</option>' + NF.STATUSES.map(function (s) { return '<option value="' + s.id + '"' + (ui.status === s.id ? ' selected' : '') + '>' + s.name + '</option>'; }).join('') + '</select>' +
      '<select id="my-project" data-filter><option value="">Все проекты</option>' + projects.map(function (p) { return '<option value="' + p.id + '"' + (ui.project === p.id ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</select>' +
      '<select id="my-priority" data-filter><option value="">Все приоритеты</option>' + Object.keys(NF.PRIORITIES).map(function (k) { return '<option value="' + k + '"' + (ui.priority === k ? ' selected' : '') + '>' + NF.PRIORITIES[k].name + '</option>'; }).join('') + '</select>' +
      '<select id="my-due" data-filter><option value="">Любой срок</option><option value="overdue"' + (ui.due === 'overdue' ? ' selected' : '') + '>Просроченные</option><option value="week"' + (ui.due === 'week' ? ' selected' : '') + '>На этой неделе</option><option value="none"' + (ui.due === 'none' ? ' selected' : '') + '>Без срока</option></select>' +
      '<button class="btn btn-ghost btn-sm" data-action="reset-my-filters">Сбросить</button>' +
      '</div>';
    html += '<div class="results-count" id="results-count"></div>';

    if (ui.view === 'list') {
      html += '<div class="panel task-list-panel"><div class="table-scroll"><table class="data-table task-table"><thead><tr>' +
        '<th>Задача</th><th>Проект</th><th>Статус</th><th>Приоритет</th><th>Срок</th><th>Постановщик</th></tr></thead><tbody>' +
        tasks.map(listRow).join('') + '</tbody></table></div><div id="no-match" class="no-match hidden">' + NF.empty('search', 'Задачи не найдены', 'Измените фильтры или строку поиска') + '</div></div>';
    } else {
      html += '<div class="kanban" id="my-kanban">' + NF.STATUSES.map(function (s) {
        var colTasks = tasks.filter(function (t) { return t.status === s.id; });
        return '<div class="kanban-col" data-status="' + s.id + '"><div class="kanban-col-head" style="--badge:' + s.color + '">' +
          '<span class="dot"></span><h3>' + s.name + '</h3><span class="col-count">' + colTasks.length + '</span></div>' +
          '<div class="kanban-col-body">' + colTasks.map(function (t) { return NF.taskCard(t, { showProject: true }); }).join('') + '</div></div>';
      }).join('') + '</div><div id="no-match" class="no-match hidden">' + NF.empty('search', 'Задачи не найдены', 'Измените фильтры или строку поиска') + '</div>';
    }
    return html;
  };

  function listRow(t) {
    var p = NF.getProject(t.projectId);
    var reporter = NF.getUser(t.reporterId);
    return '<tr class="task-row" data-task-row data-task-id="' + t.id + '" data-status="' + t.status + '" data-project="' + t.projectId + '" data-priority="' + t.priority + '" data-due="' + (NF.isOverdue(t) ? 'overdue' : (NF.isDueSoon(t) ? 'week' : 'none')) + '" data-title="' + esc(t.title.toLowerCase()) + '" data-action="open-task">' +
      '<td><div class="task-cell"><span class="priority-dot" style="background:' + NF.PRIORITIES[t.priority].color + '"></span>' +
        '<div><strong>' + esc(t.title) + '</strong><span class="task-id-inline">' + esc(t.id) + '</span>' + (NF.isOverdue(t) ? '<span class="overdue-chip">Просрочено</span>' : '') + '</div></div></td>' +
      '<td data-label="Проект"><span class="project-link">' + esc(p ? p.name : '—') + '</span></td>' +
      '<td data-label="Статус">' + NF.statusBadge(t.status) + '</td>' +
      '<td data-label="Приоритет">' + NF.priorityBadge(t.priority) + '</td>' +
      '<td data-label="Срок">' + NF.dueLabel(t) + '</td>' +
      '<td data-label="Постановщик">' + NF.avatar(reporter, 26, true) + '</td></tr>';
  }

  V.applyMyFilters = function () {
    var q = (document.getElementById('my-q') || {}).value || '';
    var status = (document.getElementById('my-status') || {}).value || '';
    var project = (document.getElementById('my-project') || {}).value || '';
    var priority = (document.getElementById('my-priority') || {}).value || '';
    var due = (document.getElementById('my-due') || {}).value || '';
    q = q.toLowerCase();
    var shown = 0, total = 0;
    document.querySelectorAll('[data-task-row], .task-card').forEach(function (el) {
      if (!el.closest('#content')) return;
      total++;
      var isCard = el.classList.contains('task-card');
      var id = el.getAttribute('data-task-id');
      var t = NF.getTask(id);
      if (!t) return;
      var ok = (!q || t.title.toLowerCase().indexOf(q) !== -1 || id.toLowerCase().indexOf(q) !== -1) &&
        (!status || t.status === status) && (!project || t.projectId === project) &&
        (!priority || t.priority === priority) &&
        (!due || (due === 'overdue' ? NF.isOverdue(t) : due === 'week' ? NF.isDueSoon(t) : !t.dueDate));
      el.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    var cnt = document.getElementById('results-count');
    if (cnt) cnt.textContent = 'Показано ' + shown + ' из ' + total;
    var nm = document.getElementById('no-match');
    if (nm) nm.classList.toggle('hidden', shown !== 0);
    document.querySelectorAll('.kanban-col').forEach(function (col) {
      var any = Array.prototype.slice.call(col.querySelectorAll('.task-card')).some(function (c) { return c.style.display !== 'none'; });
      col.classList.toggle('col-empty', !any);
    });
  };

  /* ================= Projects ================= */
  V.projects = function () {
    var u = NF.currentUser();
    var list = NF.availableProjects(u).filter(function (p) { return p.status !== 'archived'; });
    var html = NF.pageHeader('Проекты', 'Все проекты, к которым у вас есть доступ (' + list.length + ')',
      NF.isAdmin() ? '<button class="btn btn-primary" data-action="new-project">' + NF.icon('folderPlus', 17) + ' Создать проект</button>' : '');
    if (!list.length) return html + NF.empty('folder', 'Проектов пока нет', 'Обратитесь к администратору, чтобы получить доступ');
    html += '<div class="project-grid">' + list.map(function (p) {
      var tasks = NF.projectTasks(p.id);
      var open = tasks.filter(function (t) { return t.status !== 'done'; }).length;
      var done = tasks.length - open;
      var pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
      var manager = NF.getUser(p.managerId);
      var memberAvatars = p.memberIds.slice(0, 4).map(function (id) { return NF.avatar(NF.getUser(id), 28); }).join('');
      return '<a class="project-card" href="#/projects/' + p.id + '">' +
        '<span class="project-card-accent" style="background:' + p.color + '"></span>' +
        '<div class="project-card-head">' + NF.projectStatusBadge(p.status) + '<span class="project-card-date">' + NF.icon('calendar', 14) + ' ' + NF.formatShortDate(p.endDate) + '</span></div>' +
        '<h3>' + esc(p.name) + '</h3>' +
        '<p>' + esc(p.description || 'Описание не добавлено') + '</p>' +
        '<div class="project-card-meta"><span>' + NF.avatar(manager, 26) + ' ' + esc(NF.fullName(manager)) + '</span>' +
          '<span>' + NF.icon('tasks', 15) + ' ' + open + ' открытых</span>' +
          '<span>' + NF.icon('users', 15) + ' ' + p.memberIds.length + '</span></div>' +
        '<div class="project-progress"><div class="project-progress-label"><span>Прогресс</span><span>' + pct + '%</span></div>' +
          '<div class="progress-track"><div class="progress-fill" style="width:' + pct + '%;background:' + p.color + '"></div></div></div>' +
        '<div class="project-card-foot">' + memberAvatars + (p.memberIds.length > 4 ? '<span class="more-members">+' + (p.memberIds.length - 4) + '</span>' : '') + '</div>' +
      '</a>';
    }).join('') + '</div>';
    return html;
  };

  /* ================= Project detail ================= */
  V.project = function (id, tab) {
    var u = NF.currentUser();
    var p = NF.getProject(id);
    if (!p) return NF.pageHeader('Проект не найден') + NF.empty('folder', 'Проект не найден', 'Возможно, проект был удалён');
    var accessible = NF.availableProjects(u).some(function (x) { return x.id === id; });
    if (!accessible) return NF.pageHeader('Нет доступа') + NF.empty('shield', 'Нет доступа к проекту', 'Вы не добавлены в этот проект');

    tab = tab || 'board';
    var tasks = NF.projectTasks(id);
    var html = '<div class="breadcrumb"><a href="#/projects">Проекты</a>' + NF.icon('chevronRight', 14) + '<span>' + esc(p.name) + '</span></div>';
    html += '<div class="project-detail-head"><div class="project-detail-title"><span class="project-dot" style="background:' + p.color + '"></span>' +
      '<div><h1>' + esc(p.name) + '</h1><div class="project-detail-sub">' + NF.projectStatusBadge(p.status) +
      '<span>' + NF.icon('calendar', 14) + ' до ' + NF.formatDate(p.endDate) + '</span>' +
      '<span>' + NF.icon('tasks', 14) + ' ' + tasks.length + ' задач</span></div></div></div>' +
      '<div class="page-actions">' +
        (NF.isAdmin() ? '<button class="btn btn-ghost" data-action="edit-project" data-id="' + p.id + '">' + NF.icon('edit', 16) + ' Редактировать</button>' : '') +
        (NF.canCreateTask(p) ? '<button class="btn btn-primary" data-action="new-task" data-project="' + p.id + '">' + NF.icon('plus', 17) + ' Создать задачу</button>' : '') +
      '</div></div>';

    html += '<div class="tabs">' + [
      { id: 'board', label: 'Доска', icon: 'columns' },
      { id: 'list', label: 'Список задач', icon: 'list' },
      { id: 'members', label: 'Участники', icon: 'users' },
      { id: 'info', label: 'Информация', icon: 'info' }
    ].map(function (t) {
      return '<button class="tab' + (tab === t.id ? ' active' : '') + '" data-action="project-tab" data-tab="' + t.id + '" data-id="' + p.id + '">' + NF.icon(t.icon, 16) + ' ' + t.label + '</button>';
    }).join('') + '</div>';

    if (tab === 'board') html += boardHtml(p, tasks);
    else if (tab === 'list') html += projectListHtml(p, tasks);
    else if (tab === 'members') html += membersHtml(p);
    else html += projectInfoHtml(p, tasks);

    return html;
  };

  function boardHtml(p, tasks) {
    var html = '<div class="board-status-nav">' + NF.STATUSES.map(function (s) {
      var c = tasks.filter(function (t) { return t.status === s.id; }).length;
      return '<button class="board-jump" data-action="board-jump" data-status="' + s.id + '"><span class="dot" style="background:' + s.color + '"></span>' + s.name + ' <b>' + c + '</b></button>';
    }).join('') + '</div>';
    html += '<div class="kanban board-kanban" id="board-kanban">' + NF.STATUSES.map(function (s) {
      var colTasks = tasks.filter(function (t) { return t.status === s.id; });
      return '<div class="kanban-col" data-status="' + s.id + '" id="col-' + s.id + '">' +
        '<div class="kanban-col-head" style="--badge:' + s.color + '"><span class="dot"></span><h3>' + s.name + '</h3><span class="col-count">' + colTasks.length + '</span></div>' +
        '<div class="kanban-col-body" data-drop-status="' + s.id + '">' + (colTasks.length ? colTasks.map(function (t) { return NF.taskCard(t); }).join('') : '<div class="col-placeholder">Перетащите задачу сюда</div>') + '</div></div>';
    }).join('') + '</div>';
    return html;
  }

  function projectListHtml(p, tasks) {
    if (!tasks.length) return NF.empty('tasks', 'В проекте нет задач', 'Создайте первую задачу');
    return '<div class="panel"><div class="table-scroll"><table class="data-table task-table"><thead><tr>' +
      '<th>ID</th><th>Задача</th><th>Исполнитель</th><th>Статус</th><th>Приоритет</th><th>Срок</th></tr></thead><tbody>' +
      tasks.map(function (t) {
        var assignee = NF.getUser(t.assigneeId);
        return '<tr class="task-row" data-action="open-task" data-task-id="' + t.id + '">' +
          '<td data-label="ID"><span class="task-id-inline">' + esc(t.id) + '</span></td>' +
          '<td data-label="Задача"><div class="task-cell"><span class="priority-dot" style="background:' + NF.PRIORITIES[t.priority].color + '"></span><div><strong>' + esc(t.title) + '</strong>' + (NF.isOverdue(t) ? '<span class="overdue-chip">Просрочено</span>' : '') + '</div></div></td>' +
          '<td data-label="Исполнитель">' + NF.avatar(assignee, 26, true) + '</td><td data-label="Статус">' + NF.statusBadge(t.status) + '</td>' +
          '<td data-label="Приоритет">' + NF.priorityBadge(t.priority) + '</td><td data-label="Срок">' + NF.dueLabel(t) + '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
  }

  function membersHtml(p) {
    return '<div class="member-grid">' + p.memberIds.map(function (id) {
      var m = NF.getUser(id);
      var tasks = NF.userTasks(id).filter(function (t) { return t.projectId === p.id; });
      var active = tasks.filter(function (t) { return t.status !== 'done'; }).length;
      var od = tasks.filter(function (t) { return NF.isOverdue(t); }).length;
      return '<div class="member-card">' + NF.avatar(m, 52) + '<div class="member-info"><strong>' + esc(NF.fullName(m)) + '</strong>' +
        '<span>' + esc(m.position) + '</span><span class="muted small">' + esc(m.email) + '</span></div>' +
        (p.managerId === id ? '<span class="manager-chip">' + NF.icon('shield', 13) + ' Руководитель</span>' : '') +
        '<div class="member-stats"><span><b>' + active + '</b> активных</span><span><b class="' + (od ? 'text-danger' : '') + '">' + od + '</b> просрочено</span></div>' +
        (NF.isManager() ? '<button class="btn btn-ghost btn-sm btn-block" data-action="member-tasks" data-id="' + id + '" data-project="' + p.id + '">Активные задачи</button>' : '') +
        '</div>';
    }).join('') + '</div>';
  }

  function projectInfoHtml(p, tasks) {
    var done = tasks.filter(function (t) { return t.status === 'done'; }).length;
    return '<div class="info-grid"><section class="panel"><div class="panel-head"><h2>' + NF.icon('info', 17) + ' О проекте</h2></div>' +
      '<div class="panel-body info-list">' +
      '<div><span>Описание</span><strong>' + esc(p.description || '—') + '</strong></div>' +
      '<div><span>Руководитель</span><strong>' + esc(NF.fullName(NF.getUser(p.managerId))) + '</strong></div>' +
      '<div><span>Дата начала</span><strong>' + NF.formatDate(p.startDate) + '</strong></div>' +
      '<div><span>Плановое завершение</span><strong>' + NF.formatDate(p.endDate) + '</strong></div>' +
      '<div><span>Статус</span><strong>' + esc(NF.PROJECT_STATUSES.find(function (s) { return s.id === p.status; }).name) + '</strong></div>' +
      '<div><span>Участников</span><strong>' + p.memberIds.length + '</strong></div>' +
      '<div><span>Задач выполнено</span><strong>' + done + ' из ' + tasks.length + '</strong></div>' +
      '<div><span>Создание задач сотрудниками</span><strong>' + (p.allowEmployeeCreate ? 'Разрешено' : 'Запрещено') + '</strong></div>' +
      '</div></section>' +
      '<section class="panel"><div class="panel-head"><h2>' + NF.icon('sliders', 17) + ' Статистика</h2></div>' +
      '<div class="panel-body">' + NF.STATUSES.map(function (s) {
        var c = tasks.filter(function (t) { return t.status === s.id; }).length;
        var pct = tasks.length ? c / tasks.length * 100 : 0;
        return '<div class="stat-bar"><span>' + s.name + '</span><div class="progress-track"><div class="progress-fill" style="width:' + pct + '%;background:' + s.color + '"></div></div><b>' + c + '</b></div>';
      }).join('') + '</div></section></div>';
  }

  /* ================= Task detail ================= */
  V.task = function (id) {
    var u = NF.currentUser();
    var t = NF.getTask(id);
    if (!t) return NF.pageHeader('Задача не найдена') + NF.empty('tasks', 'Задача не найдена', 'Возможно, задача была удалена');
    var p = NF.getProject(t.projectId);
    var accessible = NF.availableProjects(u).some(function (x) { return x.id === t.projectId; });
    if (!accessible) return NF.pageHeader('Нет доступа') + NF.empty('shield', 'Нет доступа к задаче', 'Вы не добавлены в проект этой задачи');

    var assignee = NF.getUser(t.assigneeId), reporter = NF.getUser(t.reporterId);
    var pr = NF.PRIORITIES[t.priority];
    var canEdit = NF.canEditTask(t);
    var html = '<div class="breadcrumb"><a href="#/projects">Проекты</a>' + NF.icon('chevronRight', 14) +
      '<a href="#/projects/' + p.id + '">' + esc(p.name) + '</a>' + NF.icon('chevronRight', 14) + '<span>' + esc(t.id) + '</span></div>';

    html += '<div class="task-detail-head"><div><div class="task-detail-id">' + esc(t.id) + (NF.isOverdue(t) ? '<span class="overdue-chip">Просрочено</span>' : '') + '</div>' +
      '<h1>' + esc(t.title) + '</h1></div><div class="page-actions">' +
      (canEdit ? '<button class="btn btn-ghost" data-action="quick-status" data-id="' + t.id + '">' + NF.icon('refresh', 16) + ' Статус</button>' +
        '<button class="btn btn-ghost" data-action="edit-task" data-id="' + t.id + '">' + NF.icon('edit', 16) + ' Редактировать</button>' : '') +
      '</div></div>';

    html += '<div class="task-detail-grid"><div class="task-detail-main">';

    html += '<section class="panel"><div class="panel-head"><h2>' + NF.icon('file-text', 16) + ' Описание</h2></div>' +
      '<div class="panel-body"><p class="task-description">' + esc(t.description || 'Описание не добавлено') + '</p>' +
      (t.tags && t.tags.length ? '<div class="task-tags large">' + t.tags.map(function (tag) { return '<span class="tag">' + NF.escapeHtml(tag) + '</span>'; }).join('') + '</div>' : '') +
      '</div></section>';

    html += '<section class="panel"><div class="panel-head"><h2>' + NF.icon('paperclip', 16) + ' Вложения (' + (t.attachments || []).length + ')</h2>' +
      (canEdit ? '<button class="btn btn-ghost btn-sm" data-action="edit-task" data-id="' + t.id + '">' + NF.icon('plus', 14) + ' Добавить</button>' : '') + '</div>' +
      '<div class="panel-body">' + ((t.attachments || []).length ? '<div class="attachment-grid">' + t.attachments.map(function (a, i) {
        var content = NF.icon(a.type === 'file' ? 'paperclip' : 'link', 16) + '<span>' + esc(a.name) + '</span>' + NF.icon('external', 13);
        return a.type === 'link' && a.url ? '<a class="attachment" href="' + esc(a.url) + '" target="_blank" rel="noopener">' + content + '</a>' :
          '<a class="attachment" href="' + esc(a.url) + '" download="' + esc(a.name) + '">' + content + '</a>';
      }).join('') + '</div>' : '<p class="muted">Вложений нет</p>') + '</div></section>';

    html += '<section class="panel" id="comments"><div class="panel-head"><h2>' + NF.icon('message', 16) + ' Комментарии (' + t.comments.length + ')</h2></div>' +
      '<div class="panel-body"><div class="comment-list">' + (t.comments.length ? t.comments.map(function (c) {
        var author = NF.getUser(c.authorId);
        var own = c.authorId === u.id;
        return '<div class="comment">' + NF.avatar(author, 34) + '<div class="comment-body"><div class="comment-head">' +
          '<strong>' + esc(NF.fullName(author)) + '</strong><time>' + NF.formatDateTime(c.createdAt) + (c.edited ? ' · изменён' : '') + '</time></div>' +
          '<p>' + esc(c.text) + '</p></div>' +
          (own || u.role === 'admin' ? '<div class="comment-actions">' +
            (own ? '<button class="mini-icon" data-action="edit-comment" data-id="' + t.id + '" data-cid="' + c.id + '" title="Редактировать">' + NF.icon('edit', 15) + '</button>' : '') +
            '<button class="mini-icon danger" data-action="delete-comment" data-id="' + t.id + '" data-cid="' + c.id + '" title="Удалить">' + NF.icon('trash', 15) + '</button></div>' : '') +
          '</div>';
      }).join('') : '<p class="muted">Пока нет комментариев. Начните обсуждение.</p>') + '</div>' +
      '<div class="comment-form">' + NF.avatar(u, 34) + '<div class="comment-form-inner"><textarea id="comment-input" rows="2" placeholder="Написать комментарий…"></textarea>' +
      '<button class="btn btn-primary btn-sm" data-action="add-comment" data-id="' + t.id + '">' + NF.icon('send', 15) + ' Отправить</button></div></div>' +
      '</div></section>';

    html += '<section class="panel"><div class="panel-head"><h2>' + NF.icon('activity', 16) + ' История изменений</h2></div>' +
      '<div class="panel-body"><div class="timeline">' + t.history.map(function (h) {
        var who = NF.getUser(h.userId);
        return '<div class="timeline-item">' + NF.avatar(who, 28) + '<div><strong>' + esc(NF.fullName(who)) + '</strong> ' + esc(historyDetail(h)) +
          '<time>' + NF.formatDateTime(h.createdAt) + '</time></div></div>';
      }).join('') + '</div></div></section>';

    html += '</div><aside class="task-detail-side"><section class="panel"><div class="panel-head"><h2>Детали</h2></div>' +
      '<div class="panel-body detail-list">' +
      '<div><span>Статус</span><div>' + NF.statusBadge(t.status) + '</div></div>' +
      '<div><span>Приоритет</span><div>' + NF.priorityBadge(t.priority) + '</div></div>' +
      '<div><span>Исполнитель</span><div class="detail-user">' + NF.avatar(assignee, 28, true) + '</div></div>' +
      '<div><span>Постановщик</span><div class="detail-user">' + NF.avatar(reporter, 28, true) + '</div></div>' +
      '<div><span>Проект</span><a href="#/projects/' + p.id + '">' + esc(p.name) + '</a></div>' +
      '<div><span>Дата создания</span><strong>' + NF.formatDate(t.createdAt) + '</strong></div>' +
      '<div><span>Дедлайн</span><div>' + NF.dueLabel(t) + '</div></div>' +
      '<div><span>Обновлена</span><strong>' + NF.formatDateTime(t.updatedAt) + '</strong></div>' +
      '</div></section></aside></div>';
    return html;
  };

  function historyDetail(h) {
    var map = {
      created: 'создал(а) задачу',
      status: 'изменил(а) статус: ' + (h.oldValue || '—') + ' → ' + (h.newValue || '—'),
      priority: 'изменил(а) приоритет: ' + (h.oldValue || '—') + ' → ' + (h.newValue || '—'),
      due: 'изменил(а) дедлайн на ' + (h.newValue || '—'),
      update: 'обновил(а) поле «' + (h.field || '') + '»: ' + (h.oldValue || '—') + ' → ' + (h.newValue || '—'),
      comment: 'оставил(а) комментарий'
    };
    return map[h.action] || 'обновил(а) задачу';
  }

  /* ================= Team ================= */
  V.team = function () {
    var html = NF.pageHeader('Команда', 'Сотрудники компании NordFlow (' + NF.state.users.length + ')');
    html += '<div class="team-grid">' + NF.state.users.map(function (m) {
      var tasks = NF.userTasks(m.id);
      var active = tasks.filter(function (t) { return t.status !== 'done'; }).length;
      var od = tasks.filter(function (t) { return NF.isOverdue(t); }).length;
      return '<div class="team-card">' +
        '<div class="team-card-top">' + NF.avatar(m, 56) +
          (m.role === 'admin' ? '<span class="role-chip admin">' + NF.icon('shield', 12) + ' Админ</span>' :
           m.role === 'manager' ? '<span class="role-chip manager">' + NF.icon('briefcase', 12) + ' Руководитель</span>' : '') + '</div>' +
        '<h3>' + esc(NF.fullName(m)) + '</h3><span class="team-position">' + esc(m.position) + '</span>' +
        '<a class="team-email" href="mailto:' + esc(m.email) + '">' + NF.icon('mail', 13) + ' ' + esc(m.email) + '</a>' +
        '<div class="team-stats"><div><b>' + active + '</b><span>активных</span></div><div><b class="' + (od ? 'text-danger' : '') + '">' + od + '</b><span>просрочено</span></div></div>' +
        '<div class="team-workload"><span>Загрузка</span>' + workloadBar(active) + '</div>' +
        (NF.isManager() ? '<button class="btn btn-ghost btn-sm btn-block" data-action="member-tasks" data-id="' + m.id + '">Активные задачи</button>' : '') +
        '</div>';
    }).join('') + '</div>';
    return html;
  };

  V.memberTasksModal = function (userId, projectId) {
    var m = NF.getUser(userId);
    var tasks = NF.userTasks(userId).filter(function (t) {
      return t.status !== 'done' && (!projectId || t.projectId === projectId);
    });
    NF.openModal({
      title: 'Активные задачи · ' + NF.fullName(m), size: 'lg', noFocus: true,
      body: tasks.length ? '<div class="modal-task-list">' + tasks.map(function (t) { return NF.taskCard(t, { showProject: true }); }).join('') + '</div>' :
        NF.empty('checkCircle', 'Нет активных задач', 'У сотрудника сейчас нет задач в работе'),
      footer: '<button class="btn btn-ghost" data-action="close-modal">Закрыть</button>'
    });
  };

  /* ================= Notifications ================= */
  V.notifications = function () {
    var u = NF.currentUser();
    var list = NF.state.notifications.filter(function (n) { return n.userId === u.id; });
    var unread = list.filter(function (n) { return !n.read; }).length;
    var html = NF.pageHeader('Уведомления', unread ? 'Непрочитанных: ' + unread : 'Все уведомления прочитаны',
      unread ? '<button class="btn btn-ghost" data-action="read-all-notifs">' + NF.icon('check', 16) + ' Прочитать все</button>' : '');
    if (!list.length) return html + NF.empty('bell', 'Уведомлений нет', 'Здесь появятся уведомления по вашим задачам');
    html += '<div class="panel notification-list">' + list.map(function (n) {
      var meta = NF.NOTIF_TYPES[n.type] || NF.NOTIF_TYPES.status;
      return '<div class="notification' + (n.read ? '' : ' unread') + '">' +
        '<span class="notif-icon" style="--badge:' + meta.color + '">' + NF.icon(meta.icon, 18) + '</span>' +
        '<div class="notif-body"><p>' + esc(n.text) + '</p><time>' + NF.formatDateTime(n.createdAt) + '</time></div>' +
        (n.taskId ? '<a class="notif-link" href="#/tasks/' + n.taskId + '" data-action="read-notif" data-id="' + n.id + '">' + NF.icon('chevronRight', 18) + '</a>' : '') +
        (n.read ? '' : '<button class="mini-icon" data-action="read-notif" data-id="' + n.id + '" title="Прочитать">' + NF.icon('check', 15) + '</button>') +
        '</div>';
    }).join('') + '</div>';
    return html;
  };

  /* ================= Profile ================= */
  V.profile = function () {
    var u = NF.currentUser();
    var html = NF.pageHeader('Настройки профиля', 'Управление личной информацией и предпочтениями');
    html += '<div class="profile-grid"><section class="panel"><div class="panel-head"><h2>' + NF.icon('user', 17) + ' Личные данные</h2></div>' +
      '<div class="panel-body"><div class="profile-photo-row">' + NF.avatar(u, 72) +
        '<div><label class="btn btn-ghost btn-sm photo-upload">' + NF.icon('upload', 15) + ' Загрузить фото' +
        '<input type="file" id="photo-input" accept="image/*" hidden></label><span class="muted small">JPG или PNG, до 2 МБ</span></div></div>' +
        '<form id="profile-form" class="form" onsubmit="return false"><div class="form-grid">' +
        '<div class="field"><label>Имя</label><input id="pr-first" value="' + esc(u.firstName) + '"></div>' +
        '<div class="field"><label>Фамилия</label><input id="pr-last" value="' + esc(u.lastName) + '"></div>' +
        '<div class="field field-full"><label>Должность</label><input id="pr-pos" value="' + esc(u.position) + '"></div>' +
        '<div class="field field-full"><label>Электронная почта</label><input value="' + esc(u.email) + '" disabled><span class="field-hint">Изменение почты — только администратор</span></div>' +
        '<div class="field field-full"><label>Роль</label><input value="' + NF.ROLES[u.role] + '" disabled></div>' +
        '</div><button type="button" class="btn btn-primary" data-action="save-profile">' + NF.icon('save', 16) + ' Сохранить изменения</button></form>' +
      '</div></section>' +
      '<div class="profile-side">' +
        '<section class="panel"><div class="panel-head"><h2>' + NF.icon(u.theme === 'dark' ? 'moon' : 'sun', 17) + ' Тема интерфейса</h2></div>' +
          '<div class="panel-body"><div class="theme-switch">' +
            '<button class="theme-option' + (u.theme !== 'dark' ? ' active' : '') + '" data-action="set-theme" data-theme="light">' + NF.icon('sun', 20) + '<span>Светлая</span></button>' +
            '<button class="theme-option' + (u.theme === 'dark' ? ' active' : '') + '" data-action="set-theme" data-theme="dark">' + NF.icon('moon', 20) + '<span>Тёмная</span></button>' +
          '</div></div></section>' +
        '<section class="panel"><div class="panel-head"><h2>' + NF.icon('lock', 17) + ' Пароль</h2></div>' +
          '<div class="panel-body"><p class="muted small">Для изменения пароля потребуется текущий пароль.</p>' +
          '<button class="btn btn-ghost btn-block" data-action="change-password">' + NF.icon('lock', 16) + ' Сменить пароль</button></div></section>' +
      '</div></div>';
    return html;
  };

  /* ================= Users (admin) ================= */
  V.users = function () {
    if (!NF.isAdmin()) return NF.empty('shield', 'Нет доступа', 'Раздел доступен только администратору');
    var html = NF.pageHeader('Пользователи', 'Управление сотрудниками (' + NF.state.users.length + ')',
      '<button class="btn btn-primary" data-action="new-user">' + NF.icon('userPlus', 17) + ' Добавить пользователя</button>');
    html += '<div class="panel"><div class="table-scroll"><table class="data-table"><thead><tr>' +
      '<th>Сотрудник</th><th>Должность</th><th>Email</th><th>Роль</th><th>Задач</th><th></th></tr></thead><tbody>' +
      NF.state.users.map(function (u) {
        var count = NF.userTasks(u.id).filter(function (t) { return t.status !== 'done'; }).length;
        return '<tr><td>' + NF.avatar(u, 32, true) + '</td><td>' + esc(u.position) + '</td><td>' + esc(u.email) + '</td>' +
          '<td><span class="role-chip ' + u.role + '">' + NF.ROLES[u.role] + '</span></td><td>' + count + '</td>' +
          '<td class="row-actions"><button class="mini-icon" data-action="edit-user" data-id="' + u.id + '" title="Редактировать">' + NF.icon('edit', 16) + '</button>' +
          (u.id !== (NF.currentUser() || {}).id ? '<button class="mini-icon danger" data-action="delete-user" data-id="' + u.id + '" title="Удалить">' + NF.icon('trash', 16) + '</button>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
    return html;
  };

  /* ================= Search results ================= */
  V.search = function (query) {
    var q = query.trim().toLowerCase();
    if (!q) return '';
    var projects = NF.availableProjects(NF.currentUser()).filter(function (p) { return p.name.toLowerCase().indexOf(q) !== -1; });
    var allowed = NF.availableProjects(NF.currentUser()).map(function (p) { return p.id; });
    var tasks = NF.state.tasks.filter(function (t) { return allowed.indexOf(t.projectId) !== -1 && (t.title.toLowerCase().indexOf(q) !== -1 || t.id.toLowerCase().indexOf(q) !== -1); });
    var people = NF.state.users.filter(function (u) { return NF.fullName(u).toLowerCase().indexOf(q) !== -1 || u.email.toLowerCase().indexOf(q) !== -1; });
    var total = projects.length + tasks.length + people.length;
    var html = '<div class="search-group-title">Результаты поиска: ' + total + '</div>';
    if (!total) return html + '<div class="search-empty">Ничего не найдено</div>';
    function group(title, items, render) {
      if (!items.length) return '';
      return '<div class="search-group"><div class="search-group-label">' + title + '</div>' + items.slice(0, 5).map(render).join('') + '</div>';
    }
    html += group('Проекты', projects, function (p) {
      return '<a class="search-item" href="#/projects/' + p.id + '"><span class="search-item-icon">' + NF.icon('folder', 16) + '</span><span><strong>' + esc(p.name) + '</strong><small>' + esc(NF.fullName(NF.getUser(p.managerId))) + '</small></span></a>';
    });
    html += group('Задачи', tasks, function (t) {
      return '<a class="search-item" href="#/tasks/' + t.id + '"><span class="search-item-icon">' + NF.icon('tasks', 16) + '</span><span><strong>' + esc(t.title) + '</strong><small>' + esc(t.id) + ' · ' + esc((NF.getProject(t.projectId) || {}).name || '') + '</small></span></a>';
    });
    html += group('Сотрудники', people, function (u) {
      return '<a class="search-item" href="#/team"><span class="search-item-icon">' + NF.icon('user', 16) + '</span><span><strong>' + esc(NF.fullName(u)) + '</strong><small>' + esc(u.position) + '</small></span></a>';
    });
    return html;
  };

  V.accessDenied = function () {
    return NF.pageHeader('Нет доступа') + NF.empty('shield', 'Недостаточно прав', 'У вас нет прав для просмотра этого раздела');
  };
})();
