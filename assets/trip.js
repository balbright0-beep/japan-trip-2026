// Shared behaviour for the trip pages (sema.html, costa-rica.html):
// day/reference tabs, saved checkboxes, and the drifting hero particles.

// ═══ Panel switching ═══
// fromUser = false on first load: no scrolling and no #hash (Chrome would
// otherwise jump to the #day-1 anchor when loading finishes).
function showPanel(id, fromUser = true) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const panel = document.getElementById(id);
    const tab = document.querySelector(`.tab[data-panel="${id}"]`);
    if (panel) panel.classList.add('active');
    if (tab) {
        tab.classList.add('active');
        // Centre the tab in the nav strip without scrolling the page itself.
        const strip = tab.parentElement;
        const offset = tab.getBoundingClientRect().left - strip.getBoundingClientRect().left;
        strip.scrollTo({ left: strip.scrollLeft + offset - (strip.clientWidth - tab.clientWidth) / 2, behavior: 'smooth' });
    }
    if (!fromUser) return;
    // The nav is sticky, so its offsetTop moves once it sticks; measure from the panels instead.
    const nav = document.querySelector('.main-nav');
    const top = document.querySelector('.panels').getBoundingClientRect().top + window.scrollY - nav.offsetHeight;
    window.scrollTo({ top, behavior: 'smooth' });
    history.replaceState(null, '', '#' + id);
}

document.querySelectorAll('.tab[data-panel]').forEach(tab => {
    tab.addEventListener('click', () => showPanel(tab.dataset.panel));
});

// ═══ Init: first panel, or the one named in the link ═══
(function() {
    const hash = location.hash.replace('#', '');
    const ids = [...document.querySelectorAll('.panel')].map(p => p.id);
    if (hash && ids.includes(hash)) showPanel(hash);
    else if (ids.length) showPanel(ids[0], false);
})();

// ═══ Checkbox persistence (per-trip prefix from <body data-store>) ═══
(function() {
    const prefix = document.body.dataset.store || 'trip_';
    document.querySelectorAll('input[type="checkbox"][data-key]').forEach(cb => {
        const key = prefix + cb.dataset.key;
        try { cb.checked = localStorage.getItem(key) === '1'; } catch (e) {}
        cb.addEventListener('change', () => {
            try { localStorage.setItem(key, cb.checked ? '1' : '0'); } catch (e) {}
        });
    });
})();

// ═══ Hero particles: "drift" falls like petals, "rise" floats up like sparks ═══
(function() {
    const box = document.getElementById('particles');
    if (!box) return;
    const rise = box.dataset.kind === 'rise';
    const count = Number(box.dataset.count) || 12;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = rise ? 3 + Math.random() * 4 : 7 + Math.random() * 7;
        p.style.cssText = `
            left:${10 + Math.random() * 80}%;
            top:${rise ? 45 + Math.random() * 45 : Math.random() * 30}%;
            width:${size}px;
            height:${rise ? size : size * 1.3}px;
            animation-duration:${rise ? 6 + Math.random() * 8 : 10 + Math.random() * 15}s;
            animation-delay:${Math.random() * 12}s;
        `;
        box.appendChild(p);
    }
})();
