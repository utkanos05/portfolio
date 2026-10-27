/* =========================================================
   «Кобальт» — общий скрипт для всех страниц демо-сайта
   ---------------------------------------------------------
   Каждый блок запускается, только если на странице есть
   нужный элемент. Все анимации отключаются, если в системе
   включено «Уменьшить движение» (prefers-reduced-motion).
   ========================================================= */


/* =========================================================
   НАСТРОЙКИ — меняйте здесь
   ========================================================= */

// Номер WhatsApp для предзаказов: только цифры, с кодом страны.
// Номер выдуманный — замените на свой.
const ORDER_PHONE = "79990000000";

// Часы работы по дням недели: 0 — воскресенье, 1 — понедельник … 6 — суббота.
// Используются для статуса «Открыто/Закрыто» и времени самовывоза.
const HOURS = [
  ["09:00", "22:00"], // вс
  ["07:30", "21:00"], // пн
  ["07:30", "21:00"], // вт
  ["07:30", "21:00"], // ср
  ["07:30", "21:00"], // чт
  ["07:30", "21:00"], // пт
  ["09:00", "22:00"]  // сб
];

// Напитки для формы предзаказа: название и цена за маленький объём (₽).
const ORDER_DRINKS = [
  { name: "Капучино",            price: 260 },
  { name: "Флэт уайт",           price: 280 },
  { name: "Латте",               price: 270 },
  { name: "Раф «Кобальт»",       price: 340 },
  { name: "Американо",           price: 200 },
  { name: "Фильтр дня",          price: 240 },
  { name: "Колд брю на тонике",  price: 330 }
];

// Объёмы: надбавка к цене и размер чашки в «чеке» (scale).
const ORDER_SIZES = [
  { label: "250 мл", add: 0,   scale: 0.78 },
  { label: "350 мл", add: 60,  scale: 0.92 },
  { label: "450 мл", add: 110, scale: 1.06 }
];

// Молоко: надбавка к цене и цвет напитка на картинке.
const ORDER_MILK = [
  { label: "Коровье",     add: 0,  color: "#c58a52" },
  { label: "Овсяное",     add: 70, color: "#cf9e66" },
  { label: "Миндальное",  add: 90, color: "#d8ad7c" },
  { label: "Без молока",  add: 0,  color: "#3b2216" }
];


/* =========================================================
   ОБЩИЕ ПОМОЩНИКИ
   ========================================================= */
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const FINE_POINTER = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const clamp = function (v, min, max) { return Math.min(max, Math.max(min, v)); };
const $ = function (sel, root) { return (root || document).querySelector(sel); };
const $$ = function (sel, root) { return Array.from((root || document).querySelectorAll(sel)); };

// Один общий цикл анимации: все «прокруточные» эффекты
// регистрируются здесь и обновляются раз в кадр.
const frameTasks = [];
function onFrame(fn) { frameTasks.push(fn); }
(function loop() {
  for (let i = 0; i < frameTasks.length; i++) frameTasks[i]();
  requestAnimationFrame(loop);
})();

// Текущая скорость прокрутки (нужна бегущей строке)
let scrollVelocity = 0;
let lastScrollY = window.scrollY;
onFrame(function () {
  const y = window.scrollY;
  scrollVelocity += ((y - lastScrollY) - scrollVelocity) * 0.2;
  lastScrollY = y;
});

// Переход между страницами может прерваться (быстрый клик, свёрнутая вкладка).
// Это нормально — просто гасим ошибку, чтобы не засорять консоль.
function quietTransition(t) {
  if (!t) return;
  [t.ready, t.finished, t.updateCallbackDone].forEach(function (p) { if (p) p.catch(function () {}); });
}
window.addEventListener("pageswap", function (e) { quietTransition(e.viewTransition); });
window.addEventListener("pagereveal", function (e) { quietTransition(e.viewTransition); });

// Насколько секция «проскроллена» внутри себя: 0 — начало, 1 — конец
function sectionProgress(el) {
  const r = el.getBoundingClientRect();
  return clamp(-r.top / (r.height - window.innerHeight), 0, 1);
}

// Формат цены: 1340 → «1 340 ₽»
function rub(n) { return n.toLocaleString("ru-RU").replace(/\s/g, " ") + " ₽"; }
function toMin(t) { const p = t.split(":"); return +p[0] * 60 + +p[1]; }
function toTime(m) { return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); }


/* =========================================================
   1. ШАПКА: прячется при прокрутке вниз, бургер на телефоне
   ========================================================= */
