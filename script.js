// ⚠️ SUBSTITUA com suas credenciais do Supabase (as mesmas do admin)
const SUPABASE_URL = 'https://tqxozexxqfjcshkeuwdg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jUM3JtKDEZhZNRfBuISMXA_eDwpgmuG';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const COLORS = ['t1', 't2', 't3', 't4', 't5'];
const PROJECT_CLASSES = ['p1', 'p2', 'p3'];

// ── Carrega tudo ao iniciar ──
async function loadSite() {
  await Promise.all([loadBio(), loadSkills(), loadProjects(), loadEmpresa(), loadCatalogo()]);
}

// ── Bio ──
async function loadBio() {
  const { data } = await sb.from('bio').select('*').single();
  if (!data) return;

  if (data.status)   document.getElementById('hero-status').textContent = data.status;
  if (data.subtitle) document.getElementById('hero-subtitle').innerHTML = data.subtitle.replace('\n', '<br>');
  if (data.p1)       document.getElementById('bio-p1').textContent = data.p1;
  if (data.p2)       document.getElementById('bio-p2').textContent = data.p2;
  if (data.p3)       document.getElementById('bio-p3').textContent = data.p3;

  if (data.email) {
    const el = document.getElementById('contact-email');
    el.href = 'mailto:' + data.email;
    el.lastChild.textContent = ' ' + data.email;
  }
}

// ── Skills ──
async function loadSkills() {
  const { data } = await sb.from('skills').select('*').order('order');
  if (!data || data.length === 0) return;

  const strip = document.getElementById('skills-strip');
  strip.innerHTML = data.map((s, i) =>
    `<span class="skill-tag ${COLORS[i % COLORS.length]}">${s.name}</span>`
  ).join('');
}

// ── Projects ──
let allProjects = [];

async function loadProjects() {
  const { data } = await sb.from('projects').select('*').order('order');
  if (!data || data.length === 0) return;
  allProjects = data;

  const grid = document.getElementById('projects-grid');
  grid.innerHTML = data.map((p, i) => {
    const cls = PROJECT_CLASSES[i % PROJECT_CLASSES.length];
    const tags = (p.tags || []).map(t => `<span>${t}</span>`).join('');
    return `
      <div class="project-card ${cls}" onclick="openModal(${i})">
        <div class="project-icon">${p.icon || '🚀'}</div>
        <h3>${p.name || ''}</h3>
        <p>${p.description || ''}</p>
        <div class="project-tags">${tags}</div>
      </div>`;
  }).join('');
}

// ── Modal ──
function openModal(i) {
  const p = allProjects[i];
  if (!p) return;

  document.getElementById('modal-icon').textContent = p.icon || '🚀';
  document.getElementById('modal-title').textContent = p.name || '';
  document.getElementById('modal-description').textContent = p.long_description || p.description || '';
  document.getElementById('modal-period').textContent = p.period || '';
  document.getElementById('modal-period').style.display = p.period ? 'inline-block' : 'none';

  // Tags
  const tagsEl = document.getElementById('modal-tags');
  tagsEl.innerHTML = (p.tags || []).map(t => `<span>${t}</span>`).join('');

  // GitHub link
  const linkEl = document.getElementById('modal-link');
  if (p.link) {
    linkEl.href = p.link;
    linkEl.style.display = 'inline-flex';
  } else {
    linkEl.style.display = 'none';
  }

  // Carrossel de imagens
  const imagesEl = document.getElementById('modal-images');
  const imgs = (p.images || []).filter(s => s && s.startsWith('http'));
  if (imgs.length === 0) {
    imagesEl.innerHTML = '';
    imagesEl.style.display = 'none';
  } else {
    imagesEl.style.display = 'block';
    let current = 0;
    const render = () => {
      imagesEl.innerHTML = `
        <img src="${imgs[current]}" alt="${p.name}" onclick="openLightbox('${imgs[current]}')" />
        ${imgs.length > 1 ? `
          <button class="carousel-btn carousel-prev" onclick="carouselPrev()">‹</button>
          <button class="carousel-btn carousel-next" onclick="carouselNext()">›</button>
          <div class="carousel-dots">
            ${imgs.map((_, i) => `<div class="carousel-dot ${i === current ? 'active' : ''}" onclick="carouselGo(${i})"></div>`).join('')}
          </div>` : ''}
      `;
    };
    window.carouselPrev = () => { current = (current - 1 + imgs.length) % imgs.length; render(); };
    window.carouselNext = () => { current = (current + 1) % imgs.length; render(); };
    window.carouselGo  = (i) => { current = i; render(); };
    render();
  }

  document.getElementById('project-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModalDirect() {
  document.getElementById('project-modal').classList.remove('open');
  document.body.style.overflow = '';
}

function closeModal(e) {
  if (e.target.id === 'project-modal') closeModalDirect();
}

// Fechar com ESC
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModalDirect();
});

