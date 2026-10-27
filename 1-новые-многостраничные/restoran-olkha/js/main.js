/* =========================================================
   «Ольха» — общий скрипт для всех страниц демо-сайта
   ---------------------------------------------------------
   Каждый блок ниже запускается, только если на странице
   есть нужный элемент, поэтому один файл подключён везде.
   ========================================================= */


/* =========================================================
   НАСТРОЙКИ — меняйте здесь
   ========================================================= */

// Номер WhatsApp, куда уходят заявки на бронь.
// Только цифры, с кодом страны, без «+», пробелов и скобок.
// Номер выдуманный — замените на свой.
const BOOKING_PHONE = "79990000000";

// Часы, в которые можно забронировать столик (шаг — 30 минут).
const BOOKING_OPEN_FROM = "12:00"; // первое время в списке
const BOOKING_OPEN_TO = "22:30";   // последнее время в списке

// Максимум гостей в одной заявке через сайт.
const BOOKING_MAX_GUESTS = 12;

// «Сезонный круг» на главной: продукт и блюдо каждого месяца.
// Порядок — с января по декабрь. Тексты можно менять свободно.
const SEASON = [
  { short: "Янв", month: "Январь",   product: "Квашеная капуста", dish: "Щи из печи с томлёной грудинкой" },
  { short: "Фев", month: "Февраль",  product: "Клюква",           dish: "Утиная печень с клюквенным желе" },
  { short: "Мар", month: "Март",     product: "Берёзовый сок",    dish: "Сорбет из берёзового сока и мяты" },
  { short: "Апр", month: "Апрель",   product: "Черемша",          dish: "Тартар из оленины с черемшой" },
  { short: "Май", month: "Май",      product: "Сморчки",          dish: "Сморчки в сливках на гренке из ржи" },
  { short: "Июн", month: "Июнь",     product: "Щавель",           dish: "Холодный щавелевый суп с перепелиным яйцом" },
  { short: "Июл", month: "Июль",     product: "Черника",          dish: "Черничный пирог на ольховых углях" },
  { short: "Авг", month: "Август",   product: "Белые грибы",      dish: "Белые грибы на углях с топлёным маслом" },
  { short: "Сен", month: "Сентябрь", product: "Антоновка",        dish: "Свиная щека с печёной антоновкой" },
  { short: "Окт", month: "Октябрь",  product: "Брусника",         dish: "Дикая утка с брусничным соусом" },
  { short: "Ноя", month: "Ноябрь",   product: "Репа",             dish: "Репа, запечённая в сене, с икрой щуки" },
  { short: "Дек", month: "Декабрь",  product: "Можжевельник",     dish: "Сиг холодного копчения на можжевельнике" }
];


/* =========================================================
   1. МОБИЛЬНОЕ МЕНЮ (бургер)
   ========================================================= */
(function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  function setOpen(open) {
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
  }

  toggle.addEventListener("click", function () {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  // Закрываем меню клавишей Esc и возвращаем фокус на кнопку
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });

  // При расширении окна до десктопа сбрасываем открытое состояние
  window.matchMedia("(min-width: 901px)").addEventListener("change", function (mq) {
    if (mq.matches) setOpen(false);
  });
})();


/* =========================================================
   2. ГОД В ПОДВАЛЕ
   ========================================================= */
document.querySelectorAll("[data-year]").forEach(function (el) {
  el.textContent = new Date().getFullYear();
});


/* =========================================================
   3. ПЛАВНОЕ ПОЯВЛЕНИЕ БЛОКОВ ПРИ ПРОКРУТКЕ
   Добавьте элементу класс "reveal", чтобы он «всплывал».
   ========================================================= */
(function initReveal() {
  const items = document.querySelectorAll(".reveal");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!("IntersectionObserver" in window) || reduce) {
    items.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }

  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach(function (el) { io.observe(el); });
})();


