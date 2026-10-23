/* Search bar: query -> highlight matches on the chart + ranked results list. */

const Search = (() => {
  let form, input, clearBtn, panel, listEl, queryEl;

  function init() {
    form = document.getElementById('search-form');
    input = document.getElementById('search-input');
    clearBtn = document.getElementById('search-clear');
    panel = document.getElementById('results-panel');
    listEl = document.getElementById('results-list');
    queryEl = document.getElementById('results-query');

    form.addEventListener('submit', (e) => { e.preventDefault(); run(input.value); });
    clearBtn.addEventListener('click', clear);
    document.getElementById('results-close').addEventListener('click', clear);
  }

  async function run(query) {
    const q = (query || '').trim();
    if (!q) return;
    let matches = [];
    try {
      ({ matches } = await window.api.search(q));
    } catch (err) {
      alert(err.message);
      return;
    }

    queryEl.textContent = `“${q}”`;
    clearBtn.classList.remove('hidden');
    panel.classList.remove('hidden');

    const rankByUsername = {};
    matches.forEach((m, i) => { rankByUsername[m.username] = i + 1; });

    if (matches.length === 0) {
      window.OrgChart.clearHighlight();
      listEl.innerHTML = `<div class="results-empty">No one matched that yet.<br/>Try different words — or some profiles may still be empty.</div>`;
      return;
    }

    window.OrgChart.highlight(rankByUsername);
    listEl.innerHTML = matches.map((m, i) => `
      <div class="result-item" data-username="${m.username}">
        <div><span class="result-rank">${i + 1}</span><span class="result-name">${m.firstName} ${m.lastName}</span></div>
        <div class="result-role">${m.role} · ${m.area} · ${m.completeness}% complete</div>
        <div class="result-reason">${escapeHtml(m.reason)}</div>
      </div>
    `).join('');

    listEl.querySelectorAll('.result-item').forEach((item) => {
      item.addEventListener('click', () => {
        const u = item.dataset.username;
        window.OrgChart.centerOn(u);
        window.Profile.open(u);
      });
    });
  }

  function clear() {
    input.value = '';
    clearBtn.classList.add('hidden');
    panel.classList.add('hidden');
    listEl.innerHTML = '';
    window.OrgChart.clearHighlight();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  return { init, run, clear };
})();

window.Search = Search;