// ── Scroll suave ──
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const target = document.querySelector(link.getAttribute('href'));
  if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
});

// ── Nav ativo ──
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.style.color = link.getAttribute('href') === '#' + entry.target.id ? '#fff' : '#777';
      });
    }
  });
}, { threshold: 0.5 });
sections.forEach(s => observer.observe(s));

// ── Sombra no nav ao rolar ──
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 10) {
    nav.style.boxShadow = '0 4px 24px rgba(194, 24, 91, 0.10)';
    nav.style.borderBottom = '1px solid #C2185B40';
  } else {
    nav.style.boxShadow = 'none';
    nav.style.borderBottom = '1px solid #C2185B20';
  }
});

// ── Formulário de contato ──
async function sendMessage() {
  const name    = document.getElementById('form-name').value.trim();
  const email   = document.getElementById('form-email').value.trim();
  const message = document.getElementById('form-message').value.trim();
  const btn      = document.getElementById('btn-send');
  const feedback = document.getElementById('form-feedback');

  if (!name || !email || !message) {
    feedback.className = 'feedback-error';
    feedback.textContent = '⚠ Preencha todos os campos.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Enviando...';
  feedback.textContent = '';

  const { error } = await sb.from('messages').insert({ name, email, message });

  if (error) {
    feedback.className = 'feedback-error';
    feedback.textContent = '✗ Erro ao enviar. Tente novamente.';
    btn.disabled = false;
    btn.textContent = 'Enviar mensagem →';
  } else {
    feedback.className = 'feedback-success';
    feedback.textContent = '✓ Mensagem enviada! Em breve entrarei em contato.';
    document.getElementById('form-name').value = '';
    document.getElementById('form-email').value = '';
    document.getElementById('form-message').value = '';
    btn.disabled = false;
    btn.textContent = 'Enviar mensagem →';
  }
}

// ── Empresa ──
async function loadEmpresa() {
  const { data } = await sb.from('empresa').select('*').single();
  if (!data) return;
  if (data.nome)      document.getElementById('empresa-nome').textContent = data.nome;
  if (data.descricao) document.getElementById('empresa-desc').textContent = data.descricao;
  const logoEl = document.getElementById('empresa-emoji');
  if (data.logo) {
    logoEl.innerHTML = `<img src="${data.logo}" alt="${data.nome || ''}" style="width:100%;height:100%;object-fit:contain;border-radius:10px;padding:4px;" />`;
  } else {
    logoEl.textContent = data.emoji || '🪵';
  }
}

// ── Catálogo ──
let allCatalogo = [];

async function loadCatalogo() {
  const { data } = await sb.from('catalogo').select('*').order('order');
  allCatalogo = data || [];
  const grid = document.getElementById('catalogo-grid');
  if (allCatalogo.length === 0) {
    grid.innerHTML = '<p class="catalogo-hint">Nenhum item adicionado ainda.</p>';
    return;
  }
  grid.innerHTML = allCatalogo.map((item, i) => {
    const thumb = item.img_antes || item.img_depois || item.img_anuncio || '';
    const hasBefore = !!item.img_antes;
    const hasAfter = !!item.img_depois;
    const tipos = [];
    if (hasBefore || hasAfter) tipos.push('Antes & Depois');
    if (item.img_anuncio) tipos.push('Anúncio');
    if (!hasBefore && !hasAfter && !item.img_anuncio) tipos.push('Produto');
    return `
      <div class="cat-card" onclick="openCatModal(${i})">
        <div class="cat-card-img">
          ${thumb ? `<img src="${thumb}" alt="${item.titulo || 'item'}" />` : '<div class="cat-card-no-img">📷</div>'}
          <div class="cat-card-badge">${tipos.join(' · ')}</div>
        </div>
        <div class="cat-card-info">
          <h3>${item.titulo || 'Sem título'}</h3>
          ${item.descricao ? `<p>${item.descricao}</p>` : ''}
        </div>
      </div>`;
  }).join('');
}

function openCatModal(i) {
  const item = allCatalogo[i];
  if (!item) return;
  document.getElementById('cat-modal-title').textContent = item.titulo || 'Sem título';
  document.getElementById('cat-modal-desc').textContent = item.descricao || '';
  document.getElementById('cat-modal-desc').style.display = item.descricao ? 'block' : 'none';

  const tipos = [];
  if (item.img_antes || item.img_depois) tipos.push('Antes & Depois');
  if (item.img_anuncio) tipos.push('Anúncio');
  document.getElementById('cat-modal-tipo').textContent = tipos.join(' · ') || 'Produto';

  const imgsEl = document.getElementById('cat-modal-images');
  const cols = [];
  if (item.img_antes) cols.push(`
    <div class="cat-compare-item">
      <div class="cat-compare-label">Antes</div>
      <img src="${item.img_antes}" alt="Antes" onclick="openLightbox('${item.img_antes}')" />
    </div>`);
  if (item.img_depois) cols.push(`
    <div class="cat-compare-item">
      <div class="cat-compare-label">Depois</div>
      <img src="${item.img_depois}" alt="Depois" onclick="openLightbox('${item.img_depois}')" />
    </div>`);
  if (item.img_anuncio) cols.push(`
    <div class="cat-compare-item">
      <div class="cat-compare-label">Anúncio</div>
      <img src="${item.img_anuncio}" alt="Anúncio" onclick="openLightbox('${item.img_anuncio}')" />
    </div>`);
  imgsEl.innerHTML = cols.length
    ? `<div class="cat-modal-imgs">${cols.join('')}</div>`
    : '';

  // Links e-commerce
  const linksEl = document.getElementById('cat-modal-links');
  const stores = [
    { key: 'link_mercadolivre', label: 'Mercado Livre', color: '#FFE600', text: '#333' },
    { key: 'link_shopee',       label: 'Shopee',        color: '#EE4D2D', text: '#fff' },
    { key: 'link_magalu',       label: 'Magalu',        color: '#0086FF', text: '#fff' },
    { key: 'link_tiktok',       label: 'TikTok',        color: '#111',    text: '#fff' },
    { key: 'link_amazon',       label: 'Amazon',        color: '#FF9900', text: '#111' },
  ];

  const activeLinks = stores.filter(s => item[s.key]);
  if (activeLinks.length > 0) {
    linksEl.innerHTML = `
      <div class="cat-ecommerce-label">Disponível em</div>
      <div class="cat-ecommerce-btns">
        ${activeLinks.map(s => `
          <a href="${item[s.key]}" target="_blank" rel="noopener" class="cat-ecommerce-btn" style="background:${s.color};color:${s.text};">
            ${s.label}
          </a>`).join('')}
      </div>`;
    linksEl.style.display = 'block';
  } else {
    linksEl.innerHTML = '';
    linksEl.style.display = 'none';
  }

  document.getElementById('cat-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCatModalDirect() {
  document.getElementById('cat-modal').classList.remove('open');
  document.body.style.overflow = '';
}
function closeCatModal(e) {
  if (e.target.id === 'cat-modal') closeCatModalDirect();
}

// ── Lightbox ──
function openLightbox(src) {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  img.src = src;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeLightbox(); closeCatModalDirect(); }
});

// ── Tema escuro/claro ──
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  document.getElementById('theme-toggle').textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('theme', newTheme);
}

function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = saved === 'dark' ? '🌙' : '☀️';
}

initTheme();

// Inicia
loadSite();

// ── Scroll reveal ──
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    } else {
      entry.target.classList.remove('visible');
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
  revealObserver.observe(el);
});

// Revela cards de projeto dinamicamente após carregar
const projectObserver = new MutationObserver(() => {
  document.querySelectorAll('.project-card:not(.observed)').forEach((card, i) => {
    card.classList.add('reveal', 'observed');
    card.style.transitionDelay = (i * 0.1) + 's';
    revealObserver.observe(card);
  });
});
projectObserver.observe(document.getElementById('projects-grid'), { childList: true });