/* =========================================================
   4. «СЕЗОННЫЙ КРУГ» НА ГЛАВНОЙ
   Рисуем кольцо из 12 месяцев в SVG. По клику (или Enter/
   пробелу, или стрелкам) кольцо поворачивается, а в центре
   меняется продукт месяца.
   ========================================================= */
(function initDial() {
  const holder = document.getElementById("dial-ring");
  if (!holder) return;

  const SVG_NS = "http://www.w3.org/2000/svg";
  const C = 300;        // центр круга (в координатах viewBox 600×600)
  const R_OUT = 286;    // внешний радиус кольца
  const R_IN = 196;     // внутренний радиус кольца
  const R_TEXT = 232;   // радиус, по которому идут подписи
  const STEP = 360 / SEASON.length;

  const monthEl = document.getElementById("dial-month");
  const productEl = document.getElementById("dial-product");
  const dishEl = document.getElementById("dial-dish");

  // Перевод полярных координат в обычные
  function pt(r, deg) {
    const a = (deg - 90) * Math.PI / 180; // 0° — это «12 часов»
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  }
  function f(n) { return n.toFixed(2); }

  const segments = [];

  SEASON.forEach(function (item, i) {
    const a0 = i * STEP - STEP / 2;
    const a1 = i * STEP + STEP / 2;
    const o0 = pt(R_OUT, a0), o1 = pt(R_OUT, a1);
    const i0 = pt(R_IN, a0), i1 = pt(R_IN, a1);
    const t0 = pt(R_TEXT, a0 + 2), t1 = pt(R_TEXT, a1 - 2);

    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", "dial-seg");
    g.setAttribute("role", "button");
    g.setAttribute("tabindex", "0");
    g.setAttribute("aria-label", item.month + ": " + item.product);

    // сектор кольца
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d",
      "M" + f(o0[0]) + " " + f(o0[1]) +
      " A" + R_OUT + " " + R_OUT + " 0 0 1 " + f(o1[0]) + " " + f(o1[1]) +
      " L" + f(i1[0]) + " " + f(i1[1]) +
      " A" + R_IN + " " + R_IN + " 0 0 0 " + f(i0[0]) + " " + f(i0[1]) + " Z");
    g.appendChild(path);

    // невидимая дуга, по которой изгибается подпись месяца
    const arcId = "dial-arc-" + i;
    const arc = document.createElementNS(SVG_NS, "path");
    arc.setAttribute("id", arcId);
    arc.setAttribute("fill", "none");
    arc.setAttribute("d",
      "M" + f(t0[0]) + " " + f(t0[1]) +
      " A" + R_TEXT + " " + R_TEXT + " 0 0 1 " + f(t1[0]) + " " + f(t1[1]));
    g.appendChild(arc);

    const text = document.createElementNS(SVG_NS, "text");
    text.setAttribute("font-size", "24");
    const tp = document.createElementNS(SVG_NS, "textPath");
    tp.setAttribute("href", "#" + arcId);
    tp.setAttribute("startOffset", "50%");
    tp.setAttribute("text-anchor", "middle");
    tp.textContent = item.short;
    text.appendChild(tp);
    g.appendChild(text);

    g.addEventListener("click", function () { select(i); });
    g.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(i); }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); select((i + 1) % SEASON.length, true); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); select((i - 1 + SEASON.length) % SEASON.length, true); }
    });

    holder.appendChild(g);
    segments.push(g);
  });

  let rotation = 0;   // текущий угол поворота кольца
  let current = -1;

  function select(i, moveFocus) {
    // поворачиваем по кратчайшему пути
    let target = -i * STEP;
    let diff = ((target - rotation) % 360 + 540) % 360 - 180;
    rotation += diff;
    holder.style.transform = "rotate(" + rotation + "deg)";

    segments.forEach(function (s, n) {
      s.classList.toggle("is-active", n === i);
      s.setAttribute("aria-pressed", String(n === i));
    });

    const item = SEASON[i];
    monthEl.textContent = item.month;
    productEl.textContent = item.product;
    dishEl.textContent = item.dish;
    current = i;

    if (moveFocus) segments[i].focus();
  }

  // При загрузке выбираем текущий месяц
  select(new Date().getMonth());
})();


