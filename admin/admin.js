// ⚠️ SUBSTITUA com suas credenciais do Supabase
  const SUPABASE_URL = 'https://tqxozexxqfjcshkeuwdg.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_jUM3JtKDEZhZNRfBuISMXA_eDwpgmuG';

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  let skills = [];
  let projects = [];

  // ── AUTH ──
  async function init() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { window.location.href = 'login.html'; return; }
    document.getElementById('user-email').textContent = session.user.email;
    loadAll();
  }

  async function logout() {
    await sb.auth.signOut();
    window.location.href = 'login.html';
  }

  // ── TABS ──
  function switchTab(name) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('tab-' + name).classList.add('active');
  }

  // ── TOAST ──
  function showToast(msg = '✓ Salvo com sucesso!') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  }

  // ── LOAD ALL ──
  async function loadAll() {
    await loadBio();
    await loadSkills();
    await loadProjects();
    await loadMessages();
  }

  // ── BIO ──
  async function loadBio() {
    const { data } = await sb.from('bio').select('*').single();
    if (!data) return;
    document.getElementById('bio-subtitle').value = data.subtitle || '';
    document.getElementById('bio-p1').value = data.p1 || '';
    document.getElementById('bio-p2').value = data.p2 || '';
    document.getElementById('bio-p3').value = data.p3 || '';
    document.getElementById('bio-status').value = data.status || '';
    document.getElementById('bio-email').value = data.email || '';
  }

  async function saveBio() {
    const payload = {
      subtitle: document.getElementById('bio-subtitle').value,
      p1: document.getElementById('bio-p1').value,
      p2: document.getElementById('bio-p2').value,
      p3: document.getElementById('bio-p3').value,
      status: document.getElementById('bio-status').value,
      email: document.getElementById('bio-email').value,
    };
    const { data } = await sb.from('bio').select('id').single();
    if (data) {
      await sb.from('bio').update(payload).eq('id', data.id);
    } else {
      await sb.from('bio').insert(payload);
    }
    showToast('✓ Bio salva!');
  }

  // ── SKILLS ──
  async function loadSkills() {
    const { data } = await sb.from('skills').select('*').order('order');
    skills = data || [];
    renderSkills();
  }

  function renderSkills() {
    const el = document.getElementById('skills-list');
    el.innerHTML = skills.map((s, i) => `
      <div class="skill-item">
        ${s.name}
        <button class="skill-remove" onclick="removeSkill(${i})">×</button>
      </div>
    `).join('');
  }

  function addSkill() {
    const input = document.getElementById('new-skill');
    const val = input.value.trim();
    if (!val) return;
    skills.push({ name: val, order: skills.length });
    renderSkills();
    input.value = '';
  }

  function removeSkill(i) {
    skills.splice(i, 1);
    renderSkills();
  }

  async function saveSkills() {
    const existingIds = skills.filter(s => s.id).map(s => s.id);
    if (existingIds.length > 0) {
      await sb.from('skills').delete().not('id', 'in', '(' + existingIds.join(',') + ')');
    } else {
      await sb.from('skills').delete().gte('id', 0);
    }
    const rows = skills.map((s, i) => ({ id: s.id || (i + 1), name: s.name, order: i }));
    if (rows.length > 0) await sb.from('skills').upsert(rows, { onConflict: 'id' });
    await loadSkills();
    showToast('✓ Skills salvas!');
  }

  // ── PROJECTS ──
  async function loadProjects() {
    const { data } = await sb.from('projects').select('*').order('order');
    projects = data || [];
    renderProjects();
  }

  function renderProjects() {
    const el = document.getElementById('projects-list');
    el.innerHTML = projects.map((p, i) => `
      <div class="project-item" id="proj-${i}">
        <div class="project-item-header">
          <span class="project-num">PROJETO ${i + 1}</span>
          <button class="btn-danger" onclick="removeProject(${i})">Remover</button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Nome</label>
            <input type="text" value="${p.name || ''}" onchange="projects[${i}].name = this.value" />
          </div>
          <div class="form-group">
            <label>Emoji / Ícone</label>
            <input type="text" value="${p.icon || ''}" onchange="projects[${i}].icon = this.value" placeholder="🌐" />
          </div>
        </div>
        <div class="form-group">
          <label>Descrição curta (card)</label>
          <textarea onchange="projects[${i}].description = this.value">${p.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label>Descrição longa (modal)</label>
          <textarea onchange="projects[${i}].long_description = this.value">${p.long_description || ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Tags (separadas por vírgula)</label>
            <input type="text" value="${(p.tags || []).join(', ')}" onchange="projects[${i}].tags = this.value.split(',').map(t => t.trim())" />
          </div>
          <div class="form-group">
            <label>Período (ex: Jan 2024 – Mar 2024)</label>
            <input type="text" value="${p.period || ''}" onchange="projects[${i}].period = this.value" placeholder="Jan 2024 – Mar 2024" />
          </div>
        </div>
        <div class="form-group">
          <label>Link do GitHub (opcional)</label>
          <input type="url" value="${p.link || ''}" onchange="projects[${i}].link = this.value" placeholder="https://github.com/..." />
        </div>
        <div class="form-group">
          <label>URLs de imagens (separadas por vírgula)</label>
          <input type="text" value="${(p.images || []).join(', ')}" onchange="projects[${i}].images = this.value.split(',').map(t => t.trim()).filter(Boolean)" placeholder="https://i.imgur.com/..." />
        </div>
      </div>
    `).join('');
  }

  function addProject() {
    projects.push({ name: '', icon: '🚀', description: '', tags: [], link: '', order: projects.length });
    renderProjects();
  }

  function removeProject(i) {
    projects.splice(i, 1);
    renderProjects();
  }

  async function saveProjects() {
    const existingIds = projects.filter(p => p.id).map(p => p.id);
    if (existingIds.length > 0) {
      await sb.from('projects').delete().not('id', 'in', '(' + existingIds.join(',') + ')');
    } else {
      await sb.from('projects').delete().gte('id', 0);
    }
    const rows = projects.map((p, i) => ({
      id: p.id || (i + 1),
      name: p.name,
      icon: p.icon,
      description: p.description,
      long_description: p.long_description || '',
      tags: p.tags,
      link: p.link,
      period: p.period || '',
      images: p.images || [],
      order: i
    }));
    if (rows.length > 0) await sb.from('projects').upsert(rows, { onConflict: 'id' });
    await loadProjects();
    showToast('✓ Projetos salvos!');
  }

  // Salva projetos ao clicar Salvar na aba
  document.addEventListener('click', e => {
    if (e.target.classList.contains('btn-save') && document.getElementById('tab-projects').classList.contains('active')) {
      saveProjects();
    }
  });

  // ── MESSAGES ──
  async function loadMessages() {
    const { data } = await sb.from('messages').select('*').order('created_at', { ascending: false });
    const el = document.getElementById('messages-list');
    if (!data || data.length === 0) {
      el.innerHTML = '<div class="empty-state">Nenhuma mensagem ainda.</div>';
      return;
    }
    el.innerHTML = data.map(m => `
      <div class="message-item">
        <div class="message-meta">
          <span class="message-name">${m.name}</span>
          <span class="message-email">${m.email}</span>
          <span class="message-date">${new Date(m.created_at).toLocaleDateString('pt-BR')}</span>
        </div>
        <div class="message-text">${m.message}</div>
      </div>
    `).join('');
  }

  init();