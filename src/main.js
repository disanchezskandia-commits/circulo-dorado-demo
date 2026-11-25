import './style.css';
import { content as T } from './content.js';
import { createWorld } from './world.js';

const STEPS = T.tour.steps;
const HOTSPOT_IDS = ['plano', 'ventana', 'puerta', 'garaje'];
const ICONS = {
  plano: '<svg viewBox="0 0 24 24"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z M9 4v14 M15 6v14"/></svg>',
  ventana: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M12 4v16M4 12h16"/></svg>',
  puerta: '<svg viewBox="0 0 24 24"><path d="M6 21V4a1 1 0 011-1h10a1 1 0 011 1v17M3 21h18"/><circle cx="14.5" cy="12" r="1"/></svg>',
  garaje: '<svg viewBox="0 0 24 24"><path d="M3 10l9-6 9 6v11H3z M7 21v-8h10v8 M7 16h10"/></svg>',
};
const arrow = '<svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const arrowL = '<svg class="ico" viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';

// ---------- Persistencia (demo local; en HubSpot vendrá de formularios/HubDB) ----------
const KEY = 'circulo-dorado-notas';
const getCount = () => Number(localStorage.getItem(KEY)) || T.avance.initialCount;
const setCount = (n) => localStorage.setItem(KEY, String(n));

// ---------- DOM ----------
const app = document.getElementById('app');
app.innerHTML = `
  <canvas id="scene" aria-hidden="true"></canvas>
  <div class="hotspots" id="hotspots"></div>

  <header class="topbar">
    <a class="campaign-link" href="${T.campaignHref}">${T.campaignLink}</a>
    <nav class="nav">${T.nav.map((n) => `<a href="${n.href}" data-nav="${n.id}">${n.label}</a>`).join('')}</nav>
    <a class="btn btn-gold btn-sm cta-brick" href="#nota">${T.ctaBrick}</a>
    <button class="burger" aria-label="${T.menu}"><span></span><span></span></button>
  </header>
  <nav class="mobile-menu">
    ${T.nav.map((n) => `<a href="${n.href}" data-nav="${n.id}">${n.label}</a>`).join('')}
    <a class="btn btn-gold" href="#nota">${T.ctaBrick}</a>
  </nav>

  <section class="home">
    <p class="kicker">${T.home.kicker}</p>
    <h1>${T.home.title.map((l, i) => `<span class="${i === 2 ? 'gold' : ''}">${l}</span>`).join('')}</h1>
    <p class="lead">${T.home.lead}</p>
    <p class="question">${T.home.question}</p>
    <a class="btn btn-gold btn-lg" href="#mapa">${T.home.start} ${arrow}</a>
  </section>

  <div class="map-ui">
    <div class="destino">
      <p class="destino-empty">${T.map.destinationEmpty}</p>
      <div class="destino-body" hidden>
        <p class="kicker destino-kicker"></p>
        <h3 class="destino-title"></h3>
        <p class="destino-desc"></p>
        <a class="btn btn-dark btn-sm destino-go" href="#"></a>
      </div>
    </div>
    <div class="map-actions">
      <button class="link sections-btn">${T.map.sections}</button>
      <span>·</span>
      <a class="link" href="#">${T.map.backHome}</a>
    </div>
  </div>

  <div class="sheet sections-sheet">
    <div class="sheet-card">
      <button class="x sheet-close" aria-label="${T.close}">×</button>
      <h3>${T.map.sections}</h3>
      ${HOTSPOT_IDS.map((id) => {
        const h = T.hotspots[id];
        return `<a class="section-row" href="${h.href}"><span class="hs-ico">${ICONS[id]}</span><span><strong>${h.section}</strong><small>${h.label}</small></span>${arrow}</a>`;
      }).join('')}
    </div>
  </div>

  <div class="tour-ui">
    <button class="tour-exit link">${arrowL} ${T.tour.exit}</button>
    <article class="tour-card">
      <div class="tour-head"><span class="kicker tour-kicker"></span><span class="tour-count"></span></div>
      <h2 class="tour-title"></h2>
      <p class="tour-text"></p>
      <dl class="tour-data"></dl>
      <div class="tour-extra"></div>
      <div class="tour-nav">
        <button class="btn btn-ghost btn-sm tour-prev">${arrowL}<span>${T.tour.prev}</span></button>
        <div class="dots">${STEPS.map((s, i) => `<a href="#avance/${i + 1}" aria-label="${s.kicker}"></a>`).join('')}</div>
        <button class="btn btn-gold btn-sm tour-next"><span>${T.tour.next}</span>${arrow}</button>
      </div>
    </article>
  </div>

  <aside class="panel" aria-hidden="true">
    <button class="x panel-close" aria-label="${T.close}">×</button>
    <div class="panel-body"></div>
  </aside>

  <div class="modal" aria-hidden="true">
    <div class="modal-card"></div>
  </div>
`;

