# Деплой NordFlow Tasks на Railway

Проект — статическое SPA (HTML + CSS + vanilla JS), база данных не нужна. Чтобы Railway мог его запустить, добавлены три файла:

| Файл | Зачем |
|---|---|
| `package.json` | Сообщает Railway, что это Node-проект, и задаёт команду `npm start` |
| `server.js` | Минимальный статический сервер без зависимостей, слушает порт `$PORT` от Railway |
| `.railwayignore` | Исключает из загрузки тяжёлый `brandbook.pptx`, `tz.txt` и чек-лист |

Никаких `npm install` не требуется — зависимостей нет.

---

## Способ 1 (рекомендуемый): GitHub + панель Railway

Так проще: не нужно ставить Node.js и CLI локально. После настройки каждый `git push` автоматически обновляет сайт.

### Шаг 1. Установите Git

Проверьте в PowerShell:

```powershell
git --version
```

Если команда не найдена — скачайте Git for Windows: https://git-scm.com/download/win и установите с настройками по умолчанию.

### Шаг 2. Создайте репозиторий на GitHub

1. Зайдите на https://github.com/new.
2. Repository name: `nordflow-tasks` (можно любое).
3. Выберите **Private** или **Public** — для деплоя подойдёт любое.
4. **Не ставьте** галочки «Add a README», «.gitignore», «license» — папка уже заполнена.
5. Нажмите **Create repository**.

### Шаг 3. Загрузите код в репозиторий

В PowerShell перейдите в папку проекта и выполните команды по очереди:

```powershell
cd "C:\Users\viksa\OneDrive\Документы\zerocode\opencode\trackers\tractest"
git init
git add .
git commit -m "Initial commit: NordFlow Tasks"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/nordflow-tasks.git
git push -u origin main
```

`ВАШ_ЛОГИН` замените на свой логин GitHub. При первом push GitHub может попросить авторизацию в браузере — это нормально.

> Если `git init` уже делался ранее, просто выполните `git add .`, `git commit -m "Deploy config"` и `git push`.

### Шаг 4. Создайте проект в Railway

1. Откройте https://railway.com и войдите (GitHub-аккаунт подойдёт).
2. Нажмите **New Project** → **Deploy from GitHub repo**.
3. Если Railway впервые запрашивает доступ к GitHub — нажмите **Configure GitHub App**, выберите репозиторий `nordflow-tasks` и подтвердите.
4. Выберите репозиторий `nordflow-tasks` → **Deploy Now**.
5. Railway определит Node.js по `package.json`, выполнит `npm install` (быстро, пакетов нет) и запустит `npm start`.
6. Дождитесь статуса **Success** во вкладке **Deployments**. Логи смотрите во вкладке **Deploy Logs**.

### Шаг 5. Выдайте публичный адрес

По умолчанию сервис доступен только внутри Railway. Нужно явно создать домен:

1. Откройте ваш сервис → вкладка **Settings**.
2. В разделе **Networking** нажмите **Generate Domain**.
3. Появится адрес вида `nordflow-tasks.up.railway.app`.
4. Откройте его в браузере — должна появиться страница входа NordFlow Tasks.

Альтернативно в настройках можно добавить свой домен: **Custom Domain** → введите `tasks.example.com` → Railway покажет DNS-записи (CNAME + TXT), которые нужно добавить у вашего DNS-провайдера.

### Шаг 6. Автообновление

После любого `git push` Railway сам пересоберёт и задеплоит проект. Проверить состояние можно во вкладке **Deployments**.

---

## Способ 2: через Railway CLI (быстрее, без GitHub)

Потребуется локально установленный Node.js — он есть в LTS-версии вместе с npm.

### Шаг 1. Установите Node.js и CLI

Скачайте Node.js LTS с https://nodejs.org и установите. Проверьте:

```powershell
node --version
npm --version
```

Установите Railway CLI:

```powershell
npm install -g @railway/cli
```

### Шаг 2. Войдите и задеплойте

```powershell
cd "C:\Users\viksa\OneDrive\Документы\zerocode\opencode\trackers\tractest"
railway login
railway init
railway up
```

- `railway login` откроет браузер для входа.
- `railway init` создаст проект и привяжет текущую папку (если проект уже есть — выберите его).
- `railway up` архивирует папку, загрузит её и запустит деплой, показывая логи.

Можно сделать всё одной командой (создаст проект из имени папки):

```powershell
railway up -y
```

### Шаг 3. Откройте доступ наружу

`railway up` **не** создаёт публичный домен автоматически. Выполните:

```powershell
railway domain
```

Команда выведет адрес вида `https://xxx.up.railway.app`. Другие полезные команды:

```powershell
railway status          # статус проекта и сервиса
railway logs            # логи работающего сервиса
railway domain list     # список доменов
railway up              # повторный деплой после изменений
```

---

## Проверка после деплоя

- [ ] Открывается страница входа, фон и логотип на месте.
- [ ] Вход: `anna.volkova@nordflow.ru` / `demo123`.
- [ ] Видны 3 проекта и 31 задача.
- [ ] Обновление страницы (F5) не разлогинивает.
- [ ] Открыть сайт с телефона — меню-гамбургер и карточки работают.
- [ ] В консоли браузера (F12 → Console) нет ошибок 404 для `css/styles.css`, `js/*.js`, `info/logo/*.png`.

---

## Частые проблемы

| Симптом | Причина и решение |
|---|---|
| `No start command could be found` | `package.json` не попал в репозиторий. Убедитесь, что он закоммичен: `git add package.json && git commit -m "add package" && git push`. Либо в Railway: Settings → Start Command → `npm start`. |
| `Application failed to respond` | Сервер не слушает нужный порт. В Railway: Settings → Start Command должен быть `npm start`; `server.js` использует `process.env.PORT`. Проверьте Deploy Logs. |
| Сайт открывается, но без стилей | В консоли 404 на `css/styles.css`. Проверьте, что папки `css`, `js`, `info` загружены (не попали в `.railwayignore`). |
| 404 при переходе по ссылке | Не создан публичный домен. Выполните **Generate Domain** в Settings или `railway domain`. |
| Белый экран | Откройте F12 → Console. Чаще всего это устаревшая версия файлов — сделайте `railway up` или `git push`. |
| Данные «пропадают» | Это нормально: трекер хранит данные в `localStorage` конкретного браузера и домена. На другом устройстве/домене — свой чистый демо-набор. Serверной БД в MVP нет. |
| Превышен лимит бесплатного плана | Railway предоставляет пробный кредит, дальше нужен платный план. Проверьте Usage в личном кабинете. |

---

## Полезно знать

- Порт задаётся Railway через переменную `PORT`; локально сервер использует 8080.
- Все пути в коде относительные (`css/...`, `js/...`, `info/logo/...`), поэтому приложение одинаково работает и из корня домена, и из локальной папки.
- Статический деплой не требует переменных окружения, базы данных и volumes.
- Если нужен свой домен: `railway domain example.com`, затем добавьте CNAME и TXT-записи, показанные CLI (распространение DNS — до 72 часов).
