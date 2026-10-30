// Shared behaviour for the trip pages (sema.html, costa-rica.html):
// day/reference tabs, saved checkboxes, hero particles, the countdown and
// "today" mode, tap-to-hear phrases, the calendar file, and printing.

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

// ═══ Trip dates: countdown chip + "today" mode ═══
// <body data-start data-end>; day panels carry data-date="YYYY-MM-DD" or "first..last".
(function() {
    const b = document.body.dataset;
    if (!b.start) return;
    const day = 86400000;
    const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
    const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = parse(b.start), end = parse(b.end);

    const chip = document.querySelector('[data-countdown]');
    if (chip) {
        const n = Math.round((start - today) / day);
        const fill = t => t.replace('{days}', n === 1 ? '1 day' : `${n} days`)
            .replace('{d}', Math.round((today - start) / day) + 1)
            .replace('{t}', Math.round((end - start) / day) + 1);
        chip.textContent = fill(today < start ? chip.dataset.before : today <= end ? chip.dataset.during : chip.dataset.after);
    }

    if (today < start || today > end || location.hash) return;
    const key = iso(today);
    const panel = [...document.querySelectorAll('.panel[data-date]')].find(p => {
        const [first, last = first] = p.dataset.date.split('..');
        return key >= first && key <= last;
    });
    if (!panel) return;
    showPanel(panel.id, false);

    // Flag the next timed stop (anything still within its first half hour counts as "now").
    const minutes = t => {
        const m = /^~?\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(t.trim());
        return m ? (Number(m[1]) % 12 + (m[3].toUpperCase() === 'PM' ? 12 : 0)) * 60 + Number(m[2]) : null;
    };
    function markNext() {
        const d = new Date(), nowMin = d.getHours() * 60 + d.getMinutes();
        panel.querySelectorAll('.stop').forEach(s => s.classList.remove('is-next', 'is-past'));
        panel.querySelectorAll('.now-badge').forEach(n => n.remove());
        let flagged = false;
        panel.querySelectorAll('.stop').forEach(s => {
            const t = minutes(s.querySelector('.stop-time').textContent);
            if (t === null) return;
            if (t + 30 < nowMin) s.classList.add('is-past');
            else if (!flagged) {
                flagged = true;
                s.classList.add('is-next');
                const badge = document.createElement('span');
                badge.className = 'now-badge';
                badge.textContent = t <= nowMin ? 'NOW' : 'UP NEXT';
                s.querySelector('.stop-name').prepend(badge);
            }
        });
    }
    markNext();
    setInterval(markNext, 60000);
})();

// ═══ Tap to hear: phrases inside [data-speak="es-CR"] get a 🔊 button ═══
(function() {
    const groups = document.querySelectorAll('[data-speak]');
    if (!groups.length || !('speechSynthesis' in window)) return;
    const pickVoice = lang => {
        const voices = speechSynthesis.getVoices();
        const norm = v => v.lang.replace('_', '-').toLowerCase();
        return voices.find(v => norm(v) === lang.toLowerCase())
            || voices.find(v => norm(v).startsWith(lang.slice(0, 2).toLowerCase()));
    };
    groups.forEach(g => g.querySelectorAll('.phrase .ph').forEach(ph => {
        const text = ph.textContent.trim();
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'speak';
        btn.setAttribute('aria-label', `Hear "${text}"`);
        btn.textContent = '🔊';
        btn.addEventListener('click', () => {
            speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text.replace(/\s*\/\s*/g, ', '));
            u.lang = g.dataset.speak;
            u.rate = 0.85;
            const v = pickVoice(g.dataset.speak);
            if (v) u.voice = v;
            speechSynthesis.speak(u);
        });
        ph.append(' ', btn);
    }));
})();

// ═══ Calendar file from <script type="application/json" id="trip-events"> ═══
// Times are UTC ("20261103T141100Z"); all-day stays use "allDay": true with dates.
(function() {
    const src = document.getElementById('trip-events');
    const btn = document.querySelector('[data-ics]');
    if (!src || !btn) return;
    btn.addEventListener('click', () => {
        const events = JSON.parse(src.textContent);
        const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
        const esc = s => String(s).replace(/[\\,;]/g, m => '\\' + m).replace(/\n/g, '\\n');
        const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Trips//Itinerary//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
        events.forEach((e, i) => {
            const when = e.allDay
                ? [`DTSTART;VALUE=DATE:${e.start}`, `DTEND;VALUE=DATE:${e.end}`]
                : [`DTSTART:${e.start}`, `DTEND:${e.end}`];
            lines.push('BEGIN:VEVENT', `UID:${btn.dataset.ics}-${i}@trips`, `DTSTAMP:${stamp}`, ...when, `SUMMARY:${esc(e.title)}`);
            if (e.where) lines.push(`LOCATION:${esc(e.where)}`);
            if (e.note) lines.push(`DESCRIPTION:${esc(e.note)}`);
            lines.push('END:VEVENT');
        });
        lines.push('END:VCALENDAR');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
        a.download = btn.dataset.ics + '.ics';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
})();

// ═══ Print / save as PDF ═══
document.querySelectorAll('[data-print]').forEach(b => b.addEventListener('click', () => window.print()));