const $ = (s) => app.querySelector(s);
const $$ = (s) => [...app.querySelectorAll(s)];
const body = document.body;

const world = createWorld($('#scene'), { signText: T.signText });
world.setBricks(getCount(), T.avance.goal);

// ---------- Hotspots ----------
const canHover = matchMedia('(hover: hover)').matches;
let selected = null;
HOTSPOT_IDS.forEach((id) => {
  const h = T.hotspots[id];
  const el = document.createElement('button');
  el.className = `hotspot hs-${id}`;
  el.innerHTML = `<span class="hs-dot">${ICONS[id]}</span><span class="hs-label"><strong>${h.section}</strong><small>${h.label}</small></span>`;
  el.addEventListener('mouseenter', () => select(id));
  el.addEventListener('focus', () => select(id));
  el.addEventListener('click', () => {
    if (canHover || selected === id) location.hash = h.href;
    else select(id);
  });
  $('#hotspots').appendChild(el);
  world.track(el, world.anchors[id]);
});

function select(id) {
  selected = id;
  const h = T.hotspots[id];
  $$('.hotspot').forEach((el) => el.classList.toggle('is-active', el.classList.contains(`hs-${id}`)));
  $('.destino-empty').hidden = true;
  $('.destino-body').hidden = false;
  $('.destino-kicker').textContent = h.label;
  $('.destino-title').textContent = h.section;
  $('.destino-desc').textContent = h.desc;
  const go = $('.destino-go');
  go.href = h.href;
  go.innerHTML = `${h.action} ${arrow}`;
}

// ---------- Panel lateral ----------
function openPanel(html) {
  $('.panel-body').innerHTML = html;
  $('.panel-body').scrollTop = 0;
  $('.panel').classList.add('open');
  $('.panel').setAttribute('aria-hidden', 'false');
  body.classList.add('panel-open');
}
function closePanel() {
  $('.panel').classList.remove('open');
  $('.panel').setAttribute('aria-hidden', 'true');
  body.classList.remove('panel-open');
}
$('.panel-close').addEventListener('click', () => (location.hash = '#mapa'));

