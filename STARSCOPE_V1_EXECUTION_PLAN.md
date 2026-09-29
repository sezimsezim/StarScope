# StarScope V1.0 — пошаговый план выполнения

Этот документ превращает аудит «StarScope: аудит, V1 и план развития» в инструкцию, по которой можно работать шаг за шагом. Аудит остаётся источником истины. Здесь ничего не перепроектируется, React не добавляется, новых фич нет.

Как пользоваться:
1. Иди по шагам строго по порядку (раздел 3).
2. Для каждого шага копируй готовый промпт из раздела 5 в своего AI-ассистента.
3. После ответа AI проверяй результат по пункту «Что я должен увидеть».
4. Делай коммит с готовым сообщением из шага.
5. Записывай одну строку в DEVLOG.

---

## 1. Объясняю твой проект простым языком

### Что такое StarScope

StarScope — это сайт из двух страниц:
- **`index.html` (лендинг)** — стартовая страница: тёмное небо с мерцающими звёздами, заголовок STARSCOPE, поле поиска и несколько кликабельных звёзд с инфо-панелью и звуком.
- **`explore.html` (обсерватория)** — страница с большой HUD-карточкой одной звезды: картинка звезды, имя, температура, расстояние и поиск по каталогу.

Идея в том, что это не «космический сайт для красоты», а интерфейс к **настоящим научным данным** телескопа Gaia.

### Словарь: термины, которые тебе реально нужны

| Термин | Что это простыми словами |
|---|---|
| **Gaia DR3** | Огромная официальная таблица Европейского космического агентства: измерения почти 2 миллиардов звёзд. «DR3» = «третий выпуск данных» |
| **source_id** | Номер звезды в таблице Gaia, как номер паспорта. Например, у Проксимы Центавра `5853498713190525696`. Если номера нет в Gaia, значит этой записи в Gaia не существует |
| **parallax (параллакс)** | Насколько звезда «сдвигается» на небе, когда Земля проходит по орбите. Чем ближе звезда, тем больше сдвиг. Gaia измеряет его в mas (миллисекундах дуги) |
| **distance = 1000 / parallax** | Расстояние в парсеках. Gaia его не измеряет напрямую — это **вычисленное** (derived) значение |
| **Teff (teff_gspphot)** | Температура поверхности звезды в кельвинах, которую Gaia оценила по цвету звезды. Иногда Gaia её не даёт, тогда значение пустое (NULL) |
| **G mag** | Яркость звезды в фильтре Gaia. Чем меньше число, тем ярче звезда |
| **NULL / null** | «Значения нет». Правильно показать «—», а не придумать число |
| **ADQL** | Язык запросов к таблице Gaia, почти как SQL. Например: «дай мне звёзды с параллаксом больше 200» |
| **TAP** | «Дверь» в архив Gaia, через которую программа отправляет ADQL-запрос и получает таблицу |
| **Пайплайн (`fetch_gaia_stars.py`)** | Python-скрипт-«завод»: сходил в Gaia, забрал звёзды, посчитал расстояния, сохранил в файл JSON |
| **JSON** | Текстовый файл с данными в формате, который JavaScript читает напрямую |
| **Каталог** | Твой JSON-файл со списком звёзд, которые показывает сайт |
| **`gaia-adapter.js`** | Переводчик между данными Gaia и интерфейсом StarScope: загружает JSON и превращает сырые поля (`parallax`, `temperature`) в готовые строки для экрана («4.25 LY», «2,829 K») |
| **Нормализация** | Та самая работа переводчика: привести сырые данные к одному удобному виду |
| **ES-модуль** | JS-файл, который может «одолжить» функции у другого файла через `import`/`export`. Важно: если в модуле ошибка в написании кода, **весь** скрипт, который его импортирует, не запускается |
| **SyntaxError (синтаксическая ошибка)** | Опечатка, из-за которой браузер не может даже прочитать код (например, `eturn` вместо `return`) |
| **Vite** | Программа-помощник: (1) запускает твой сайт на компьютере по адресу `localhost` (dev-сервер), (2) собирает готовую версию для интернета (build) |
| **dev-сервер** | Локальный «мини-интернет» на твоём компьютере. Нужен, потому что браузер не даёт загружать JSON со страницы, открытой двойным кликом (`file://`) |
| **build / сборка** | Vite упаковывает сайт в папку `dist/`, которую потом выкладывают в интернет |
| **`public/`** | Специальная папка Vite: всё, что в ней лежит, копируется в сборку как есть. Туда кладём JSON |
| **package.json** | Список программ-библиотек, которые нужны проекту, плюс команды (`npm run dev`) |
| **Зависимости** | Эти самые библиотеки. Сейчас там лежит лишний React-шаблон из AI Studio |
| **Мёртвый файл** | Файл, который ни одна страница не использует |
| **Дубликат** | Две разные версии одного и того же кода. Опасны: ты правишь одну, а работает другая |
| **Источник истины** | Та одна версия, которая считается правильной. Все остальные удаляются |
| **Рефакторинг** | Переложить код по-другому, **не меняя** того, что видит пользователь |
| **Unit-тест** | Маленькая программа, которая автоматически проверяет функцию: «на вход "gj 551" → на выходе Проксима» |
| **Коммит** | Сохранённая точка в истории Git с описанием, что изменилось |
| **Тег** | Имя для важного коммита, например `v1.0.0` |
| **GitHub Pages** | Бесплатный хостинг сайтов от GitHub |
| **GitHub Actions (CI/CD)** | Робот GitHub, который после каждого `git push` сам собирает сайт и выкладывает его |
| **a11y (accessibility, доступность)** | Чтобы сайтом можно было пользоваться с клавиатуры, со скринридера, при плохом зрении |
| **ARIA** | Специальные атрибуты в HTML (`aria-label`, `aria-expanded`), которые объясняют скринридеру, что это за элемент |
| **Responsive / адаптив** | Сайт нормально выглядит и на телефоне, и на мониторе |
| **Deep-link** | Ссылка, которая открывает сразу нужную звезду: `explore.html?star=barnards-star` |
| **Derived (вычисленное)** | Значение, которое посчитал StarScope, а не измерила Gaia. Его нужно помечать |

### Что уже работает

- **Лендинг** полностью живой: фон со звёздами (`main.js`), эффект «перебора символов» в телеметрии, звук, клик по звезде открывает инфо-панель.
- **Дизайн обсерватории** (`explore.css`) — сильная визуальная база.
- **Логика explore-страницы** (inline-скрипт внутри `explore.html`) в целом написана правильно: поиск, выбор звезды, обработка `?q=`.
- **Python-пайплайн `fetch_gaia_stars.py`** — лучший файл проекта. Его запрос к Gaia проверен и работает.
- **`gaia-stars-v1.json`** — настоящие данные Gaia: все 14 звёзд совпадают с архивом.

### Что сейчас сломано

1. **Explore молчит.** В `gaia-adapter.js` написано `eturn` вместо `return` и не хватает `}`. Браузер не может прочитать файл, поэтому весь скрипт explore не запускается. Ты видишь только Canopus, вписанный прямо в HTML, и пустой поиск.
2. **Каталог v2 не настоящий.** `gaia-stars-v2.json` (его загружает explore) почти целиком не из Gaia: 15 из 20 номеров `source_id` в Gaia просто не существуют, у остальных цифры не совпадают.
3. **Выдуманные числа в интерфейсе.** Масса и светимость (M☉, L☉) назначаются «на глаз» по температуре: у всех красных карликов одинаковые цифры.
4. **Пайплайн и адаптер «говорят на разных языках».** Скрипт пишет поле `dist_pc`, адаптер ищет `distance_pc` и, не найдя, молча ставит всем звёздам 10 световых лет.
5. **Много мусора.** 14 мёртвых или дублирующих файлов, например `уууууууууууууу.html`, `scratch.js`, старый `explore.js` и три разные версии функции, выбирающей цвет звезды.
6. **Сборка для интернета сломана.** В `package.json` лежит React-шаблон, который не используется, а `main.js` и JSON не попадут в папку сборки.

### Каким должен быть поток данных

```
Архив Gaia DR3 (ESA)
      │  ADQL-запрос через TAP
      ▼
fetch_gaia_stars.py            ← «завод»: забирает и считает расстояния
      │  пишет файл
      ▼
public/data/gaia-stars.json    ← ЕДИНСТВЕННЫЙ каталог (источник истины)
      │                        ← verify_catalog.py проверяет его по Gaia
      ▼
gaia-adapter.js                ← «переводчик»: сырые поля → текст для экрана
      │
      ├──► explore.html / explore-main.js   (HUD + поиск)
      └──► index.html / main.js             (featured-звёзды на лендинге)
```

Главное правило: **данные создаёт только пайплайн. Ни ты, ни AI не пишете звёзды в JSON руками.**

### Что значит V1

**StarScope V1.0 «Honest Gaia Explorer»** — сайт в интернете, где можно найти и рассмотреть каждую звезду небольшого (около 25 звёзд) проверенного каталога Gaia DR3, и каждое число на экране либо взято из Gaia, либо помечено как вычисленное.

### Почему НЕ надо начинать новый проект сейчас

- Сложная часть (данные, поиск, деплой) — это ровно то, что делает тебя разработчиком. В новом проекте ты упрёшься в те же задачи, только без готового дизайна.
- Проблемы StarScope решаются за часы, а не за месяцы: удалить мусор — 1 час, починить адаптер — 1,5 часа.
- Проект с реальным научным архивом и проверкой данных редко встречается в портфолио начинающих. Это твоё преимущество.
- Правило: **сначала V1 в интернете, потом любые новые идеи.**

---

## 2. План V1 человеческим языком

У каждой задачи: что это значит, зачем, что ты делаешь, какие файлы, какой результат, сколько времени, чему научишься.

**T1. Снимок проекта (Git checkpoint)**
- Что это: сохранить текущее состояние в Git, чтобы всегда можно было вернуться.
- Зачем: дальше мы удаляем файлы. Если что-то сломается, откатишься за секунду.
- Что ты делаешь: 4 команды в терминале.
- Файлы: все, `.gitignore`.
- Результат: на GitHub появился тег `v0.1-prototype`.
- Время: 20–30 мин. Научишься: коммиты, теги, `.gitignore`.

**T2. Починить переводчик `gaia-adapter.js`**
- Что это: исправить опечатку и скобку, из-за которых explore не работает, и убрать запасной список выдуманных звёзд.
- Зачем: без этого explore не видит ни одной звезды.
- Что ты делаешь: даёшь AI промпт A, проверяешь в браузере.
- Файлы: `gaia-adapter.js`.
- Результат: в поиске на explore появился список звёзд, в консоли браузера нет красных ошибок.
- Время: 1–1,5 ч. Научишься: читать ошибки в консоли, как ломается модуль.

