/* App bootstrap: state, login/logout, loading data, legend and nudges. */

window.state = { user: null, people: [], byUsername: {}, searchActive: false };

const App = (() => {
  const AREA_ORDER = ['Executive', 'Product', 'Engineering', 'Design', 'Operations', 'Partnerships'];

  async function init() {
    await window.api.ready; // decide server vs static backend first

    Profile.init();
    OrgChart.init((username) => Profile.open(username));
    Search.init();

    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Session check
    try {
      const { user } = await window.api.me();
      window.state.user = user;
    } catch (_) {
      window.state.user = null;
    }

    if (window.state.user) showApp();
    else showLogin();
  }

  async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = '';
    try {
      const { user } = await window.api.login(username, password);
      window.state.user = user;
      document.getElementById('login-password').value = '';
      showApp();
    } catch (err) {
      errorEl.textContent = err.message;
    }
  }

  async function handleLogout() {
    try { await window.api.logout(); } catch (_) {}
    window.state.user = null;
    Search.clear();
    showLogin();
  }

  function showLogin() {
    document.getElementById('app').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
  }

  async function showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('user-name').textContent =
      `${window.state.user.firstName} ${window.state.user.lastName}`;
    await reloadPeople();
  }

  async function reloadPeople() {
    const { people } = await window.api.getPeople();
    window.state.people = people;
    window.state.byUsername = {};
    people.forEach((p) => { window.state.byUsername[p.username] = p; });
    OrgChart.render(people);
    renderLegend(people);
    updateNudge();
  }

  function renderLegend(people) {
    const areas = AREA_ORDER.filter((a) => people.some((p) => p.area === a));
    document.getElementById('legend').innerHTML = areas.map((a) => `
      <div class="legend-item">
        <span class="legend-dot" style="background:${WK.areaColor(a)}"></span>${a}
      </div>`).join('');
  }

  function updateNudge() {
    const nudge = document.getElementById('nudge');
    const me = window.state.user ? window.state.byUsername[window.state.user.username] : null;
    if (me && me.completeness < 100) {
      nudge.innerHTML = `
        <span>👋 Your profile is <strong>${me.completeness}% complete</strong>. A fuller profile helps colleagues find you — and ranks you higher in search.</span>
        <button class="btn-primary" id="nudge-btn">Complete my profile</button>`;
      nudge.classList.remove('hidden');
      document.getElementById('nudge-btn').addEventListener('click', () => Profile.open(me.username));
    } else {
      nudge.classList.add('hidden');
    }
  }

  return { init, reloadPeople };
})();

window.App = App;
document.addEventListener('DOMContentLoaded', App.init);
