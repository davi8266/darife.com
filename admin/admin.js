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
    await loadEmpresa();
    await loadCatalogo();
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

  // ── EMPRESA ──
  async function loadEmpresa() {
    const { data } = await sb.from('empresa').select('*').single();
    if (!data) return;
    document.getElementById('emp-nome').value = data.nome || '';
    document.getElementById('emp-desc').value = data.descricao || '';
    document.getElementById('emp-emoji').value = data.emoji || '🪵';
    document.getElementById('emp-logo').value = data.logo || '';
  }

  async function saveEmpresa() {
    const payload = {
      nome: document.getElementById('emp-nome').value,
      descricao: document.getElementById('emp-desc').value,
      emoji: document.getElementById('emp-emoji').value,
      logo: document.getElementById('emp-logo').value,
    };
    const { data } = await sb.from('empresa').select('id').single();
    if (data) {
      await sb.from('empresa').update(payload).eq('id', data.id);
    } else {
      await sb.from('empresa').insert({ ...payload, id: 1 });
    }
    showToast('✓ Empresa salva!');
  }

  // ── CATÁLOGO ──
  let catalogoItems = [];

  async function loadCatalogo() {
    const { data } = await sb.from('catalogo').select('*').order('order');
    catalogoItems = data || [];
    renderCatalogo();
  }

  function renderCatalogo() {
    const el = document.getElementById('catalogo-list');
    if (catalogoItems.length === 0) {
      el.innerHTML = '<p style="font-family:var(--mono);font-size:0.8rem;color:#aaa;text-align:center;padding:2rem;">Nenhum item ainda. Clique em + Adicionar.</p>';
      return;
    }
    el.innerHTML = catalogoItems.map((item, i) => `
      <div class="project-item">
        <div class="project-item-header">
          <span class="project-num">ITEM ${i + 1}</span>
          <button class="btn-danger" onclick="removeCatalogo(${i})">Remover</button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Título</label>
            <input type="text" value="${item.titulo || ''}" onchange="catalogoItems[${i}].titulo = this.value" placeholder="Ex: Quadro Mandala" />
          </div>
          <div class="form-group">
            <label>Tipo</label>
            <select onchange="catalogoItems[${i}].tipo = this.value">
              <option value="produto" ${item.tipo === 'produto' ? 'selected' : ''}>Produto</option>
              <option value="antes-depois" ${item.tipo === 'antes-depois' ? 'selected' : ''}>Antes & Depois</option>
              <option value="anuncio" ${item.tipo === 'anuncio' ? 'selected' : ''}>Anúncio</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Descrição (opcional)</label>
          <textarea onchange="catalogoItems[${i}].descricao = this.value" placeholder="Descreva o produto...">${item.descricao || ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>📷 Imagem Antes</label>
            <input type="url" value="${item.img_antes || ''}" onchange="catalogoItems[${i}].img_antes = this.value" placeholder="https://..." />
          </div>
          <div class="form-group">
            <label>✨ Imagem Depois</label>
            <input type="url" value="${item.img_depois || ''}" onchange="catalogoItems[${i}].img_depois = this.value" placeholder="https://..." />
          </div>
        </div>
        <div class="form-group">
          <label>🛒 Foto do Anúncio</label>
          <input type="url" value="${item.img_anuncio || ''}" onchange="catalogoItems[${i}].img_anuncio = this.value" placeholder="https://..." />
        </div>
        <div style="font-family:var(--mono);font-size:0.68rem;color:#999;letter-spacing:0.08em;text-transform:uppercase;margin:1rem 0 0.5rem;padding-top:0.75rem;border-top:1px solid var(--border);">Links e-commerce (opcional)</div>
        <div class="form-row">
          <div class="form-group">
            <label>Mercado Livre</label>
            <input type="url" value="${item.link_mercadolivre || ''}" onchange="catalogoItems[${i}].link_mercadolivre = this.value" placeholder="https://produto.mercadolivre.com.br/..." />
          </div>
          <div class="form-group">
            <label>Shopee</label>
            <input type="url" value="${item.link_shopee || ''}" onchange="catalogoItems[${i}].link_shopee = this.value" placeholder="https://shopee.com.br/..." />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Magalu</label>
            <input type="url" value="${item.link_magalu || ''}" onchange="catalogoItems[${i}].link_magalu = this.value" placeholder="https://www.magazineluiza.com.br/..." />
          </div>
          <div class="form-group">
            <label>TikTok Shop</label>
            <input type="url" value="${item.link_tiktok || ''}" onchange="catalogoItems[${i}].link_tiktok = this.value" placeholder="https://www.tiktok.com/..." />
          </div>
        </div>
        <div class="form-group">
          <label>Amazon</label>
          <input type="url" value="${item.link_amazon || ''}" onchange="catalogoItems[${i}].link_amazon = this.value" placeholder="https://www.amazon.com.br/..." />
        </div>
      </div>
    `).join('');
  }

  function addCatalogo() {
    catalogoItems.push({ tipo: 'produto', titulo: '', imagem: '', order: catalogoItems.length });
    renderCatalogo();
  }

  function removeCatalogo(i) {
    catalogoItems.splice(i, 1);
    renderCatalogo();
  }

  async function saveCatalogo() {
    await sb.from('catalogo').delete().gte('id', 0);
    const rows = catalogoItems.map((item, i) => ({
      id: item.id || (i + 1),
      tipo: item.tipo || 'produto',
      titulo: item.titulo || '',
      descricao: item.descricao || '',
      img_antes: item.img_antes || '',
      img_depois: item.img_depois || '',
      img_anuncio: item.img_anuncio || '',
      link_mercadolivre: item.link_mercadolivre || '',
      link_shopee: item.link_shopee || '',
      link_magalu: item.link_magalu || '',
      link_tiktok: item.link_tiktok || '',
      link_amazon: item.link_amazon || '',
      order: i
    }));
    if (rows.length > 0) await sb.from('catalogo').upsert(rows, { onConflict: 'id' });
    showToast('✓ Catálogo salvo!');
  }

  init();