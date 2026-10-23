/* Interactive org chart: layout, rendering, pan/zoom, and search highlighting. */

// ---- Shared helpers (used across the frontend) ----
window.WK = {
  initials(p) {
    return `${(p.firstName || '')[0] || ''}${(p.lastName || '')[0] || ''}`.toUpperCase();
  },
  areaColor(area) {
    const styles = getComputedStyle(document.documentElement);
    const v = styles.getPropertyValue(`--area-${area}`).trim();
    return v || styles.getPropertyValue('--area-default').trim();
  },
  completenessColor(pct) {
    if (pct >= 80) return '#17b890';
    if (pct >= 40) return '#f6a623';
    return '#e03b4d';
  },
};

const OrgChart = (() => {
  const CARD_W = 200;
  const CARD_H = 118;
  const X_GAP = 34;
  const Y_GAP = 62;
  const MARGIN = 60;

  let viewport, canvas, nodesEl, edgesEl;
  let nodeById = {};
  let layoutNodes = [];
  let onCardClick = () => {};

  // transform state
  let scale = 1, tx = 0, ty = 0;
  // drag state
  let down = false, moved = 0, startX = 0, startY = 0, startTx = 0, startTy = 0;
  let justDragged = false;

  function init(onClick) {
    viewport = document.getElementById('viewport');
    canvas = document.getElementById('canvas');
    nodesEl = document.getElementById('nodes');
    edgesEl = document.getElementById('edges');
    onCardClick = onClick;
    bindInteractions();
  }

  // ---- Layout: tidy tree based on manager relationships ----
  function layout(people) {
    nodeById = {};
    const nameToUser = {};
    people.forEach((p) => {
      nodeById[p.username] = { person: p, children: [], depth: 0, x: 0, y: 0 };
      nameToUser[`${p.firstName} ${p.lastName}`.toLowerCase()] = p.username;
    });

    const roots = [];
    people.forEach((p) => {
      const mgrUser = nameToUser[(p.managerName || '').toLowerCase()];
      if (mgrUser && mgrUser !== p.username) {
        nodeById[mgrUser].children.push(nodeById[p.username]);
      } else {
        roots.push(nodeById[p.username]);
      }
    });

    let nextLeafX = 0;
    const assign = (node, depth) => {
      node.depth = depth;
      if (node.children.length === 0) {
        node.x = nextLeafX * (CARD_W + X_GAP);
        nextLeafX++;
      } else {
        node.children.forEach((c) => assign(c, depth + 1));
        const first = node.children[0].x;
        const last = node.children[node.children.length - 1].x;
        node.x = (first + last) / 2;
      }
      node.y = depth * (CARD_H + Y_GAP);
    };
    roots.forEach((r) => assign(r, 0));

    layoutNodes = Object.values(nodeById);
    const maxX = Math.max(...layoutNodes.map((n) => n.x)) + CARD_W;
    const maxY = Math.max(...layoutNodes.map((n) => n.y)) + CARD_H;
    return { width: maxX + MARGIN * 2, height: maxY + MARGIN * 2 };
  }

  function render(people) {
    const size = layout(people);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    edgesEl.setAttribute('width', size.width);
    edgesEl.setAttribute('height', size.height);
    edgesEl.innerHTML = '';
    nodesEl.innerHTML = '';

    // edges
    layoutNodes.forEach((node) => {
      node.children.forEach((child) => {
        const x1 = node.x + MARGIN + CARD_W / 2;
        const y1 = node.y + MARGIN + CARD_H;
        const x2 = child.x + MARGIN + CARD_W / 2;
        const y2 = child.y + MARGIN;
        const midY = (y1 + y2) / 2;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'edge-line');
        path.setAttribute('d', `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`);
        edgesEl.appendChild(path);
      });
    });

    // cards
    layoutNodes.forEach((node) => {
      nodesEl.appendChild(makeCard(node));
    });

    fit();
  }

  function makeCard(node) {
    const p = node.person;
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.username = p.username;
    el.style.left = `${node.x + MARGIN}px`;
    el.style.top = `${node.y + MARGIN}px`;
    el.style.borderLeftColor = WK.areaColor(p.area);

    const incomplete = p.completeness < 100
      ? `<span class="tag-incomplete">${p.completeness === 0 ? 'Empty profile' : 'Incomplete'}</span>`
      : '<span>Complete ✓</span>';

    el.innerHTML = `
      <div class="card-top">
        <div class="avatar" style="color:${WK.areaColor(p.area)}">${WK.initials(p)}</div>
        <div>
          <div class="card-name">${p.firstName} ${p.lastName}</div>
          <div class="card-role">${p.role}</div>
        </div>
      </div>
      <div class="card-area" style="color:${WK.areaColor(p.area)}">${p.area}</div>
      <div class="completeness">
        <div class="completeness-bar">
          <div class="completeness-fill" style="width:${p.completeness}%;background:${WK.completenessColor(p.completeness)}"></div>
        </div>
        <div class="completeness-label"><span>${p.completeness}% complete</span>${incomplete}</div>
      </div>`;

    el.addEventListener('click', () => {
      if (justDragged) return;
      onCardClick(p.username);
    });
    return el;
  }

  // ---- Pan & zoom ----
  function applyTransform() {
    canvas.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function bindInteractions() {
    viewport.addEventListener('mousedown', (e) => {
      down = true; moved = 0;
      startX = e.clientX; startY = e.clientY;
      startTx = tx; startTy = ty;
    });
    window.addEventListener('mousemove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
      if (moved > 4) viewport.classList.add('grabbing');
      tx = startTx + dx;
      ty = startTy + dy;
      applyTransform();
    });
    window.addEventListener('mouseup', () => {
      if (!down) return;
      down = false;
      viewport.classList.remove('grabbing');
      justDragged = moved > 4;
      setTimeout(() => { justDragged = false; }, 0);
    });

    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const delta = -e.deltaY * 0.0015;
      zoomAt(px, py, delta);
    }, { passive: false });

    document.getElementById('zoom-in').addEventListener('click', () => zoomCenter(0.2));
    document.getElementById('zoom-out').addEventListener('click', () => zoomCenter(-0.2));
    document.getElementById('zoom-fit').addEventListener('click', fit);
  }

  function clampScale(s) { return Math.min(1.6, Math.max(0.25, s)); }

  function zoomAt(px, py, delta) {
    const newScale = clampScale(scale * (1 + delta));
    const ratio = newScale / scale;
    tx = px - (px - tx) * ratio;
    ty = py - (py - ty) * ratio;
    scale = newScale;
    applyTransform();
  }

  function zoomCenter(delta) {
    const rect = viewport.getBoundingClientRect();
    zoomAt(rect.width / 2, rect.height / 2, delta);
  }

  function fit() {
    const rect = viewport.getBoundingClientRect();
    const cw = canvas.offsetWidth;
    const ch = canvas.offsetHeight;
    if (!cw || !ch) return;
    scale = clampScale(Math.min(rect.width / cw, rect.height / ch) * 0.95);
    tx = (rect.width - cw * scale) / 2;
    ty = Math.max(20, (rect.height - ch * scale) / 2);
    applyTransform();
  }

  function centerOn(username) {
    const node = nodeById[username];
    if (!node) return;
    const rect = viewport.getBoundingClientRect();
    scale = clampScale(1);
    const cx = node.x + MARGIN + CARD_W / 2;
    const cy = node.y + MARGIN + CARD_H / 2;
    tx = rect.width / 2 - cx * scale;
    ty = rect.height / 2 - cy * scale;
    applyTransform();
  }

  // ---- Search highlighting ----
  function highlight(rankByUsername) {
    nodesEl.querySelectorAll('.card').forEach((card) => {
      const u = card.dataset.username;
      card.querySelector('.rank-badge')?.remove();
      if (rankByUsername[u]) {
        const rank = rankByUsername[u];
        card.classList.remove('faded');
        card.classList.add(rank <= 3 ? 'match-top' : 'match');
        if (rank <= 5) {
          const badge = document.createElement('div');
          badge.className = 'rank-badge';
          badge.textContent = rank;
          card.appendChild(badge);
        }
      } else {
        card.classList.add('faded');
        card.classList.remove('match', 'match-top');
      }
    });
  }

  function clearHighlight() {
    nodesEl.querySelectorAll('.card').forEach((card) => {
      card.classList.remove('faded', 'match', 'match-top');
      card.querySelector('.rank-badge')?.remove();
    });
  }

  return { init, render, highlight, clearHighlight, fit, centerOn };
})();

window.OrgChart = OrgChart;