/* =========================================================
   5. ФИЛЬТР МЕНЮ ПО КАТЕГОРИЯМ
   Кнопки: data-filter="all | starters | mains | desserts | drinks"
   Разделы меню: data-category с теми же словами.
   ========================================================= */
(function initMenuFilter() {
  const buttons = document.querySelectorAll(".filter-btn");
  const sections = document.querySelectorAll(".menu-section[data-category]");
  const status = document.getElementById("menu-status");
  if (!buttons.length || !sections.length) return;

  // Подписываем на кнопках количество блюд в каждой категории
  buttons.forEach(function (btn) {
    const cat = btn.dataset.filter;
    const count = cat === "all"
      ? document.querySelectorAll(".menu-section .dish").length
      : document.querySelectorAll('.menu-section[data-category="' + cat + '"] .dish').length;
    const span = btn.querySelector(".filter-count");
    if (span) span.textContent = count;
  });

  function apply(cat) {
    let shown = 0;
    sections.forEach(function (sec) {
      const visible = cat === "all" || sec.dataset.category === cat;
      sec.hidden = !visible;
      if (visible) shown += sec.querySelectorAll(".dish").length;
    });
    buttons.forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.filter === cat));
    });
    // сообщение для экранных дикторов и для всех
    if (status) {
      const label = document.querySelector('.filter-btn[data-filter="' + cat + '"] .filter-name');
      status.textContent = "Показано блюд: " + shown + (cat === "all" ? "" : " — " + label.textContent.toLowerCase());
    }
    // запоминаем выбор в адресе страницы: menu.html#desserts
    if (history.replaceState) {
      history.replaceState(null, "", cat === "all" ? location.pathname : "#" + cat);
    }
  }

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () { apply(btn.dataset.filter); });
  });

  // Если в адресе есть #категория — сразу открываем её
  const fromHash = location.hash.replace("#", "");
  const known = Array.prototype.some.call(buttons, function (b) { return b.dataset.filter === fromHash; });
  apply(known ? fromHash : "all");
})();


/* =========================================================
   6. ФОРМА БРОНИРОВАНИЯ → WhatsApp с готовым текстом
   ========================================================= */