(function initHeader() {
  const header = $(".site-header");
  if (!header) return;

  let prev = window.scrollY;
  onFrame(function () {
    const y = window.scrollY;
    if (Math.abs(y - prev) < 4) return;
    header.classList.toggle("is-scrolled", y > 10);
    // прячем, только если меню не открыто и ушли ниже первого экрана
    const open = document.body.classList.contains("nav-open");
    header.classList.toggle("is-hidden", !open && y > prev && y > 400);
    prev = y;
  });

  const toggle = $(".nav-toggle");
  const nav = $("#site-nav");
  if (!toggle || !nav) return;

  function setOpen(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
  }
  toggle.addEventListener("click", function () {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
  });
  window.matchMedia("(min-width: 961px)").addEventListener("change", function (mq) {
    if (mq.matches) setOpen(false);
  });
})();

// Год в подвале
$$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });


/* =========================================================
   2. РАЗБИВКА ЗАГОЛОВКОВ НА БУКВЫ И СЛОВА
   data-split="chars" — буквы выезжают по одной
   data-split="words" — слова выезжают по одному
   Строки задаются в HTML через <span class="split-line">.
   Для экранных дикторов сохраняем исходный текст в aria-label.
   ========================================================= */
(function initSplit() {
  $$("[data-split]").forEach(function (el) {
    const mode = el.dataset.split;
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    let i = 0;

    function walk(node) {
      Array.from(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            if (mode === "words") {
              const mask = document.createElement("span");
              mask.className = "word-mask";
              const w = document.createElement("span");
              w.className = "split-word";
              w.style.setProperty("--i", i++);
              w.textContent = part;
              mask.appendChild(w);
              frag.appendChild(mask);
            } else {
              // слово держим целым, чтобы оно не разрывалось при переносе
              const word = document.createElement("span");
              word.style.display = "inline-block";
              word.style.whiteSpace = "nowrap";
              Array.from(part).forEach(function (ch) {
                const c = document.createElement("span");
                c.className = "split-char";
                c.style.setProperty("--i", i++);
                c.textContent = ch;
                word.appendChild(c);
              });
              frag.appendChild(word);
            }
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          child.setAttribute("aria-hidden", "true");
          walk(child);
        }
      });
    }
    walk(el);
    el.dataset.splitReady = "";
  });
})();


/* =========================================================
   3. ПОЯВЛЕНИЕ ПРИ ПРОКРУТКЕ
   [data-reveal], [data-split] получают класс .is-in,
   когда попадают на экран. Задержка — атрибут style="--d:200ms".
   ========================================================= */
(function initReveal() {
  const items = $$("[data-reveal], [data-split]");
  if (REDUCED || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-in"); });
    return;
  }
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -5% 0px" });
  items.forEach(function (el) { io.observe(el); });
})();


/* =========================================================
   4. «МАГНИТНЫЕ» КНОПКИ — тянутся за курсором
   Работает только с мышью. Добавьте элементу класс "magnetic".
   ========================================================= */
(function initMagnetic() {
  if (REDUCED || !FINE_POINTER) return;
  $$(".magnetic").forEach(function (el) {
    const strength = 0.35;
    el.addEventListener("mousemove", function (e) {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", ((e.clientX - r.left - r.width / 2) * strength) + "px");
      el.style.setProperty("--my", ((e.clientY - r.top - r.height / 2) * strength) + "px");
    });
    el.addEventListener("mouseleave", function () {
      el.style.setProperty("--mx", "0px");
      el.style.setProperty("--my", "0px");
    });
  });
})();


/* =========================================================
   5. ГЛАВНАЯ: свечение за курсором, зёрна, значок, строка
   ========================================================= */
(function initHero() {
  const hero = $(".hero");
  if (!hero) return;

  // Свечение и зёрна двигаются за курсором
  if (!REDUCED && FINE_POINTER) {
    const glow = $(".hero-glow");
    const beans = $$(".bean[data-depth]");
    hero.addEventListener("mousemove", function (e) {
      const r = hero.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (glow) { glow.style.setProperty("--gx", x + "px"); glow.style.setProperty("--gy", y + "px"); }
      const nx = x / r.width - 0.5, ny = y / r.height - 0.5;
      beans.forEach(function (b) {
        const d = parseFloat(b.dataset.depth);
        b.style.setProperty("--px", (-nx * d) + "px");
        b.style.setProperty("--py", (-ny * d) + "px");
      });
    });
  }

  // Круглый значок поворачивается вместе с прокруткой
  const badge = $(".badge svg");
  if (badge && !REDUCED) {
    onFrame(function () { badge.style.setProperty("--rot", (window.scrollY * 0.25) + "deg"); });
  }
})();