**T3. Проверить каталоги по Gaia и переключиться на честный v1**
- Что это: запустить скрипт-проверку, увидеть, что v2 фальшивый, а v1 настоящий, и подключить v1.
- Зачем: сразу перестать показывать выдуманные звёзды.
- Файлы: `scripts/verify_catalog.py` (из kit), `explore.html` (одна строка).
- Результат: скрипт показывает v2 → 0/20, v1 → 14/14; explore показывает 14 настоящих звёзд.
- Время: 45 мин. Научишься: как проверять данные, а не верить им.

**T4. Удалить мёртвые файлы**
- Что это: убрать 14+ файлов, которые никто не использует.
- Зачем: чтобы ты и AI больше не путали, какой файл настоящий.
- Файлы: см. промпт B.
- Результат: в папке только нужные файлы, сайт работает как раньше.
- Время: 45–60 мин. Научишься: проверять, используется ли файл (`git grep`).

**T5. Почистить зависимости и настроить сборку**
- Что это: убрать React-шаблон, оставить только Vite, положить JSON в `public/data/`, починить подключение `main.js`.
- Зачем: иначе сайт нельзя выложить в интернет.
- Файлы: `package.json`, `package-lock.json`, `vite.config.ts`, `index.html`, `explore.html`, `main.tsx`, `ts.config.json`.
- Результат: `npm run build` создаёт папку `dist/`, и `npm run preview` показывает рабочий сайт.
- Время: 1,5–2 ч. Научишься: что такое сборка и зачем `public/`.

**T6. Починить кодировку (кракозябры)**
- Что это: убрать «вЂ”» и «Mв‰» вместо «—» и «M☉».
- Зачем: выглядит как сломанный сайт.
- Результат: все символы отображаются правильно.
- Время: 30–45 мин. Научишься: что такое UTF-8.

**T7. Пересобрать настоящий каталог через пайплайн**
- Что это: научить `fetch_gaia_stars.py` писать правильные поля, брать ближайшие звёзды и твой список «интересных», и сохранять в `public/data/gaia-stars.json`.
- Зачем: это сердце V1: каталог создаётся из Gaia программой, а не руками.
- Файлы: `fetch_gaia_stars.py`, новый `requirements.txt`, `public/data/gaia-stars.json`.
- Результат: около 25 звёзд, все проходят `verify_catalog.py`.
- Время: 3–4 ч. Научишься: ADQL-запросы, работа с пустыми значениями, запуск Python-скрипта.

**T8. Честный HUD**
- Что это: убрать из карточки звезды выдуманные массу/светимость/класс, показать только то, что есть в Gaia.
- Зачем: главный смысл V1 — «никаких фальшивых чисел».
- Файлы: `gaia-adapter.js`, `explore.html`.
- Результат: на карточке Teff, расстояние (помечено «вычислено»), параллакс, G mag, источник. Нет данных — «—».
- Время: 2–2,5 ч. Научишься: различать измерение и вычисление.

**T9. Вынести JS из `explore.html` в отдельный файл**
- Что это: перенести 200+ строк скрипта из HTML в `explore-main.js`, **ничего не меняя** в поведении.
- Зачем: код в отдельном файле легче читать, проверять и тестировать.
- Результат: сайт работает точно так же, в `explore.html` одна строка `<script>`.
- Время: 1,5–2 ч. Научишься: рефакторинг «без изменения поведения».

**T10. Умный поиск**
- Что это: поиск, который понимает «gj 551», «barnards», «61 cyg», номер Gaia, и сначала показывает точное совпадение.
- Файлы: новый `search.js`, `explore-main.js`.
- Результат: нужная звезда всегда первая.
- Время: 2 ч. Научишься: чистые функции (функции без HTML, которые легко проверять).

**T11. Тесты**
- Что это: автоматическая проверка поиска и переводчика одной командой `npm test`.
- Зачем: следующие правки AI не сломают поиск незаметно.
- Файлы: `tests/*.test.js`, `package.json`.
- Результат: `npm test` пишет `pass`.
- Время: 1,5–2 ч. Научишься: писать и читать тесты.

**T12. Клавиатура в поиске**
- Что это: Enter выбирает звезду, стрелки двигаются по списку, Esc закрывает.
- Время: 1,5–2 ч. Научишься: события клавиатуры, фокус.

**T13. Ссылки на звёзды**
- Что это: адрес `explore.html?star=barnards-star` открывает нужную звезду, а при выборе звезды адрес в браузере меняется.
- Время: 1–1,5 ч. Научишься: параметры URL, `history.replaceState`.

**T14. Связать лендинг с каталогом**
- Что это: звёзды на лендинге берутся из того же JSON, есть кнопка «OPEN IN EXPLORER», звук выключен по умолчанию.
- Файлы: `main.js`, `index.html`.
- Время: 2,5–3 ч. Научишься: переиспользовать один модуль на двух страницах.

**T15. Телефон и доступность**
- Что это: сайт удобен на телефоне и с клавиатуры, шрифты не мельче 11px, анимации отключаются для тех, кому они мешают.
- Файлы: `explore.css`, `index.html`, `main.js`.
- Результат: Lighthouse Accessibility ≥ 90, на ширине 360px ничего не налезает.
- Время: 3–4 ч. Научишься: DevTools, Lighthouse, адаптив.

**T16. Выложить на GitHub Pages**
- Что это: GitHub сам собирает и публикует сайт после каждого `git push`.
- Файлы: `.github/workflows/deploy.yml`.
- Результат: публичная ссылка вида `https://<твой-логин>.github.io/<repo>/`.
- Время: 1,5–2 ч. Научишься: CI/CD.

**T17. Документация и релиз**
- Что это: README (что это и как запустить), DATA.md (откуда данные), CHANGELOG (что изменилось), тег `v1.0.0`.
- Время: 2–3 ч. Научишься: объяснять свой проект другим.

**Итого до V1.0: примерно 32–42 часа.**

---

## 3. Точный порядок работы

Предполагается Windows + VS Code + терминал в VS Code (PowerShell или Git Bash). Все команды выполняются в корне проекта StarScope.

### STEP 0 — Подготовка

- **Task:** подготовить рабочее место и увидеть текущую поломку своими глазами.
- **Simple explanation:** прежде чем чинить, нужно увидеть, что сломано.
- **Files:** ничего не меняем.
- **What I do:**
  1. Открой папку StarScope в VS Code.
  2. Распакуй `starscope-v1-kit.zip` **в отдельную папку вне проекта**, например `Documents/starscope-kit/`.
  3. Скопируй в проект **только** `scripts/verify_catalog.py` → `StarScope/scripts/verify_catalog.py`. Папки `reference/` и `tests/` пока не копируй: `reference/` никогда не попадает в репозиторий (иначе будет дубликат), тесты скопируем в STEP 11.
  4. Проверь версии: `node -v` (нужно 20.19+ или 22+), `python --version` (3.10+), `git --version`.
- **What I ask my coding AI:** ничего.
- **What command I run:** `npm install`, затем `npm run dev`.
- **What I should see:** в терминале адрес вроде `http://localhost:3000`. Открой `http://localhost:3000/explore.html`, нажми F12 → вкладка Console. Должна быть красная ошибка `SyntaxError` про `gaia-adapter.js`. Это подтверждение поломки.
- **Definition of done:** ты увидел ошибку своими глазами.
- **Commit:** нет.
- **DEVLOG entry:** «Сессия 1: запустил проект, увидел SyntaxError в gaia-adapter.js».
- **Estimated time:** 20–30 мин.

### STEP 1 — Git checkpoint

- **Task:** T1.
- **Simple explanation:** сохраняемся перед «боссом».
- **Files:** `.gitignore`.
- **What I do:** открой `.gitignore` (если его нет, создай) и убедись, что там есть:
  ```
  node_modules/
  dist/
  .env
  .env.*
  __pycache__/
  ```
- **What I ask my coding AI:** ничего.
- **What command I run:**
  ```bash
  git status
  git log --all --oneline -- .env
  git add -A
  git commit -m "chore: snapshot prototype before V1 cleanup"
  git tag v0.1-prototype
  git push
  git push origin v0.1-prototype
  ```
  Если `git log --all -- .env` что-то показал, значит файл с ключами когда-то попал в историю: зайди в Google AI Studio и **отзови/смени ключ**, прежде чем идти дальше.
- **What I should see:** на GitHub во вкладке Tags есть `v0.1-prototype`.
- **Definition of done:** тег на GitHub, `.env` не в истории.
- **Commit:** `chore: snapshot prototype before V1 cleanup`
- **DEVLOG entry:** «Зафиксировал прототип как v0.1-prototype перед чисткой».
- **Estimated time:** 20 мин.

### STEP 2 — Починить `gaia-adapter.js`

- **Task:** T2.
- **Simple explanation:** исправляем опечатку, из-за которой explore молчит.
- **Files:** `gaia-adapter.js` (меняем), `explore.html` (только читаем).
- **What I do:**
  1. Сначала сам найди в `gaia-adapter.js` строку `eturn rawList.map` и посмотри на `if` выше: где у него закрывающая `}`? Попробуй понять проблему сам 10 минут.
  2. Потом дай AI промпт A.
- **What I ask my coding AI:** **Промпт A**.
- **What command I run:** `npm run dev` (если не запущен) → обнови `http://localhost:3000/explore.html` с Ctrl+F5.
- **What I should see:**
  - нет красных ошибок в Console;
  - кнопка SEARCH TARGET открывает список звёзд (пока из v2, это нормально);
  - при выборе звезды карточка меняется.
  - Проверка ошибки: временно переименуй `gaia-stars-v2.json` → `x.json`, обнови страницу: должно появиться `CATALOG UNAVAILABLE — CHECK CONSOLE`. Верни имя обратно.
- **Definition of done:** данные грузятся; при отсутствии файла показывается понятная ошибка; нет выдуманных запасных звёзд.
- **Commit:** `fix(adapter): repair syntax error so explore can load the catalog`
- **DEVLOG entry:** «Почему explore молчал» (см. раздел 7).
- **Estimated time:** 1–1,5 ч.

### STEP 3 — Проверить каталоги и переключиться на v1

- **Task:** T3.
- **Simple explanation:** проверяем, какой каталог настоящий, и подключаем его.
- **Files:** `scripts/verify_catalog.py`, `explore.html` (одна строка).
- **What I do:** запусти проверку (команды ниже), потом дай AI **промпт E** (разбор вывода), затем в `explore.html` поменяй одну строку:
  ```js
  stars = await loadGaiaStars("./gaia-stars-v1.json");
  ```
- **What command I run:**
  ```bash
  python scripts/verify_catalog.py gaia-stars-v2.json
  python scripts/verify_catalog.py gaia-stars-v1.json
  ```
