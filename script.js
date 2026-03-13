// ⚠️ SUBSTITUA com suas credenciais do Supabase (as mesmas do admin)
const SUPABASE_URL = 'https://tqxozexxqfjcshkeuwdg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jUM3JtKDEZhZNRfBuISMXA_eDwpgmuG';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const COLORS = ['t1', 't2', 't3', 't4', 't5'];
const PROJECT_CLASSES = ['p1', 'p2', 'p3'];

// ── Carrega tudo ao iniciar ──
async function loadSite() {
  await Promise.all([loadBio(), loadSkills(), loadProjects()]);
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
    el.querySelector('svg').insertAdjacentText('afterend', ' ' + data.email);
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
async function loadProjects() {
  const { data } = await sb.from('projects').select('*').order('order');
  if (!data || data.length === 0) return;

  const grid = document.getElementById('projects-grid');
  grid.innerHTML = data.map((p, i) => {
    const cls = PROJECT_CLASSES[i % PROJECT_CLASSES.length];
    const tags = (p.tags || []).map(t => `<span>${t}</span>`).join('');
    const link = p.link ? `href="${p.link}" target="_blank" rel="noopener"` : '';
    return `
      <a class="project-card ${cls}" ${link}>
        <div class="project-icon">${p.icon || '🚀'}</div>
        <h3>${p.name || ''}</h3>
        <p>${p.description || ''}</p>
        <div class="project-tags">${tags}</div>
      </a>`;
  }).join('');
}

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