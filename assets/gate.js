// Fun entry gate for the trips site: "passport control".
// ⚠ A front door, not a lock — the pages are static files and the GitHub repo is
// public, so anyone determined can still read them. It keeps casual visitors out.
// Loaded in <head> of every page so the page is hidden before it paints.
(function () {
    const KEY = 'trips_pass';
    const SEED = 2026;
    // Fingerprint of the normalised password (lower-case, letters/digits only).
    // To change it: cyrb53(norm('new password'), SEED) in the console.
    const PASS = 7840402633288606;

    const norm = s => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
    const cyrb53 = (str, seed = 0) => {
        let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
        for (let i = 0, ch; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
        h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
        h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    };

    // Any [data-lock] button signs this device out again.
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('[data-lock]').forEach(b => b.addEventListener('click', () => {
            try { localStorage.removeItem(KEY); } catch (e) {}
            location.reload();
        }));
    });

    let admitted = false;
    try { admitted = localStorage.getItem(KEY) === String(PASS); } catch (e) {}
    if (admitted) return;

    const root = document.documentElement;
    root.classList.add('trip-locked');

    const fonts = document.createElement('link');
    fonts.rel = 'stylesheet';
    fonts.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;600&family=DM+Sans:wght@400;600&display=swap';
    document.head.appendChild(fonts);

    const style = document.createElement('style');
    style.textContent = `
html.trip-locked body { visibility: hidden; overflow: hidden; }
#trip-gate {
    visibility: visible;
    position: fixed; inset: 0; z-index: 2147483647;
    display: grid; place-items: center;
    padding: 1.5rem; overflow-y: auto;
    background:
        radial-gradient(circle at 18% 14%, rgba(199,128,45,0.10), transparent 42%),
        radial-gradient(circle at 86% 82%, rgba(22,94,131,0.09), transparent 46%),
        #FAF8F3;
    font-family: 'DM Sans', system-ui, sans-serif;
    color: #1C1C1C;
    transition: opacity 0.5s, transform 0.5s;
}
#trip-gate::before {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background: repeating-radial-gradient(circle at 50% 50%, transparent 0 15px, rgba(28,28,28,0.035) 15px 16px);
    -webkit-mask-image: radial-gradient(circle, #000 25%, transparent 72%);
    mask-image: radial-gradient(circle, #000 25%, transparent 72%);
}
#trip-gate.leaving { opacity: 0; transform: scale(1.03); }
#trip-gate * { box-sizing: border-box; }
.gate-inner { position: relative; display: flex; align-items: center; gap: 2.8rem; width: 100%; max-width: 780px; }
.gate-passport {
    flex: 0 0 200px; height: 280px;
    border-radius: 6px 14px 14px 6px;
    background: linear-gradient(135deg, #24325A, #131B30);
    box-shadow: inset 7px 0 0 rgba(0,0,0,0.28), 0 22px 44px -20px rgba(19,27,48,0.75);
    display: flex; flex-direction: column; align-items: center; justify-content: space-between;
    padding: 1.7rem 1rem 1.5rem;
    color: #D8B26A;
    transform: rotate(-4deg);
}
.gate-cover-top { font-family: 'Cormorant Garamond', serif; font-weight: 600; letter-spacing: 0.35em; font-size: 1.1rem; padding-left: 0.35em; }
.gate-cover-bottom { font-size: 0.6rem; font-weight: 600; letter-spacing: 0.32em; padding-left: 0.32em; }
.gate-passport svg { width: 100px; height: 100px; }
.gate-desk { flex: 1; min-width: 0; }
.gate-kicker { font-size: 0.68rem; font-weight: 600; letter-spacing: 0.4em; color: #A8742A; }
.gate-title { font-family: 'Cormorant Garamond', serif; font-weight: 300; font-size: clamp(2.3rem, 6vw, 3.3rem); line-height: 1.05; margin: 0.45rem 0 0.5rem; }
.gate-sub { color: #7E796E; font-size: 0.92rem; margin: 0 0 1.5rem; }
.gate-form { display: flex; flex-wrap: wrap; gap: 0.7rem; align-items: flex-end; margin: 0; }
.gate-label { flex-basis: 100%; font-size: 0.62rem; font-weight: 600; letter-spacing: 0.22em; color: #7E796E; text-transform: uppercase; }
.gate-form input {
    flex: 1 1 200px; min-width: 0;
    font: inherit; font-size: 1.05rem; letter-spacing: 0.08em;
    padding: 0.55rem 0.2rem;
    border: none; border-bottom: 1.5px solid #1C1C1C; border-radius: 0;
    background: transparent; color: inherit; outline: none;
}
.gate-form input:focus { border-bottom-color: #E94709; }
.gate-form button {
    font: inherit; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.08em;
    color: #FAF8F3; background: #1C1C1C;
    border: none; border-radius: 3px; padding: 0.75rem 1.15rem; cursor: pointer;
    transition: background 0.2s;
}
.gate-form button:hover, .gate-form button:focus-visible { background: #E94709; }
.gate-msg { min-height: 1.5em; margin: 0.95rem 0 0; font-size: 0.88rem; font-style: italic; color: #C8361A; }
.gate-hint { margin: 0.3rem 0 0; font-size: 0.82rem; color: #165E83; }
.gate-inner.shake { animation: gate-shake 0.45s; }
@keyframes gate-shake { 20% { transform: translateX(-9px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(3px); } }
.gate-stamp {
    position: absolute; left: 50%; top: 50%;
    transform: translate(-50%, -50%) rotate(-12deg) scale(3);
    opacity: 0; pointer-events: none;
    border: 5px double #C8361A; border-radius: 10px;
    padding: 0.45rem 1.5rem 0.35rem;
    color: #C8361A; background: rgba(250,248,243,0.35);
    font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 2.8rem; letter-spacing: 0.18em;
    line-height: 1; text-align: center; white-space: nowrap;
    mix-blend-mode: multiply;
}
.gate-stamp small { display: block; font-family: 'DM Sans', sans-serif; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.4em; margin-top: 0.35rem; }
#trip-gate.admitted .gate-stamp { animation: gate-slam 0.45s cubic-bezier(0.2, 1.4, 0.4, 1) forwards; }
@keyframes gate-slam { to { opacity: 0.92; transform: translate(-50%, -50%) rotate(-12deg) scale(1); } }
@media (max-width: 640px) {
    .gate-inner { flex-direction: column; gap: 1.8rem; text-align: center; }
    .gate-passport { flex-basis: auto; width: 150px; height: 205px; }
    .gate-passport svg { width: 72px; height: 72px; }
    .gate-form { justify-content: center; }
    .gate-form button { flex: 1 1 100%; }
    .gate-stamp { font-size: 2.1rem; }
}
@media (prefers-reduced-motion: reduce) {
    #trip-gate, .gate-inner.shake { animation: none; transition: none; }
    #trip-gate.admitted .gate-stamp { animation: none; opacity: 0.92; transform: translate(-50%, -50%) rotate(-12deg); }
}
@media print { #trip-gate { display: none; } }`;
    document.head.appendChild(style);

    const NOPE = [
        'Customs is not convinced.',
        'Denied. Please step out of the line.',
        'Nope — and your bag is going to Denver anyway.',
        'The duty-free lady is judging you. Try again.',
        'Even the sniffer dog is shaking its head.',
        'Close? Not really.',
    ];

    function build() {
        const gate = document.createElement('div');
        gate.id = 'trip-gate';
        gate.setAttribute('role', 'dialog');
        gate.setAttribute('aria-modal', 'true');
        gate.setAttribute('aria-labelledby', 'gate-title');
        gate.innerHTML = `
<div class="gate-inner">
    <div class="gate-passport" aria-hidden="true">
        <div class="gate-cover-top">PASSPORT</div>
        <svg viewBox="0 0 100 100" fill="none" stroke="#D8B26A" stroke-width="2.2">
            <circle cx="50" cy="50" r="40"/><ellipse cx="50" cy="50" rx="17" ry="40"/>
            <line x1="50" y1="10" x2="50" y2="90"/><path d="M15 33 H85 M10 50 H90 M15 67 H85"/>
        </svg>
        <div class="gate-cover-bottom">TRIPS · 2026</div>
    </div>
    <div class="gate-desk">
        <div class="gate-kicker">PASSPORT CONTROL</div>
        <h1 id="gate-title" class="gate-title">Purpose of your visit?</h1>
        <p class="gate-sub">State the password to enter.</p>
        <form class="gate-form" autocomplete="off">
            <label class="gate-label" for="gate-input">Password</label>
            <input id="gate-input" type="password" autocapitalize="none" autocorrect="off" spellcheck="false">
            <button type="submit">Present passport →</button>
        </form>
        <p class="gate-msg" aria-live="polite"></p>
        <p class="gate-hint" hidden>Hint: two words — what the captain says as you leave the ground.</p>
    </div>
    <div class="gate-stamp" aria-hidden="true">ADMITTED<small>· 2026 ·</small></div>
</div>`;
        document.body.appendChild(gate);

        const inner = gate.querySelector('.gate-inner');
        const input = gate.querySelector('input');
        const msg = gate.querySelector('.gate-msg');
        const hint = gate.querySelector('.gate-hint');
        let misses = 0, last = -1;
        input.focus();

        gate.querySelector('form').addEventListener('submit', e => {
            e.preventDefault();
            if (cyrb53(norm(input.value), SEED) === PASS) {
                try { localStorage.setItem(KEY, String(PASS)); } catch (err) {}
                msg.style.color = '#165E83';
                msg.textContent = 'Welcome aboard.';
                gate.classList.add('admitted');
                setTimeout(() => {
                    gate.classList.add('leaving');
                    root.classList.remove('trip-locked');
                    setTimeout(() => gate.remove(), 500);
                }, 1100);
                return;
            }
            misses++;
            let i;
            do { i = Math.floor(Math.random() * NOPE.length); } while (i === last);
            last = i;
            msg.textContent = NOPE[i];
            if (misses >= 2) hint.hidden = false;
            inner.classList.remove('shake');
            void inner.offsetWidth;
            inner.classList.add('shake');
            input.select();
        });
    }

    if (document.body) build();
    else document.addEventListener('DOMContentLoaded', build);
})();