- **What I should see:** v2 → `0/20 stars verified`, v1 → `14/14 stars verified`. На explore 14 звёзд с правильными расстояниями (Проксима ≈ 4.25 LY, не 10 LY).
- **Definition of done:** explore показывает только настоящие звёзды v1.
- **Commit:** `data: switch explore to verified v1 Gaia catalog` (+ `scripts/verify_catalog.py` в том же коммите — скрипт и есть причина переключения).

  Точнее, два коммита:
  1. `test(data): add verify_catalog.py to check catalog against Gaia DR3` (только скрипт);
  2. `data: switch explore to verified v1 Gaia catalog` (только `explore.html`).
- **DEVLOG entry:** «Мой v2-каталог оказался не данными Gaia».
- **Estimated time:** 45 мин.

Важно: масса и светимость на карточке всё ещё выдуманы. Их уберём в STEP 9. Пока не трогай.

### STEP 4 — Удалить мёртвые файлы

- **Task:** T4.
- **Files:** `const starData = [.ts`, `explore.js` (все копии), `gaia-api.js`, `radar.js`, `fallback_gaia_stars.js`, `Untitled-1.html`, `уууууууууууууу.html`, `scratch.js`, `style.css`, лишняя вторая `explore.css`, `stars.json`, `featured.json`, `gaia-stars-v2.json`.
- **What I ask my coding AI:** **Промпт B**. AI сначала покажет список, ты подтверждаешь, потом он удаляет.
- **What command I run:**
  ```bash
  git ls-files
  git grep -n "explore.js"
  git grep -n "style.css"
  npm run dev
  ```
- **What I should see:** обе страницы работают как до удаления.
- **Definition of done:** в корне остались только `index.html`, `explore.html`, `explore.css`, `main.js`, `gaia-adapter.js`, `fetch_gaia_stars.py`, `gaia-stars-v1.json`, `package.json`, `package-lock.json`, `vite.config.ts`, `main.tsx`, `ts.config.json` (последние два удалим в STEP 5), `scripts/`, `.gitignore`.
- **Commit:** `chore: remove dead prototype files` (один коммит, в описании список файлов).
- **DEVLOG entry:** «Уборка: 14 файлов, три версии одной функции».
- **Estimated time:** 45–60 мин.

### STEP 5 — Зависимости и сборка

- **Task:** T5.
- **Files:** `package.json`, `package-lock.json`, `vite.config.ts`, `index.html`, `explore.html`, `main.tsx`, `ts.config.json`, новая папка `public/data/`.
- **What I ask my coding AI:** **Промпт C**.
- **What command I run:**
  ```bash
  npm run dev
  npm run build
  npm run preview
  ```
- **What I should see:**
  - `npm run build` без ошибок; в `dist/` есть `index.html`, `explore.html`, папка `assets/` и `dist/data/gaia-stars-v1.json`;
  - `npm run preview` → `http://localhost:4173/` и `http://localhost:4173/explore.html` работают: фон мерцает, звёзды в поиске есть.
- **Definition of done:** сайт работает и в dev-режиме, и из собранной версии.
- **Commit:** два коммита:
  1. `build: remove unused React/AI Studio template dependencies` (`package.json`, `package-lock.json`, `vite.config.ts`, удаление `main.tsx`, `ts.config.json`);
  2. `build: fix production bundle (module script, public data folder)` (`index.html`, `explore.html`, перенос JSON в `public/data/`).
- **DEVLOG entry:** «Моя первая успешная production-сборка».
- **Estimated time:** 1,5–2 ч.

### STEP 6 — Кодировка UTF-8

- **Task:** T6.
- **What I do:** открой обе страницы. Если в заголовке вкладки или на странице есть «вЂ»», «Mв‰», «В°», «Г¶», дай AI **промпт C2**. Если всё отображается правильно, пропусти шаг и запиши это в DEVLOG.
- **What command I run:** `git grep -n "вЂ"` и `git grep -n "Г¶"`.
- **What I should see:** обе команды ничего не находят.
- **Commit:** `fix: re-save source files as UTF-8`
- **Estimated time:** 30–45 мин.

### STEP 7 — Настоящий каталог из пайплайна

- **Task:** T7.
- **Files:** `fetch_gaia_stars.py`, новый `requirements.txt`.
- **What I ask my coding AI:** **Промпт D**.
- **What command I run:**
  ```bash
  python -m pip install -r requirements.txt
  python fetch_gaia_stars.py
  ```
