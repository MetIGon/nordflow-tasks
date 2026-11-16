/* ============================================================
   NordFlow Tasks — app controller (router, events, DnD)
   ============================================================ */
(function () {
  'use strict';
  var NF = window.NF;

  var App = {
    ui: {
      my: { view: 'list', q: '', status: '', project: '', priority: '', due: '' }
    },
    activeNav: 'home',
    route: null
  };
  NF.app = App;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- Routing ---------- */
  function parseHash() {
    var raw = (location.hash || '').replace(/^#\/?/, '');
    var parts = raw.split('?');
    var seg = parts[0].split('/').filter(Boolean);
    var query = {};
    (parts[1] || '').split('&').forEach(function (kv) {
      if (!kv) return;
      var p = kv.split('=');
      query[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
    });
    return { page: seg[0] || 'home', param: seg[1] || null, query: query };
  }

  App.go = function (hash) {
    if (location.hash === hash) { App.render(); return; }
    location.hash = hash;
  };

  App.render = function () {
    var r = parseHash();
    App.route = r;
    var loggedIn = !!NF.currentUser();

    if (!loggedIn) {
      document.getElementById('app').innerHTML = NF.views.login();
      $('body').setAttribute('data-route', 'login');
      applyTheme(localStorage.getItem(NF.THEME_KEY) || 'light');
      return;
    }
    if (r.page === 'login') { App.go('#/'); return; }

    var html, nav = r.page;
    switch (r.page) {
      case 'home': html = NF.views.home(); nav = 'home'; break;
      case 'my-tasks': html = NF.views.mytasks(); nav = 'mytasks'; break;
      case 'projects': html = r.param ? NF.views.project(r.param, r.query.tab) : NF.views.projects(); nav = 'projects'; break;
      case 'tasks': html = NF.views.task(r.param); nav = r.param ? 'projects' : 'home'; break;
      case 'team': html = NF.views.team(); nav = 'team'; break;
      case 'notifications': html = NF.views.notifications(); nav = 'notifications'; break;
      case 'profile': html = NF.views.profile(); nav = 'profile'; break;
      case 'users': html = NF.views.users(); nav = 'users'; break;
      default: html = NF.views.home(); nav = 'home';
    }
    App.activeNav = nav;
    document.getElementById('app').innerHTML = NF.renderShell(nav, html);
    $('body').setAttribute('data-route', 'app');
    applyTheme((NF.currentUser() || {}).theme || 'light');
    afterRender();
  };

  App.renderContent = function (html) {
    var content = document.getElementById('content');
    if (content) { content.innerHTML = html; afterRender(); }
  };

  function afterRender() {
    updateBadges();
    if (App.route && App.route.page === 'my-tasks') {
      bindMyFilters();
      NF.views.applyMyFilters();
    }
    var photo = $('#photo-input');
    if (photo) photo.addEventListener('change', onPhotoChange);
  }

  function applyTheme(theme) {
    var value = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', value);
    try { localStorage.setItem(NF.THEME_KEY, value); } catch (e) { /* storage unavailable */ }
  }

  function updateBadges() {
    var u = NF.currentUser();
    if (!u) return;
    var unread = NF.state.notifications.filter(function (n) { return n.userId === u.id && !n.read; }).length;
    var nb = document.getElementById('nav-notif-badge');
    if (nb) { nb.textContent = unread; nb.style.display = unread ? '' : 'none'; }
    var dot = document.getElementById('topbar-notif-dot');
    if (dot) dot.style.display = unread ? '' : 'none';
  }

  /* ---------- Login / logout ---------- */
  function doLogin() {
    // Login is handled by the form submit event only. Guard against repeated calls.
    if (NF.getSession()) return;
    var email = ($('#login-email') || {}).value || '';
    var pass = ($('#login-pass') || {}).value || '';
    var u = NF.state.users.find(function (x) { return x.email.toLowerCase() === email.trim().toLowerCase(); });
    var err = document.getElementById('auth-error');
    if (!u || u.password !== pass) {
      if (err) err.textContent = 'Неверная почта или пароль. Попробуйте ещё раз.';
      return;
    }
    NF.setSession(u.id);
    applyTheme(u.theme || 'light');
    App.go('#/');
    NF.toast('Добро пожаловать, ' + u.firstName + '!');
  }
  function doLogout() {
    NF.clearSession();
    App.go('#/login');
    App.render();
  }

  /* ---------- Global search ---------- */
  function handleSearchInput(e) {
    var q = e.target.value;
    var box = document.getElementById('search-results');
    if (!box) return;
    if (!q.trim()) { box.innerHTML = ''; box.classList.remove('open'); return; }
    box.innerHTML = NF.views.search(q);
    box.classList.add('open');
  }

  /* ---------- My tasks filters ---------- */
  function bindMyFilters() {
    var q = document.getElementById('my-q');
    if (q) {
      q.oninput = function () { App.ui.my.q = q.value; NF.views.applyMyFilters(); };
    }
    $$('[data-filter]').forEach(function (sel) {
      sel.onchange = function () {
        var map = { 'my-status': 'status', 'my-project': 'project', 'my-priority': 'priority', 'my-due': 'due' };
        App.ui.my[map[sel.id]] = sel.value;
        NF.views.applyMyFilters();
      };
    });
  }

  /* ---------- Theme / profile ---------- */
  function setTheme(theme) {
    var u = NF.currentUser(); if (!u) return;
    u.theme = theme;
    NF.save(); applyTheme(theme); App.render();
    NF.toast(theme === 'dark' ? 'Тёмная тема включена' : 'Светлая тема включена');
  }
  function saveProfile() {
    var u = NF.currentUser();
    u.firstName = ($('#pr-first') || {}).value.trim() || u.firstName;
    u.lastName = ($('#pr-last') || {}).value.trim() || u.lastName;
    u.position = ($('#pr-pos') || {}).value.trim();
    NF.save(); App.render(); NF.toast('Профиль сохранён');
  }
  function onPhotoChange(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { NF.toast('Файл слишком большой (макс. 2 МБ)', 'error'); return; }
    var reader = new FileReader();
    reader.onload = function () {
      NF.currentUser().photo = reader.result;
      NF.save(); App.render(); NF.toast('Фотография обновлена');
    };
    reader.readAsDataURL(file);
  }

  /* ---------- Notifications ---------- */
  function readNotification(id, el) {
    var n = NF.state.notifications.find(function (x) { return x.id === id; });
    if (n) n.read = true;
    NF.save(); updateBadges();
    if (el) {
      var row = el.closest('.notification');
      if (row) row.classList.remove('unread');
    }
  }

  /* ---------- Drag & drop ---------- */
  function bindDragDrop() {
    document.addEventListener('dragstart', function (e) {
      var card = e.target.closest && e.target.closest('.task-card');
      if (!card) return;
      e.dataTransfer.setData('text/plain', card.getAttribute('data-task-id'));
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(function () { card.classList.add('dragging'); }, 0);
    });
    document.addEventListener('dragend', function () {
      $$('.task-card.dragging').forEach(function (c) { c.classList.remove('dragging'); });
      $$('.kanban-col.drop-target').forEach(function (c) { c.classList.remove('drop-target'); });
    });
    document.addEventListener('dragover', function (e) {
      var body = e.target.closest && e.target.closest('.kanban-col-body');
      if (!body) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      var col = body.closest('.kanban-col');
      $$('.kanban-col.drop-target').forEach(function (c) { if (c !== col) c.classList.remove('drop-target'); });
      col.classList.add('drop-target');
    });
    document.addEventListener('drop', function (e) {
      var body = e.target.closest && e.target.closest('.kanban-col-body');
      if (!body) return;
      e.preventDefault();
      var id = e.dataTransfer.getData('text/plain');
      var status = body.getAttribute('data-drop-status');
      $$('.kanban-col.drop-target').forEach(function (c) { c.classList.remove('drop-target'); });
      if (id && status) NF.setStatus(id, status);
    });
  }

  /* ---------- Global click delegation ---------- */
  function bindClicks() {
    document.addEventListener('click', function (e) {
      // close search results / user menu when clicking elsewhere
      if (!e.target.closest('#global-search')) {
        var sb = document.getElementById('search-results');
        if (sb) sb.classList.remove('open');
      }
      if (!e.target.closest('#user-menu') && !e.target.closest('[data-action="user-menu"]')) {
        var um = document.getElementById('user-menu');
        if (um) um.classList.remove('open');
      }

      var el = e.target.closest('[data-action]');
      if (!el) return;
      var action = el.getAttribute('data-action');
      var id = el.getAttribute('data-id');

      switch (action) {
        case 'login': doLogin(); break;
        case 'toggle-pass': {
          var input = document.getElementById('login-pass');
          if (input) {
            var show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            el.innerHTML = NF.icon(show ? 'eyeoff' : 'eye', 18);
          }
          break;
        }
        case 'logout': doLogout(); break;
        case 'toggle-sidebar': document.querySelector('.app-shell').classList.toggle('sidebar-open'); break;
        case 'close-sidebar': document.querySelector('.app-shell').classList.remove('sidebar-open'); break;
        case 'goto': App.go(el.getAttribute('data-hash')); break;
        case 'user-menu': toggleUserMenu(el); break;
        case 'close-modal': NF.closeModal(); break;
        case 'confirm-yes': {
          var cb = NF._confirmCallback;
          NF.closeModal();
          if (typeof cb === 'function') cb();
          break;
        }
        case 'new-project': NF.formProject(); break;
        case 'edit-project': NF.formProject(id); break;
        case 'submit-project': NF.submitProject(el); break;
        case 'new-task': NF.formTask(null, el.getAttribute('data-project')); break;
        case 'edit-task': NF.formTask(id); break;
        case 'submit-task': NF.submitTask(el); break;
        case 'quick-status': NF.quickStatus(id); break;
        case 'task-quick-menu': e.stopPropagation(); NF.quickStatus(id); break;
        case 'set-status': NF.setStatus(id, el.getAttribute('data-status')); break;
        case 'open-task': App.go('#/tasks/' + (id || el.getAttribute('data-task-id'))); break;
        case 'my-view':
          App.ui.my.view = el.getAttribute('data-view');
          App.renderContent(NF.views.mytasks());
          break;
        case 'reset-my-filters':
          App.ui.my = { view: App.ui.my.view, q: '', status: '', project: '', priority: '', due: '' };
          App.renderContent(NF.views.mytasks());
          break;
        case 'project-tab': App.go('#/projects/' + id + '?tab=' + el.getAttribute('data-tab')); break;
        case 'board-jump': {
          var col = document.getElementById('col-' + el.getAttribute('data-status'));
          if (col) col.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
          break;
        }
        case 'member-tasks': NF.views.memberTasksModal(id, el.getAttribute('data-project')); break;
        case 'add-comment': NF.addComment(id); break;
        case 'edit-comment': NF.editComment(id, el.getAttribute('data-cid')); break;
        case 'save-comment': NF.saveComment(id, el.getAttribute('data-cid')); break;
        case 'delete-comment': NF.deleteComment(id, el.getAttribute('data-cid')); break;
        case 'read-notif': readNotification(id, el); break;
        case 'read-all-notifs':
          NF.state.notifications.forEach(function (n) { if (n.userId === (NF.currentUser() || {}).id) n.read = true; });
          NF.save(); App.render(); NF.toast('Все уведомления прочитаны');
          break;
        case 'set-theme': setTheme(el.getAttribute('data-theme')); break;
        case 'change-password': NF.formPassword(); break;
        case 'submit-password': NF.submitPassword(); break;
        case 'save-profile': saveProfile(); break;
        case 'new-user': NF.formUser(); break;
        case 'edit-user': NF.formUser(id); break;
        case 'submit-user': NF.submitUser(el); break;
        case 'delete-user': deleteUser(id); break;
        case 'remove-attach': {
          // remove link attachment preview from form
          var item = el.closest('.attach-item');
          if (item) item.remove();
          break;
        }
        case 'remove-file-attach': {
          var idx = parseInt(el.getAttribute('data-index'), 10);
          if (NF._formAttachments) NF._formAttachments.splice(idx, 1);
          NF.renderAttachPreview();
          break;
        }
      }
    });
  }

  function toggleUserMenu(anchor) {
    var menu = document.getElementById('user-menu');
    if (!menu) return;
    if (menu.classList.contains('open')) { menu.classList.remove('open'); return; }
    var u = NF.currentUser();
    menu.innerHTML =
      '<div class="user-menu-head">' + NF.avatar(u, 36) + '<div><strong>' + NF.escapeHtml(NF.fullName(u)) + '</strong><span>' + NF.escapeHtml(u.email) + '</span></div></div>' +
      '<a class="user-menu-item" href="#/profile">' + NF.icon('settings', 16) + ' Настройки профиля</a>' +
      '<button class="user-menu-item" data-action="set-theme" data-theme="' + (u.theme === 'dark' ? 'light' : 'dark') + '">' +
        NF.icon(u.theme === 'dark' ? 'sun' : 'moon', 16) + (u.theme === 'dark' ? ' Светлая тема' : ' Тёмная тема') + '</button>' +
      '<button class="user-menu-item danger" data-action="logout">' + NF.icon('logout', 16) + ' Выйти</button>';
    menu.classList.add('open');
  }

  function deleteUser(id) {
    var u = NF.getUser(id);
    if (!u) return;
    NF.confirm('Удалить пользователя «' + NF.fullName(u) + '»? Его задачи будут переданы вам.', function () {
      var me = NF.currentUser();
      NF.state.tasks.forEach(function (t) {
        if (t.assigneeId === id) t.assigneeId = me.id;
        if (t.reporterId === id) t.reporterId = me.id;
      });
      NF.state.projects.forEach(function (p) {
        p.memberIds = p.memberIds.filter(function (m) { return m !== id; });
        if (p.managerId === id) p.managerId = me.id;
      });
      NF.state.notifications = NF.state.notifications.filter(function (n) { return n.userId !== id; });
      NF.state.users = NF.state.users.filter(function (x) { return x.id !== id; });
      NF.save(); App.render(); NF.toast('Пользователь удалён');
    }, 'Удалить');
  }

  /* ---------- Misc bindings ---------- */
  function bindGlobal() {
    document.addEventListener('submit', function (e) {
      if (e.target.id === 'login-form') { e.preventDefault(); doLogin(); }
    });
    document.addEventListener('input', function (e) {
      if (e.target.id === 'search-input') handleSearchInput(e);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        NF.closeModal();
        var um = document.getElementById('user-menu'); if (um) um.classList.remove('open');
        var sb = document.getElementById('search-results'); if (sb) sb.classList.remove('open');
        var sh = document.querySelector('.app-shell'); if (sh) sh.classList.remove('sidebar-open');
      }
      // Enter on the login form is processed natively via the submit event.
    });
    window.addEventListener('hashchange', function () { App.render(); });
  }

  /* ---------- Init ---------- */
  function init() {
    // Drop legacy storage so demo data always starts from the original seed.
    try { localStorage.removeItem('nordflow_tasks_state_v1'); } catch (e) { /* ignore */ }
    applyTheme(localStorage.getItem(NF.THEME_KEY) || 'light');

    bindGlobal();
    bindClicks();
    bindDragDrop();
    NF.checkDeadlines();

    var loggedIn = !!NF.currentUser();
    var isLogin = (location.hash || '') === '#/login';
    if (!loggedIn && !isLogin) { location.hash = '#/login'; }
    else if (loggedIn && (isLogin || !location.hash)) { location.hash = '#/'; }
    App.render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
