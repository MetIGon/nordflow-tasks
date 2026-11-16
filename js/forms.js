/* ============================================================
   NordFlow Tasks — forms & mutation logic
   ============================================================ */
(function () {
  'use strict';
  var NF = window.NF;

  function esc(s) { return NF.escapeHtml(s); }
  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function checked(id) { var el = document.getElementById(id); return !!el && el.checked; }

  function options(list, getVal, getLabel, selected) {
    return list.map(function (item) {
      var v = getVal(item);
      return '<option value="' + esc(v) + '"' + (String(v) === String(selected) ? ' selected' : '') + '>' + esc(getLabel(item)) + '</option>';
    }).join('');
  }
  function userOptions(selected) {
    return options(NF.state.users, function (u) { return u.id; }, function (u) { return NF.fullName(u); }, selected);
  }
  function managerOptions(selected) {
    var list = NF.state.users.filter(function (u) { return u.role === 'admin' || u.role === 'manager'; });
    return options(list, function (u) { return u.id; }, function (u) { return NF.fullName(u) + ' · ' + NF.ROLES[u.role]; }, selected);
  }
  function statusOptions(selected) {
    return options(NF.STATUSES, function (s) { return s.id; }, function (s) { return s.name; }, selected);
  }
  function priorityOptions(selected) {
    return options(Object.keys(NF.PRIORITIES), function (k) { return k; }, function (k) { return NF.PRIORITIES[k].name; }, selected);
  }
  function projectStatusOptions(selected) {
    return options(NF.PROJECT_STATUSES, function (s) { return s.id; }, function (s) { return s.name; }, selected);
  }

  function nextTaskId() {
    var max = 100;
    NF.state.tasks.forEach(function (t) {
      var m = /NDF-(\d+)/.exec(t.id);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return 'NDF-' + (max + 1);
  }

  function readFiles(fileList, cb) {
    var files = Array.prototype.slice.call(fileList || []);
    if (!files.length) { cb([]); return; }
    var out = [];
    var left = files.length;
    files.forEach(function (f) {
      if (f.size > 2 * 1024 * 1024) {
        out.push({ name: f.name + ' (слишком большой)', type: 'file', url: '' });
        if (--left === 0) cb(out);
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        out.push({ name: f.name, type: 'file', url: reader.result });
        if (--left === 0) cb(out);
      };
      reader.onerror = function () { if (--left === 0) cb(out); };
      reader.readAsDataURL(f);
    });
  }

  /* ================= Project form ================= */
  NF.formProject = function (projectId) {
    var p = projectId ? NF.getProject(projectId) : null;
    var isEdit = !!p;
    var members = p ? p.memberIds : [];
    var memberCheckboxes = NF.state.users.map(function (u) {
      return '<label class="check-chip"><input type="checkbox" name="member" value="' + u.id + '"' +
        (members.indexOf(u.id) !== -1 ? ' checked' : '') + '><span>' + esc(NF.fullName(u)) + '</span></label>';
    }).join('');

    var body =
      '<form id="project-form" class="form">' +
        '<div class="form-grid">' +
          '<div class="field field-full"><label>Название проекта <b>*</b></label>' +
            '<input id="p-name" value="' + esc(p ? p.name : '') + '" placeholder="Например, Разработка сайта" required></div>' +
          '<div class="field field-full"><label>Описание</label>' +
            '<textarea id="p-desc" rows="3" placeholder="Краткое описание проекта">' + esc(p ? p.description : '') + '</textarea></div>' +
          '<div class="field"><label>Руководитель проекта <b>*</b></label>' +
            '<select id="p-manager">' + managerOptions(p ? p.managerId : (NF.currentUser() || {}).id) + '</select></div>' +
          '<div class="field"><label>Статус <b>*</b></label>' +
            '<select id="p-status">' + projectStatusOptions(p ? p.status : 'planning') + '</select></div>' +
          '<div class="field"><label>Дата начала</label><input type="date" id="p-start" value="' + esc(p ? p.startDate : NF.toISO()) + '"></div>' +
          '<div class="field"><label>Плановая дата завершения</label><input type="date" id="p-end" value="' + esc(p ? p.endDate : NF.addDays(30)) + '"></div>' +
          '<div class="field field-full"><label>Участники</label><div class="check-chips">' + memberCheckboxes + '</div></div>' +
          '<div class="field field-full"><label class="check-line"><input type="checkbox" id="p-allow"' + (p && p.allowEmployeeCreate ? ' checked' : '') + '> Разрешить сотрудникам создавать задачи в проекте</label></div>' +
        '</div>' +
      '</form>';
    var footer = '<button class="btn btn-ghost" data-action="close-modal">Отмена</button>' +
      '<button class="btn btn-primary" data-action="submit-project" data-id="' + (p ? p.id : '') + '">' + (isEdit ? 'Сохранить' : 'Создать проект') + '</button>';

    NF.openModal({ title: isEdit ? 'Редактировать проект' : 'Создать проект', body: body, footer: footer, size: 'lg' });
  };

  NF.submitProject = function (btn) {
    var id = btn.getAttribute('data-id');
    var name = val('p-name');
    if (!name) { NF.toast('Укажите название проекта', 'error'); return; }
    var memberIds = Array.prototype.slice.call(document.querySelectorAll('input[name="member"]:checked')).map(function (el) { return el.value; });
    var managerId = val('p-manager');
    if (memberIds.indexOf(managerId) === -1) memberIds.push(managerId);
    var data = {
      name: name, description: val('p-desc'), managerId: managerId,
      startDate: val('p-start'), endDate: val('p-end'), status: val('p-status'),
      memberIds: memberIds, allowEmployeeCreate: checked('p-allow')
    };
    if (id) {
      var p = NF.getProject(id);
      Object.keys(data).forEach(function (k) { p[k] = data[k]; });
      p.updatedAt = NF.nowISO();
      NF.toast('Проект обновлён');
    } else {
      var newId = NF.uid('p');
      NF.state.projects.push(Object.assign({
        id: newId, color: ['#2FB6DE', '#0E8C8C', '#8B5CF6', '#E8862B'][NF.state.projects.length % 4],
        createdAt: NF.nowISO(), updatedAt: NF.nowISO()
      }, data));
      NF.toast('Проект создан');
      NF.state.notifications.unshift({
        id: NF.uid('n'), userId: managerId, type: 'assigned',
        text: 'Вы назначены руководителем проекта «' + name + '»', projectId: newId,
        read: false, createdAt: NF.nowISO()
      });
      id = newId;
    }
    NF.save();
    NF.closeModal();
    if (NF.app) NF.app.go('#/projects/' + id);
  };

  /* ================= Task form ================= */
  NF.formTask = function (taskId, presetProjectId) {
    var t = taskId ? NF.getTask(taskId) : null;
    var isEdit = !!t;
    var accessible = NF.availableProjects(NF.currentUser());
    if (!isEdit && !accessible.length) { NF.toast('Нет доступных проектов', 'error'); return; }
    var projectId = t ? t.projectId : (presetProjectId || accessible[0].id);
    var attachHtml = (t && t.attachments || []).map(function (a, i) {
      return '<div class="attach-item">' + NF.icon(a.type === 'file' ? 'paperclip' : 'link', 14) +
        '<span>' + esc(a.name) + '</span><button type="button" class="mini-btn" data-action="remove-attach" data-index="' + i + '">×</button></div>';
    }).join('');

    var body =
      '<form id="task-form" class="form" onsubmit="return false">' +
        '<div class="form-grid">' +
          '<div class="field field-full"><label>Название задачи <b>*</b></label>' +
            '<input id="t-title" value="' + esc(t ? t.title : '') + '" placeholder="Краткое описание задачи" required></div>' +
          '<div class="field field-full"><label>Описание</label>' +
            '<textarea id="t-desc" rows="3" placeholder="Подробности задачи">' + esc(t ? t.description : '') + '</textarea></div>' +
          '<div class="field"><label>Проект <b>*</b></label><select id="t-project">' +
            options(accessible, function (p) { return p.id; }, function (p) { return p.name; }, projectId) + '</select></div>' +
          '<div class="field"><label>Статус <b>*</b></label><select id="t-status">' + statusOptions(t ? t.status : 'backlog') + '</select></div>' +
          '<div class="field"><label>Исполнитель <b>*</b></label><select id="t-assignee">' + userOptions(t ? t.assigneeId : '') + '</select></div>' +
          '<div class="field"><label>Постановщик</label><select id="t-reporter">' + userOptions(t ? t.reporterId : (NF.currentUser() || {}).id) + '</select></div>' +
          '<div class="field"><label>Приоритет <b>*</b></label><select id="t-priority">' + priorityOptions(t ? t.priority : 'medium') + '</select></div>' +
          '<div class="field"><label>Дедлайн</label><input type="date" id="t-due" value="' + esc(t ? t.dueDate : NF.addDays(7)) + '"></div>' +
          '<div class="field field-full"><label>Теги (через запятую)</label>' +
            '<input id="t-tags" value="' + esc(t ? (t.tags || []).join(', ') : '') + '" placeholder="frontend, дизайн, срочно"></div>' +
          '<div class="field field-full"><label>Ссылки (по одной на строку)</label>' +
            '<textarea id="t-links" rows="2" placeholder="https://…">' + esc((t && t.attachments || []).filter(function (a) { return a.type === 'link'; }).map(function (a) { return a.url; }).join('\n')) + '</textarea></div>' +
          '<div class="field field-full"><label>Файлы</label>' +
            '<input type="file" id="t-files" multiple class="file-input">' +
            '<div id="attach-list" class="attach-list">' + attachHtml + '</div></div>' +
        '</div>' +
      '</form>';
    var footer = '<button class="btn btn-ghost" data-action="close-modal">Отмена</button>' +
      '<button class="btn btn-primary" data-action="submit-task" data-id="' + (t ? t.id : '') + '">' + (isEdit ? 'Сохранить изменения' : 'Создать задачу') + '</button>';

    NF.openModal({
      title: isEdit ? 'Редактировать задачу ' + t.id : 'Новая задача',
      body: body, footer: footer, size: 'lg',
      onMount: function (root) {
        NF._formAttachments = (t && t.attachments || []).filter(function (a) { return a.type === 'file'; }).slice();
        var fileInput = root.querySelector('#t-files');
        fileInput.addEventListener('change', function () {
          readFiles(fileInput.files, function (arr) {
            NF._formAttachments = NF._formAttachments.concat(arr);
            NF.renderAttachPreview();
          });
        });
      }
    });
  };

  NF.renderAttachPreview = function () {
    var list = document.getElementById('attach-list');
    if (!list) return;
    var files = NF._formAttachments || [];
    list.innerHTML = files.map(function (a, i) {
      return '<div class="attach-item">' + NF.icon('paperclip', 14) + '<span>' + esc(a.name) + '</span>' +
        '<button type="button" class="mini-btn" data-action="remove-file-attach" data-index="' + i + '">×</button></div>';
    }).join('');
  };

  NF.submitTask = function (btn) {
    var id = btn.getAttribute('data-id');
    var title = val('t-title');
    if (!title) { NF.toast('Укажите название задачи', 'error'); return; }
    if (!val('t-assignee')) { NF.toast('Выберите исполнителя', 'error'); return; }
    var links = val('t-links').split('\n').map(function (s) { return s.trim(); }).filter(Boolean).map(function (url) {
      return { name: url.length > 42 ? url.slice(0, 42) + '…' : url, type: 'link', url: url };
    });
    var attachments = links.concat(NF._formAttachments || []);
    var oldStatus, oldDue, oldAssignee;
    var data = {
      title: title, description: val('t-desc'), projectId: val('t-project'),
      status: val('t-status'), assigneeId: val('t-assignee'), reporterId: val('t-reporter') || (NF.currentUser() || {}).id,
      priority: val('t-priority'), dueDate: val('t-due'),
      tags: val('t-tags').split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      attachments: attachments
    };

    if (id) {
      var t = NF.getTask(id);
      oldStatus = t.status; oldDue = t.dueDate; oldAssignee = t.assigneeId;
      Object.keys(data).forEach(function (k) {
        if (JSON.stringify(t[k]) !== JSON.stringify(data[k])) {
          NF.addHistory(t, 'update', k, t[k], data[k]);
        }
      });
      Object.keys(data).forEach(function (k) { t[k] = data[k]; });
      if (oldAssignee !== data.assigneeId) NF.notifyUser(data.assigneeId, 'assigned', 'Вам назначена задача ' + t.id + ' «' + t.title + '»', t.id, t.projectId);
      if (oldStatus !== data.status) NF.notifyUser(data.assigneeId, 'status', 'Статус задачи ' + t.id + ' изменён на «' + NF.statusName(data.status) + '»', t.id, t.projectId);
      if (oldDue !== data.dueDate) NF.notifyUser(data.assigneeId, 'due', 'Изменён срок задачи ' + t.id, t.id, t.projectId);
      NF.toast('Задача обновлена');
    } else {
      var newId = nextTaskId();
      var task = Object.assign({
        id: newId, createdAt: NF.nowISO(), updatedAt: NF.nowISO(), comments: [], history: []
      }, data);
      task.history.push({ id: NF.uid('h'), userId: (NF.currentUser() || {}).id, action: 'created', field: null, oldValue: null, newValue: null, createdAt: NF.nowISO() });
      NF.state.tasks.push(task);
      NF.notifyUser(data.assigneeId, 'assigned', 'Вам назначена задача ' + newId + ' «' + title + '»', newId, data.projectId);
      NF.toast('Задача создана: ' + newId);
      id = newId;
    }
    NF.save();
    NF.closeModal();
    if (NF.app) NF.app.go('#/tasks/' + id);
  };

  /* ================= Quick status change ================= */
  NF.statusName = function (id) {
    var s = NF.STATUSES.find(function (x) { return x.id === id; });
    return s ? s.name : id;
  };

  NF.quickStatus = function (taskId) {
    var t = NF.getTask(taskId);
    if (!t) return;
    if (!NF.canEditTask(t)) { NF.toast('Недостаточно прав для изменения статуса', 'error'); return; }
    var body = '<p class="muted" style="margin-bottom:14px">Выберите новый статус для задачи <b>' + esc(t.id) + '</b></p>' +
      '<div class="status-actions">' + NF.STATUSES.map(function (s) {
        return '<button class="status-action' + (s.id === t.status ? ' current' : '') + '" data-action="set-status" data-id="' + t.id + '" data-status="' + s.id + '" style="--badge:' + s.color + '">' +
          '<span class="dot"></span>' + s.name + (s.id === t.status ? NF.icon('check', 15) : '') + '</button>';
      }).join('') + '</div>';
    NF.openModal({ title: 'Изменить статус', body: body, size: 'sm', noFocus: true });
  };

  NF.setStatus = function (taskId, status) {
    var t = NF.getTask(taskId);
    if (!t || t.status === status) { NF.closeModal(); return; }
    if (!NF.canEditTask(t)) { NF.toast('Недостаточно прав', 'error'); return; }
    var old = t.status;
    NF.addHistory(t, 'status', 'status', NF.statusName(old), NF.statusName(status));
    t.status = status;
    NF.notifyUser(t.assigneeId, 'status', 'Статус задачи ' + t.id + ' изменён на «' + NF.statusName(status) + '»', t.id, t.projectId);
    NF.save();
    NF.closeModal();
    NF.toast('Статус обновлён: ' + NF.statusName(status));
    if (NF.app) NF.app.render();
  };

  /* ================= User form (admin) ================= */
  NF.formUser = function (userId) {
    var u = userId ? NF.getUser(userId) : null;
    var isEdit = !!u;
    var body =
      '<form id="user-form" class="form" onsubmit="return false"><div class="form-grid">' +
        '<div class="field"><label>Имя <b>*</b></label><input id="u-first" value="' + esc(u ? u.firstName : '') + '" required></div>' +
        '<div class="field"><label>Фамилия <b>*</b></label><input id="u-last" value="' + esc(u ? u.lastName : '') + '" required></div>' +
        '<div class="field field-full"><label>Электронная почта <b>*</b></label><input type="email" id="u-email" value="' + esc(u ? u.email : '') + '" required></div>' +
        '<div class="field"><label>Должность</label><input id="u-pos" value="' + esc(u ? u.position : '') + '" placeholder="Например, Дизайнер"></div>' +
        '<div class="field"><label>Роль <b>*</b></label><select id="u-role">' +
          Object.keys(NF.ROLES).map(function (k) { return '<option value="' + k + '"' + (u && u.role === k ? ' selected' : '') + '>' + NF.ROLES[k] + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="field field-full"><label>' + (isEdit ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль <b>*</b>') + '</label>' +
          '<input type="text" id="u-pass" value="' + (isEdit ? '' : 'demo123') + '"></div>' +
      '</div></form>';
    var footer = '<button class="btn btn-ghost" data-action="close-modal">Отмена</button>' +
      '<button class="btn btn-primary" data-action="submit-user" data-id="' + (u ? u.id : '') + '">' + (isEdit ? 'Сохранить' : 'Добавить') + '</button>';
    NF.openModal({ title: isEdit ? 'Редактировать пользователя' : 'Новый пользователь', body: body, footer: footer });
  };

  NF.submitUser = function (btn) {
    var id = btn.getAttribute('data-id');
    var email = val('u-email').toLowerCase();
    if (!val('u-first') || !val('u-last') || !email) { NF.toast('Заполните обязательные поля', 'error'); return; }
    if (NF.state.users.some(function (x) { return x.email === email && x.id !== id; })) { NF.toast('Пользователь с такой почтой уже существует', 'error'); return; }
    var data = {
      firstName: val('u-first'), lastName: val('u-last'), email: email,
      position: val('u-pos'), role: val('u-role')
    };
    if (id) {
      var u = NF.getUser(id);
      Object.keys(data).forEach(function (k) { u[k] = data[k]; });
      if (val('u-pass')) u.password = val('u-pass');
      NF.toast('Пользователь обновлён');
    } else {
      var colors = ['#0E8C8C', '#2F80D8', '#8B5CF6', '#E8862B', '#2FA36B', '#E2558A'];
      NF.state.users.push(Object.assign({
        id: NF.uid('u'), password: val('u-pass') || 'demo123',
        color: colors[NF.state.users.length % colors.length], theme: 'light', photo: null
      }, data));
      NF.toast('Пользователь добавлен');
    }
    NF.save(); NF.closeModal(); if (NF.app) NF.app.render();
  };

  /* ================= Password form ================= */
  NF.formPassword = function () {
    var body = '<form id="pass-form" class="form" onsubmit="return false">' +
      '<div class="field"><label>Текущий пароль</label><input type="password" id="pw-old"></div>' +
      '<div class="field"><label>Новый пароль</label><input type="password" id="pw-new"></div>' +
      '<div class="field"><label>Повторите новый пароль</label><input type="password" id="pw-new2"></div>' +
      '</form>';
    var footer = '<button class="btn btn-ghost" data-action="close-modal">Отмена</button>' +
      '<button class="btn btn-primary" data-action="submit-password">Сменить пароль</button>';
    NF.openModal({ title: 'Смена пароля', body: body, footer: footer, size: 'sm' });
  };

  NF.submitPassword = function () {
    var u = NF.currentUser();
    if (val('pw-old') !== u.password) { NF.toast('Неверный текущий пароль', 'error'); return; }
    if (!val('pw-new')) { NF.toast('Введите новый пароль', 'error'); return; }
    if (val('pw-new') !== val('pw-new2')) { NF.toast('Пароли не совпадают', 'error'); return; }
    u.password = val('pw-new');
    NF.save(); NF.closeModal(); NF.toast('Пароль изменён');
  };

  /* ================= Add comment ================= */
  NF.addComment = function (taskId) {
    var input = document.getElementById('comment-input');
    if (!input) return;
    var text = input.value.trim();
    if (!text) { NF.toast('Введите текст комментария', 'error'); return; }
    var t = NF.getTask(taskId);
    if (!t) return;
    t.comments.push({ id: NF.uid('c'), authorId: (NF.currentUser() || {}).id, text: text, createdAt: NF.nowISO() });
    t.updatedAt = NF.nowISO();
    // notify assignee and reporter about new comment (if not the author)
    var author = (NF.currentUser() || {}).id;
    [t.assigneeId, t.reporterId].forEach(function (uid) {
      if (uid && uid !== author) NF.notifyUser(uid, 'comment', NF.fullName(NF.currentUser()) + ' прокомментировал(а) задачу ' + t.id, t.id, t.projectId);
    });
    NF.save();
    NF.toast('Комментарий добавлен');
    if (NF.app) NF.app.render();
  };

  NF.deleteComment = function (taskId, commentId) {
    var t = NF.getTask(taskId);
    if (!t) return;
    var c = t.comments.find(function (x) { return x.id === commentId; });
    if (!c) return;
    var u = NF.currentUser();
    if (c.authorId !== u.id && u.role !== 'admin') { NF.toast('Можно удалять только свои комментарии', 'error'); return; }
    NF.confirm('Удалить комментарий?', function () {
      t.comments = t.comments.filter(function (x) { return x.id !== commentId; });
      NF.save(); NF.app.render(); NF.toast('Комментарий удалён');
    });
  };

  NF.editComment = function (taskId, commentId) {
    var t = NF.getTask(taskId);
    if (!t) return;
    var c = t.comments.find(function (x) { return x.id === commentId; });
    if (!c || c.authorId !== (NF.currentUser() || {}).id) { NF.toast('Можно редактировать только свои комментарии', 'error'); return; }
    NF.openModal({
      title: 'Редактировать комментарий', size: 'sm',
      body: '<div class="field"><label>Текст</label><textarea id="edit-comment-text" rows="4">' + esc(c.text) + '</textarea></div>',
      footer: '<button class="btn btn-ghost" data-action="close-modal">Отмена</button>' +
              '<button class="btn btn-primary" data-action="save-comment" data-id="' + taskId + '" data-cid="' + commentId + '">Сохранить</button>'
    });
  };

  NF.saveComment = function (taskId, commentId) {
    var t = NF.getTask(taskId);
    var c = t && t.comments.find(function (x) { return x.id === commentId; });
    if (!c) return;
    var text = val('edit-comment-text');
    if (!text) { NF.toast('Комментарий не может быть пустым', 'error'); return; }
    c.text = text; c.edited = true;
    NF.save(); NF.closeModal(); NF.app.render(); NF.toast('Комментарий обновлён');
  };
})();