- **What I should see:** в терминале таблица примерно из 25 звёзд; появился файл `public/data/gaia-stars.json`.
- **Personally check in SIMBAD:** открой [SIMBAD](https://simbad.cds.unistra.fr/simbad/), введи `Gaia DR3 762815470562110464` и проверь, что это Lalande 21185. Проверь так 5–6 звёзд из таблицы имён в промпте D. Это настоящая исследовательская работа, не пропускай её.
- **Definition of done:** скрипт отработал без ошибок, JSON создан.
- **Commit:** `data(pipeline): emit distance_* fields, add curated IDs and quality columns` (только `fetch_gaia_stars.py` и `requirements.txt`, **без** JSON).
- **DEVLOG entry:** «Мой первый настоящий каталог Gaia».
- **Estimated time:** 3–4 ч.

### STEP 8 — Проверить новый каталог и переключиться

- **Task:** T3 для нового каталога.
- **What I ask my coding AI:** **Промпт E** (с новым файлом).
- **What command I run:** `python scripts/verify_catalog.py public/data/gaia-stars.json`
- **What I should see:** `25/25 stars verified against Gaia DR3` (или сколько звёзд получилось; главное — все).
- **What I do then:** в `explore.html` путь → `"./data/gaia-stars.json"`; удали `public/data/gaia-stars-v1.json` и `gaia-stars-v1.json` (`git rm`). Проверь explore.
- **Commit:** `data: regenerate catalog from Gaia DR3 (N stars, 100% verified)` (JSON + CSV + одна строка в `explore.html` + удаление v1).
- **Estimated time:** 30–45 мин.

### STEP 9 — Честный HUD

- **Task:** T8.
- **Files:** `gaia-adapter.js`, `explore.html`.
- **What I ask my coding AI:** **Промпт F**.
- **What command I run:** `npm run dev`
- **What I should see:** на карточке `TEFF (GAIA GSP-PHOT)`, `DISTANCE (DERIVED)`, `PARALLAX`, `G MAG`; нет M☉/L☉; класс подписан «≈ M-TYPE · FROM TEFF»; статичный Canopus исчез; под звездой строка `SOURCE // GAIA DR3`.
- **Definition of done:** на экране нет ни одного числа, которого нет в каталоге или которое не помечено как вычисленное.
- **Commit:** `feat(explore): show only measured Gaia fields in HUD`
- **DEVLOG entry:** «Убрал из HUD числа, которые выглядели научно, но были выдуманы».
- **Estimated time:** 2–2,5 ч.

### STEP 10 — Вынести JS в `explore-main.js`

- **Task:** T9.
- **What I ask my coding AI:** **Промпт G**.
- **What I should see:** страница работает **точно так же**, как до шага.
- **Commit:** `refactor(explore): move inline script into explore-main.js`
- **Estimated time:** 1,5–2 ч.

### STEP 11 — Умный поиск (`search.js`)

- **Task:** T10.
- **What I ask my coding AI:** **Промпт H1**.
- **What I should see:** запросы `barnards`, `61 cyg`, `gj 551`, `5853498713190525696` находят нужную звезду первой; выделена реально выбранная звезда.
- **Commit:** `feat(search): ranked, normalized search in search.js`
- **Estimated time:** 2 ч.

### STEP 12 — Тесты

- **Task:** T11.
- **What I do:** скопируй `tests/` из kit в проект.
- **What I ask my coding AI:** **Промпт I**.
- **What command I run:** `npm test`
- **What I should see:** `# pass N`, `# fail 0`.
- **Commit:** `test: add unit tests for search and gaia-adapter`
- **Estimated time:** 1,5–2 ч.

### STEP 13 — Клавиатура в поиске

- **What I ask my coding AI:** **Промпт H2**.
- **What I should see:** мышь не нужна: Tab до SEARCH TARGET → Enter → печатаешь → ↓ → Enter выбирает → Esc закрывает, фокус возвращается на кнопку.
- **Commit:** `feat(search): keyboard navigation for search results`
- **Estimated time:** 1,5–2 ч.

### STEP 14 — Ссылки на звёзды

- **What I ask my coding AI:** **Промпт H3**.
- **What I should see:** выбираешь Barnard's Star → адрес стал `explore.html?star=barnards-star`; копируешь адрес в новую вкладку → открывается Barnard's Star; `?star=nonsense` → «STAR NOT FOUND».
- **Commit:** `feat(explore): shareable ?star= URLs`
- **Estimated time:** 1–1,5 ч.

### STEP 15 — Лендинг из каталога

- **Task:** T14.
- **What I ask my coding AI:** **Промпт J**.
- **What I should see:** на лендинге звёзды из каталога (Проксима, Barnard's Star, 61 Cygni A, Epsilon Eridani, Atlas, 51 Pegasi); цифры в инфо-панели совпадают с explore; кнопка «OPEN IN EXPLORER →» ведёт на нужную звезду; звук по умолчанию OFF.
- **Commit:** два коммита: `feat(landing): load featured stars from the Gaia catalog` и `fix(landing): audio off by default`.
- **Estimated time:** 2,5–3 ч.

### STEP 16 — Телефон и доступность

- **Task:** T15.
- **What I ask my coding AI:** **Промпт K**.
- **What command I run:** `npm run dev` → открой адрес `Network:` из терминала на телефоне (телефон и компьютер в одной Wi-Fi). В Chrome DevTools: значок телефона (Ctrl+Shift+M), ширина 360, 768, 1440. Lighthouse: F12 → Lighthouse → Accessibility.
- **What I should see:** Lighthouse Accessibility ≥ 90 на обеих страницах; на 360px ничего не налезает.
- **Commit:** `style(responsive): fix mobile layout on landing and explore` и `fix(a11y): focus handling, font sizes, reduced motion`.
- **Estimated time:** 3–4 ч.

### STEP 17 — GitHub Pages

- **Task:** T16.
- **What I ask my coding AI:** **Промпт L**.
- **What I do on GitHub:** репозиторий → Settings → Pages → Source: **GitHub Actions**.
- **What command I run:** `git push`, потом открой вкладку Actions.
- **What I should see:** зелёная галочка; сайт открывается по публичной ссылке, обе страницы и поиск работают.
- **Commit:** `ci: deploy to GitHub Pages`
- **DEVLOG entry:** «StarScope в интернете».
- **Estimated time:** 1,5–2 ч.

### STEP 18 — Документация и релиз

- **Task:** T17.
- **What I ask my coding AI:** **Промпт M**.
- **What I do:** пройди чек-лист «STARSCOPE V1.0 — DONE» (раздел 9). Если хотя бы один пункт «нет», вернись к нужному шагу.
- **What command I run:**
  ```bash
  git tag v1.0.0
  git push origin v1.0.0
  ```
  Затем на GitHub: Releases → Draft a new release → тег `v1.0.0` → вставь текст раздела `[1.0.0]` из CHANGELOG.
- **Commit:** `docs: README, DATA.md and CHANGELOG for v1.0.0`
- **DEVLOG entry:** «Релиз V1.0».
- **Estimated time:** 2–3 ч.

---

## 4. Сессия на ближайшие 6–8 часов

Перерыв 10 минут после каждого блока. Каждый блок заканчивается коммитом или записью.

### Блок 1 (0:00–0:30) — Подготовка и снимок

- **START WITH:** открой VS Code → папка StarScope → терминал (Ctrl+`). Выполни `npm install`, `npm run dev`, открой `http://localhost:3000/explore.html`, F12 → Console.
- **THEN (AI):** ничего.
- **THEN (я проверяю):** вижу красную ошибку про `gaia-adapter.js`. Делаю скриншот для DEVLOG.
- **THEN (команда):** STEP 1 — `.gitignore`, `git add -A`, коммит, тег, push.
- **THEN (успех):** тег `v0.1-prototype` на GitHub.
- **THEN (commit):** `chore: snapshot prototype before V1 cleanup`

### Блок 2 (0:30–2:00) — Починить адаптер

- **START WITH:** открой `gaia-adapter.js`, прокрути до `loadGaiaStars`. Найди `eturn` и посмотри, где заканчивается `if (!rawList ...`. 10 минут попробуй понять сам.
- **THEN (AI):** промпт A. Сначала прочитай объяснение AI на русском и сравни со своей догадкой. Только потом разрешай менять код.
- **THEN (я проверяю):** в VS Code открой Source Control (Ctrl+Shift+G) → кликни на `gaia-adapter.js` → смотри diff. Проверь:
  - `return rawList.map(...)` стоит **после** закрывающей `}` блока `if`;
  - `FALLBACK_GAIA_STARS` и `candidatePaths` удалены;
  - `fetch` вызывается один раз;
  - при ошибке бросается `throw new Error(...)`;
  - вместо `: 10` расстояние считается из параллакса;
  - `getSpectralInfo`, `mass`, `lum` **не тронуты** (это STEP 9).
- **THEN (команда):** Ctrl+F5 на explore; тест с переименованием JSON.
- **THEN (успех):** список звёзд есть, консоль чистая, при отсутствии файла — `CATALOG UNAVAILABLE`.
- **THEN (commit):** `fix(adapter): repair syntax error so explore can load the catalog`

### Блок 3 (2:00–2:45) — Проверка данных

- **START WITH:** терминал: `python scripts/verify_catalog.py gaia-stars-v2.json`.
- **THEN (AI):** промпт E, вставь вывод обоих запусков.
- **THEN (я проверяю):** v2 → 0/20, v1 → 14/14. Своими словами запиши в DEVLOG, почему `MISSING` значит «такой звезды в Gaia нет».
- **THEN (команда):** поменяй строку в `explore.html` на `./gaia-stars-v1.json`, Ctrl+F5.
- **THEN (успех):** 14 звёзд, у Проксимы ≈ 4.25 LY.
- **THEN (commit):** `test(data): add verify_catalog.py to check catalog against Gaia DR3`, затем `data: switch explore to verified v1 Gaia catalog`.

### Блок 4 (2:45–3:45) — Уборка

- **START WITH:** `git ls-files` → посмотри на список глазами.
- **THEN (AI):** промпт B. AI покажет таблицу «файл → кто на него ссылается → удалить?». Прочитай. Подтверди словом «OK, delete».
- **THEN (я проверяю):** `git status` показывает только удаления (`deleted:`), а не изменения других файлов.
- **THEN (команда):** `npm run dev`, проверь обе страницы.
- **THEN (успех):** лендинг и explore работают как раньше.
- **THEN (commit):** `chore: remove dead prototype files`

### Блок 5 (3:45–5:45) — Зависимости и сборка

- **START WITH:** открой `package.json` и `vite.config.ts`. Посмотри на `"name": "react-example"` и список зависимостей.
- **THEN (AI):** промпт C.
- **THEN (я проверяю):**
  - в `package.json` в зависимостях остался только `vite`;
  - в `vite.config.ts` нет `react` и `tailwindcss`;
  - в `index.html` строка `<script type="module" src="./main.js"></script>`;
  - JSON лежит в `public/data/`, путь в `explore.html` = `"./data/gaia-stars-v1.json"`.
- **THEN (команда):** `npm install`, `npm run dev` (проверь обе страницы), `npm run build`, `npm run preview` (проверь `http://localhost:4173/` и `/explore.html`).
- **THEN (успех):** собранный сайт работает, в `dist/data/` есть JSON.
- **THEN (commit):** `build: remove unused React/AI Studio template dependencies`, затем `build: fix production bundle (module script, public data folder)`.

### Блок 6 (5:45–6:15) — Кодировка

- **START WITH:** посмотри на заголовок вкладки обеих страниц и на метки «M☉», «°».
- **THEN (AI):** промпт C2, только если нашлись кракозябры.
- **THEN (я проверяю):** `git grep -n "вЂ"` ничего не находит.
- **THEN (успех):** все символы правильные.
- **THEN (commit):** `fix: re-save source files as UTF-8` (если были изменения).

### Блок 7 (6:15–8:00, если есть силы) — Начать пайплайн

- **START WITH:** открой `fetch_gaia_stars.py`, прочитай `ADQL_QUERY`, `build_star_entry`, `validate_catalog`. Запиши в DEVLOG одним предложением, что делает каждая функция.
- **THEN (AI):** промпт D.
- **THEN (я проверяю):** в diff в `KNOWN_NAMES` только ID из таблицы промпта D; нигде нет новых выдуманных ID; ключи называются `distance_pc` / `distance_ly`.
- **THEN (команда):** `python -m pip install -r requirements.txt`, `python fetch_gaia_stars.py`.
- **THEN (успех):** появился `public/data/gaia-stars.json`, в терминале таблица около 25 звёзд.
- **THEN (commit):** `data(pipeline): emit distance_* fields, add curated IDs and quality columns`
- **Если не успел:** закоммить нечего — ничего страшного. Запиши в DEVLOG, где остановился.

В конце сессии: запиши в DEVLOG таблицу времени и 3 вещи, которые понял. `git push`.

---

## 5. Готовые промпты для AI

Промпты на английском: AI-ассистенты точнее выполняют технические инструкции на английском. Каждый промпт требует объяснения на русском.

Общее правило: **вставляй в чат AI только файлы, названные в промпте.** Не давай ему весь проект.

### A. Починить `gaia-adapter.js`

Что делает: минимальный фикс загрузки данных, без изменения того, что показывается на экране.

```
You are helping me fix one bug in my project StarScope (vanilla JS + Vite, no React).

FILES:
- gaia-adapter.js (you may change this file)
- explore.html (READ ONLY — only to see how loadGaiaStars() is used)

RULES:
1. First INSPECT the files. Before writing any code, explain in RUSSIAN, in simple words for a beginner:
   what is broken, why the explore page shows no stars, and what minimal changes you propose.
2. Make a MINIMAL patch. Do not rewrite the file. Do not rename functions. Do not change code that is unrelated to the bug.
3. Do NOT invent, add or "fix" any star data. No new stars, no new numbers.
4. Do NOT create a second version of any existing function. Edit the existing code in place.
5. Do NOT touch getSpectralInfo(), the mass/lum/kicker/category values, or the per-star overrides — that is a separate later task.
6. Code and comments in English.

KNOWN PROBLEMS TO FIX in loadGaiaStars():
a) "eturn" must be "return".
b) The if-block that checks rawList is not closed before the return, so normalization only runs inside the fallback branch. The normalization must run for any successfully loaded list.
c) Remove the FALLBACK_GAIA_STARS array and the candidatePaths loop completely. Fetch only the jsonPath argument, once.
d) If the response is not ok, or the JSON is not a non-empty array, throw an Error with a clear English message (include the URL and HTTP status). Do not silently fall back to anything.
e) Rename "responce" to "response".
f) Distance: replace the silent default of 10 ly. If distance_ly is missing, compute it from distance_pc; if that is missing, compute distance_pc = 1000 / parallax (only if parallax > 0) and distance_ly = distance_pc * 3.26156. If nothing is available, the displayed "dist" must be "—" instead of a number.

OUTPUT:
1. Explanation in Russian (what was wrong, what you changed, why).
2. The patch (only the changed parts, or the full loadGaiaStars() function if that is clearer).
3. Testing instructions for me: exact URL to open, what to see in the browser console, and how to test the error state by temporarily renaming the JSON file.
4. Final list of changed files.
```

### B. Удалить мёртвые файлы

```
You are helping me clean dead files from my project StarScope (vanilla JS + Vite, no React).

LIVE FILES (must stay, do not modify them in this task):
index.html, explore.html, explore.css (the one linked from explore.html), main.js, gaia-adapter.js,
fetch_gaia_stars.py, gaia-stars-v1.json, package.json, package-lock.json, vite.config.ts,
main.tsx, ts.config.json (these two will be handled in a later task), scripts/verify_catalog.py, .gitignore

CANDIDATES FOR DELETION:
"const starData = [.ts", every copy of explore.js, gaia-api.js, radar.js, fallback_gaia_stars.js,
Untitled-1.html, "уууууууууууууу.html", scratch.js, style.css, any SECOND copy of explore.css
(not the one linked from explore.html), stars.json, featured.json, gaia-stars-v2.json

RULES:
1. First INSPECT. Run `git ls-files` and, for EACH candidate, search for references
   (for example `git grep -n "<file name>"`) in .html, .js, .css, .ts, .json files.
2. Show me a table: file | referenced by | safe to delete (yes/no) | reason. Explain in RUSSIAN.
3. If there are two files with the same name (for example two explore.css), tell me their full paths
   and which one is actually linked from explore.html. Only the unlinked one is a candidate.
4. WAIT for my confirmation before deleting anything.
5. After I confirm, delete with `git rm "<path>"` (use quotes: some names contain spaces, brackets or Cyrillic).
6. Do NOT edit any live file. Do NOT move code from deleted files into live files. Do NOT create new files.

OUTPUT:
1. The table + explanation in Russian.
2. After my confirmation: the exact git rm commands you ran.
3. Testing instructions: which pages to open and what must still work.
4. Final list of deleted files (this will go into my commit message).
```

### C. Почистить `package.json` и Vite

```
You are helping me clean the build setup of StarScope. It is a plain multi-page site
(index.html + explore.html, vanilla JS, ES modules). It is NOT a React app.
package.json and vite.config.ts were copied from a Google AI Studio React template.

FILES:
package.json, package-lock.json, vite.config.ts, main.tsx, ts.config.json, index.html, explore.html, gaia-stars-v1.json

RULES:
1. First INSPECT. Search the project for any import of react, react-dom, @google/genai, express, dotenv,
   motion, lucide-react, tailwindcss. Explain in RUSSIAN which dependencies are actually used and why each
   unused one can go. Explain in simple words why the production build is currently broken.
2. Minimal changes only. Do NOT migrate to React or TypeScript. Do NOT add new libraries.
3. Do NOT change any page logic or styles.

TASKS:
a) Remove unused dependencies with npm commands (not by hand, so package-lock.json stays consistent):
   npm uninstall react react-dom @vitejs/plugin-react @tailwindcss/vite tailwindcss autoprefixer @google/genai express @types/express dotenv motion lucide-react tsx esbuild typescript @types/react @types/react-dom @types/node
   then: npm install -D vite
   If vite ends up in both "dependencies" and "devDependencies", keep it only in devDependencies.
b) package.json: "name": "starscope", "version": "0.1.0", keep "type": "module", "private": true.
   Scripts must be exactly:
   "dev": "vite --port 3000 --host", "build": "vite build", "preview": "vite preview --host"
c) Replace vite.config.ts with this minimal config:
   import { resolve } from "node:path";
   import { defineConfig } from "vite";
   export default defineConfig({
     base: "./",
     build: { rollupOptions: { input: {
       main: resolve(__dirname, "index.html"),
       explore: resolve(__dirname, "explore.html"),
     } } },
   });
d) Delete main.tsx and ts.config.json with git rm (nothing imports them).
e) index.html: change <script src="./main.js"></script> to <script type="module" src="./main.js"></script>.
   Explain to me why Vite needs type="module" here.
f) Move gaia-stars-v1.json to public/data/gaia-stars-v1.json (use git mv) and change the path in explore.html
   to "./data/gaia-stars-v1.json". Explain what the public/ folder does.

OUTPUT:
1. Explanation in Russian.
2. The exact commands you ran and the diffs.
3. Testing instructions: npm run dev (both pages), npm run build (what should appear in dist/),
   npm run preview (which URLs to open and what to check).
4. Final list of changed, moved and deleted files, split into two groups for two commits:
   group 1 = dependency/config cleanup, group 2 = production bundle fixes (index.html, explore.html, JSON move).
```

### C2. Кодировка (только если нашлись кракозябры)

```
Some files in StarScope show mojibake (UTF-8 text that was decoded as Windows-1251), for example
"вЂ”" instead of "—", "Mв‰" instead of "M☉", "В°" instead of "°", "Г¶" instead of "ö".

FILES: run `git grep -n -e "вЂ" -e "Г¶" -e "В°" -e "в‰" -e "О±"` and work only on the files it lists.

RULES:
1. First show me the list of files and lines, and explain in RUSSIAN what mojibake is and why it happened.
2. Replace ONLY the broken characters. Do not change any code, text wording, numbers or formatting.
   Typical mapping: "вЂ”"→"—", "вЂ№"→"‹", "вЂє"→"›", "вЂІ"→"′", "вЂі"→"″", "В·"→"·", "В°"→"°", "Вµ"→"µ",
   "Mв‰"→"M☉", "Lв‰"→"L☉", "вњ•"→"✕", "вЊ–"→"⌖", "в€’"→"−", "Г¶"→"ö", "Г…"→"Å", "О±"→"α", "ОІ"→"β",
   "Оі"→"γ", "О¶"→"ζ", "Оµ"→"ε", "Ої"→"ο", "ПЂ"→"π", "в†’"→"→", "в‰¤"→"≤", "Г—"→"×".
   Decorative comment lines made of "в”Ђ" can be replaced with plain "-" characters.
   If you are not sure what a sequence should be, list it and ask me instead of guessing.
3. Save all changed files as UTF-8 (no BOM). Add an .editorconfig with: root = true, [*] charset = utf-8.

OUTPUT: explanation in Russian, the replacements per file, how I verify (the git grep command must return nothing,
page titles must show "—"), and the final list of changed files.
```

### D. Пересобрать каталог Gaia

Таблица имён ниже — это звёзды, которые реально возвращает запрос скрипта (я выполнил его в архиве Gaia), плюс 14 проверенных звёзд из твоего `gaia-stars-v1.json`. Имена я сопоставил по координатам и параллаксу. **Перед коммитом проверь 5–6 из них в SIMBAD** (поиск `Gaia DR3 <номер>`).

```
You are helping me fix the data pipeline of StarScope: fetch_gaia_stars.py (Python, astroquery).
It queries the official Gaia DR3 archive. The query itself works. Several things around it are wrong.

FILES:
- fetch_gaia_stars.py (change it)
- gaia-adapter.js (READ ONLY — to see which field names the website expects)
- create requirements.txt

ABSOLUTE RULES ABOUT DATA:
- Every number in the output must come from the Gaia DR3 query result or be computed from it by a documented formula.
- NEVER type star values (parallax, temperature, coordinates, magnitudes) by hand.
- NEVER invent source_ids or star names. Use ONLY the source_ids and names listed below.
- If Gaia returns an empty/masked value, write null in JSON. Never replace it with a default number.

OTHER RULES:
1. First INSPECT the script and explain in RUSSIAN, in simple words: what each function does,
   what is wrong now, and your minimal plan. Wait for my OK before editing.
2. Minimal patch. Keep the existing structure and helper functions (parallax_to_pc, pc_to_ly,
   equatorial_to_cartesian, write_json, write_csv, validate_catalog). Do not rewrite the file.
3. Code and comments in English.

CHANGES:
a) Output field names: rename "dist_pc" -> "distance_pc" and "dist_ly" -> "distance_ly"
   (the website adapter reads distance_pc / distance_ly). Update validate_catalog() accordingly.
b) Add these columns to the SELECT: phot_g_mean_mag, parallax_error, bp_rp.
   Write them to the output as "phot_g_mean_mag", "parallax_error", "bp_rp".
   They may be masked/empty: handle with numpy.ma.is_masked (or equivalent) and write null.
c) Keep the existing "nearest stars" query (parallax > 200 AND teff_gspphot IS NOT NULL, top TARGET_COUNT).
   Add a second query for a curated list: WHERE source_id IN (CURATED_SOURCE_IDS).
   Merge both results, remove duplicates by source_id, sort by parallax descending.
   Add a field "selection" to each star: "nearest" or "curated" (if a star is in both, use "nearest").
d) CURATED_SOURCE_IDS (these are verified to exist in Gaia DR3):
   5853498713190525696, 4472832130942575872, 4810594479418041856, 1872046609345556480,
   6553614253923452800, 4034171629042489088, 2835207319109249920, 48026706558487040,
   66526127137440128, 3735000631158990976, 2428589330539122304, 4017860992519744384,
   2577061092921353984, 1907131544341497600
e) Replace the entire KNOWN_NAMES dict with ONLY these entries (source_id: id / name / aliases):
   5853498713190525696  proxima-centauri    Proxima Centauri   [Alpha Centauri C, GJ 551]
   4472832130942575872  barnards-star       Barnard's Star     [GJ 699]
   762815470562110464   lalande-21185       Lalande 21185      [GJ 411]
   4075141768785646848  ross-154            Ross 154           [GJ 729]
   5164707970261890560  epsilon-eridani     Epsilon Eridani    [GJ 144]
   6553614253923452800  lacaille-9352       Lacaille 9352      [GJ 887]
   3796072592206250624  ross-128            Ross 128           [GJ 447]
   1872046574983497216  61-cygni-b          61 Cygni B         [GJ 820 B]
   1872046609345556480  61-cygni-a          61 Cygni A         [GJ 820 A]
   2154880616774131840  struve-2398-a       Struve 2398 A      [GJ 725 A]
   2154880616774131712  struve-2398-b       Struve 2398 B      [GJ 725 B]
   385334230892516480   groombridge-34-a    Groombridge 34 A   [GJ 15 A]
   385334196532776576   groombridge-34-b    Groombridge 34 B   [GJ 15 B]
   6412595290592307840  epsilon-indi-a      Epsilon Indi A     [GJ 845]
   3139847906307949696  luytens-star        Luyten's Star      [GJ 273]
   4810594479418041856  kapteyns-star       Kapteyn's Star     [GJ 191]
   4034171629042489088  groombridge-1830    Groombridge 1830   [GJ 451]
   2835207319109249920  51-pegasi           51 Pegasi          [HD 217014]
   48026706558487040    epsilon-tauri       Epsilon Tauri      [Ain, HD 28305]
   66526127137440128    atlas               Atlas              [27 Tauri]
   3735000631158990976  gliese-486          Gliese 486         [GJ 486]
   2428589330539122304  3-ceti              3 Ceti             []
   4017860992519744384  gliese-436          Gliese 436         [GJ 436]
   2577061092921353984  zeta-piscium        Zeta Piscium       [Revati]
   1907131544341497600  1-lacertae          1 Lacertae         []
   Any star returned by Gaia that is not in this dict keeps the existing fallback name "Gaia DR3 <source_id>".
f) validate_catalog(): the "parallax > PARALLAX_MIN_MAS" rule applies ONLY to stars with selection == "nearest".
   For all stars require parallax > 0. Replace "exactly TARGET_COUNT stars" with
   "at least TARGET_COUNT stars with selection == nearest".
   Temperature may be null for curated stars: only check temperature > 0 when it is not null.
g) Output paths: JSON -> public/data/gaia-stars.json, CSV -> public/data/gaia-stars.csv
   (create the folder if needed).
h) requirements.txt: astroquery, astropy, numpy (no pinned exotic versions).

OUTPUT:
1. Explanation in Russian (first, before code).
2. The patch.
3. Testing instructions: install command, run command, what the summary table should look like,
   how to check one star in SIMBAD by typing "Gaia DR3 <source_id>".
4. Final list of changed/created files. Remind me to commit the script changes and the generated JSON separately.
```

### E. Запуск и разбор `verify_catalog.py`

```
I ran scripts/verify_catalog.py from my project StarScope. It compares every star in a catalog JSON
with the official Gaia DR3 archive by source_id.

FILES: scripts/verify_catalog.py (READ ONLY), and the output below.

<paste the full terminal output here>

RULES:
1. Explain in RUSSIAN, in simple words: what MISSING, MISMATCH and OK mean, and what this output says
   about the catalog I checked.
2. Do NOT suggest editing the JSON by hand to make the check pass. The only allowed way to change catalog
   data is to change and re-run fetch_gaia_stars.py.
3. Do NOT change verify_catalog.py tolerances to make stars pass.
4. If there are MISMATCH/MISSING lines for a catalog generated by fetch_gaia_stars.py, explain the most
   likely reason and which part of fetch_gaia_stars.py to look at. Do not write a fix yet.

OUTPUT: explanation in Russian, a one-sentence verdict ("this catalog is / is not trustworthy"), and the
next action I should take.
```

### F. Честный HUD

```
You are helping me make the star card (HUD) in StarScope honest: every number shown must come from the
Gaia catalog or be clearly labelled as derived.

FILES:
- gaia-adapter.js (change)
- explore.html (change: HUD markup and the selectStar() function in the inline script)
- public/data/gaia-stars.json (READ ONLY — look at the first 2 entries to see the real field names)

RULES:
1. First INSPECT and list in RUSSIAN every value currently shown in the HUD, marking each one as:
   "from Gaia", "derived (calculated)", "decorative text", or "invented". Wait for my OK.
2. Minimal changes. Keep the existing HTML structure, ids and CSS classes where possible.
   Do not redesign the card. Do not change explore.css unless a new label needs one small rule.
3. NEVER invent numbers. Missing values must be shown as "—".
4. Do NOT create a second spectral/color function. Keep getSpectralInfo() as the single source of colors,
   but remove the invented fields from it.
5. Code and comments in English.

CHANGES in gaia-adapter.js:
a) Remove mass, lum, kicker text like "SPECTRAL CLASS B8 Ia", category like "BLUE SUPERGIANT", and all
   per-star overrides (the canopus / sirius-a / proxima-centauri / ... if-else chain).
   getSpectralInfo() keeps only: band, bg, glow, dotColor.
b) Extract the per-star mapping into an exported pure function normalizeStar(raw) and make
   loadGaiaStars() call it. Also export raToHms and decToDms.
c) Temperature: if raw.temperature is null/undefined/empty, temperature = null, temp = "—",
   and use a neutral grey color instead of pretending it is a known class.
   Never use a default like 5000.
d) New display strings: parallax "768.07 ± 0.03 mas" (use parallax_error if present, otherwise only the value),
   gmag "8.98" or "—", band label "≈ M-TYPE · FROM TEFF" (or "CLASS UNKNOWN" if teff is null).
e) raToHms/decToDms: round the TOTAL number of seconds first, then split into h/m/s (or d/m/s),
   so the output can never show "60s" and is not truncated.

CHANGES in explore.html:
f) The 4 metrics become: "TEFF (GAIA GSP-PHOT)", "DISTANCE (DERIVED 1000/PARALLAX)", "PARALLAX", "G MAG".
   Keep the same metric container ids if possible, or rename them consistently in markup and selectStar().
g) Replace the hard-coded Canopus content in the markup with neutral placeholders ("ACQUIRING TARGET…", "—").
h) Replace the static "SPECTRAL ANALYSIS // 0.65µm" and "SPECTRAL RESOLUTION // 0.02 Å" texts with
   "SOURCE // GAIA DR3 · EPOCH J2016.0". Keep other purely decorative HUD texts (e.g. "OBSERVATORY // ONLINE").
i) The "STAR NOT FOUND" branch must also use "—" for all 4 metrics.

OUTPUT:
1. The Russian table from step 1, then the explanation.
2. The patch.
3. Testing instructions: which 3 stars to click and what exact values I should compare with the JSON file.
4. Final list of changed files.
```

### G. Вынести inline-JS в модуль

```
Refactoring task in StarScope. Goal: move the inline <script type="module"> from explore.html into a new file
explore-main.js WITHOUT changing any behavior.

FILES: explore.html (change), explore-main.js (create), gaia-adapter.js (READ ONLY)

RULES:
1. First explain in RUSSIAN what "refactoring without changing behavior" means and your plan.
2. Move the code AS IS. Do not rename functions, do not "improve" logic, do not fix other bugs in the same step.
   If you notice a bug, list it at the end as a note — do not fix it.
3. The import path must stay correct: import { loadGaiaStars } from "./gaia-adapter.js";
4. explore.html must end up with exactly one script tag: <script type="module" src="./explore-main.js"></script>
5. Do not create any other new files. Do not duplicate any function.

OUTPUT: explanation in Russian, the new file, the explore.html diff, a manual test checklist
(open/close search, type a query, select 3 stars, ?q=barnard, ?q=nonsense, Esc, click outside),
and the final list of changed/created files.
```

### H1. Умный поиск

Для справки у тебя есть `reference/search.js` из kit. Покажи его AI как образец, но **не копируй в репозиторий**.

```
Implement ranked search in StarScope with the smallest possible change.

FILES: explore-main.js (change), search.js (create), public/data/gaia-stars.json (READ ONLY, look at 2 entries).
Optional reference (do NOT copy this file into the repo, only use the idea): <paste reference/search.js>

RULES:
1. First INSPECT explore-main.js and tell me in RUSSIAN every place where stars are currently filtered or matched
   by text (there are at least two: renderResults() and the ?q= handling in initializeStarScope()).
   Explain why having two different matching implementations is a problem.
2. Create search.js with two exported pure functions (no DOM access inside):
   - normalizeQuery(text): lowercase, remove diacritics (Boötis -> bootis), remove spaces, hyphens, underscores,
     apostrophes and dots.
   - searchStars(stars, query, limit = 20): score 3 = exact match, 2 = prefix match, 1 = substring match on
     name, id, source_id and every alias; ties sorted by distance_ly ascending; empty query returns the first
     `limit` stars unchanged.
3. Replace BOTH existing matching implementations with searchStars(). After this change there must be exactly one
   search implementation in the project.
4. Fix "is-selected": it must mark the star that is currently shown in the HUD, not always the first result.
   Keep track of the selected star id in one variable.
5. Show a result count line like "3 TARGETS" at the top of the result list (use existing CSS classes if possible).
6. Do not change the visual design. Do not add libraries. Code and comments in English.

OUTPUT: explanation in Russian, the patch, a test table for me
(query -> expected first result: "barnards", "61 cyg", "gj 551", "5853498713190525696", "EPS ERI", "xyz"),
and the final list of changed/created files.
```

### I. Unit-тесты

```
Add unit tests to StarScope using Node's built-in test runner (node --test). No new dependencies.

FILES: search.js, gaia-adapter.js (READ ONLY unless a test reveals a real bug), tests/search.test.js,
tests/gaia-adapter.test.js (I copied these from a reference kit; they import from ../reference/ — fix the imports
to ../search.js and ../gaia-adapter.js), package.json.

RULES:
1. First read the tests and the code. Explain in RUSSIAN what each test checks.
2. Adapt the tests to the real function names and return shapes in my code. Do not change the code just to
   match a test's naming.
3. If a test fails, explain in Russian whether the TEST or the CODE is wrong, and why. Never weaken or delete
   a correct test just to make it pass. Wait for my decision before changing code.
4. Tests must not use the network or the browser DOM.
5. Add to package.json scripts: "test": "node --test tests/"
6. Add one extra test for the bug fixed earlier: a star with no distance fields and a valid parallax must get
   distance_ly computed from parallax (not 10, not null).

OUTPUT: explanation in Russian, final test files, the package.json change, the command to run (npm test) and what
the output should look like, final list of changed files.
```

### H2. Клавиатура в поиске

```
Add keyboard navigation to the StarScope search panel. Smallest safe change, no new libraries.

FILES: explore-main.js, explore.html, explore.css

RULES:
1. First INSPECT the current markup of #searchResults and explain in RUSSIAN why role="listbox" on the <ul> with
   <button role="option"> inside <li> is an incorrect accessibility pattern.
2. Use the SIMPLE pattern: a plain list of buttons. Remove role="listbox" and role="option".
   Do not implement a full ARIA combobox.
3. Behavior:
   - Enter in the input selects the first result.
   - ArrowDown in the input moves focus to the first result button; ArrowDown/ArrowUp move between result buttons;
     ArrowUp on the first result returns focus to the input.
   - Escape closes the panel and returns focus to the "SEARCH TARGET" button (existing closeSearch()).
   - Enter/Space on a result button selects it (native button behavior — do not re-implement it).
   - Add aria-live="polite" to the result count line so screen readers hear "3 TARGETS".
4. Reuse existing functions (openSearch, closeSearch, selectStar, renderResults). Do not duplicate them.
5. Make sure :focus-visible styles are clearly visible for result buttons (small CSS change only if needed).

OUTPUT: explanation in Russian, the patch, a keyboard-only test script for me (step by step, without the mouse),
final list of changed files.
```

### H3. Ссылки на звёзды

```
Add shareable star URLs to StarScope explore.

FILES: explore-main.js (change), index.html (READ ONLY — its search form sends ?q=)

RULES:
1. First explain in RUSSIAN what URL query parameters are and what history.replaceState does.
2. Behavior:
   - On load: if ?star=<id> exists, open the star with exactly that id.
     Else if ?q=<text> exists, use searchStars() and open the FIRST ranked result.
     Else open the first star in the catalog.
     If ?star or ?q matches nothing, show the existing "STAR NOT FOUND" state.
   - When the user selects a star, update the address bar to ?star=<id> using history.replaceState
     (no page reload, no new history entries).
3. Use searchStars() from search.js — do not write another matching function.
4. Minimal changes. Code and comments in English.

OUTPUT: explanation in Russian, the patch, test URLs for me
(explore.html?star=barnards-star, ?q=61%20cyg, ?q=nonsense, ?star=nonsense, no parameters), final list of changed files.
```

### J. Лендинг из реального каталога

```
Connect the StarScope landing page to the real Gaia catalog.

FILES: main.js (change), index.html (change), gaia-adapter.js (READ ONLY, reuse it), public/data/gaia-stars.json (READ ONLY)

CURRENT PROBLEM: main.js has a hard-coded FEATURED_STARS array (Sirius, Arcturus, Vega, Rigel, Betelgeuse, Proxima).
Five of them are not in my Gaia catalog, and the values are typed by hand.

RULES:
1. First INSPECT main.js and explain in RUSSIAN which parts must NOT change (starfield canvas, scramble effect,
   audio synthesis, panel positioning) and which part will change (only the data source of the featured stars).
2. Do NOT rewrite main.js. Keep the starfield, scrambleElement, audio and openPanel logic.
3. NEVER type star values by hand. All values come from loadGaiaStars("./data/gaia-stars.json").
4. Replace FEATURED_STARS with:
   const FEATURED_LAYOUT = [
     { id: "proxima-centauri", x: 15, y: 22 },
     { id: "barnards-star",    x: 48, y: 13 },
     { id: "61-cygni-a",       x: 82, y: 20 },
     { id: "epsilon-eridani",  x: 14, y: 72 },
     { id: "atlas",            x: 85, y: 72 },
     { id: "51-pegasi",        x: 66, y: 84 },
   ];
   x/y are decorative screen positions (add a comment saying so). Values (name, designation, distance,
   temperature, RA/Dec) come from the normalized catalog star with that id. If an id is not found, skip it
   and log a console.warn.
5. The info panel shows: name, designation, distance (derived), Teff, G mag. Rename the "SPECTRAL" and
   "APPARENT MAG" labels in index.html to match the real fields ("≈ CLASS (FROM TEFF)", "G MAG").
6. Add an "OPEN IN EXPLORER →" link in the info panel pointing to explore.html?star=<id>.
7. Audio OFF by default: soundOn = false, and in index.html data-on="false", aria-pressed="false", label "AUDIO: OFF".
8. Replace btn.innerHTML with createElement + textContent (no HTML strings built from data).
9. Keyboard: the same telemetry update that happens on mouseenter/mouseleave must also happen on focus/blur.
10. Change the search placeholder to "Search a star (e.g. Proxima, Barnard)..." and "EPOCH J2026.2" to "EPOCH J2016.0".
11. If the catalog fails to load, the landing must still work (starfield, search form); just show no markers.

OUTPUT: explanation in Russian, the patch, test steps (compare one star's values between landing panel and explore),
final list of changed files. Propose TWO commits: featured stars from catalog; audio off by default.
```

### K. Мобильная версия и доступность

```
Accessibility and mobile pass for StarScope. Fix only concrete problems; no redesign.

FILES: index.html (inline <style> and markup), explore.html, explore.css, main.js, explore-main.js

KNOWN PROBLEMS:
- Text of 9–10px (.featured-star .tag, .info-grid, .footer-status and similar) — minimum 11px.
- @keyframes starPulse in explore.css ignores prefers-reduced-motion.
- On narrow screens (360px) featured markers on the landing overlap the title and search field
  (html, body have overflow:hidden and markers use vw/vh positions).
- Info panel (role="dialog") does not move focus inside when opened and does not return focus to the marker when closed.
- Inline style on the "‹ LANDING" link in explore.html.
- explore .observatory has min-height: 560px, which breaks landscape phones (640x360).

RULES:
1. First INSPECT and give me a RUSSIAN table: problem | file | line | minimal fix. Wait for my OK.
2. Smallest CSS/JS changes. Keep the visual style. Do not add libraries. Do not change data logic.
3. On screens <= 640px on the landing, hide the featured markers layer (the search form is the main entry point on mobile)
   — or place them below the hero if it can be done in a few lines. Tell me which option you chose and why.
4. Add: @media (prefers-reduced-motion: reduce) { animations off for .procedural-star and orbits }.
5. Info panel: on open move focus to the close button; on close return focus to the marker that opened it.
6. Move the inline style of the LANDING link into explore.css as a class.

OUTPUT: the table, the patch, a test checklist for me (Chrome DevTools device mode at 360x640, 640x360, 768x1024,
1440x900; Lighthouse Accessibility for both pages; keyboard-only walkthrough), final list of changed files.
Propose two commits: responsive fixes and a11y fixes.
```

### L. Деплой на GitHub Pages

```
Set up GitHub Pages deployment for StarScope using GitHub Actions.

FILES: .github/workflows/deploy.yml (create), vite.config.ts (READ ONLY — it uses base: "./"), package.json (READ ONLY)

RULES:
1. First explain in RUSSIAN what GitHub Actions and GitHub Pages are and what this workflow will do step by step.
2. Use the official GitHub Pages actions. Suggested workflow (update action versions if GitHub now recommends newer ones):

   name: Deploy to GitHub Pages
   on:
     push:
       branches: [main]
     workflow_dispatch:
   permissions:
     contents: read
     pages: write
     id-token: write
   concurrency:
     group: pages
     cancel-in-progress: true
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 22
             cache: npm
         - run: npm ci
         - run: npm test
         - run: npm run build
         - uses: actions/upload-pages-artifact@v3
           with:
             path: dist
     deploy:
       needs: build
       runs-on: ubuntu-latest
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       steps:
         - id: deployment
           uses: actions/deploy-pages@v4

3. If my default branch is "master" instead of "main", tell me to change the branch name.
4. Do not add any other workflow, secrets or dependencies.

OUTPUT: explanation in Russian, the file, the exact GitHub settings I must click (Settings -> Pages -> Source: GitHub Actions),
how to read a failed Actions log, a post-deploy checklist (both pages, search, ?star= links, data file loads,
no 404 in the Network tab), final list of created files.
```

### M. README + DATA.md + CHANGELOG

```
Write the V1.0 documentation for StarScope. Only describe things that actually exist in the code now.

FILES: README.md, DATA.md, CHANGELOG.md, DEVLOG.md (create or update).
READ: fetch_gaia_stars.py, gaia-adapter.js, search.js, explore-main.js, main.js, package.json, public/data/gaia-stars.json (first entries).

RULES:
1. First list in RUSSIAN what you found in the code (features, data fields, commands). Wait for my OK.
2. Documentation in English. Do NOT invent features, numbers, screenshots or links.
   Where the live URL or screenshot is needed, write a clearly marked placeholder: <LIVE_URL>, <SCREENSHOT>.
3. README.md: one-sentence description ("Honest Gaia Explorer"), live URL placeholder, screenshot placeholder,
   features list, how to run (npm install, npm run dev, npm run build, npm test), how to rebuild the catalog
   (pip install -r requirements.txt, python fetch_gaia_stars.py, python scripts/verify_catalog.py public/data/gaia-stars.json),
   project structure (only real files), data credit to ESA Gaia DR3.
4. DATA.md: a table of every field in gaia-stars.json with: meaning, unit, source (Gaia column name) or formula
   (derived), can be null (yes/no). Explain: epoch J2016.0; distance = 1000/parallax is an approximation;
   teff_gspphot can be null; why very bright stars (Sirius, Vega, Canopus, Betelgeuse, Arcturus) are not in the
   catalog (they are too bright for reliable Gaia DR3 entries); how verify_catalog.py works.
5. CHANGELOG.md in "Keep a Changelog" format with section [1.0.0] built ONLY from my actual git log.
   Run `git log --oneline v0.1-prototype..HEAD` and group the commits into Added / Changed / Removed / Fixed.

OUTPUT: the Russian summary, the files, and the final list of changed files.
```

---

## 6. План коммитов для V1

| # | Коммит | Реальная работа | Файлы | Почему отдельный коммит |
|---|---|---|---|---|
| 1 | `chore: snapshot prototype before V1 cleanup` | Сохранение исходного состояния, `.gitignore` | всё | Точка отката + тег `v0.1-prototype` |
| 2 | `fix(adapter): repair syntax error so explore can load the catalog` | `eturn`, скобка, удалён fallback, ошибка вместо молчания, расстояние из параллакса | `gaia-adapter.js` | Один баг → один фикс, можно откатить отдельно |
| 3 | `test(data): add verify_catalog.py to check catalog against Gaia DR3` | Инструмент проверки данных | `scripts/verify_catalog.py` | Новый инструмент, не связан с правкой UI |
| 4 | `data: switch explore to verified v1 Gaia catalog` | Отказ от фальшивого v2 | `explore.html` | Решение о данных, отдельное от инструмента |
| 5 | `chore: remove dead prototype files` | Удаление 14 файлов | удалённые файлы | Одна логическая уборка, в описании — список |
| 6 | `build: remove unused React/AI Studio template dependencies` | Очистка зависимостей и конфигурации | `package.json`, `package-lock.json`, `vite.config.ts`, `main.tsx`, `ts.config.json` | Меняет окружение, а не поведение сайта |
| 7 | `build: fix production bundle (module script, public data folder)` | `type="module"`, JSON в `public/data/` | `index.html`, `explore.html`, JSON | Отдельная причина: чинит сборку |
| 8 | `fix: re-save source files as UTF-8` | Кодировка | затронутые файлы, `.editorconfig` | Массовая, но однотипная правка; не смешивать с логикой |
| 9 | `data(pipeline): emit distance_* fields, add curated IDs and quality columns` | Код пайплайна | `fetch_gaia_stars.py`, `requirements.txt` | Код отдельно от сгенерированных данных |
| 10 | `data: regenerate catalog from Gaia DR3 (N stars, 100% verified)` | Новый каталог, удаление v1 | `public/data/gaia-stars.json`, `.csv`, `explore.html` | Большой diff данных не должен прятать изменения кода |
| 11 | `feat(explore): show only measured Gaia fields in HUD` | Честная карточка | `gaia-adapter.js`, `explore.html` | Видимое пользователю изменение |
| 12 | `refactor(explore): move inline script into explore-main.js` | Перенос без изменения поведения | `explore.html`, `explore-main.js` | Рефакторинг никогда не смешивается с фичей |
| 13 | `feat(search): ranked, normalized search in search.js` | Ранжирование, один поиск вместо двух | `search.js`, `explore-main.js` | Новая функциональность |
| 14 | `test: add unit tests for search and gaia-adapter` | Тесты + `npm test` | `tests/`, `package.json` | Отдельный вид работы |
| 15 | `feat(search): keyboard navigation for search results` | Клавиатура | `explore-main.js`, `explore.html`, `explore.css` | Отдельная функциональность |
| 16 | `feat(explore): shareable ?star= URLs` | URL-состояние | `explore-main.js` | Отдельная функциональность |
| 17 | `feat(landing): load featured stars from the Gaia catalog` | Лендинг ↔ каталог | `main.js`, `index.html` | Смена источника данных на лендинге |
| 18 | `fix(landing): audio off by default` | Звук | `main.js`, `index.html` | Отдельное UX-решение |
| 19 | `style(responsive): fix mobile layout on landing and explore` | Адаптив | CSS | Визуальные правки |
| 20 | `fix(a11y): focus handling, font sizes, reduced motion` | Доступность | CSS/JS | Другая категория проблем |
| 21 | `ci: deploy to GitHub Pages` | Автодеплой | `.github/workflows/deploy.yml` | Инфраструктура |
| 22 | `docs: README, DATA.md and CHANGELOG for v1.0.0` | Документация | `*.md` | Документация |
| — | тег `v1.0.0` + GitHub Release | | | |

Если по ходу найдёшь и исправишь баг, это отдельный `fix:`. Если шаг получился маленьким (например, кодировка оказалась в порядке), коммита не будет — и это нормально.

---

## 7. План DEVLOG

Шаблон записи:

```markdown
## YYYY-MM-DD — <title>
**Problem:** what I saw
**Cause:** what was actually wrong
**Change:** what I changed (commit <hash>)
**Learned:** one or two sentences in my own words
**Next:** the next step
```

Записи, которые можно писать **уже сейчас** (открытия сделаны в аудите, ты их подтверждаешь своими глазами на шагах 0–3):

1. **«Почему explore молчал»** (STEP 2)
   - Обнаружил: список звёзд пустой, `try/catch` ничего не ловит.
   - Причина: `SyntaxError` в `gaia-adapter.js` (`eturn`, незакрытый `if`), поэтому модуль не загружается и весь скрипт explore не запускается.
   - Выучил: ошибка в написании кода импортируемого модуля останавливает скрипт ещё до выполнения, поэтому `try/catch` не помогает.

2. **«Мой v2-каталог оказался не данными Gaia»** (STEP 3)
   - Обнаружил: `verify_catalog.py` → v2: 0/20, v1: 14/14.
   - Изменил: explore переключён на v1.
   - Выучил: данные, «похожие на научные», нужно проверять по первоисточнику.

3. **«Почему Сириуса и Веги нет там, где я ожидал, в Gaia DR3»** (STEP 3 или 7)
   - Обнаружил: у «Sirius A» номер Gaia на самом деле принадлежит слабому Sirius B, а яркие Vega, Canopus, Betelgeuse, Arcturus не находятся по своим координатам.
   - Выучил: Gaia рассчитана на слабые звёзды, самые яркие звёзды неба там отсутствуют или ненадёжны. Поэтому featured-звёзды надо выбирать из реального каталога.

Записи, которые пишутся **только после того, как это произойдёт**:

4. **«Уборка: 14 мёртвых файлов и три версии одной функции»** (STEP 4) — что удалил и как проверял, что файл никто не использует.
5. **«Моя первая успешная production-сборка»** (STEP 5) — зачем `type="module"` и папка `public/`.
6. **«Мой первый настоящий каталог Gaia»** (STEP 7–8) — сколько звёзд, какие имена ты подтвердил в SIMBAD, что показал `verify_catalog.py`.
7. **«Числа, которые выглядели научно, но были выдуманы»** (STEP 9) — масса/светимость по температуре.
8. **«Рефакторинг, после которого ничего не изменилось (и это хорошо)»** (STEP 10).
9. **«Почему 'gj 551' теперь находит Проксиму»** (STEP 11–12) — нормализация и ранжирование, первые тесты.
10. **«Сайт без мыши»** (STEP 13, 16) — клавиатура и Lighthouse до/после.
11. **«StarScope в интернете»** (STEP 17) — первый деплой и какие ошибки были в логах Actions.
12. **«Релиз V1.0»** (STEP 18) — что вошло, что осознанно отложено.

---

## 8. Что считается реальными часами разработки

| Категория | Примеры в StarScope |
|---|---|
| **Coding** | Писать `search.js`; менять `fetch_gaia_stars.py`; переделывать метрики HUD |
| **Debugging** | Найти по Console, почему explore молчит; найти, почему у всех звёзд 10 LY; понять, почему после сборки 404 на JSON (вкладка Network) |
| **Testing** | `npm test`; ручной чек-лист по шагу; прогон `verify_catalog.py`; проверка на 360px; Lighthouse |
| **Reading & understanding code** | Прочитать `main.js` и объяснить, как работает `scrambleElement`; прочитать diff от AI построчно; объяснить вслух `normalizeStar` |
| **Technical research (по проекту)** | Документация Vite про `public/`; MDN про `import`; что такое `teff_gspphot`; почему в Gaia нет ярких звёзд — с записью вывода в DATA.md/DEVLOG |
| **Working with Gaia data** | Запускать пайплайн; сверять звёзды в SIMBAD; читать вывод проверки |
| **Git/GitHub** | Осмысленные коммиты; читать свой diff перед коммитом; теги; релиз |
| **Refactoring** | Вынести inline-скрипт; объединить два поиска в один |
| **Deployment** | Настроить Actions; читать логи ошибок; проверять опубликованный сайт |
| **Accessibility** | Клавиатурная навигация; фокус в инфо-панели; размеры шрифтов; reduced motion |
| **Documentation** | README, DATA.md, CHANGELOG, DEVLOG |

**НЕ считается реальной разработкой:**
- Попросить AI «улучшить проект» и принять результат, не читая.
- Перегенерировать файл второй, третий раз «вдруг станет лучше».
- Двигать цвета свечения и отступы без задачи из backlog.
- Коммиты ради количества (исправил пробел → коммит).
- Смотреть общие туториалы, не связанные с текущим шагом.
- Держать редактор открытым без работы.
- Добавлять NOT NOW-фичи (раздел 10), пока V1 не закончен.

Правило: у каждой сессии есть результат — коммит, запись в DEVLOG или записанный вывод исследования.

---

## 9. STARSCOPE V1.0 — DONE

Каждый пункт: да / нет. V1.0 готов, только когда везде «да».

**Данные**
- [ ] Есть ровно один каталог `public/data/gaia-stars.json`, созданный `fetch_gaia_stars.py`.
- [ ] `python scripts/verify_catalog.py public/data/gaia-stars.json` → все звёзды OK.
- [ ] Имена 5+ звёзд я лично проверил в SIMBAD.
- [ ] На экране нет масс, светимостей и спектральных классов, которых нет в каталоге.
- [ ] Вычисленные значения (расстояние, класс по Teff) помечены как derived.
- [ ] Пустые значения показываются как «—».
- [ ] Эпоха координат указана как J2016.0.

**Explore**
- [ ] Каталог загружается, в Console 0 ошибок.
- [ ] Если JSON недоступен, показывается понятная ошибка.
- [ ] Поиск по имени, алиасу и номеру Gaia, точное совпадение первым.
- [ ] Клавиатура: Enter, ↑/↓, Esc работают без мыши.
- [ ] `?star=<id>` открывает звезду; адрес меняется при выборе; `?q=` работает.

**Лендинг**
- [ ] Featured-звёзды берутся из каталога.
- [ ] Из инфо-панели можно перейти в explore на ту же звезду.
- [ ] Звук по умолчанию выключен.

**Качество**
- [ ] На 360px, 768px, 1440px и в горизонтальном телефоне ничего не налезает.
- [ ] Lighthouse Accessibility ≥ 90 на обеих страницах.
- [ ] `npm test` проходит.
- [ ] Все символы (—, °, ☉) отображаются правильно.

**Репозиторий**
- [ ] Мёртвые и дублирующиеся файлы удалены.
- [ ] В `package.json` из зависимостей только `vite`.
- [ ] `npm run build` без ошибок, `npm run preview` показывает рабочий сайт.
- [ ] Сайт опубликован на GitHub Pages, публичная ссылка работает.
- [ ] README.md, DATA.md, CHANGELOG.md, DEVLOG.md существуют и описывают только то, что реально есть.
- [ ] Тег `v1.0.0` и GitHub Release созданы.

---

## 10. NOT NOW (не давай себе переусложнить проект)

| Идея | Статус | Когда |
|---|---|---|
| Миграция на React / TypeScript | **NOT NOW** | Возможно, никогда. Ванильный JS справляется |
| Three.js 3D-карта соседей Солнца | **NOT NOW** | Эксперимент после V1.2 |
| Живые запросы к Gaia из браузера | **NOT NOW** | V2 (нужен прокси: архив Gaia не разрешает запросы с чужих сайтов) |
| Бэкенд / сервер | **NOT NOW** | V2 |
| Аккаунты, избранное, база данных | **NOT NOW** | Не планируется |
| AI-чатбот про звёзды (`@google/genai`) | **NOT NOW** | Не планируется |
| Тысячи звёзд | **NOT NOW** | V1.1 — 200–500 звёзд |
| Масса/светимость/радиус из Gaia FLAME | **NOT NOW** | V1.1 |
| Автоматические имена через SIMBAD | **NOT NOW** | V1.1 |
| Фильтры и сортировка | **NOT NOW** | V1.1 |
| Проверка каталога в GitHub Actions | **NOT NOW** | V1.1 |
| HR-диаграмма, карта неба (идея `radar.js`) | **NOT NOW** | V1.2 |
| Яркие звёзды из Hipparcos | **NOT NOW** | V1.1, с явной меткой источника |
| Сонификация на explore | **NOT NOW** | Опциональный эксперимент после V1 |
| Новая «дизайн-система» / общий CSS | **NOT NOW** | Когда появится третья страница |
| Переименование `main.js`, папка `src/` | **NOT NOW** | Не нужно для V1 |

Если в процессе появляется новая идея, запиши её в конец DEVLOG под заголовком «Ideas (NOT NOW)» и вернись к текущему шагу.

---

## Что такое StarScope прямо сейчас

Красивый прототип из двух страниц. Лендинг работает, у explore сильный дизайн, а Python-пайплайн к Gaia написан правильно. Но explore не загружает данные из-за опечатки в `gaia-adapter.js`, каталог v2 почти целиком не из Gaia, часть чисел на экране выдумана, а сборка для интернета сломана.

## Что на самом деле значит V1

Сайт в интернете с небольшим (около 25 звёзд) каталогом, созданным из Gaia DR3 программой и проверенным скриптом. Работает поиск (включая клавиатуру и ссылки на звёзды), лендинг связан с каталогом, сайт удобен на телефоне, есть документация. Никаких выдуманных чисел.

## Что сделать сегодня вечером

**Один следующий шаг: STEP 1 — Git checkpoint.** Это 20 минут и без AI:

```bash
git status
git log --all --oneline -- .env
git add -A
git commit -m "chore: snapshot prototype before V1 cleanup"
git tag v0.1-prototype
git push
git push origin v0.1-prototype
```

Сразу после этого — первая задача с AI: STEP 2, починка `gaia-adapter.js`.

## Точный промпт для первой задачи с AI

Это **промпт A** из раздела 5. Вставь в чат AI вместе с файлами `gaia-adapter.js` и `explore.html`.

## Что проверить после того, как AI изменит код

1. В diff (Ctrl+Shift+G → `gaia-adapter.js`): `return rawList.map(...)` стоит **после** закрывающей `}` блока `if`.
2. `FALLBACK_GAIA_STARS` и `candidatePaths` удалены, `fetch` вызывается один раз.
3. При ошибке загрузки есть `throw new Error(...)`, а не молчаливый `catch`.
4. Расстояние считается из параллакса, заглушки `10` больше нет.
5. `getSpectralInfo`, `mass`, `lum` не тронуты.
6. Ctrl+F5 на `http://localhost:3000/explore.html`: список звёзд есть, в Console нет красных ошибок.
7. Переименуй JSON → на странице `CATALOG UNAVAILABLE — CHECK CONSOLE` → верни имя.

## Точный коммит

```bash
git add gaia-adapter.js
git commit -m "fix(adapter): repair syntax error so explore can load the catalog"
```

## Какая задача следующая

**STEP 3:** запустить `python scripts/verify_catalog.py` на v2 и v1, разобрать вывод промптом E и переключить explore на проверенный `gaia-stars-v1.json`.
