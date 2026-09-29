# StarScope: аудит, V1 и план развития

Аудит всего файла `starscope-all-code.txt` (13 959 строк, 30 файлов). Идентификаторы Gaia из каталогов проверены запросами к официальному архиву Gaia DR3 ([ESA Gaia Archive, TAP](https://gea.esac.esa.int/archive/)) 25.09.2026.

Главный вывод в одном абзаце: у StarScope хорошая основа. Лендинг (`index.html` + `main.js`) работает, у explore-страницы есть сильный визуальный стиль, а Python-пайплайн `fetch_gaia_stars.py` написан правильно и реально работает с Gaia DR3. Но сейчас explore-страница **не загружает данные вообще** из-за синтаксической ошибки в `gaia-adapter.js`, а каталог, который она пытается загрузить (`gaia-stars-v2.json`), **почти целиком не из Gaia**: 15 из 20 `source_id` в архиве Gaia DR3 не существуют, а у остальных 5 значения не совпадают. Реальные данные Gaia лежат в старом файле `gaia-stars-v1.json` (все 14 из 14 звёзд проверены). До того как добавлять что-то новое, нужно починить загрузку и заменить выдуманный каталог настоящим.

---

## CURRENT STATE

### Текущая архитектура (как на самом деле связаны файлы)

```
index.html  ──<script src="./main.js">──►  main.js
   │                                        ├─ canvas-звёздный фон (работает)
   │                                        ├─ FEATURED_STARS: 6 звёзд вписаны в код (не из каталога)
   │                                        ├─ Web Audio-сонификация (работает)
   │                                        └─ инфо-панель по клику (работает)
   │
   └─ <form action="explore.html" method="get" name="q">  ──►  explore.html?q=Sirius
                                                                    │
explore.html ──<link> explore.css                                   │
   └─ inline <script type="module">  ◄──────────────────────────────┘
          import { loadGaiaStars } from "./gaia-adapter.js"   ◄── СИНТАКСИЧЕСКАЯ ОШИБКА
          loadGaiaStars("./gaia-stars-v2.json")               ◄── в основном выдуманные данные

fetch_gaia_stars.py ──(ESA TAP)──► gaia-stars-v2.json / .csv   ◄── но v2.json в репо НЕ из этого скрипта
                                                                    (другие ключи и округления)

package.json + vite.config.ts + main.tsx + ts.config.json  ◄── шаблон Google AI Studio (React),
                                                               React в проекте нигде не используется
```

### Что делает каждый важный файл

| Файл | Роль | Статус |
|---|---|---|
| `index.html` | Лендинг: hero, поиск (GET-форма → `explore.html?q=`), слой featured-звёзд, инфо-панель, стили inline | Работает |
| `main.js` | Canvas-фон, эффект «скремблинга» телеметрии, Web Audio, маркеры featured-звёзд, инфо-панель | Работает, но данные вписаны в код |
| `explore.html` | Страница HUD + весь JS explore-страницы inline (поиск, `selectStar`, `initializeStarScope`, deep-link `?q=`) | Разметка/логика нормальные, но падает на импорте |
| `explore.css` (первая копия, ~1100 строк) | Стили HUD, поиска, адаптив на 800/520px | Работает |
| `gaia-adapter.js` | `raToHms`, `decToDms`, `getSpectralInfo`, резервный каталог, `loadGaiaStars` + нормализация | **Сломан** (см. ниже) |
| `fetch_gaia_stars.py` | ADQL-запрос в `gaiadr3.gaia_source`, перевод единиц, валидация, JSON/CSV | **Лучший файл проекта.** Запрос проверен, работает |
| `gaia-stars-v1.json` | 14 звёзд | **Настоящие данные Gaia DR3** (14/14 проверено) |
| `gaia-stars-v2.json` | 20 звёзд, их загружает explore | **Не Gaia**: 0/20 проходят проверку |
| `vite.config.ts` | Мультистраничная сборка (index + explore), плагины React + Tailwind | Полезна частично |
| `package.json` | `"name": "react-example"`, React, `@google/genai`, express, dotenv, motion, lucide, tailwind | В основном лишние зависимости |

### Дубли и мёртвые файлы (важно)

| Файл | Что это | Решение |
|---|---|---|
| `const starData = [.ts` | Старый вариант explore-логики, **повреждён** (строки 213–216, 336 `zz`, 433–437, 455 `==== */zz`). Имя файла тоже сломано | Удалить |
| `explore.js` (обе копии одинаковые) | Старая логика explore: ссылается на ID `starHudCard`, `proceduralStarVisual`, `starDistance`, `starTeff`, `catalogStatus`, которых в `explore.html` **нет**. Нигде не подключён | Удалить |
| Вторая пустая `explore.js`, `gaia-api.js`, `radar.js` | Пустые файлы | Удалить (идею radar записать в backlog) |
| `fallback_gaia_stars.js` | Обрезанная копия части `gaia-adapter.js` («Normalization logic continues...») | Удалить |
| `Untitled-1.html` | Кусок старой explore-страницы с вписанными в код 4 звёздами | Удалить |
| `уууууууууууууу.html` | Черновик: несколько файлов склеены в один (`explore html:`, `explore.css:`, `style.css:`, `index.html:`). Не валидный HTML | Удалить |
| `scratch.js` | Две копии `main.js`, начинается с `vvv` | Удалить |
| `style.css` | «Shared Design System», но **ни одна страница его не подключает** | Удалить (или позже реально сделать общим) |
| Вторая `explore.css` (~690 строк) | Другая, более старая версия стилей, `body { overflow: hidden }` | Удалить, источник истины = первая |
| `stars.json` | 20 ярких звёзд (литературные значения, не Gaia) | Удалить |
| `featured.json` | `[]` | Удалить или использовать для списка featured id (см. P1) |
| `main.tsx` | Точка входа React: импортирует `./App` и `./index.css`, которых **нет** | Удалить |
| `ts.config.json` | Неправильное имя (TypeScript ищет `tsconfig.json`), настройки для React | Удалить |

В дампе есть одинаковые имена (`explore.css`, `explore.js`, `main.js`, `package-lock.json` по два раза). Скорее всего, у тебя вложенная копия папки или черновые копии. Проверь командой `git ls-files` (или `dir /s /b` на Windows), какие файлы реально лежат в репозитории.

### Три реализации одного и того же (выбери источник истины)

| Что | Реализации | Источник истины |
|---|---|---|
| Цвет/класс звезды | `getSpectralPalette()` в `explore.js`, `getSpectralPalette()` в `const starData = [.ts` (сломан), `getSpectralInfo()` в `gaia-adapter.js` | `getSpectralInfo()` в `gaia-adapter.js`, но **без** выдуманных mass/lum/kicker/category |
| Логика поиска/выбора звезды | `explore.js`, `.ts`-файл, `Untitled-1.html`, `уууу.html`, inline-скрипт в `explore.html` | Inline-скрипт в `explore.html` → потом вынести в `explore-main.js` + `search.js` |
| Данные звёзд | `starData` (×2), `stars.json`, `FEATURED_STARS` в `main.js`, `FALLBACK_GAIA_STARS` (×2), `gaia-stars-v1.json`, `gaia-stars-v2.json`, данные в `Untitled-1.html` | **Единственный источник: JSON, созданный `fetch_gaia_stars.py`**, лежит в `public/data/gaia-stars.json` |
| Стили explore | `explore.css` ×2, `style.css`, inline `<style>` в `explore.html` | Первая `explore.css` (+ перенести в неё inline `:root` из `explore.html`) |

### Подходит ли структура для V1

**Да, в целом подходит.** Статический мультистраничный сайт + ванильный JS + статический JSON + офлайн Python-пайплайн — это правильная и честная архитектура для V1. React, бэкенд и база данных сейчас не нужны. Переписывать на React **не надо**: шаблон React попал в проект из AI Studio, а не потому что он нужен.

Минимальные исправления структуры (у каждого есть конкретная причина):

1. `public/data/gaia-stars.json`: Vite копирует в сборку только то, что лежит в `public/`, или то, что импортировано. Файлы, которые загружаются через `fetch("./gaia-stars-v2.json")`, в `dist/` **не попадут**.
2. `<script type="module" src="./main.js">`: скрипт без `type="module"` Vite не собирает и не копирует в `dist/`. После `vite build` лендинг останется без JS.
3. Убрать из `package.json`/`vite.config.ts` React, Tailwind, Gemini и Express: они не используются, но замедляют установку и путают тебя и AI-ассистентов («это React-проект?»).

Переименовывать `main.js` в `landing.js` и заводить папку `src/` необязательно. Не трать на это время в V1.

---

## WHAT IS WORKING

1. **Лендинг `index.html` + `main.js`** полностью рабочий:
   - canvas-фон с ограничением количества частиц (`Math.min(180, W*H/11000)`) и поддержкой `prefers-reduced-motion`;
   - `scrambleElement()` отменяет предыдущий `requestAnimationFrame`, утечек нет;
   - Web Audio: `ensureAudio()` создаёт контекст лениво, `teffToFreq()` отображает Teff на частоту. Хорошая идея сонификации;
   - позиционирование инфо-панели с защитой от выхода за экран (`openPanel`);
   - Escape и клик снаружи закрывают панель.
2. **Поиск на лендинге** отправляет `explore.html?q=...` обычной GET-формой. Это просто и правильно.
3. **Вёрстка и CSS explore-страницы**: HUD-карточка, орбиты, перекрестие, пульсация звезды, `focus-visible` у кнопок, адаптив на 800px и 520px.
4. **Логика в inline-скрипте `explore.html`** в целом хорошая: результаты создаются через `createElement` + `textContent` (безопасно, без XSS), есть обработка `?q=`, состояние «STAR NOT FOUND», `try/catch` вокруг инициализации.
5. **`fetch_gaia_stars.py`**: правильный ADQL, проверка `isfinite`, конвертация единиц с документацией, `validate_catalog()` проверяет `dist_pc == 1000/parallax`, экспорт JSON + CSV. Я выполнил этот ADQL-запрос в [архиве Gaia DR3](https://gea.esac.esa.int/archive/): он возвращает 24 валидные строки, то есть скрипт должен успешно отработать.
6. **Формулы**: `d_pc = 1000 / parallax_mas`, `1 pc = 3.26156 ly`, перевод RA/Dec в x/y/z. Всё верно.
7. **`gaia-stars-v1.json`**: все 14 source_id существуют в Gaia DR3, parallax и `teff_gspphot` совпадают с архивом (Proxima 768.0665 mas / 2829.35 K, Barnard 546.976 / 3099.63 и т. д.).

---

## WHAT IS BROKEN

### Блокеры (P0)

**B1. `gaia-adapter.js` не парсится, поэтому explore-страница не получает никаких данных.**

```js
// gaia-adapter.js, end of loadGaiaStars()
  if (!rawList || !Array.isArray(rawList) || rawList.length === 0) {
    console.warn("...");
    rawList = FALLBACK_GAIA_STARS;
                                   // <- missing closing "}" of the if-block
    eturn rawList.map((star) => {  // <- "eturn" instead of "return" => SyntaxError
```

Что происходит в браузере: модуль с синтаксической ошибкой не загружается, поэтому **весь** `<script type="module">` в `explore.html` не выполняется. Твой `try/catch` в `initializeStarScope()` ничего не поймает, потому что код до него просто не дойдёт. Пользователь видит статичный Canopus, вписанный в HTML, и пустой поиск. Отсюда ощущение, что «всё работает, только поиск пустой».

Вторая скрытая ошибка: даже если исправить `eturn` → `return`, `return` окажется **внутри** `if`. Тогда при успешном `fetch` функция вернёт `undefined`, и `stars.filter` упадёт. Скобку `}` нужно закрыть до `return`.

Мелкие ошибки в том же файле (тоже реальные баги данных):
- `"source-id"` вместо `"source_id"` у Proxima в `FALLBACK_GAIA_STARS` → у неё не будет source_id в UI и поиске;
- `"Siruis A"` (опечатка). Проверка `star.name.includes("Sirius")` для неё не сработает;
- `"AlphaBoГ¶tis"` (без пробела и в неправильной кодировке), Arcturus `distance_pc: 88.83` (это значение parallax; правильно ~11.26 pc);
- `responce`: только опечатка, но запутывает при чтении.

**B2. Каталог `gaia-stars-v2.json` не из Gaia DR3.** Проверка по архиву (скрипт `scripts/verify_catalog.py` приложен):

| Звезда в v2 | Результат |
|---|---|
| Alpha Cen A, Alpha Cen B, Wolf 359, Lalande 21185, Ross 154, Ross 248, Ross 128, EZ Aqr A, Procyon A, Canopus, Vega, Rigel, Betelgeuse, Arcturus | **source_id не существует в Gaia DR3** (15 звёзд) |
| Sirius A (`2947050466531873024`) | ID существует, но это источник с G = 8.52 и parallax 374.49 (по положению и яркости это Sirius B, а не Sirius A). `teff_gspphot` = NULL, в файле же 9940 K |
| Luyten 726-8 A (`2452378776434477184`) | ID существует, но это звезда G = 3.30 на RA 26.0°, Dec −15.9° с parallax 273.8. Это координаты **Tau Ceti**, а не Luyten 726-8 |
| Proxima, Barnard, Eps Eri, Lacaille 9352 | ID верные, но в файле литературные значения Teff (3042, 3134, 5084, 3688), а не Gaia `teff_gspphot` (2829, 3100, 5002, 3376) |

Итог: **0 из 20** записей v2 честно соответствуют Gaia DR3. Судя по ключам (`distance_pc`/`distance_ly`) и округлениям, v2 не был создан `fetch_gaia_stars.py`. Его, скорее всего, сгенерировал AI. Это самая важная проблема проекта, потому что главный заявленный смысл StarScope в том, что он «технически настоящий».

**B3. Самые яркие звёзды в Gaia DR3 почти отсутствуют.** Я сделал cone search радиусом 72″ вокруг Sirius, Vega, Canopus, Betelgeuse, Arcturus, Alpha Cen, Procyon: ни одной яркой звезды нет, только слабые соседи с G = 13–19 (у Sirius есть только Sirius B с G = 8.5). У тебя же лендинг предлагает «Search a star (e.g. Sirius, Vega)», а `FEATURED_STARS` в `main.js` состоит из Sirius, Arcturus, Vega, Rigel, Betelgeuse, Proxima: 5 из 6 не в Gaia. Это продуктовое решение, а не только баг: для V1 featured-звёзды и подсказки должны быть из реального Gaia-каталога (Proxima, Barnard's Star, 61 Cygni A, Epsilon Eridani, Atlas (Плеяды), 51 Pegasi…). Яркие звёзды можно добавить в V1.1 из другого источника (Hipparcos/SIMBAD) с честной меткой источника.

**B4. `KNOWN_NAMES` в `fetch_gaia_stars.py` в основном выдуман.** Реальный запрос скрипта возвращает, например, `762815470562110464` (parallax 392.75 — это Lalande 21185) и `4075141768785646848` (parallax 336.03 — Ross 154), а в словаре для этих звёзд указаны несуществующие ID. Скрипт сработает, но большинство звёзд получат имя вида `Gaia DR3 762815470562110464`. Решение: оставить в словаре только проверенные ID (все 14 ID из v1 проверены) и позже подтягивать имена автоматически через SIMBAD.

**B5. Несовпадение ключей пайплайна и адаптера.** `build_star_entry()` пишет `dist_pc`/`dist_ly`, а `gaia-adapter.js` читает `distance_pc`/`distance_ly`. Если запустить скрипт и подключить его JSON, адаптер не найдёт расстояние и подставит заглушку `10` (`: 10));`). У всех звёзд будет «10 LY», и никакой ошибки ты не увидишь. Выбери одно имя. Предлагаю `distance_pc`/`distance_ly` в пайплайне (одна правка в Python, адаптер не меняется).

**B6. Сборка Vite ломает сайт** (см. «Подходит ли структура»): `main.js` без `type="module"` не попадёт в `dist/`, а `gaia-stars-v2.json` не лежит в `public/`. На GitHub Pages / Netlify после `npm run build` не будет ни JS лендинга, ни данных.

### Фальшивые / демо / статические данные

| Где | Что выдумано |
|---|---|
| `getSpectralInfo()` | `mass` и `lum` назначаются **по диапазону температуры**: у всех M-звёзд «0.12 M☉ / 0.0017 L☉», у всех B-звёзд «18.0 M☉». `kicker` «SPECTRAL CLASS B8 Ia» / «F0 II» и `category` «BLUE SUPERGIANT» / «BRIGHT GIANT» одинаковые для всех звёзд диапазона. Это выглядит как измерение, но им не является |
| `if (star.id === "canopus")…` overrides | Ручные значения массы/светимости для звёзд, которых нет в Gaia |
| `explore.html` статическая разметка | Canopus «10,700 L☉ / 8.0 M☉», `SPECTRAL RESOLUTION // 0.02 Å`, `SPECTRAL ANALYSIS // 0.65µm` — декор, выглядящий как данные |
| `index.html` | `EPOCH J2026.2`, `FOV 060°` — декор. Координаты Gaia DR3 даны на эпоху **J2016.0**. Комментарий в `main.js` «Gaia DR3 / SIMBAD epoch J2000» неверен |
| `main.js` `FEATURED_STARS` | 6 звёзд вписаны в код; позиции `x/y` в vw/vh — декоративные, не небесные |
| `normalize: Number(star.temperature \|\| 5000)` | Если Teff отсутствует, UI покажет 5000 K как будто это измерение |

Правило на будущее: **декоративные надписи можно оставлять** (это часть HUD-эстетики), но их нельзя путать с данными. Любое число рядом с единицей измерения (K, LY, M☉, L☉, mas) должно приходить из каталога, иначе показываем «—».

### Реально подключено к настоящим данным

- `fetch_gaia_stars.py` → ESA Gaia TAP: **да, по-настоящему** (запрос проверен).
- `gaia-stars-v1.json`: **да** (14/14).
- Всё, что сейчас видит пользователь: **нет**. Лендинг показывает вписанные в код значения, explore не загружает ничего.

### UX-проблемы

- В `renderResults()` класс `is-selected` получает всегда первый результат (`index === 0`), а не реально выбранная звезда.
- Enter в поле поиска на explore ничего не делает (в старом `explore.js` был, в новом потерян). Нет навигации стрелками.
- Deep-link `?q=` использует `includes`: `?q=a` откроет первую звезду, содержащую «a». Нужен ранжированный поиск (точное → префикс → подстрока).
- При выборе звезды URL не меняется: ссылкой на звезду нельзя поделиться.
- Инфо-панель на лендинге не ведёт в explore (нет «OPEN IN EXPLORER»), хотя это главный переход между страницами.
- Звук **включён по умолчанию** (`data-on="true"`), а щелчок звучит уже при наведении. Для научного инструмента лучше по умолчанию OFF.
- Поиск по «Bootis» не найдёт «Boötis», по «61cyg» не найдёт «61 Cygni» (нет нормализации).

### Производительность

Серьёзных проблем нет, объём данных мизерный. Мелочи:
- `renderStarfield()` использует `t++` на кадр, поэтому скорость мерцания зависит от частоты экрана (60 vs 144 Гц). Лучше использовать timestamp из `requestAnimationFrame`.
- Цикл `candidatePaths` делает до 5 `fetch` подряд с молчаливыми `catch`: это маскирует ошибки. Нужен один путь и честная ошибка.
- Google Fonts блокирует рендер. Допустимо для V1, `display=swap` уже стоит.
- `package-lock.json` тянет ~130 пакетов (React, Gemini SDK, google-auth-library, express), которые не нужны.

### Доступность (a11y)

- Много текста 9–10px (`.featured-star .tag`, `.info-grid`, `.footer-status`). Минимум 11–12px.
- `role="listbox"` у `<ul>`, а внутри `<li><button role="option">`: неправильный ARIA-паттерн (option не может быть кнопкой внутри li). Либо обычный список кнопок без listbox, либо полноценный combobox-паттерн с `aria-activedescendant`.
- Маркеры featured-звёзд: телеметрия обновляется по `mouseenter`, но не по `focus`. С клавиатуры эффекта нет.
- Инфо-панель `role="dialog"`: фокус не переносится внутрь и не возвращается на маркер после закрытия.
- `@keyframes starPulse` в `explore.css` не отключается при `prefers-reduced-motion` (в `main.js` это учтено, в CSS нет).
- Ссылка «‹ LANDING» со стилями inline.

### Мобильная версия

- `index.html`: `html, body { overflow: hidden; height: 100% }` и featured-маркеры с позицией `left: 15vw; top: 22vh` → на телефоне маркеры налезают на заголовок и поле поиска. Инфо-панель фиксированной ширины 260px.
- Вторая `explore.css` ставит `body { overflow: hidden }` — если подключится именно она, на маленьком экране контент обрежется без прокрутки.
- `.observatory { min-height: 560px; height: min(720px, calc(100vh - 160px)) }` — на телефонах в горизонтальном положении не помещается. Первая `explore.css` в `@media (max-width: 800px)` частично это решает, проверь на 360×640 и 640×360.

### Безопасность и надёжность

- `innerHTML` с данными звезды есть в мёртвом `explore.js` и в `main.js` (`btn.innerHTML = \`<span class="tag">${star.name...}\``). Сейчас данные локальные, риск низкий, но как только имена будут приходить из SIMBAD/внешнего API, это станет XSS. Используй `textContent`, как уже сделано в `explore.html`.
- В `package.json` есть `@google/genai` и `dotenv`: если в папке остался `.env` с `GEMINI_API_KEY` из AI Studio, проверь, что он в `.gitignore` и никогда не попадал в историю (`git log --all -- .env`).
- Молчаливые `catch {}` и fallback на выдуманные данные: это проблема надёжности. Пользователь не узнает, что данные не загрузились, и увидит «Gaia DR3» на ненастоящих числах.

### Кодировка

В дампе видны `вЂ”` вместо «—», `Mв‰` вместо «M☉», `В°` вместо «°», `BoГ¶tis` вместо «Boötis». Частично это может быть артефакт того, как собирался дамп. Но в `vite.config.ts` виден **двойной** мусор `ГўВЂВ”`, значит как минимум этот файл уже был пересохранён в неправильной кодировке. Открой страницы в браузере: если в заголовке вкладки «StarScope вЂ” Observatory HUD», файлы нужно пересохранить в UTF-8 (в VS Code: «Reopen with Encoding → Windows 1251», затем «Save with Encoding → UTF-8»).

### Зависимости

`package.json` — это шаблон `react-example`: `react`, `react-dom`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `tailwindcss`, `autoprefixer`, `@google/genai`, `express`, `@types/express`, `dotenv`, `motion`, `lucide-react`, `tsx`, `esbuild`, `typescript` не используются ни одним файлом, который реально загружают страницы. Скрипт `lint: tsc --noEmit` без `tsconfig.json` (у тебя `ts.config.json`) проверяет не то, что ты думаешь. Нужен только `vite`.

---

## WHAT STARSCOPE V1 SHOULD BE

### V1 GOAL

**StarScope V1: задеплоенный веб-обсерваторий, где можно найти и изучить каждую звезду небольшого проверенного каталога Gaia DR3, и каждое показанное число честно взято из Gaia или явно помечено как вычисленное.**

### V1 MUST-HAVE

1. Explore загружает каталог без ошибок, в консоли нет ошибок.
2. **Один** каталог `public/data/gaia-stars.json`, созданный `fetch_gaia_stars.py`: ~20–40 звёзд (ближайшие + проверенный список «интересных» ID из v1). `verify_catalog.py` проходит на 100%.
3. HUD звезды показывает только реальные поля: имя, Gaia DR3 source_id, RA/Dec (J2016.0), parallax (± error), расстояние (pc/ly, помечено «derived: 1000/parallax»), Teff GSP-Phot, G mag, «≈ класс по Teff». Нет данных → «—».
4. Работающий поиск: имя, алиасы, source_id; ранжирование; Enter; стрелки; корректный `is-selected`; «ничего не найдено».
5. Deep-links: `explore.html?q=barnard` и `explore.html?star=barnards-star`; URL обновляется при выборе звезды.
6. Лендинг связан с каталогом: featured-звёзды из того же JSON, из инфо-панели можно перейти в explore.
7. Нормальная работа на телефоне (360px) и с клавиатуры.
8. Деплой (GitHub Pages) через `vite build`, рабочий публичный URL.
9. README (что это, как запустить, откуда данные), `DATA.md` (поля, единицы, ограничения: «яркие звёзды отсутствуют в Gaia»), `CHANGELOG.md`.
10. Мёртвые файлы удалены, зависимости очищены.

### V1 NICE-TO-HAVE

- Unit-тесты для `search.js` и `normalizeStar()` на встроенном `node --test` (без новых зависимостей). Я бы поднял их почти до must-have, это 2 часа работы.
- Сонификация (Teff → тон) на explore-странице, код уже есть в `main.js`.
- Кнопка «copy source_id» / ссылка на страницу звезды в Gaia Archive или SIMBAD.
- Фильтр по классу температуры (M/K/G/…).

### NOT V1 (осознанно откладываем)

- Живые запросы к Gaia из браузера. ESA TAP не отдаёт CORS-заголовок (проверил: `Access-Control-Allow-Origin` в ответе нет), значит нужен прокси/бэкенд. Это V2.
- 3D-визуализация (Three.js), хотя x/y/z уже считаются.
- HR-диаграмма и карта неба (V1.2).
- Масса/светимость/радиус (FLAME): V1.1, и только из Gaia `astrophysical_parameters`.
- React/TypeScript-миграция, аккаунты, избранное, база данных, AI-чат про звёзды (`@google/genai` удалить).
- Тысячи звёзд.

### Близко ли к V1?

Визуально близко, по сути нет. Не хватает одной **крупной** части: **настоящего конвейера данных «Gaia → JSON → UI»**, который сейчас разорван в трёх местах (синтаксическая ошибка адаптера, выдуманный v2, несовпадение ключей `dist_*`/`distance_*`). После починки этого (~8–10 часов) остаток до V1 — это поиск, связка лендинга, адаптив, деплой и документация. Итого **~35–45 часов** реальной работы, то есть 3–5 недель по 1,5–2 часа в день.

---

## V1 → V1.1 → V1.2 → V2 ROADMAP

```
Current State (v0.1-prototype)   красиво, но данные не грузятся / не настоящие
        ↓   ~35–45 ч
V1.0  "Honest Gaia Explorer"     настоящий проверенный каталог + поиск + деплой
        ↓   ~20–25 ч
V1.1  "Deeper Data"              больше звёзд, реальные физ. параметры, имена из SIMBAD, CI-проверка
        ↓   ~20–30 ч
V1.2  "See the Data"             HR-диаграмма + карта неба, связанные с выбором звезды
        ↓   ~40–60 ч
V2.0  "Live Archive"             поиск любой звезды Gaia через свой прокси к TAP
```

### Current State → V1.0 «Honest Gaia Explorer»

- **Главная цель:** превратить демо в настоящий продукт на реальных данных.
- **Фичи:** см. V1 MUST-HAVE.
- **Техническая работа:** фикс адаптера; удаление дублей; очистка Vite; доработка пайплайна (ключи, `phot_g_mean_mag`, `parallax_error`, режим «список ID»); `verify_catalog.py`; вынос JS из `explore.html` в `explore-main.js` + `search.js`; честный HUD; связка лендинга; a11y/адаптив; GitHub Pages.
- **Чему научишься:** ES-модули и как браузер обрабатывает ошибку импорта; как Vite собирает мультистраничный сайт и что такое `public/`; ADQL/TAP; parallax → distance и почему яркие звёзды выпадают из Gaia; чистые функции и unit-тесты; ARIA combobox; CI/CD-деплой.
- **Коммиты:** `chore: snapshot prototype`, `fix(adapter): …`, `chore: remove dead prototype files`, `build: drop unused React template deps`, `data: regenerate catalog from Gaia DR3`, `feat(search): ranked search`, `feat(explore): shareable ?star= URLs`, `ci: deploy to GitHub Pages`, `docs: README + DATA.md`.
- **Devlog:** «Почему мой explore молчал: синтаксическая ошибка в ES-модуле»; «Я проверил свой каталог по архиву Gaia, и 0 из 20 звёзд прошли»; «Почему Сириуса и Веги нет в Gaia DR3»; «Первый деплой».
- **Объём:** ~35–45 ч.
- **Definition of done:** см. последний раздел.

### V1.1 «Deeper Data»

- **Главная цель:** каталог глубже и больше, а качество данных автоматически защищено.
- **Фичи:**
  - JOIN с `gaiadr3.astrophysical_parameters`: `mass_flame`, `lum_flame`, `radius_flame` (есть не у всех звёзд, у M-карликов часто NULL → «—»). Вместо выдуманных M☉/L☉ появятся настоящие;
  - `bp_rp` (цвет) и абсолютная звёздная величина `M_G = G + 5·log10(parallax_mas/100)`: они понадобятся для HR-диаграммы в V1.2;
  - автоматические имена через SIMBAD TAP (там CORS разрешён, но в пайплайне это не важно), вместо ручного `KNOWN_NAMES`;
  - каталог 200–500 звёзд (например, `parallax > 50 AND phot_g_mean_mag < 12 AND parallax_over_error > 10` + curated список);
  - сортировка/фильтры (расстояние, класс по Teff); виртуализация списка не нужна до ~1000;
  - GitHub Action: `verify_catalog.py` на каждом PR, который меняет `public/data/`;
  - опционально: отдельный раздел «Яркие звёзды (Hipparcos via SIMBAD)» с чёткой меткой источника.
- **Чему научишься:** JOIN в ADQL, работа с NULL, качество астрометрии (`parallax_over_error`, `ruwe`), кросс-матчинг каталогов, CI.
- **Коммиты:** `data(pipeline): join FLAME astrophysical parameters`, `data(pipeline): resolve names via SIMBAD`, `feat(explore): filter by temperature class`, `ci: verify catalog on PR`.
- **Devlog:** «Откуда берётся масса звезды в Gaia (FLAME)»; «Как я автоматически сопоставил Gaia и SIMBAD».
- **Объём:** ~20–25 ч.
- **DoD:** ≥200 звёзд, 100% verify, ни одного числа без источника, CI зелёный, время загрузки каталога < 300 мс на обычном 4G.

### V1.2 «See the Data»

- **Главная цель:** научная визуализация, которая объясняет данные, а не просто украшает.
- **Фичи (только две):**
  1. **HR-диаграмма** (`bp_rp` по X, `M_G` по Y) на `<canvas>`: выбранная звезда подсвечена, клик по точке выбирает звезду. Это самый «научный» и узнаваемый график в астрономии.
  2. **Карта неба** (RA/Dec, равнопромежуточная проекция или Aitoff): это и есть логичное место для идеи из пустого `radar.js`.
  - Общий модуль состояния «выбранная звезда» (простой pub/sub на 20 строк, не Redux).
- **Чему научишься:** системы координат, проекции, canvas hit-testing, devicePixelRatio, связывание нескольких видов через состояние.
- **Коммиты:** `feat(charts): HR diagram`, `feat(charts): sky map projection`, `refactor: shared selection state`, `perf(charts): hit-test via grid`.
- **Devlog:** «Строю HR-диаграмму из настоящих данных Gaia»; «Проекция Aitoff для карты неба».
- **Объём:** ~20–30 ч.
- **DoD:** обе диаграммы работают с клавиатурой (альтернатива — таблица/список), корректны на Retina, выбор синхронизирован с HUD.

### V2.0 «Live Archive»

- **Главная цель:** выйти за пределы статического каталога: найти любую звезду Gaia DR3 по имени или source_id.
- **Фичи:** поиск по имени → SIMBAD (разрешение имени в координаты/ID) → Gaia TAP по source_id → HUD; кеш результатов; «Near this star» (cone search).
- **Техническая работа:** маленький прокси (Cloudflare Worker или Vercel function, ~100 строк), потому что ESA TAP не отдаёт CORS; whitelisting запросов (только параметризованные шаблоны с числовым source_id, **никакого свободного ADQL от пользователя**); rate limiting; таймауты; состояния загрузки/ошибок.
- **Чему научишься:** серверные функции, CORS, безопасность API (инъекции в ADQL), кеширование, работа с медленными внешними сервисами.
- **Объём:** ~40–60 ч.
- **DoD:** поиск «Tau Ceti» и произвольного source_id работает за < 3 с, ошибки архива отображаются понятно, прокси нельзя использовать для произвольных запросов.

3D-соседство Солнца (x/y/z уже есть) — это **P4-эксперимент** после V1.2, а не отдельная версия, пока ты не решишь, что это ядро продукта.

---

## CONTINUE STARSCOPE OR START A NEW PROJECT?

**Продолжай StarScope.** Причины:
- у проекта есть настоящая, редкая для портфолио фишка: реальный научный архив, ADQL и проверка данных;
- самая сложная и полезная работа (честный конвейер данных, тесты, деплой) ещё впереди: именно она делает тебя разработчиком, а не новый проект;
- нынешние трудности (сломанный импорт, выдуманные данные) — нормальные инженерные задачи, а не признак тупика.

**Когда второй проект действительно оправдан:**
- после релиза V1 (или V1.1), если тебе нужен навык, который StarScope **естественно не требует**: база данных + аутентификация, мобильная разработка, бэкенд с состоянием;
- учебное или конкурсное требование с дедлайном (хакатон: в `main.js` есть «NASA Hackathon Edition»). Тогда проект ограничен по времени, а StarScope ставится на паузу с записью в `DEVLOG.md`: где остановился, что дальше.

**Законная причина временно переключиться:** ты упёрся во внешнюю блокировку (например, архив Gaia недоступен несколько дней) **и** записал, что делать по возвращении. Или 1–2-недельный мини-проект, который напрямую прокачивает навык для StarScope (например, «попробовать canvas-графики» перед V1.2).

**Плохие причины бросить StarScope:**
- «AI нагенерировал хаос, проще начать заново» (нет: удалить 12 мёртвых файлов займёт час);
- застрял на баге больше двух дней;
- новая идея кажется интереснее;
- «код не идеальный» / «надо переписать на React/TS»;
- хочется «больше проектов на GitHub» ради количества.

**Когда StarScope можно считать достаточно завершённым:** после **V1.2**: задеплоен, данные проверяются CI, есть тесты, HR-диаграмма и карта неба, README + DATA.md + CHANGELOG, нет известных P0/P1 багов. После этого переводи его в режим поддержки (фиксы, мелкие улучшения). V2 делай, только если тебе реально интересен бэкенд.

---

## PRIORITIZED BACKLOG

Порядок = порядок выполнения. «Commit?» показывает, заслуживает ли задача собственного коммита.

### P0: блокирующие

**P0-1. Снимок текущего состояния**
- Зачем: безопасная точка возврата перед удалением файлов; честная история «вот откуда я начал».
- Файлы: весь репозиторий, `.gitignore`.
- Что сделать: проверить `.gitignore` (`node_modules/`, `dist/`, `.env`, `__pycache__/`, `*.csv` по желанию). `git add -A && git commit -m "chore: snapshot prototype before V1 cleanup"`, `git tag v0.1-prototype`, `git push --tags`.
- Готово, когда: тег виден на GitHub, `.env` не в истории (`git log --all -- .env` пусто).
- Время: 20–30 мин. Commit: да.

**P0-2. Починить `gaia-adapter.js`**
- Зачем: сейчас explore вообще не получает данные (B1).
- Файлы: `gaia-adapter.js`, `explore.html` (путь к данным).
- Что сделать: закрыть `if`-блок до `return`, `eturn` → `return`; удалить `FALLBACK_GAIA_STARS` и цикл `candidatePaths` (fallback нужен был только из-за `file://`, а с Vite dev server это не нужно); бросать понятную ошибку при неудачном `fetch`; вынести нормализацию в экспортируемую чистую функцию `normalizeStar(raw)`; `Number(x || 5000)` → `null`, если данных нет. Эталон приложен в `reference/gaia-adapter.js`: **сначала попробуй исправить сам**, потом сравни.
- Готово, когда: `npx vite` → `http://localhost:5173/explore.html` показывает список звёзд, в консоли нет ошибок; при переименовании JSON появляется «CATALOG UNAVAILABLE».
- Время: 1–1,5 ч. Commit: да (`fix(adapter): …`).

**P0-3. Удалить мёртвые и дублирующиеся файлы**
- Зачем: 12+ файлов с противоречивой логикой путают тебя и AI-ассистента («какой explore.js настоящий?»).
- Файлы: `const starData = [.ts`, `explore.js`, `gaia-api.js`, `radar.js`, `fallback_gaia_stars.js`, `Untitled-1.html`, `уууууууууууууу.html`, `scratch.js`, `style.css`, вторая `explore.css`, `stars.json`, `featured.json`, `main.tsx`, `ts.config.json`.
- Что сделать: перед удалением каждого файла выполнить `grep -rn "имя_файла" --include=*.html --include=*.js .` и убедиться, что на него никто не ссылается. Удалять через `git rm`: история сохранится.
- Готово, когда: в корне остались только `index.html`, `explore.html`, `explore.css`, `main.js`, `gaia-adapter.js`, `fetch_gaia_stars.py`, данные, конфиги; обе страницы работают как до удаления.
- Время: 45–60 мин. Commit: да, один (`chore: remove dead prototype files`), в описании перечисли файлы.

**P0-4. Починить сборку и зависимости**
- Зачем: B6. Без этого деплой сломан.
- Файлы: `package.json`, `package-lock.json`, `vite.config.ts`, `index.html`, `explore.html`, новая папка `public/data/`.
- Что сделать: `npm uninstall react react-dom @vitejs/plugin-react @tailwindcss/vite tailwindcss autoprefixer @google/genai express @types/express dotenv motion lucide-react tsx esbuild typescript @types/react @types/react-dom @types/node`; `"name": "starscope"`, `"version": "0.1.0"`; убрать скрипты `clean`/`lint`. `vite.config.ts` → минимальный (см. ниже). `<script type="module" src="./main.js">`. `gaia-stars-*.json` → `public/data/`.
- Готово, когда: `npm run build && npm run preview`: обе страницы, анимации и данные работают из `dist/`.
- Время: 1,5–2 ч. Commit: 2 коммита (`build: drop unused React template deps`, `build: fix production bundle (module script, public data)`).

```ts
// vite.config.ts - minimal multi-page static build
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./", // relative asset paths work on GitHub Pages project sites
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        explore: resolve(__dirname, "explore.html"),
      },
    },
  },
});
```

**P0-5. Кодировка UTF-8**
- Зачем: «вЂ”» в заголовке вкладки и «Mв‰» вместо «M☉» выглядят как сломанный сайт.
- Файлы: все `.html`, `.js`, `.css`, `vite.config.ts`.
- Что сделать: проверить в браузере; пересохранить сломанные файлы в UTF-8; добавить `.editorconfig` с `charset = utf-8`.
- Готово, когда: `grep -rn "вЂ\|Г¶\|в‰" --include=*.html --include=*.js --include=*.css .` ничего не находит.
- Время: 30–45 мин. Commit: да (`fix: re-save files as UTF-8`).

### P1: важно для V1

**P1-1. Настоящий каталог из пайплайна**
- Зачем: B2, B4, B5. Это центр V1.
- Файлы: `fetch_gaia_stars.py`, новый `requirements.txt` (`astroquery`, `astropy`), `public/data/gaia-stars.json`.
- Что сделать: (1) ключи `dist_pc/dist_ly` → `distance_pc/distance_ly`; (2) добавить в SELECT `phot_g_mean_mag`, `parallax_error`, `bp_rp`; (3) убрать `teff_gspphot IS NOT NULL` из фильтра (иначе выпадут звёзды без Teff), NULL сохранять как `null`; (4) второй режим: `CURATED_SOURCE_IDS` = 14 проверенных ID из `gaia-stars-v1.json` → `WHERE source_id IN (...)`; объединить с ближайшими; (5) `KNOWN_NAMES` оставить только для проверенных ID (удалить выдуманные); (6) `validate_catalog`: заменить «ровно 15» на «≥ N»; (7) выводить в `public/data/gaia-stars.json`.
- Готово, когда: `python fetch_gaia_stars.py` создаёт файл, `python scripts/verify_catalog.py public/data/gaia-stars.json` → 100% OK, explore показывает эти звёзды. Старые `gaia-stars-v1.json`/`v2.json` удалены.
- Время: 3–4 ч. Commit: 2 (`data(pipeline): …` для кода скрипта, `data: regenerate catalog from Gaia DR3` для JSON). Код и сгенерированные данные коммить отдельно.

**P1-2. Добавить `verify_catalog.py`**
- Зачем: автоматическая защита от повторения ситуации с v2.
- Файлы: `scripts/verify_catalog.py` (приложен, только стандартная библиотека).
- Что сделать: прочитать построчно и понять, запустить на старом v2 (увидишь 0/20) и на новом каталоге.
- Готово, когда: запуск на новом каталоге возвращает exit code 0.
- Время: 30–45 мин (включая чтение кода). Commit: да (`test(data): verify catalog against Gaia DR3`).

**P1-3. Честный HUD**
- Зачем: убрать выдуманные mass/lum/kicker/category.
- Файлы: `explore.html` (разметка метрик и `selectStar`), `gaia-adapter.js`.
- Что сделать: метрики → `TEFF (GSP-PHOT)`, `DISTANCE`, `PARALLAX` (с ± error), `G MAG`; kicker → «≈ K-TYPE · FROM TEFF»; удалить overrides для Canopus/Sirius/…; статический Canopus в разметке заменить нейтральным «ACQUIRING TARGET…»; `EPOCH` → `J2016.0`; добавить в карточку строку источника «SOURCE // GAIA DR3 · RETRIEVED 2026-…».
- Готово, когда: у каждого числа есть источник, отсутствующие значения показываются как «—».
- Время: 2–2,5 ч. Commit: да (`feat(explore): show only measured Gaia fields`).

**P1-4. Вынести JS из `explore.html`**
- Зачем: 200+ строк inline-скрипта нельзя протестировать и неудобно ревьюить.
- Файлы: `explore.html` → новые `explore-main.js` (DOM) и `search.js` (чистая логика).
- Что сделать: перенос **без изменения поведения**: сначала рефакторинг, потом фичи.
- Готово, когда: поведение идентично, `explore.html` содержит только `<script type="module" src="./explore-main.js">`.
- Время: 1,5–2 ч. Commit: да (`refactor(explore): move inline script to modules`).

**P1-5. Поиск, который работает**
- Зачем: второй главный приоритет из твоего списка.
- Файлы: `search.js`, `explore-main.js`, `explore.html`, `explore.css`.
- Что сделать: `searchStars()` с ранжированием и нормализацией (эталон в `reference/search.js`, 5 тестов проходят); Enter выбирает первый результат; ↑/↓ двигают выделение (`aria-activedescendant`); `is-selected` = реально выбранная звезда; счётчик «N TARGETS»; `?q=` использует тот же `searchStars()`; при выборе `history.replaceState(null, "", "?star=" + star.id)`; `?star=` открывает звезду.
- Готово, когда: «barnards», «61 cyg», «gj 551», полный source_id находят нужную звезду; Enter/стрелки/Esc работают без мыши; ссылка `?star=` открывает ту же звезду в новой вкладке.
- Время: 3–4 ч. Commit: 2–3 (`feat(search): ranked, normalized search`, `feat(search): keyboard navigation`, `feat(explore): shareable ?star= URLs`).

**P1-6. Unit-тесты**
- Зачем: поиск и нормализация — самые ломкие места, а AI-правки часто их ломают незаметно.
- Файлы: `tests/search.test.js`, `tests/gaia-adapter.test.js` (приложены), `package.json` (`"test": "node --test tests/"`).
- Готово, когда: `npm test` зелёный; ты сам добавил хотя бы один тест на баг, который нашёл.
- Время: 1,5–2 ч. Commit: да (`test: search and adapter unit tests`).

**P1-7. Связать лендинг с каталогом**
- Зачем: сейчас лендинг показывает 5 звёзд не из Gaia и никуда не ведёт.
- Файлы: `main.js`, `index.html`.
- Что сделать: `FEATURED_STARS` → загрузка `public/data/gaia-stars.json` и список `FEATURED_IDS` (позиции x/y можно оставить декоративными, но значения брать из каталога); кнопка «OPEN IN EXPLORER →» в инфо-панели (`explore.html?star=id`); placeholder «Search a star (e.g. Proxima, Barnard)»; звук OFF по умолчанию; `btn.innerHTML` → `textContent`; `focus`/`blur` = `mouseenter`/`mouseleave`.
- Готово, когда: цифры на лендинге и в explore для одной звезды совпадают, переход работает.
- Время: 2,5–3 ч. Commit: 2 (`feat(landing): featured stars from Gaia catalog`, `fix(landing): audio off by default`).

**P1-8. Адаптив и доступность**
- Файлы: `explore.css`, `index.html` (inline style), `main.js`.
- Что сделать: проверить 360×640, 768×1024, 640×360 в DevTools; на мобильном featured-маркеры скрыть или разместить вне hero; шрифты ≥ 11px; `@media (prefers-reduced-motion: reduce) { .procedural-star { animation: none } }`; фокус в инфо-панели; исправить ARIA-паттерн listbox; Lighthouse Accessibility ≥ 90.
- Готово, когда: Lighthouse a11y ≥ 90 на обеих страницах, на 360px ничего не перекрывается, всё доступно с клавиатуры.
- Время: 3–4 ч. Commit: 2–3 (по странице или по теме: `style(responsive): …`, `fix(a11y): …`).

**P1-9. Деплой на GitHub Pages**
- Файлы: `.github/workflows/deploy.yml`.
- Что сделать: официальный workflow «Deploy static content» + `npm ci && npm run build`, артефакт `dist/`.
- Готово, когда: публичный URL, обе страницы и данные работают, ссылка в README.
- Время: 1,5–2 ч (включая отладку путей). Commit: да (`ci: deploy to GitHub Pages`).

**P1-10. Документация V1 + релиз**
- Файлы: `README.md`, `DATA.md`, `CHANGELOG.md`, `DEVLOG.md`.
- Что сделать: README (скриншот, URL, запуск, структура); DATA.md (каждое поле: источник, единицы, derived/measured; эпоха J2016.0; почему нет Sirius/Vega); CHANGELOG 1.0.0; тег `v1.0.0` + GitHub Release.
- Время: 2–3 ч. Commit: да (`docs: …`), затем тег.

### P2: V1.1

| # | Задача | Зачем | Файлы | Готово, когда | Время | Commit |
|---|---|---|---|---|---|---|
| P2-1 | JOIN `astrophysical_parameters` (FLAME mass/lum/radius) | Настоящие M☉/L☉ вместо выдуманных | `fetch_gaia_stars.py`, `gaia-adapter.js`, `explore.html` | Значения совпадают с архивом, NULL → «—» | 3 ч | да |
| P2-2 | Имена через SIMBAD | Убрать ручной `KNOWN_NAMES` | `fetch_gaia_stars.py` | ≥90% звёзд с именем получили его автоматически | 3–4 ч | да |
| P2-3 | Каталог 200–500 звёзд + фильтр качества (`parallax_over_error > 10`) | Больше звёзд для исследования, данные для HR-диаграммы | пайплайн, JSON | verify 100%, файл < 300 KB | 2 ч | да (код и данные отдельно) |
| P2-4 | Фильтры/сортировка | С 300 звёздами один поиск неудобен | `search.js`, `explore-main.js` | фильтр по классу + сортировка по расстоянию, покрыто тестами | 3 ч | да |
| P2-5 | CI: `verify_catalog.py` + `npm test` на PR | Автоматическая защита качества | `.github/workflows/ci.yml` | PR с фейковой звездой краснеет | 1,5 ч | да |
| P2-6 | Состояния загрузки/ошибки + timeout `fetch` (`AbortController`) | Надёжность на плохом интернете | `gaia-adapter.js`, `explore-main.js` | throttling «Slow 3G» в DevTools выглядит нормально | 1–1,5 ч | да |

### P3: V1.2 и позже

| # | Задача | Время |
|---|---|---|
| P3-1 | Модуль выбранной звезды (pub/sub) | 1–2 ч |
| P3-2 | HR-диаграмма на canvas, клик → выбор | 6–8 ч |
| P3-3 | Карта неба (RA/Dec, Aitoff) | 6–8 ч |
| P3-4 | Текстовая альтернатива для графиков (a11y) | 2 ч |
| P3-5 | V2: прокси к Gaia TAP + разрешение имён через SIMBAD | 40–60 ч |

### P4: опциональные эксперименты

- Сонификация Teff на explore (переиспользовать `playStarTone` из `main.js` через общий модуль `audio.js`): 2 ч.
- 3D-окрестность Солнца по x/y/z (Three.js) в отдельной ветке `experiment/3d`: 8–12 ч. Сливать в main только если действительно полезно.
- Раздел «яркие звёзды (Hipparcos)» с меткой источника: 4 ч.

---

## LEGITIMATE CODING-HOUR SYSTEM

### Что считается реальной разработкой

| Категория | Пример в StarScope |
|---|---|
| Реализация фич | ранжированный поиск, `?star=` URL, HR-диаграмма |
| Отладка | найти, почему explore молчит (B1), почему все звёзды «10 LY» (B5) |
| Расследование багов | воспроизвести, записать шаги, найти причину в DevTools |
| Рефакторинг | вынести inline-скрипт в модули без изменения поведения |
| Понимание существующего кода | прочитать `fetch_gaia_stars.py` и объяснить каждую функцию своими словами |
| Документация (чтение) | Vite `public/`, MDN ES modules, Gaia DR3 data model, ADQL |
| Работа с данными / API | ADQL-запросы в Gaia Archive, проверка значений, SIMBAD |
| Тесты | писать `node --test`, прогонять `verify_catalog.py` |
| Архитектура | решать, где источник истины данных, составлять схему модулей |
| Git/GitHub | ветки, осмысленные коммиты, PR с самоцензурой, релизы |
| Деплой | GitHub Pages, отладка путей в `dist/` |
| a11y / адаптив / перформанс | Lighthouse, клавиатурная навигация, профилирование canvas |
| Техническое исследование | «почему Веги нет в Gaia», «что такое FLAME» — с записью вывода в DATA.md или DEVLOG |
| Техническая документация | README, DATA.md, devlog-заметка с решением |

**Не считается:** перегенерация целых файлов AI без чтения; переформатирование кода туда-сюда; переименование ради переименования; смотреть общие туториалы, не связанные с текущей задачей; коммиты из одной точки с запятой; «улучшение» цвета свечения пятый раз подряд.

### Лестница coding-часов

**30 минут (разогрев, начало дня, когда мало сил)**
- Запустить `verify_catalog.py`, разобрать один MISMATCH и записать вывод в DATA.md.
- Прочитать одну функцию (`equatorial_to_cartesian`, `scrambleElement`, `decToDms`) и написать к ней комментарий «почему», а не «что».
- Проверить одну страницу на 360px и завести issue на каждую проблему.
- Написать один unit-тест на найденный баг.
- Удалить один мёртвый файл после `grep` по ссылкам.

**1 час**
- P0-2 (фикс адаптера) или P0-5 (кодировка).
- Добавить `phot_g_mean_mag` в пайплайн и в HUD.
- `prefers-reduced-motion` + крупные шрифты в `explore.css`.
- Кнопка «OPEN IN EXPLORER» в инфо-панели лендинга.

**2 часа**
- P0-4 (сборка и зависимости) с проверкой `npm run build && npm run preview`.
- P1-4 (вынести inline-скрипт в модули).
- P1-6 (тесты).
- GitHub Pages workflow с отладкой путей.

**3 часа (глубокая работа)**
- P1-1 (перестроить пайплайн + режим curated ID + перегенерировать каталог).
- P1-8 (адаптив + a11y двух страниц с Lighthouse до/после).
- P2-1 (JOIN FLAME + отображение NULL).

**4 часа (крупная фича)**
- P1-5 целиком (поиск: ранжирование, клавиатура, URL-состояние, тесты).
- P2-2 (автоматические имена через SIMBAD).
- P3-2 (HR-диаграмма, первая рабочая версия).

### Простой журнал времени

Веди `DEVLOG.md` или таблицу. Одна строка на сессию:

```
| Date       | Time  | Category  | Task  | Result                                    | Commit  |
|------------|-------|-----------|-------|-------------------------------------------|---------|
| 2026-09-26 | 1h10m | debugging | P0-2  | explore loads catalog, 0 console errors    | a1b2c3d |
| 2026-09-27 | 2h00m | build     | P0-4  | vite build works, dropped 16 unused deps   | d4e5f6a |
```

Правило: у сессии должен быть **результат** (коммит, issue, запись в DATA.md, записанный вывод исследования). Сессия без результата допустима, но тогда запиши, что узнал и где застрял.

---

## GIT / COMMIT STRATEGY

### Типы коммитов (Conventional Commits) на примерах StarScope

| Тип | Когда | Пример |
|---|---|---|
| `feat:` | новое поведение для пользователя | `feat(search): rank exact > prefix > substring matches` |
| `fix:` | исправление бага | `fix(adapter): close if-block before return in loadGaiaStars` |
| `refactor:` | структура меняется, поведение нет | `refactor(explore): move inline script to explore-main.js` |
| `data:` | пайплайн или сгенерированные данные | `data: regenerate catalog from Gaia DR3 (32 stars, verified)` |
| `test:` | тесты и проверки | `test(search): cover diacritics and source_id lookup` |
| `docs:` | README, DATA.md, комментарии | `docs(data): explain why Sirius and Vega are absent from Gaia DR3` |
| `style:` | визуал/CSS без логики | `style(explore): increase metric label size to 11px` |
| `build:` | Vite, зависимости | `build: drop unused React/Gemini template dependencies` |
| `ci:` | GitHub Actions | `ci: deploy dist/ to GitHub Pages` |
| `perf:` | ускорение, с измерением | `perf(landing): time-based twinkle instead of per-frame counter` |
| `chore:` | уборка | `chore: remove dead prototype files` |

### Что заслуживает отдельного коммита

- Одна логическая причина = один коммит. Фикс бага и рефакторинг рядом — **два** коммита: если фикс сломает что-то, его можно откатить отдельно.
- Код пайплайна и сгенерированный JSON коммить **отдельно**: diff данных огромный и закроет изменения в коде.
- Удаление мёртвых файлов — один коммит со списком в описании, а не 14 коммитов.
- Не коммить: половину фичи, которая ломает страницу (для этого есть ветка), форматирование вперемешку с логикой, `dist/`.

**Ветки:** `main` всегда рабочий (его деплоит GitHub Pages). Каждая задача P0/P1 → ветка `fix/adapter-syntax`, `feat/ranked-search` → PR в свой же репозиторий → прочитать свой diff в PR → merge. Это даёт видимую историю разработки и учит ревью.

**Теги:** `v0.1-prototype` (сейчас), `v1.0.0`, `v1.1.0`, `v1.2.0`. Вместе с каждым тегом — GitHub Release с текстом из CHANGELOG.

### CHANGELOG.md (формат Keep a Changelog)

```markdown
# Changelog
All notable changes to StarScope are documented here.
Format: Keep a Changelog. Versioning: SemVer.

## [Unreleased]

## [1.0.0] - 2026-10-XX
### Added
- Ranked, diacritic-insensitive search by name, alias and Gaia DR3 source_id.
- Shareable URLs: explore.html?star=<id>.
- scripts/verify_catalog.py: checks every catalog entry against the Gaia DR3 archive.
### Changed
- Catalog regenerated from Gaia DR3 via fetch_gaia_stars.py (N stars, 100% verified).
- HUD shows only measured Gaia fields; derived values are labelled.
### Removed
- Hand-written stellar mass/luminosity values that were not from Gaia.
- Unused React/Gemini template dependencies and 14 dead prototype files.
### Fixed
- Explore page failed to load any data due to a syntax error in gaia-adapter.js.
- Production build was missing main.js and the catalog JSON.

## [0.1.0-prototype] - 2026-09-XX
- Initial visual prototype (landing + explore HUD).
```

### DEVLOG.md (история разработки, для людей)

```markdown
## 2026-09-26 - Why my explore page was silent
**Problem:** Search list was empty, no errors caught by try/catch.
**Cause:** SyntaxError in gaia-adapter.js ("eturn"), so the whole module never ran.
**Fix:** ... (commit a1b2c3d)
**Learned:** A syntax error in an imported ES module stops the importing script
before any of its code (including try/catch) executes.
**Next:** remove dead files (P0-3).
```

---

## AI CODING WORKFLOW

### Цикл на каждую задачу

1. **Understand (сам, 10–20 мин).** Открой файлы из backlog. Одним-двумя предложениями запиши в issue, что сейчас происходит и что должно происходить. Если не можешь сформулировать, значит пока не понимаешь задачу, и AI тоже поможет плохо.
2. **Ask AI for analysis (не для кода).** Дай **только** релевантные файлы и попроси объяснить и предложить план, без кода: «Вот `gaia-adapter.js` и inline-скрипт из `explore.html`. Объясни, почему список звёзд пустой. Не переписывай файлы, перечисли причины и минимальные правки». Сравни ответ со своей гипотезой.
3. **Implement (малым шагом).** Проси патч только для одной функции или одного файла: «Измени только `loadGaiaStars()`, остальное не трогай». Никаких «перепиши проект целиком». Если AI возвращает весь файл, это сигнал проверить diff особенно внимательно.
4. **Review generated code.** Прочитай `git diff` построчно. На каждую строку ответь: зачем она? Если есть удалённые строки, которые ты не просил удалять, — откати. Проверь, не создал ли AI **новую** функцию, дублирующую существующую (так появились 3 версии `getSpectralPalette`).
5. **Test.** `npm test`, `verify_catalog.py` (если трогал данные), ручная проверка в браузере по чек-листу задачи, консоль без ошибок, 360px.
6. **Debug.** Если сломалось: сначала DevTools (Console, Network, Sources с breakpoint) и минимальное воспроизведение, **потом** AI — с текстом ошибки и конкретными строками, а не «не работает, исправь».
7. **Commit.** Сообщение пишешь сам. Если не можешь описать изменение одной строкой, коммит слишком большой.
8. **Document.** Одна строка в DEVLOG (что узнал), при изменении данных — DATA.md, при изменении поведения — CHANGELOG `[Unreleased]`.

### Что ты должен понимать сам до того, как принять AI-код

- **Поток данных:** Gaia TAP → `fetch_gaia_stars.py` → `public/data/gaia-stars.json` → `loadGaiaStars()` → `normalizeStar()` → `selectStar()` → DOM. Нарисуй это сам на бумаге.
- **Форма нормализованного объекта звезды:** какие поля есть, какие могут быть `null`.
- **Физика в коде:** почему `1000 / parallax`, почему это приближение (плохо работает при большой относительной ошибке parallax), что такое `teff_gspphot` и почему он иногда NULL, почему эпоха J2016.0.
- **Какие данные измерены, а какие вычислены или декоративны.** Это суть проекта.
- **ES-модули:** `import`/`export`, почему нужен HTTP-сервер, а не `file://`, что происходит при синтаксической ошибке в импортируемом модуле.
- **Что делает Vite:** dev-сервер, `build`, `public/`, `base`.
- **Обработчики событий** в `explore-main.js`: кто их добавляет, сколько раз, кто закрывает панель поиска.
- **`searchStars()`** целиком: ты должен суметь объяснить, почему «gj 551» находит Proxima.

Хорошая проверка: закрой AI и объясни вслух, что делает изменённая функция. Не получается — не мержи.

---

## AVOID THESE FAILURE MODES (конкретно для тебя)

- **Не переписывай на React/TypeScript.** Ванильный JS полностью справляется с V1–V1.2. Шаблон React оказался в проекте случайно.
- **Не добавляй 3D/Three.js до V1.2.** Это классическая «крутая фича», которая съест 20 часов и не сделает данные честнее.
- **Не создавай `gaia-stars-v3.json` руками или через AI.** Каталог пишет только пайплайн, проверяет только `verify_catalog.py`.
- **Не проси AI «улучшить весь проект».** Именно так появились `уууу.html`, `scratch.js`, три `getSpectralPalette` и выдуманные source_id.
- **Не прячь ошибки fallback-ами.** Молчаливый fallback на выдуманные данные хуже честной ошибки.
- **Не добавляй AI-чат про звёзды (`@google/genai`)**: для V1 это не нужно и добавляет секреты, стоимость и бэкенд.
- **Не заводи отдельный CSS-«дизайн-систему»**, пока нет третьей страницы. `style.css` уже доказал, что никто его не подключил.
- **Не заменяй работающее:** `main.js` (фон, скремблинг, аудио) не трогай, кроме конкретных пунктов P1-7.
- **Риск overengineering:** сейчас его нет, скорее наоборот (демо без фундамента). Но если захочется «state manager», «роутер», «плагинную архитектуру» — это сигнал остановиться.

---

## DO THIS NEXT

1. **Прямо сейчас (20 мин): P0-1.** Проверь `.gitignore`, `git add -A`, `git commit -m "chore: snapshot prototype before V1 cleanup"`, `git tag v0.1-prototype`, push. Проверь, что `.env` не попал в историю.
2. **P0-2: почини `gaia-adapter.js`** (закрыть `if`, `eturn` → `return`, убрать `FALLBACK_GAIA_STARS` и цикл путей, ошибка вместо молчания). Запусти `npx vite`, открой `/explore.html`: должен появиться список звёзд и 0 ошибок в консоли. Только после этого сравни свою версию с `reference/gaia-adapter.js`. Коммит `fix(adapter): …`.
3. **P0-3: удали мёртвые файлы** (список выше), каждый — после `grep` по ссылкам. Один коммит `chore: remove dead prototype files`.
4. **P0-4: почини сборку**: убери React/Gemini-зависимости, минимальный `vite.config.ts`, `type="module"` для `main.js`, данные в `public/data/`. Проверка: `npm run build && npm run preview`, обе страницы работают.
5. **P1-1 + P1-2: настоящий каталог.** Исправь ключи и `KNOWN_NAMES` в `fetch_gaia_stars.py`, добавь curated ID из v1, запусти пайплайн, затем `python scripts/verify_catalog.py public/data/gaia-stars.json` → 100% OK. Удали v1/v2. Два коммита: код пайплайна и данные.

Пока эти 5 шагов не закончены, **не трогай визуал и не добавляй фичи**.

---

## DEFINITION OF DONE FOR V1

**Данные**
- [ ] Ровно один каталог `public/data/gaia-stars.json`, созданный `fetch_gaia_stars.py`.
- [ ] `verify_catalog.py` → 100% OK (exit code 0).
- [ ] В UI нет ни одного числа с единицей измерения, которого нет в каталоге или которое не помечено как derived.
- [ ] NULL-значения показываются как «—», а не как 0, 5000 K или 10 LY.
- [ ] Эпоха координат указана как J2016.0.

**Функциональность**
- [ ] Explore загружает каталог, в консоли 0 ошибок и 0 предупреждений.
- [ ] Поиск по имени, алиасу и source_id; ранжирование; Enter; ↑/↓; Esc; пустой результат.
- [ ] `?q=` и `?star=` работают; URL обновляется при выборе.
- [ ] Лендинг: featured-звёзды из каталога, переход в explore, звук по умолчанию выключен.
- [ ] При недоступном JSON показывается понятная ошибка.

**Качество**
- [ ] `npm test` зелёный (search + adapter).
- [ ] Lighthouse Accessibility ≥ 90 и Performance ≥ 90 на обеих страницах.
- [ ] Вся функциональность доступна с клавиатуры, видимый фокус.
- [ ] Проверено на 360×640, 768×1024, 1440×900 и в горизонтальной ориентации телефона.
- [ ] Все файлы в UTF-8, нет «вЂ»».

**Репозиторий и деплой**
- [ ] Нет мёртвых/дублирующихся файлов; в `package.json` только `vite`.
- [ ] `npm run build` → `dist/` деплоится на GitHub Pages через Actions, публичный URL работает.
- [ ] README (URL, скриншот, запуск, структура), DATA.md (поля, единицы, источник, ограничения), CHANGELOG 1.0.0, DEVLOG.
- [ ] Тег `v1.0.0` + GitHub Release.

---

## Приложенные файлы

- `scripts/verify_catalog.py`: проверка каталога по Gaia DR3 (только стандартная библиотека Python). Результат на твоих файлах: `gaia-stars-v2.json` → 0/20, `gaia-stars-v1.json` → 14/14.
- `reference/gaia-adapter.js`: эталон исправленного адаптера (чистая `normalizeStar`, без выдуманных значений, честные ошибки, форматирование координат без «60 секунд»).
- `reference/search.js`: эталон ранжированного поиска.
- `tests/search.test.js`, `tests/gaia-adapter.test.js`: 8 тестов на `node --test`, все проходят.

Эталоны в `reference/` нужны для сравнения **после** твоей собственной попытки, а не для копирования вместо неё.
