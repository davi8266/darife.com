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

  // Redes sociais e links
  const linksEl = document.getElementById('empresa-links');
  const socials = [
    { key: 'link_instagram', label: 'Instagram', icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>` },
    { key: 'link_facebook', label: 'Facebook', icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>` },
    { key: 'link_whatsapp', label: 'WhatsApp', icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>` },
    { key: 'link_site', label: 'Site', icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>` },
  ];

  const activeLinks = socials.filter(s => data[s.key]);
  if (activeLinks.length > 0) {
    linksEl.innerHTML = activeLinks.map(s =>
      `<a href="${data[s.key]}" target="_blank" rel="noopener" class="empresa-social-link" title="${s.label}">
        ${s.icon}<span>${s.label}</span>
      </a>`
    ).join('');
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