// Бегущие строки: движутся постоянно, при прокрутке ускоряются и наклоняются
(function initMarquee() {
  const tracks = $$(".marquee-track");
  if (!tracks.length || REDUCED) return;

  tracks.forEach(function (track) {
    const dir = track.dataset.dir === "right" ? 1 : -1;
    let x = 0;
    onFrame(function () {
      const half = track.scrollWidth / 2;  // содержимое продублировано в HTML
      const boost = clamp(Math.abs(scrollVelocity) * 0.25, 0, 18);
      x += dir * (0.6 + boost);
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      track.style.setProperty("--x", x + "px");
      track.style.setProperty("--skew", clamp(-scrollVelocity * 0.25, -10, 10) + "deg");
    });
  });
})();


/* =========================================================
   6. «СОБЕРИ КАПУЧИНО ПРОКРУТКОЙ» (главная)
   Пишем прогресс прокрутки секции в --p, а CSS по нему
   поднимает слои в чашке. Здесь же переключаем шаги рецепта.
   ========================================================= */
(function initPour() {
  const pour = $(".pour");
  if (!pour) return;
  const steps = $$(".pour-steps li", pour);
  const marks = [0, 0.25, 0.55, 0.8]; // где начинается каждый шаг (0…1)

  if (REDUCED) { steps.forEach(function (s) { s.classList.add("is-active"); }); return; }

  let last = -1;
  onFrame(function () {
    const p = Math.round(sectionProgress(pour) * 1000) / 1000;
    if (p === last) return;
    last = p;
    pour.style.setProperty("--p", p);
    let active = 0;
    marks.forEach(function (m, i) { if (p >= m) active = i; });
    steps.forEach(function (s, i) {
      s.classList.toggle("is-active", i === active);
      s.classList.toggle("is-done", i < active);
    });
  });
})();


/* =========================================================
   7. СЧЁТЧИКИ: числа «набегают» при появлении
   <span data-count="1240">0</span>
   ========================================================= */
(function initCounters() {
  const nums = $$("[data-count]");
  if (!nums.length) return;

  function run(el) {
    const target = parseFloat(el.dataset.count);
    if (REDUCED) { el.textContent = target.toLocaleString("ru-RU"); return; }
    const start = performance.now(), dur = 1800;
    (function tick(now) {
      const t = clamp((now - start) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = Math.round(target * eased).toLocaleString("ru-RU");
      if (t < 1) requestAnimationFrame(tick);
    })(start);
  }

  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.6 });
  nums.forEach(function (n) { io.observe(n); });
})();


/* =========================================================
   8. О НАС: манифест «проявляется» по словам при прокрутке
   ========================================================= */
(function initManifesto() {
  const el = $(".manifesto");
  if (!el || REDUCED) return;

  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute("aria-label", words.join(" "));
  el.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true">' + w + "</span>"; }).join(" ");
  const spans = $$(".w", el);

  onFrame(function () {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
    const lit = p * spans.length;
    spans.forEach(function (s, i) { s.style.setProperty("--o", clamp(lit - i, 0.15, 1)); });
  });
})();


/* =========================================================
   9. О НАС: «Путь зерна» — горизонтальная лента
   Вертикальная прокрутка двигает ленту вбок (на широких экранах).
   ========================================================= */
(function initJourney() {
  const section = $(".journey");
  if (!section || REDUCED) return;
  const track = $(".journey-track", section);
  const wide = window.matchMedia("(min-width: 761px)");

  function measure() {
    const max = Math.max(0, track.scrollWidth - window.innerWidth + 40);
    section.style.setProperty("--jmax", max + "px");
  }
  measure();
  window.addEventListener("resize", measure);

  onFrame(function () {
    if (!wide.matches) return;
    section.style.setProperty("--jp", sectionProgress(section).toFixed(4));
  });
})();


/* =========================================================
   10. МЕНЮ: фильтр по категориям
   Кнопки: data-filter, позиции: data-cat.
   Плавную перестановку делает View Transitions API, а где его
   нет — позиции просто «всплывают» заново.
   ========================================================= */