const H = T.historias;
function renderHistorias() {
  return `
    <p class="kicker">${H.kicker}</p>
    <h2>${H.title}</h2>
    <div class="cards">
      ${H.items
        .map(
          (s, i) => `
        <a class="story-card" href="#historias/${i + 1}">
          <div class="ph ph-portrait"><span>${H.portrait}</span></div>
          <div class="story-meta"><strong>${s.title}</strong><small>${s.lead}</small>
          <span class="link">${H.read} ${arrow}</span></div>
        </a>`
        )
        .join('')}
    </div>`;
}
function renderHistoria(i) {
  const s = H.items[i] || H.items[0];
  const next = ((i + 1) % H.items.length) + 1;
  return `
    <p class="kicker">${H.kicker} · ${i + 1}/${H.items.length}</p>
    <h2>${s.title}</h2>
    <p class="muted">${s.name} · ${s.lead}</p>
    <div class="ph ph-video"><span>${H.media}</span></div>
    ${s.sections.map((b) => `<h4>${b.h}</h4><p>${b.p}</p>`).join('')}
    <div class="end-read">
      <a class="btn btn-ghost btn-sm" href="#historias">${arrowL} ${H.all}</a>
      <a class="btn btn-dark btn-sm" href="#historias/${next}">${H.next} ${arrow}</a>
      <a class="btn btn-gold btn-sm" href="#nota">${T.ctaBrick}</a>
    </div>`;
}
function renderCirculo() {
  const C = T.circulo;
  return `
    <p class="kicker">${C.kicker}</p>
    <h2>${C.title}</h2>
    <div class="ph ph-wide"><span>${C.photo}</span></div>
    ${C.blocks.map((b) => `<h4>${b.h}</h4><p>${b.p}</p>`).join('')}
    <a class="btn btn-gold" href="#avance">${C.action} ${arrow}</a>`;
}
function renderTienda() {
  const S = T.tienda;
  return `
    <p class="kicker">${S.kicker}</p>
    <h2>${S.title}</h2>
    <p>${S.intro}</p>
    <div class="products">
      ${S.products
        .map(
          (p) => `
        <div class="product">
          <div class="ph ph-square"><span>[Foto]</span></div>
          <strong>${p.name}</strong>
          <div class="product-row"><span class="price">${p.price}</span><small>${p.stock}</small></div>
          <small class="muted">${p.origin}</small>
          <a class="btn btn-dark btn-sm" href="#" onclick="return false">${S.buy}</a>
        </div>`
        )
        .join('')}
    </div>`;
}

// ---------- Recorrido ----------
let stepIndex = 0;
function renderAvanceExtra() {
  const A = T.avance;
  const n = getCount();
  const pct = Math.min(100, (n / A.goal) * 100);
  return `
    <div class="thermo">
      <div class="thermo-top"><strong>${A.thermo(n, A.goal)}</strong><small>${A.cutoff}</small></div>
      <div class="thermo-bar"><span style="width:${pct}%"></span></div>
    </div>
    <h4>${A.budgetTitle}</h4>
    <div class="budget">${A.budget.map((b, i) => `<span class="b${i}" style="flex:${b.pct}"><em>${b.label}</em></span>`).join('')}</div>
    <small class="muted">${A.budgetNote}</small>
    <h4>${A.milestonesTitle}</h4>
    <ol class="milestones">${A.milestones.map((m) => `<li><span>${m.title}</span><small>${m.status}</small></li>`).join('')}</ol>
    <a class="btn btn-gold" href="#nota">${T.ctaBrick} ${arrow}</a>`;
}
function renderStep(i) {
  const s = STEPS[i];
  stepIndex = i;
  const card = $('.tour-card');
  card.classList.toggle('is-avance', s.id === 'avance');
  card.classList.remove('in');
  void card.offsetWidth;
  card.classList.add('in');
  $('.tour-kicker').textContent = s.kicker;
  $('.tour-count').textContent = T.tour.stepOf(i + 1, STEPS.length);
  $('.tour-title').textContent = s.title;
  $('.tour-text').textContent = s.text;
  $('.tour-data').innerHTML = s.data.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  $('.tour-extra').innerHTML =
    s.id === 'avance' ? renderAvanceExtra() : s.action ? `<a class="link" href="${s.action.href}">${s.action.label} ${arrow}</a>` : '';
  $('.tour-prev').disabled = i === 0;
  $('.tour-next').hidden = i === STEPS.length - 1;
  $$('.dots a').forEach((d, k) => d.classList.toggle('on', k === i));
  world.tourStep(s.id);
}
$('.tour-prev').addEventListener('click', () => (location.hash = `#avance/${Math.max(1, stepIndex)}`));
$('.tour-next').addEventListener('click', () => (location.hash = `#avance/${Math.min(STEPS.length, stepIndex + 2)}`));
$('.tour-exit').addEventListener('click', () => (location.hash = '#mapa'));
window.addEventListener('keydown', (e) => {
  if (mode !== 'tour' || modalOpen) return;
  if (e.key === 'ArrowRight' && stepIndex < STEPS.length - 1) $('.tour-next').click();
  if (e.key === 'ArrowLeft' && stepIndex > 0) $('.tour-prev').click();
  if (e.key === 'Escape') $('.tour-exit').click();
});