(function initBooking() {
  const form = document.getElementById("booking-form");
  if (!form) return;

  const nameInput = form.elements.name;
  const phoneInput = form.elements.phone;
  const dateInput = form.elements.date;
  const timeSelect = form.elements.time;
  const guestsInput = form.elements.guests;
  const commentInput = form.elements.comment;
  const status = document.getElementById("form-status");

  // Дата в формате ГГГГ-ММ-ДД по местному времени
  function isoDate(d) {
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  // Нельзя выбрать прошедшую дату; бронь — не дальше чем на 60 дней
  const today = new Date();
  const maxDate = new Date(); maxDate.setDate(today.getDate() + 60);
  dateInput.min = isoDate(today);
  dateInput.max = isoDate(maxDate);

  // Заполняем список времени по настройкам в начале файла
  function toMinutes(t) { const p = t.split(":"); return +p[0] * 60 + +p[1]; }
  for (let m = toMinutes(BOOKING_OPEN_FROM); m <= toMinutes(BOOKING_OPEN_TO); m += 30) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    const opt = document.createElement("option");
    opt.value = opt.textContent = hh + ":" + mm;
    timeSelect.appendChild(opt);
  }

  // Кнопки «−» и «+» для числа гостей
  guestsInput.max = BOOKING_MAX_GUESTS;
  form.querySelectorAll("[data-guests]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const next = (parseInt(guestsInput.value, 10) || 1) + Number(btn.dataset.guests);
      guestsInput.value = Math.min(BOOKING_MAX_GUESTS, Math.max(1, next));
      clearError(guestsInput);
    });
  });

  // Показ и очистка ошибок под полями
  function showError(input, text) {
    const field = input.closest(".field");
    field.classList.add("has-error");
    input.setAttribute("aria-invalid", "true");
    field.querySelector(".field-error").textContent = text;
  }
  function clearError(input) {
    const field = input.closest(".field");
    field.classList.remove("has-error");
    input.removeAttribute("aria-invalid");
    field.querySelector(".field-error").textContent = "";
  }
  [nameInput, phoneInput, dateInput, timeSelect, guestsInput].forEach(function (el) {
    el.addEventListener("input", function () { clearError(el); });
    el.addEventListener("change", function () { clearError(el); });
  });

  function validate() {
    // сначала убираем ошибки прошлой попытки
    [nameInput, phoneInput, dateInput, timeSelect, guestsInput].forEach(clearError);

    let firstBad = null;
    function bad(input, text) { showError(input, text); if (!firstBad) firstBad = input; }

    if (nameInput.value.trim().length < 2) bad(nameInput, "Напишите, как к вам обращаться.");

    const digits = phoneInput.value.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 12) bad(phoneInput, "Укажите телефон, например +7 999 000-00-00.");

    if (!dateInput.value) {
      bad(dateInput, "Выберите дату.");
    } else if (dateInput.value < dateInput.min || dateInput.value > dateInput.max) {
      bad(dateInput, "Бронь доступна с сегодняшнего дня и на 60 дней вперёд.");
    }

    if (!timeSelect.value) {
      bad(timeSelect, "Выберите время.");
    } else if (dateInput.value === isoDate(new Date())) {
      // на сегодня — не раньше, чем через час
      const now = new Date();
      if (toMinutes(timeSelect.value) < now.getHours() * 60 + now.getMinutes() + 60) {
        bad(timeSelect, "На сегодня можно забронировать не раньше чем через час.");
      }
    }

    const g = parseInt(guestsInput.value, 10);
    if (!g || g < 1 || g > BOOKING_MAX_GUESTS) {
      bad(guestsInput, "От 1 до " + BOOKING_MAX_GUESTS + " гостей. Для банкета позвоните нам.");
    }

    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.textContent = "";
    if (!validate()) return;

    // 2026-10-26 → 26.10.2026
    const dateRu = dateInput.value.split("-").reverse().join(".");

    // Текст заявки — его увидит администратор в мессенджере
    const lines = [
      "Здравствуйте! Хочу забронировать столик в «Ольхе».",
      "",
      "Имя: " + nameInput.value.trim(),
      "Телефон: " + phoneInput.value.trim(),
      "Дата: " + dateRu,
      "Время: " + timeSelect.value,
      "Гостей: " + guestsInput.value
    ];
    if (commentInput.value.trim()) lines.push("Пожелания: " + commentInput.value.trim());

    const url = "https://wa.me/" + BOOKING_PHONE + "?text=" + encodeURIComponent(lines.join("\n"));
    window.open(url, "_blank", "noopener");

    // Запасная ссылка, если браузер заблокировал новое окно
    status.innerHTML = "";
    status.append("Открываем WhatsApp с готовой заявкой. Если окно не появилось, ");
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = "нажмите сюда";
    status.append(a, ".");
  });
})();


/* =========================================================
   7. КОНТАКТЫ: подсветка сегодняшнего дня в часах работы
   Строки таблицы помечены data-day: 1 — пн … 0 — вс
   ========================================================= */
(function initHours() {
  const row = document.querySelector('.hours tr[data-day="' + new Date().getDay() + '"]');
  if (row) {
    row.classList.add("is-today");
    row.querySelector("th").insertAdjacentText("beforeend", " · сегодня");
  }
})();