(function initMenuFilter() {
  const bar = $(".filter");
  if (!bar) return;
  const buttons = $$(".filter-btn", bar);
  const items = $$(".item");
  const pill = $(".filter-pill", bar);
  const status = $("#menu-status");

  // Подписываем количество позиций в каждой категории
  buttons.forEach(function (btn) {
    const f = btn.dataset.filter;
    const n = f === "all" ? items.length : items.filter(function (it) { return it.dataset.cat === f; }).length;
    const sup = document.createElement("sup");
    sup.textContent = n;
    btn.appendChild(sup);
  });

  // Уникальные имена нужны View Transitions, чтобы строки «переезжали»
  items.forEach(function (it, i) { it.style.viewTransitionName = "item-" + i; });

  function movePill(btn) {
    pill.style.setProperty("--l", btn.offsetLeft + "px");
    pill.style.setProperty("--w", btn.offsetWidth + "px");
  }

  function render(filter) {
    let shown = 0;
    items.forEach(function (it) {
      const ok = filter === "all" || it.dataset.cat === filter;
      it.hidden = !ok;
      if (ok) shown++;
    });
    buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.filter === filter)); });
    const btn = buttons.find(function (b) { return b.dataset.filter === filter; });
    movePill(btn);
    if (status) status.textContent = "Показано позиций: " + shown;
    if (history.replaceState) history.replaceState(null, "", filter === "all" ? location.pathname : "#" + filter);
  }

  function apply(filter) {
    if (REDUCED) { render(filter); return; }
    if (document.startViewTransition) {
      quietTransition(document.startViewTransition(function () { render(filter); }));
    } else {
      render(filter);
      let i = 0;
      items.forEach(function (it) {
        if (it.hidden) return;
        it.classList.remove("is-entering");
        void it.offsetWidth; // перезапуск анимации
        it.style.setProperty("--i", i++);
        it.classList.add("is-entering");
      });
    }
  }

  buttons.forEach(function (b) { b.addEventListener("click", function () { apply(b.dataset.filter); }); });
  window.addEventListener("resize", function () { movePill($('.filter-btn[aria-pressed="true"]', bar)); });

  const hash = location.hash.slice(1);
  const start = buttons.some(function (b) { return b.dataset.filter === hash; }) ? hash : "all";
  render(start);
  // шрифты грузятся позже — пересчитываем положение «таблетки»
  if (document.fonts) document.fonts.ready.then(function () { movePill($('.filter-btn[aria-pressed="true"]', bar)); });
})();


/* =========================================================
   11. ПРЕДЗАКАЗ → WhatsApp с готовым текстом
   ========================================================= */