// ---------- Nota / ladrillo ----------
let modalOpen = false;
let returnHash = '#mapa';
function openNote() {
  const N = T.nota;
  modalOpen = true;
  $('.modal-card').innerHTML = `
    <button class="x modal-close" aria-label="${T.close}">×</button>
    <p class="kicker">${N.kicker}</p>
    <h2>${N.title}</h2>
    <form class="note-form">
      <label for="note">${N.question}</label>
      <textarea id="note" rows="4" maxlength="400" placeholder="${N.placeholder}" required></textarea>
      <small class="muted">${N.help}</small>
      <button class="btn btn-gold" type="submit">${N.submit} ${arrow}</button>
    </form>`;
  $('.modal').classList.add('open');
  $('.modal').setAttribute('aria-hidden', 'false');
  setTimeout(() => $('#note')?.focus(), 300);
  $('.modal-close').addEventListener('click', closeNoteNav);
  $('.note-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!$('#note').value.trim()) return;
    const n = getCount() + 1;
    setCount(n);
    world.setBricks(n, T.avance.goal, true);
    $('.modal-card').innerHTML = `
      <button class="x modal-close" aria-label="${T.close}">×</button>
      <div class="done-brick"></div>
      <h2>${N.doneTitle}</h2>
      <p>${N.doneText(n)}</p>
      <a class="btn btn-gold" href="#avance/${STEPS.length}">${N.doneAction} ${arrow}</a>`;
    $('.modal-close').addEventListener('click', closeNoteNav);
  });
}
function closeNote() {
  modalOpen = false;
  $('.modal').classList.remove('open');
  $('.modal').setAttribute('aria-hidden', 'true');
}
function closeNoteNav() {
  location.hash = returnHash;
}
$('.modal').addEventListener('click', (e) => e.target === $('.modal') && closeNoteNav());

// ---------- Menú y hoja de secciones ----------
$('.burger').addEventListener('click', () => body.classList.toggle('menu-open'));
$('.sections-btn').addEventListener('click', () => body.classList.add('sheet-open'));
$('.sheet-close').addEventListener('click', () => body.classList.remove('sheet-open'));
$('.sections-sheet').addEventListener('click', (e) => e.target === $('.sections-sheet') && body.classList.remove('sheet-open'));

// ---------- Rutas ----------
let mode = null;
function setMode(m) {
  if (mode === m) return false;
  mode = m;
  body.dataset.mode = m;
  return true;
}
function showHome() {
  closePanel();
  if (setMode('home')) world.intro();
}
function showMap() {
  if (setMode('map')) world.exterior();
}
function showTour(i) {
  closePanel();
  setMode('tour');
  renderStep(i);
}

function route() {
  const [name, arg] = location.hash.replace(/^#/, '').split('/');
  body.classList.remove('menu-open', 'sheet-open');
  $$('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === (name === 'mapa' ? 'inicio' : name)));

  if (name === 'nota') {
    if (!mode) showMap();
    return openNote();
  }
  closeNote();
  returnHash = location.hash || '#';

  if (!name) return showHome();
  if (name === 'avance') {
    const i = arg ? Math.max(0, Math.min(STEPS.length - 1, parseInt(arg, 10) - 1 || 0)) : 0;
    return showTour(i);
  }
  showMap();
  if (name === 'historias') return openPanel(arg ? renderHistoria(Math.max(0, parseInt(arg, 10) - 1 || 0)) : renderHistorias());
  if (name === 'circulo') return openPanel(renderCirculo());
  if (name === 'tienda') return openPanel(renderTienda());
  closePanel();
}
window.addEventListener('hashchange', route);
route();
