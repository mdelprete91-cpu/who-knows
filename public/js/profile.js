/* Profile modal: view any colleague; edit only your own. */

const Profile = (() => {
  let modal, content;

  const FIELDS = [
    { key: 'whatIDo', label: 'What I do', hint: 'A short description of your work.', type: 'textarea' },
    { key: 'skills', label: 'Skills & topics I know well', hint: 'Comma-separated, e.g. budgeting, forecasting, SQL.', type: 'input' },
    { key: 'currentlyWorkingOn', label: 'Currently working on', hint: '', type: 'textarea' },
    { key: 'happyToHelp', label: 'Happy to help with', hint: '', type: 'textarea' },
    { key: 'whatIDont', label: "What I don't do", hint: 'Topics people ask you about but should ask someone else.', type: 'textarea' },
  ];

  function init() {
    modal = document.getElementById('profile-modal');
    content = document.getElementById('profile-content');
    modal.querySelector('[data-close]').addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  function person(username) {
    return window.state.byUsername[username];
  }

  function open(username) {
    const p = person(username);
    if (!p) return;
    const canEdit = window.state.user && window.state.user.username === username;
    renderView(p, canEdit);
    modal.classList.remove('hidden');
  }

  function close() {
    modal.classList.add('hidden');
  }

  function fieldBlock(label, value, asChips) {
    if (!value || !value.trim()) {
      return `<div class="profile-section"><h4>${label}</h4><p class="empty">Not filled in yet.</p></div>`;
    }
    if (asChips) {
      const chips = value.split(',').map((s) => s.trim()).filter(Boolean)
        .map((s) => `<span class="chip">${escapeHtml(s)}</span>`).join('');
      return `<div class="profile-section"><h4>${label}</h4><div class="chips">${chips}</div></div>`;
    }
    return `<div class="profile-section"><h4>${label}</h4><p>${escapeHtml(value)}</p></div>`;
  }

  function renderView(p, canEdit) {
    const color = WK.areaColor(p.area);
    content.innerHTML = `
      <button class="modal-close" data-x>✕</button>
      <div class="profile-head">
        <div class="avatar" style="color:${color}">${WK.initials(p)}</div>
        <div>
          <div class="profile-name">${p.firstName} ${p.lastName}</div>
          <div class="profile-role">${p.role} · <span style="color:${color};font-weight:600">${p.area}</span></div>
          <div class="profile-meta">📍 ${p.location} · <a href="mailto:${p.email}">${p.email}</a></div>
          ${p.managerName ? `<div class="profile-meta">Reports to ${p.managerName}</div>` : ''}
        </div>
      </div>

      <div class="profile-completeness">
        <div class="completeness-bar">
          <div class="completeness-fill" style="width:${p.completeness}%;background:${WK.completenessColor(p.completeness)}"></div>
        </div>
        <div class="completeness-label"><span>Profile ${p.completeness}% complete</span></div>
      </div>

      ${fieldBlock('What I do', p.whatIDo)}
      ${fieldBlock('Skills & topics', p.skills, true)}
      ${fieldBlock('Currently working on', p.currentlyWorkingOn)}
      ${fieldBlock('Happy to help with', p.happyToHelp)}
      ${fieldBlock("What I don't do", p.whatIDont)}

      ${canEdit ? '<button class="btn-primary profile-edit-btn" data-edit>Edit my profile</button>'
        : '<p class="profile-meta" style="margin-top:18px">You can only edit your own profile.</p>'}
    `;
    content.querySelector('[data-x]').addEventListener('click', close);
    if (canEdit) content.querySelector('[data-edit]').addEventListener('click', () => renderEdit(p));
  }

  function renderEdit(p) {
    const fieldsHtml = FIELDS.map((f) => {
      const val = escapeHtml(p[f.key] || '');
      const input = f.type === 'input'
        ? `<input id="edit-${f.key}" type="text" value="${val}" />`
        : `<textarea id="edit-${f.key}" rows="3">${val}</textarea>`;
      return `<div class="edit-field">
        <label>${f.label} ${f.hint ? `<span class="hint">— ${f.hint}</span>` : ''}</label>
        ${input}
      </div>`;
    }).join('');

    content.innerHTML = `
      <button class="modal-close" data-x>✕</button>
      <div class="profile-name">Edit profile</div>
      <div class="profile-role">${p.firstName} ${p.lastName} · ${p.role}</div>
      <form id="edit-form">
        ${fieldsHtml}
        <div class="edit-actions">
          <button type="submit" class="btn-primary">Save changes</button>
          <button type="button" class="btn-ghost" data-cancel>Cancel</button>
        </div>
      </form>
    `;
    content.querySelector('[data-x]').addEventListener('click', close);
    content.querySelector('[data-cancel]').addEventListener('click', () => renderView(p, true));
    content.querySelector('#edit-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const updates = {};
      FIELDS.forEach((f) => { updates[f.key] = document.getElementById(`edit-${f.key}`).value; });
      try {
        await window.api.updateProfile(p.username, updates);
        await window.App.reloadPeople();
        renderView(person(p.username), true);
      } catch (err) {
        alert(err.message);
      }
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  return { init, open, close };
})();

window.Profile = Profile;