(function initOrder() {
  const form = $("#order-form");
  if (!form) return;

  const el = form.elements;
  const status = $("#form-status");

  // --- Заполняем списки из настроек в начале файла ---
  ORDER_DRINKS.forEach(function (d, i) {
    el.drink.add(new Option(d.name + " — от " + d.price + " ₽", i));
  });
  ORDER_MILK.forEach(function (m, i) {
    el.milk.add(new Option(m.label + (m.add ? " (+" + m.add + " ₽)" : ""), i));
  });
  const sizeBox = $("#size-chips");
  ORDER_SIZES.forEach(function (s, i) {
    const label = document.createElement("label");
    label.className = "chip";
    label.innerHTML = '<input type="radio" name="size" value="' + i + '"' + (i === 1 ? " checked" : "") + ">" +
      "<span>" + s.label + (s.add ? " <small>+" + s.add + " ₽</small>" : "") + "</span>";
    sizeBox.appendChild(label);
  });

  // --- Время самовывоза: каждые 15 минут, не раньше чем через 15 минут ---
  function fillTimes() {
    el.time.length = 1;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    let day = now.getDay();
    let from = Math.max(toMin(HOURS[day][0]), Math.ceil((nowMin + 15) / 15) * 15);
    let to = toMin(HOURS[day][1]) - 15;
    let prefix = "Сегодня, ";
    if (from > to) {           // сегодня уже поздно — предлагаем завтра
      day = (day + 1) % 7;
      from = toMin(HOURS[day][0]);
      to = toMin(HOURS[day][1]) - 15;
      prefix = "Завтра, ";
    }
    for (let m = from; m <= to; m += 15) el.time.add(new Option(prefix + toTime(m), prefix + toTime(m)));
  }
  fillTimes();

  // --- Количество ---
  $$("[data-qty]", form).forEach(function (b) {
    b.addEventListener("click", function () {
      el.qty.value = clamp((parseInt(el.qty.value, 10) || 1) + Number(b.dataset.qty), 1, 10);
      update();
    });
  });

  // --- Живой чек ---
  const out = {
    drink: $("#r-drink"), size: $("#r-size"), milk: $("#r-milk"),
    qty: $("#r-qty"), time: $("#r-time"), total: $("#r-total")
  };
  const cupWrap = $(".receipt-cup");

  function current() {
    const drink = ORDER_DRINKS[el.drink.value];
    const size = ORDER_SIZES[form.querySelector('input[name="size"]:checked').value];
    const milk = ORDER_MILK[el.milk.value];
    const qty = clamp(parseInt(el.qty.value, 10) || 1, 1, 10);
    const total = drink ? (drink.price + size.add + milk.add) * qty : 0;
    return { drink: drink, size: size, milk: milk, qty: qty, total: total };
  }

  let lastTotal = null;
  function update() {
    const c = current();
    out.drink.textContent = c.drink ? c.drink.name : "—";
    out.size.textContent = c.size.label;
    out.milk.textContent = c.milk.label;
    out.qty.textContent = c.qty;
    out.time.textContent = el.time.value || "—";
    out.total.textContent = rub(c.total);
    cupWrap.style.setProperty("--cup", c.size.scale);
    cupWrap.style.setProperty("--milk", c.milk.color);
    if (lastTotal !== null && lastTotal !== c.total && !REDUCED) {
      out.total.classList.remove("bump"); void out.total.offsetWidth; out.total.classList.add("bump");
    }
    lastTotal = c.total;
  }
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();

  // --- Проверка полей ---
  function setError(input, text) {
    const field = input.closest(".field");
    field.classList.toggle("has-error", !!text);
    field.querySelector(".field-error").textContent = text || "";
    if (text) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
  }
  ["name", "phone", "drink", "time"].forEach(function (n) {
    el[n].addEventListener("input", function () { setError(el[n], ""); });
    el[n].addEventListener("change", function () { setError(el[n], ""); });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.textContent = "";
    const errors = [];
    if (el.name.value.trim().length < 2) errors.push([el.name, "Как вас зовут? Напишем имя на стаканчике."]);
    const digits = el.phone.value.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 12) errors.push([el.phone, "Нужен телефон, например +7 999 000-00-00."]);
    if (el.drink.value === "") errors.push([el.drink, "Выберите напиток."]);
    if (!el.time.value) errors.push([el.time, "Когда заберёте заказ?"]);

    ["name", "phone", "drink", "time"].forEach(function (n) { setError(el[n], ""); });
    if (errors.length) {
      errors.forEach(function (er) { setError(er[0], er[1]); });
      errors[0][0].focus();
      return;
    }

    const c = current();
    const lines = [
      "Здравствуйте! Предзаказ в «Кобальт»:",
      "",
      c.qty + " × " + c.drink.name + ", " + c.size.label + ", молоко: " + c.milk.label.toLowerCase(),
      "Заберу: " + el.time.value,
      "Имя: " + el.name.value.trim(),
      "Телефон: " + el.phone.value.trim()
    ];
    if (el.comment.value.trim()) lines.push("Комментарий: " + el.comment.value.trim());
    lines.push("Сумма: " + c.total + " ₽");

    const url = "https://wa.me/" + ORDER_PHONE + "?text=" + encodeURIComponent(lines.join("\n"));
    window.open(url, "_blank", "noopener");

    status.textContent = "Открываем WhatsApp с готовым заказом. Если окно не появилось, ";
    const a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener"; a.textContent = "нажмите сюда";
    status.append(a, ".");
  });
})();


/* =========================================================
   12. КОНТАКТЫ: «Открыто / Закрыто» и сегодняшний день
   ========================================================= */
(function initHours() {
  const now = new Date();
  const row = $('.hours tr[data-day="' + now.getDay() + '"]');
  if (row) row.classList.add("is-today");

  const badge = $(".open-status");
  if (!badge) return;
  const h = HOURS[now.getDay()];
  const m = now.getHours() * 60 + now.getMinutes();
  const open = m >= toMin(h[0]) && m < toMin(h[1]);
  badge.textContent = open ? "Сейчас открыто — до " + h[1] : "Сейчас закрыто — откроемся в " + HOURS[(m < toMin(h[0]) ? now.getDay() : (now.getDay() + 1) % 7)][0];
  badge.classList.toggle("is-closed", !open);
})();
