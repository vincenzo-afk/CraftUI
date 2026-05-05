'use strict';

// ══════════════════════════════════════════════════════════════
// SECTION: Constants & Config
// ══════════════════════════════════════════════════════════════

const CF_API_BASE = 'https://api.cloudflare.com/client/v4/accounts';
const MODEL_ID    = '@cf/moonshotai/kimi-k2.6';

/** Default state for every component controller */
const DEFAULT_CONFIG = {
  buttons: {
    variant : 'primary',
    size    : 'md',
    radius  : 8,
    color   : '#6366f1',
    text    : 'Click Me',
    loading : false,
    icon    : true,
  },
  cards: {
    variant : 'basic',
    radius  : 16,
    shadow  : 3,
    width   : 320,
    title   : 'Design System',
    body    : 'A modern card component with smooth transitions.',
    badge   : true,
  },
  modals: {
    size            : 'md',
    opacity         : 0.6,
    animation       : 'scale',
    overlayClose    : true,
  },
  loaders: {
    color : '#6366f1',
    size  : 48,
    speed : 1.0,
  },
  shadows: {
    color   : '#6366f1',
    blur    : 20,
    spread  : 0,
    offsetX : 0,
    offsetY : 8,
  },
  gradients: {
    type   : 'linear',
    angle  : 135,
    color1 : '#6366f1',
    color2 : '#ec4899',
  },
};

/** Live config state — mutated by controllers */
const state = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

// ══════════════════════════════════════════════════════════════
// SECTION: Theme Management
// ══════════════════════════════════════════════════════════════

function initTheme() {
  const saved = localStorage.getItem('craftui-theme') || 'dark';
  applyTheme(saved);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('craftui-theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ══════════════════════════════════════════════════════════════
// SECTION: Toast Notifications
// ══════════════════════════════════════════════════════════════

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'info'|'success'|'error'} type
 * @param {number} duration ms before auto-dismiss
 */
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" aria-label="Dismiss notification">✕</button>
  `;

  // Dismiss on close button
  toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast));
  container.appendChild(toast);

  // Trigger slide-in animation
  requestAnimationFrame(() => toast.classList.add('toast-visible'));

  // Auto-dismiss
  setTimeout(() => dismissToast(toast), duration);
}

function dismissToast(toast) {
  toast.classList.remove('toast-visible');
  toast.classList.add('toast-hiding');
  toast.addEventListener('transitionend', () => toast.remove(), { once: true });
}

// ══════════════════════════════════════════════════════════════
// SECTION: Navigation & Scrollspy
// ══════════════════════════════════════════════════════════════

function initNavigation() {
  // ── Sidebar tab clicks ──
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const sectionId = item.dataset.section;
      const target    = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveSidebarItem(sectionId);
      }
      // Close sidebar on mobile after navigation
      if (window.innerWidth < 768) closeSidebar();
    });
  });

  // ── Scrollspy via IntersectionObserver ──
  const sections = document.querySelectorAll('.component-section');
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSidebarItem(entry.target.id);
        }
      });
    },
    { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
  );
  sections.forEach(s => observer.observe(s));
}

function setActiveSidebarItem(sectionId) {
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.toggle('active', item.dataset.section === sectionId);
  });
}

// ── Mobile sidebar ──
function initMobileSidebar() {
  const btn     = document.getElementById('hamburger-btn');
  const sidebar = document.getElementById('sidebar');
  if (!btn || !sidebar) return;

  btn.addEventListener('click', () => {
    const isOpen = sidebar.classList.toggle('sidebar-open');
    btn.setAttribute('aria-expanded', String(isOpen));
  });

  // Close when clicking outside sidebar on mobile
  document.addEventListener('click', e => {
    if (
      window.innerWidth < 768 &&
      !sidebar.contains(e.target) &&
      !btn.contains(e.target)
    ) {
      closeSidebar();
    }
  });
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const btn     = document.getElementById('hamburger-btn');
  if (sidebar) sidebar.classList.remove('sidebar-open');
  if (btn)     btn.setAttribute('aria-expanded', 'false');
}

// ══════════════════════════════════════════════════════════════
// SECTION: Utility helpers
// ══════════════════════════════════════════════════════════════

/** Update a range input's display value label */
function bindRangeLabel(inputId, labelId, transform) {
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);
  if (!input || !label) return;
  const update = () => {
    label.textContent = transform ? transform(input.value) : input.value;
  };
  input.addEventListener('input', update);
  update();
}

/** Hex color → rgba string */
function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Write tokenized code into a <pre><code> element */
function setCodeOutput(elementId, rawCode) {
  const pre = document.getElementById(elementId);
  if (!pre) return;
  const code = pre.querySelector('code') || pre;
  code.innerHTML = tokenize(rawCode);
}

// ══════════════════════════════════════════════════════════════
// SECTION: Syntax Tokenizer
// ══════════════════════════════════════════════════════════════

/**
 * Very lightweight HTML/CSS syntax highlighter.
 * Wraps recognized tokens in <span class="token-*"> elements.
 */
function tokenize(code) {
  // Escape HTML first so we don't double-encode
  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // CSS comments  /* … */
  escaped = escaped.replace(
    /(\/\*[\s\S]*?\*\/)/g,
    '<span class="token-comment">$1</span>'
  );

  // HTML tags  &lt;tagname ... &gt;
  escaped = escaped.replace(
    /(&lt;\/?)([\w-]+)/g,
    '$1<span class="token-keyword">$2</span>'
  );

  // HTML attribute values  ="..."
  escaped = escaped.replace(
    /=(&quot;|")(.*?)\1/g,
    '=<span class="token-string">"$2"</span>'
  );

  // CSS property values  : value;
  escaped = escaped.replace(
    /:\s*([^{};/\n<>]+);/g,
    ': <span class="token-value">$1</span>;'
  );

  // CSS property names  word-word:
  escaped = escaped.replace(
    /^(\s*)([\w-]+)(\s*:)/gm,
    '$1<span class="token-attr">$2</span>$3'
  );

  // Numbers
  escaped = escaped.replace(
    /\b(\d+\.?\d*)(px|em|rem|%|deg|s|ms|vh|vw)?\b/g,
    '<span class="token-number">$1$2</span>'
  );

  return escaped;
}

// ══════════════════════════════════════════════════════════════
// SECTION: Component Controller — Buttons
// ══════════════════════════════════════════════════════════════

function renderButtonPreview(cfg) {
  const container = document.getElementById('buttons-preview-content');
  if (!container) return;

  const sizeMap = { sm: '8px 16px', md: '10px 22px', lg: '14px 30px' };
  const fontMap = { sm: '0.8rem', md: '0.9rem', lg: '1rem' };
  const padding  = sizeMap[cfg.size] || sizeMap.md;
  const fontSize = fontMap[cfg.size] || fontMap.md;
  const icon     = cfg.icon ? '⚡ ' : '';
  const label    = cfg.loading
    ? `<span class="btn-spinner"></span> Loading…`
    : `${icon}${cfg.text}`;

  const baseStyle = `
    padding:${padding};
    border-radius:${cfg.radius}px;
    font-size:${fontSize};
    cursor:pointer;
    border:none;
    font-weight:600;
    display:inline-flex;
    align-items:center;
    gap:6px;
    transition:all 0.2s ease;
    text-decoration:none;
  `.replace(/\n\s*/g, '');

  const variantStyles = {
    primary    : `background:linear-gradient(135deg,${cfg.color},${darkenHex(cfg.color,20)});color:#fff;box-shadow:0 4px 14px ${hexToRgba(cfg.color,0.4)};`,
    secondary  : `background:transparent;color:${cfg.color};border:2px solid ${cfg.color};`,
    ghost      : `background:transparent;color:var(--text);`,
    danger     : `background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;box-shadow:0 4px 14px rgba(239,68,68,0.35);`,
    neon       : `background:transparent;color:#a78bfa;border:2px solid #a78bfa;box-shadow:0 0 12px rgba(167,139,250,0.4);letter-spacing:0.05em;`,
    neumorphic : `background:var(--surface-2);color:var(--text-muted);box-shadow:5px 5px 10px rgba(0,0,0,0.25),-5px -5px 10px rgba(255,255,255,0.04);`,
    '3d'       : `background:${cfg.color};color:#fff;border-bottom:4px solid ${darkenHex(cfg.color,30)};transform-style:preserve-3d;`,
  };

  const variantStyle = variantStyles[cfg.variant] || variantStyles.primary;
  const disabledAttr = cfg.loading ? 'disabled' : '';

  container.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:center;padding:20px;">
      <button style="${baseStyle}${variantStyle}" ${disabledAttr} class="btn-${cfg.variant}">${label}</button>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;padding:0 20px 20px;opacity:0.6;font-size:0.75rem;color:var(--text-muted);">
      All sizes:
      ${['sm','md','lg'].map(s =>
        `<button style="${baseStyle.replace(padding, sizeMap[s]).replace(fontSize, fontMap[s])}${variantStyle}padding:${sizeMap[s]};font-size:${fontMap[s]};" class="btn-${cfg.variant}">${cfg.text}</button>`
      ).join('')}
    </div>`;
}

function darkenHex(hex, amount) {
  let r = Math.max(0, parseInt(hex.slice(1,3),16) - amount);
  let g = Math.max(0, parseInt(hex.slice(3,5),16) - amount);
  let b = Math.max(0, parseInt(hex.slice(5,7),16) - amount);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function generateButtonCode(cfg) {
  const icon = cfg.icon ? '⚡ ' : '';
  const label = cfg.loading ? '<!-- spinner --> Loading…' : `${icon}${cfg.text}`;
  return `<!-- Button Component: ${cfg.variant} / ${cfg.size} -->
<style>
  /* Button: ${cfg.variant} variant */
  .btn-${cfg.variant} {
    padding: ${cfg.size === 'sm' ? '8px 16px' : cfg.size === 'lg' ? '14px 30px' : '10px 22px'};
    border-radius: ${cfg.radius}px;
    font-size: ${cfg.size === 'sm' ? '0.8rem' : cfg.size === 'lg' ? '1rem' : '0.9rem'};
    font-weight: 600;
    cursor: pointer;
    border: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    ${cfg.variant === 'primary'
      ? `background: linear-gradient(135deg, ${cfg.color}, ${darkenHex(cfg.color,20)});\n    color: #fff;\n    box-shadow: 0 4px 14px ${hexToRgba(cfg.color,0.4)};`
      : cfg.variant === 'secondary'
      ? `background: transparent;\n    color: ${cfg.color};\n    border: 2px solid ${cfg.color};`
      : cfg.variant === 'ghost'
      ? `background: transparent;\n    color: inherit;`
      : cfg.variant === 'danger'
      ? `background: linear-gradient(135deg, #ef4444, #dc2626);\n    color: #fff;\n    box-shadow: 0 4px 14px rgba(239,68,68,0.35);`
      : cfg.variant === 'neon'
      ? `background: transparent;\n    color: #a78bfa;\n    border: 2px solid #a78bfa;\n    box-shadow: 0 0 12px rgba(167,139,250,0.4);`
      : cfg.variant === 'neumorphic'
      ? `background: #e0e5ec;\n    color: #636fa4;\n    box-shadow: 5px 5px 10px #b8bec7, -5px -5px 10px #ffffff;`
      : `background: ${cfg.color};\n    color: #fff;\n    border-bottom: 4px solid ${darkenHex(cfg.color,30)};`
    }
  }
  .btn-${cfg.variant}:hover {
    transform: translateY(-2px);
  }
  .btn-${cfg.variant}:active {
    transform: translateY(0);
  }
  ${cfg.loading ? `
  /* Loading spinner */
  @keyframes spin { to { transform: rotate(360deg); } }
  .btn-spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }` : ''}
</style>

<button class="btn-${cfg.variant}"${cfg.loading ? ' disabled' : ''}>
  ${cfg.loading ? '<span class="btn-spinner"></span> Loading…' : label}
</button>`;
}

function initButtonsController() {
  const ids = {
    variant : 'btn-variant',
    size    : 'btn-size',
    radius  : 'btn-radius',
    color   : 'btn-color',
    text    : 'btn-text',
    loading : 'btn-loading',
    icon    : 'btn-icon',
  };

  const update = () => {
    state.buttons.variant = document.getElementById(ids.variant)?.value || 'primary';
    state.buttons.size    = document.getElementById(ids.size)?.value    || 'md';
    state.buttons.radius  = parseInt(document.getElementById(ids.radius)?.value) || 8;
    state.buttons.color   = document.getElementById(ids.color)?.value   || '#6366f1';
    state.buttons.text    = document.getElementById(ids.text)?.value    || 'Click Me';
    state.buttons.loading = document.getElementById(ids.loading)?.checked || false;
    state.buttons.icon    = document.getElementById(ids.icon)?.checked  !== false;

    renderButtonPreview(state.buttons);
    setCodeOutput('buttons-code', generateButtonCode(state.buttons));
  };

  Object.values(ids).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', update);
  });

  // Range label
  bindRangeLabel('btn-radius', 'btn-radius-val', v => `${v}px`);

  // Initial render
  update();
}

// ══════════════════════════════════════════════════════════════
// SECTION: Component Controller — Cards
// ══════════════════════════════════════════════════════════════

function renderCardPreview(cfg) {
  const container = document.getElementById('cards-preview-content');
  if (!container) return;

  const shadowLevels = [
    'none',
    '0 1px 3px rgba(0,0,0,0.15)',
    '0 4px 12px rgba(0,0,0,0.15)',
    '0 8px 24px rgba(0,0,0,0.18)',
    '0 12px 40px rgba(0,0,0,0.22)',
    '0 20px 60px rgba(0,0,0,0.28)',
  ];
  const shadow = shadowLevels[Math.min(cfg.shadow, 5)];

  const baseCard = `
    width:${cfg.width}px;
    max-width:100%;
    border-radius:${cfg.radius}px;
    box-shadow:${shadow};
    overflow:hidden;
    transition:transform 0.25s ease,box-shadow 0.25s ease;
  `;

  const badge = cfg.badge
    ? `<span style="
        background:linear-gradient(135deg,#6366f1,#ec4899);
        color:#fff;font-size:0.7rem;font-weight:700;
        padding:2px 10px;border-radius:20px;letter-spacing:0.05em;">NEW</span>`
    : '';

  const variantMap = {
    basic: {
      card : `${baseCard}background:var(--surface);border:1px solid var(--border);`,
      inner: '',
    },
    glass: {
      card : `${baseCard}background:var(--glass-bg);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid var(--glass-border);`,
      inner: '',
    },
    gradient: {
      card : `${baseCard}background:var(--surface);border:2px solid transparent;background-clip:padding-box;position:relative;`,
      inner: `box-shadow:inset 0 0 0 2px transparent;background:linear-gradient(135deg,#6366f1,#ec4899) border-box;`,
    },
    hover: {
      card : `${baseCard}background:var(--surface);border:1px solid var(--border);cursor:pointer;`,
      inner: '',
    },
    dark: {
      card : `${baseCard}background:#0a0a12;color:#f0f0ff;border:1px solid rgba(255,255,255,0.08);`,
      inner: '',
    },
    image: {
      card : `${baseCard}background:var(--surface);border:1px solid var(--border);`,
      inner: '',
    },
  };

  const v = variantMap[cfg.variant] || variantMap.basic;
  const isImage = cfg.variant === 'image';

  const imageHeader = isImage
    ? `<div style="height:140px;background:linear-gradient(135deg,#6366f1,#ec4899);display:flex;align-items:center;justify-content:center;font-size:2.5rem;">🎨</div>`
    : '';

  const textColor = cfg.variant === 'dark' ? '#f0f0ff' : 'var(--text)';
  const mutedColor = cfg.variant === 'dark' ? '#9898b4' : 'var(--text-muted)';

  container.innerHTML = `
    <div style="display:flex;justify-content:center;align-items:center;padding:20px;">
      <div style="${v.card}" class="card-preview-item">
        ${imageHeader}
        <div style="padding:24px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
            <h3 style="color:${textColor};font-size:1.05rem;font-weight:700;margin:0;">${cfg.title}</h3>
            ${badge}
          </div>
          <p style="color:${mutedColor};font-size:0.85rem;line-height:1.6;margin:0 0 16px;">${cfg.body}</p>
          <div style="display:flex;gap:8px;">
            <button style="
              padding:7px 16px;border-radius:8px;font-size:0.82rem;font-weight:600;
              background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;cursor:pointer;">
              Explore →
            </button>
            <button style="
              padding:7px 16px;border-radius:8px;font-size:0.82rem;font-weight:600;
              background:transparent;color:${textColor};border:1px solid var(--border);cursor:pointer;">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>`;
}

function generateCardCode(cfg) {
  const shadowLevels = ['none','0 1px 3px rgba(0,0,0,0.15)','0 4px 12px rgba(0,0,0,0.15)','0 8px 24px rgba(0,0,0,0.18)','0 12px 40px rgba(0,0,0,0.22)','0 20px 60px rgba(0,0,0,0.28)'];
  const shadow = shadowLevels[Math.min(cfg.shadow, 5)];

  const variantCss = {
    basic    : `background: #ffffff;\n  border: 1px solid rgba(0,0,0,0.08);`,
    glass    : `background: rgba(255,255,255,0.15);\n  backdrop-filter: blur(12px);\n  border: 1px solid rgba(255,255,255,0.25);`,
    gradient : `background: linear-gradient(#fff,#fff) padding-box,\n             linear-gradient(135deg,#6366f1,#ec4899) border-box;\n  border: 2px solid transparent;`,
    hover    : `background: #ffffff;\n  border: 1px solid rgba(0,0,0,0.08);\n  cursor: pointer;`,
    dark     : `background: #0a0a12;\n  color: #f0f0ff;\n  border: 1px solid rgba(255,255,255,0.08);`,
    image    : `background: #ffffff;\n  border: 1px solid rgba(0,0,0,0.08);`,
  };

  return `<!-- Card Component: ${cfg.variant} variant -->
<style>
  .card {
    width: ${cfg.width}px;
    max-width: 100%;
    border-radius: ${cfg.radius}px;
    box-shadow: ${shadow};
    overflow: hidden;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    ${variantCss[cfg.variant] || variantCss.basic}
  }
  ${cfg.variant === 'hover' ? `.card:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.18);
  }` : ''}
  .card-body { padding: 24px; }
  .card-header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
  }
  .card-title { font-size: 1.05rem; font-weight: 700; margin: 0; }
  .card-badge {
    background: linear-gradient(135deg, #6366f1, #ec4899);
    color: #fff;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 20px;
    letter-spacing: 0.05em;
  }
  .card-text {
    font-size: 0.85rem;
    line-height: 1.6;
    margin: 0 0 16px;
    opacity: 0.75;
  }
  .card-actions { display: flex; gap: 8px; }
  .card-btn-primary {
    padding: 7px 16px;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 600;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: #fff;
    border: none;
    cursor: pointer;
  }
  .card-btn-secondary {
    padding: 7px 16px;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 600;
    background: transparent;
    border: 1px solid rgba(0,0,0,0.12);
    cursor: pointer;
  }
</style>

<div class="card">
  ${cfg.variant === 'image' ? `<div class="card-image-header" style="
    height: 140px;
    background: linear-gradient(135deg, #6366f1, #ec4899);
    display: flex; align-items: center; justify-content: center;
    font-size: 2.5rem;">🎨</div>` : ''}
  <div class="card-body">
    <div class="card-header-row">
      <h3 class="card-title">${cfg.title}</h3>
      ${cfg.badge ? '<span class="card-badge">NEW</span>' : ''}
    </div>
    <p class="card-text">${cfg.body}</p>
    <div class="card-actions">
      <button class="card-btn-primary">Explore →</button>
      <button class="card-btn-secondary">Learn More</button>
    </div>
  </div>
</div>`;
}

function initCardsController() {
  const ids = {
    variant : 'card-variant',
    radius  : 'card-radius',
    shadow  : 'card-shadow',
    width   : 'card-width',
    title   : 'card-title',
    body    : 'card-body',
    badge   : 'card-badge',
  };

  const update = () => {
    state.cards.variant = document.getElementById(ids.variant)?.value || 'basic';
    state.cards.radius  = parseInt(document.getElementById(ids.radius)?.value) || 16;
    state.cards.shadow  = parseInt(document.getElementById(ids.shadow)?.value) || 3;
    state.cards.width   = parseInt(document.getElementById(ids.width)?.value)  || 320;
    state.cards.title   = document.getElementById(ids.title)?.value || 'Design System';
    state.cards.body    = document.getElementById(ids.body)?.value  || 'A modern card.';
    state.cards.badge   = document.getElementById(ids.badge)?.checked !== false;

    renderCardPreview(state.cards);
    setCodeOutput('cards-code', generateCardCode(state.cards));
  };

  Object.entries(ids).forEach(([,id]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', update);
  });

  bindRangeLabel('card-radius', 'card-radius-val', v => `${v}px`);
  bindRangeLabel('card-shadow', 'card-shadow-val', v => v);
  bindRangeLabel('card-width',  'card-width-val',  v => `${v}px`);

  update();
}

// ══════════════════════════════════════════════════════════════
// SECTION: Component Controller — Modals
// ══════════════════════════════════════════════════════════════

function renderModalPreview(cfg) {
  const content = document.getElementById('modals-preview-content');
  if (!content) return;

  const isDrawer = cfg.size === 'drawer';
  const isConfirm = cfg.size === 'confirmation';

  content.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;align-items:center;padding:24px;text-align:center;">
      <div style="font-size:2rem;">${isConfirm ? '⚠️' : isDrawer ? '📂' : '🪟'}</div>
      <p style="font-size:0.85rem;color:var(--text-muted);">
        ${isDrawer ? 'Drawer panel slides from the right.'
          : isConfirm ? 'Confirmation dialog with warning styling.'
          : `Modal dialog • ${cfg.size.toUpperCase()} • ${cfg.animation} animation`}
      </p>
      <p style="font-size:0.75rem;color:var(--text-subtle);">
        Overlay opacity: ${Math.round(cfg.opacity * 100)}% •
        Close on overlay: ${cfg.overlayClose ? 'Yes' : 'No'}
      </p>
    </div>`;

  // Apply size class to modal container
  const container = document.getElementById('modal-preview-container');
  if (container) {
    container.className = `modal-container modal-${cfg.size}`;
  }
}

function applyModalConfig(cfg) {
  const overlay   = document.getElementById('modal-preview-overlay');
  const container = document.getElementById('modal-preview-container');
  if (!overlay || !container) return;

  // Overlay opacity
  overlay.style.setProperty('--modal-overlay-opacity', cfg.opacity);

  // Size classes
  container.className = 'modal-container modal-' + cfg.size;

  // Animation class
  container.dataset.animation = cfg.animation;
}

function openModal(cfg) {
  const overlay = document.getElementById('modal-preview-overlay');
  if (!overlay) return;
  applyModalConfig(cfg);
  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('modal-open');
  // Focus first focusable element
  setTimeout(() => {
    const focusable = overlay.querySelector('button,input,textarea,[tabindex]');
    if (focusable) focusable.focus();
  }, 100);
}

function closeModal() {
  const overlay = document.getElementById('modal-preview-overlay');
  if (!overlay) return;
  overlay.classList.remove('modal-open');
  overlay.setAttribute('aria-hidden', 'true');
}

function generateModalCode(cfg) {
  const isDrawer  = cfg.size === 'drawer';
  const isConfirm = cfg.size === 'confirmation';
  const maxW = { sm:'360px', md:'500px', lg:'700px', drawer:'380px', confirmation:'420px' };

  return `<!-- Modal Component: ${cfg.size} / ${cfg.animation} animation -->
<style>
  /* ── Overlay ── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,${cfg.opacity});
    display: flex;
    align-items: ${isDrawer ? 'stretch' : 'center'};
    justify-content: ${isDrawer ? 'flex-end' : 'center'};
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.25s ease, visibility 0.25s ease;
  }
  .modal-overlay.open {
    opacity: 1;
    visibility: visible;
  }
  /* ── Container ── */
  .modal-container {
    background: #ffffff;
    border-radius: ${isDrawer ? '16px 0 0 16px' : '16px'};
    width: 100%;
    max-width: ${maxW[cfg.size] || maxW.md};
    ${isDrawer ? 'height:100%;overflow-y:auto;' : 'max-height:90vh;overflow-y:auto;'}
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    transform: ${
      cfg.animation === 'scale'
        ? 'scale(0.9)'
        : cfg.animation === 'slide'
        ? 'translateY(40px)'
        : 'perspective(600px) rotateX(-15deg)'
    };
    opacity: 0;
    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease;
  }
  .modal-overlay.open .modal-container {
    transform: none;
    opacity: 1;
  }
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(0,0,0,0.08);
  }
  .modal-title { font-size: 1.05rem; font-weight: 700; margin: 0; }
  .modal-close {
    background: none;
    border: none;
    font-size: 1rem;
    cursor: pointer;
    opacity: 0.5;
    padding: 4px 8px;
    border-radius: 6px;
    transition: opacity 0.2s, background 0.2s;
  }
  .modal-close:hover { opacity: 1; background: rgba(0,0,0,0.06); }
  .modal-body  { padding: 24px; font-size: 0.9rem; line-height: 1.7; }
  .modal-footer {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding: 16px 24px;
    border-top: 1px solid rgba(0,0,0,0.08);
  }
  ${isConfirm ? `.modal-icon {
    font-size: 2.5rem;
    text-align: center;
    padding: 20px 0 0;
  }
  .modal-warning { color: #f59e0b; }` : ''}
</style>

<!-- Trigger button -->
<button onclick="document.getElementById('myModal').classList.add('open')"
  style="padding:10px 22px;border-radius:10px;background:#6366f1;color:#fff;border:none;cursor:pointer;font-weight:600;">
  Open Modal
</button>

<!-- Modal -->
<div class="modal-overlay" id="myModal"
  onclick="${cfg.overlayClose ? 'if(event.target===this)this.classList.remove(\'open\')' : ''}">
  <div class="modal-container">
    ${isConfirm ? '<div class="modal-icon modal-warning">⚠️</div>' : ''}
    <div class="modal-header">
      <h2 class="modal-title">${isConfirm ? 'Confirm Action' : 'Modal Title'}</h2>
      <button class="modal-close" onclick="document.getElementById('myModal').classList.remove('open')">✕</button>
    </div>
    <div class="modal-body">
      ${isConfirm
        ? '<p>Are you sure you want to proceed? This action cannot be undone.</p>'
        : '<p>This is the modal body content. Place any content here.</p>'}
    </div>
    <div class="modal-footer">
      <button onclick="document.getElementById('myModal').classList.remove('open')"
        style="padding:8px 18px;border-radius:8px;border:1px solid rgba(0,0,0,0.12);background:transparent;cursor:pointer;">
        ${isConfirm ? 'Cancel' : 'Close'}
      </button>
      <button style="padding:8px 18px;border-radius:8px;border:none;
        background:${isConfirm ? '#ef4444' : '#6366f1'};color:#fff;font-weight:600;cursor:pointer;">
        ${isConfirm ? 'Delete' : 'Confirm'}
      </button>
    </div>
  </div>
</div>`;
}

function initModalsController() {
  const update = () => {
    state.modals.size         = document.getElementById('modal-size')?.value || 'md';
    state.modals.opacity      = (parseInt(document.getElementById('modal-opacity')?.value) || 60) / 100;
    state.modals.animation    = document.getElementById('modal-animation')?.value || 'scale';
    state.modals.overlayClose = document.getElementById('modal-overlay-close')?.checked !== false;

    renderModalPreview(state.modals);
    setCodeOutput('modals-code', generateModalCode(state.modals));
  };

  ['modal-size','modal-opacity','modal-animation','modal-overlay-close'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', update);
  });

  bindRangeLabel('modal-opacity', 'modal-opacity-val', v => (parseInt(v)/100).toFixed(2));

  // Open / Close buttons
  document.getElementById('modal-open-btn')?.addEventListener('click', () => openModal(state.modals));
  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
  document.getElementById('modal-cancel-btn')?.addEventListener('click', closeModal);

  // Overlay click
  document.getElementById('modal-preview-overlay')?.addEventListener('click', e => {
    if (state.modals.overlayClose && e.target.id === 'modal-preview-overlay') closeModal();
  });

  // Keyboard ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  update();
}

// ══════════════════════════════════════════════════════════════
// SECTION: Component Controller — Loaders
// ══════════════════════════════════════════════════════════════

function renderLoadersPreview(cfg) {
  const container = document.getElementById('loaders-preview-content');
  if (!container) return;

  const dur  = (1 / cfg.speed).toFixed(2) + 's';
  const s    = cfg.size;
  const c    = cfg.color;
  const half = Math.round(s / 2);

  const loaders = [
    {
      label : 'Spinner',
      html  : `<div class="ldr-spinner" style="
        width:${s}px;height:${s}px;
        border:${Math.max(3, Math.round(s/10))}px solid ${hexToRgba(c,0.2)};
        border-top-color:${c};
        border-radius:50%;
        animation:spin ${dur} linear infinite;"></div>`,
    },
    {
      label : 'Dots',
      html  : `<div style="display:flex;gap:${Math.round(s/5)}px;align-items:center;">
        ${[0,1,2].map(i => `<div style="
          width:${half}px;height:${half}px;
          background:${c};border-radius:50%;
          animation:bounce ${dur} ease-in-out ${i * 0.15}s infinite alternate;"></div>`).join('')}
      </div>`,
    },
    {
      label : 'Pulse',
      html  : `<div style="position:relative;width:${s}px;height:${s}px;">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:${hexToRgba(c,0.3)};
          animation:pulse-ring ${dur} ease-out infinite;"></div>
        <div style="
          position:absolute;inset:${Math.round(s/4)}px;border-radius:50%;
          background:${c};"></div>
      </div>`,
    },
    {
      label : 'Skeleton',
      html  : `<div style="width:${Math.max(180, s*3)}px;border-radius:10px;overflow:hidden;background:var(--surface-2);">
        <div style="
          background:linear-gradient(90deg,transparent 0%,${hexToRgba(c,0.15)} 50%,transparent 100%);
          background-size:200% 100%;
          animation:shimmer ${dur} linear infinite;
          height:12px;border-radius:6px;margin:12px;"></div>
        <div style="
          background:linear-gradient(90deg,transparent 0%,${hexToRgba(c,0.15)} 50%,transparent 100%);
          background-size:200% 100%;
          animation:shimmer ${dur} linear infinite 0.2s;
          height:10px;width:70%;border-radius:6px;margin:0 12px 12px;"></div>
      </div>`,
    },
    {
      label : 'Progress',
      html  : `<div style="width:${Math.max(180,s*3)}px;height:${Math.max(8,Math.round(s/6))}px;background:${hexToRgba(c,0.15)};border-radius:99px;overflow:hidden;">
        <div style="
          height:100%;width:60%;border-radius:99px;
          background:linear-gradient(90deg,${c},${hexToRgba(c,0.6)});
          animation:progress-move ${dur} ease-in-out infinite alternate;"></div>
      </div>`,
    },
    {
      label : 'Bars',
      html  : `<div style="display:flex;gap:${Math.round(s/10)+2}px;align-items:flex-end;height:${s}px;">
        ${[0,1,2,3,4].map((_, i) => `<div style="
          width:${Math.max(6, Math.round(s/8))}px;
          background:${c};border-radius:3px 3px 0 0;
          animation:bars ${dur} ease-in-out ${i * 0.1}s infinite alternate;
          height:${30 + i*10}%;"></div>`).join('')}
      </div>`,
    },
    {
      label : 'Orbit',
      html  : `<div style="position:relative;width:${s}px;height:${s}px;">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          border:2px dashed ${hexToRgba(c,0.25)};"></div>
        <div style="
          position:absolute;
          width:${Math.round(s/4)}px;height:${Math.round(s/4)}px;
          background:${c};border-radius:50%;
          top:0;left:50%;margin-left:-${Math.round(s/8)}px;
          transform-origin:${Math.round(s/8)}px ${half}px;
          animation:orbit ${dur} linear infinite;"></div>
      </div>`,
    },
  ];

  const keyframes = `
    <style>
      @keyframes spin          { to { transform: rotate(360deg); } }
      @keyframes bounce        { from { transform:translateY(0); } to { transform:translateY(-${half}px); } }
      @keyframes pulse-ring    { 0%{transform:scale(0.8);opacity:0.8} 100%{transform:scale(1.5);opacity:0;} }
      @keyframes shimmer       { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      @keyframes progress-move { from{width:20%} to{width:85%} }
      @keyframes bars          { from{transform:scaleY(0.3)} to{transform:scaleY(1)} }
      @keyframes orbit         { to{transform:rotate(360deg)} }
      @media (prefers-reduced-motion: reduce) {
        *[style*='animation'] { animation: none !important; }
      }
    </style>`;

  container.innerHTML = keyframes + `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:20px;padding:20px;">
      ${loaders.map(l => `
        <div style="
          display:flex;flex-direction:column;align-items:center;gap:14px;
          padding:20px;border-radius:12px;background:var(--surface);border:1px solid var(--border);">
          <div style="display:flex;align-items:center;justify-content:center;min-height:${s}px;">
            ${l.html}
          </div>
          <span style="font-size:0.72rem;color:var(--text-muted);font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">${l.label}</span>
        </div>`).join('')}
    </div>`;
}

function generateLoadersCode(cfg) {
  const dur = (1 / cfg.speed).toFixed(2);
  return `<!-- Loader Components — Color: ${cfg.color}, Size: ${cfg.size}px, Speed: ${cfg.speed}x -->
<style>
  :root {
    --loader-color: ${cfg.color};
    --loader-size: ${cfg.size}px;
    --loader-duration: ${dur}s;
  }

  /* ── Spinner ── */
  @keyframes spin { to { transform: rotate(360deg); } }
  .loader-spinner {
    width: var(--loader-size);
    height: var(--loader-size);
    border: calc(var(--loader-size) / 10) solid ${hexToRgba(cfg.color,0.2)};
    border-top-color: var(--loader-color);
    border-radius: 50%;
    animation: spin var(--loader-duration) linear infinite;
  }

  /* ── Dots ── */
  @keyframes bounce { from{transform:translateY(0)} to{transform:translateY(calc(var(--loader-size)*-0.5))} }
  .loader-dots { display: flex; gap: 6px; align-items: center; }
  .loader-dots span {
    width: calc(var(--loader-size) * 0.5);
    height: calc(var(--loader-size) * 0.5);
    background: var(--loader-color);
    border-radius: 50%;
    animation: bounce var(--loader-duration) ease-in-out infinite alternate;
  }
  .loader-dots span:nth-child(2) { animation-delay: 0.15s; }
  .loader-dots span:nth-child(3) { animation-delay: 0.30s; }

  /* ── Pulse ── */
  @keyframes pulse-ring { 0%{transform:scale(0.8);opacity:0.8} 100%{transform:scale(1.5);opacity:0} }
  .loader-pulse { position: relative; width: var(--loader-size); height: var(--loader-size); }
  .loader-pulse::before {
    content: '';
    position: absolute; inset: 0;
    border-radius: 50%;
    background: ${hexToRgba(cfg.color,0.3)};
    animation: pulse-ring var(--loader-duration) ease-out infinite;
  }
  .loader-pulse::after {
    content: '';
    position: absolute;
    inset: 25%;
    border-radius: 50%;
    background: var(--loader-color);
  }

  /* ── Skeleton ── */
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .loader-skeleton {
    width: 220px; border-radius: 10px;
    background: rgba(0,0,0,0.05);
    padding: 16px;
  }
  .skeleton-line {
    height: 12px; border-radius: 6px;
    background: linear-gradient(90deg,transparent 0%,${hexToRgba(cfg.color,0.15)} 50%,transparent 100%);
    background-size: 200% 100%;
    animation: shimmer var(--loader-duration) linear infinite;
    margin-bottom: 10px;
  }
  .skeleton-line.short { width: 60%; }

  /* ── Progress ── */
  @keyframes progress { from{width:20%} to{width:85%} }
  .loader-progress {
    width: 100%; height: 8px;
    background: ${hexToRgba(cfg.color,0.15)};
    border-radius: 99px; overflow: hidden;
  }
  .loader-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--loader-color), ${hexToRgba(cfg.color,0.6)});
    border-radius: 99px;
    animation: progress var(--loader-duration) ease-in-out infinite alternate;
  }

  /* ── Bars ── */
  @keyframes bars { from{transform:scaleY(0.3)} to{transform:scaleY(1)} }
  .loader-bars { display: flex; gap: 4px; align-items: flex-end; height: var(--loader-size); }
  .loader-bars span {
    flex: 1; min-width: 6px;
    background: var(--loader-color);
    border-radius: 3px 3px 0 0;
    animation: bars var(--loader-duration) ease-in-out infinite alternate;
  }
  .loader-bars span:nth-child(2){animation-delay:0.1s}
  .loader-bars span:nth-child(3){animation-delay:0.2s}
  .loader-bars span:nth-child(4){animation-delay:0.3s}
  .loader-bars span:nth-child(5){animation-delay:0.4s}

  /* ── Orbit ── */
  @keyframes orbit { to { transform: rotate(360deg); } }
  .loader-orbit {
    position: relative;
    width: var(--loader-size);
    height: var(--loader-size);
  }
  .orbit-ring {
    position: absolute; inset: 0;
    border-radius: 50%;
    border: 2px dashed ${hexToRgba(cfg.color,0.25)};
  }
  .orbit-dot {
    position: absolute;
    width: calc(var(--loader-size) * 0.25);
    height: calc(var(--loader-size) * 0.25);
    background: var(--loader-color);
    border-radius: 50%;
    top: 0; left: 50%;
    margin-left: calc(var(--loader-size) * -0.125);
    transform-origin: calc(var(--loader-size) * 0.125) calc(var(--loader-size) * 0.5);
    animation: orbit var(--loader-duration) linear infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .loader-spinner, .loader-dots span, .loader-pulse::before,
    .skeleton-line, .loader-progress-bar, .loader-bars span, .orbit-dot {
      animation: none !important;
    }
  }
</style>

<!-- Usage examples -->
<div class="loader-spinner"></div>
<div class="loader-dots"><span></span><span></span><span></span></div>
<div class="loader-pulse"></div>
<div class="loader-skeleton">
  <div class="skeleton-line"></div>
  <div class="skeleton-line short"></div>
</div>
<div class="loader-progress"><div class="loader-progress-bar"></div></div>
<div class="loader-bars"><span></span><span></span><span></span><span></span><span></span></div>
<div class="loader-orbit"><div class="orbit-ring"></div><div class="orbit-dot"></div></div>`;
}

function initLoadersController() {
  const update = () => {
    state.loaders.color = document.getElementById('loader-color')?.value || '#6366f1';
    state.loaders.size  = parseInt(document.getElementById('loader-size')?.value)  || 48;
    // speed slider: 5–30 maps to 0.5x–3x
    const raw = parseInt(document.getElementById('loader-speed')?.value) || 10;
    state.loaders.speed = raw / 10;

    renderLoadersPreview(state.loaders);
    setCodeOutput('loaders-code', generateLoadersCode(state.loaders));
  };

  ['loader-color','loader-size','loader-speed'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', update);
  });

  bindRangeLabel('loader-size',  'loader-size-val',  v => `${v}px`);
  bindRangeLabel('loader-speed', 'loader-speed-val', v => `${(parseInt(v)/10).toFixed(1)}x`);

  update();
}

// ══════════════════════════════════════════════════════════════
// SECTION: Component Controller — Shadows
// ══════════════════════════════════════════════════════════════

const SHADOW_PRESETS = [
  { name:'None',     value:'none',                                              label:'shadow-none'    },
  { name:'XS',       value:'0 1px 2px rgba(0,0,0,0.08)',                        label:'shadow-xs'      },
  { name:'SM',       value:'0 1px 3px rgba(0,0,0,0.12),0 1px 2px rgba(0,0,0,0.08)',label:'shadow-sm' },
  { name:'MD',       value:'0 4px 16px rgba(0,0,0,0.15)',                       label:'shadow-md'      },
  { name:'LG',       value:'0 10px 32px rgba(0,0,0,0.18)',                      label:'shadow-lg'      },
  { name:'XL',       value:'0 20px 48px rgba(0,0,0,0.22)',                      label:'shadow-xl'      },
  { name:'2XL',      value:'0 32px 64px rgba(0,0,0,0.28)',                      label:'shadow-2xl'     },
  { name:'Inset',    value:'inset 0 2px 8px rgba(0,0,0,0.15)',                  label:'shadow-inset'   },
  { name:'Colored',  value:'COLORED',                                            label:'shadow-colored' },
  { name:'Neon',     value:'NEON',                                               label:'shadow-neon'    },
];

function renderShadowsPreview(cfg) {
  const container = document.getElementById('shadows-preview-content');
  if (!container) return;

  const coloredShadow = `0 8px 30px ${hexToRgba(cfg.color, 0.5)}`;
  const neonShadow    = `0 0 10px ${hexToRgba(cfg.color,0.6)},0 0 30px ${hexToRgba(cfg.color,0.4)},0 0 60px ${hexToRgba(cfg.color,0.2)}`;
  const customShadow  = `${cfg.offsetX}px ${cfg.offsetY}px ${cfg.blur}px ${cfg.spread}px ${hexToRgba(cfg.color, 0.45)}`;

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:16px;padding:20px;">
      ${SHADOW_PRESETS.map(p => {
        const shadow = p.value === 'COLORED' ? coloredShadow
                     : p.value === 'NEON'    ? neonShadow
                     : p.value;
        return `
          <div style="
            display:flex;flex-direction:column;align-items:center;gap:10px;padding:16px;">
            <div style="
              width:64px;height:64px;
              background:var(--surface);
              border-radius:12px;
              box-shadow:${shadow};
              transition:box-shadow 0.3s ease;">
            </div>
            <span style="font-size:0.7rem;color:var(--text-muted);font-weight:600;text-align:center;">
              ${p.name}
            </span>
          </div>`;
      }).join('')}
      <!-- Custom shadow card -->
      <div style="
        display:flex;flex-direction:column;align-items:center;gap:10px;padding:16px;
        border:1px dashed var(--border-strong);border-radius:12px;">
        <div style="
          width:64px;height:64px;
          background:var(--surface);
          border-radius:12px;
          box-shadow:${customShadow};
          transition:box-shadow 0.3s ease;">
        </div>
        <span style="font-size:0.7rem;color:var(--primary);font-weight:700;text-align:center;">
          Custom ✦
        </span>
      </div>
    </div>`;
}

function generateShadowsCode(cfg) {
  const coloredShadow = `0 8px 30px ${hexToRgba(cfg.color, 0.5)}`;
  const neonShadow    = `0 0 10px ${hexToRgba(cfg.color,0.6)},0 0 30px ${hexToRgba(cfg.color,0.4)},0 0 60px ${hexToRgba(cfg.color,0.2)}`;
  const customShadow  = `${cfg.offsetX}px ${cfg.offsetY}px ${cfg.blur}px ${cfg.spread}px ${hexToRgba(cfg.color, 0.45)}`;

  return `/* ── Shadow Utility Classes ── */

/* No shadow */
.shadow-none   { box-shadow: none; }

/* Elevation scale */
.shadow-xs     { box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
.shadow-sm     { box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08); }
.shadow-md     { box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
.shadow-lg     { box-shadow: 0 10px 32px rgba(0,0,0,0.18); }
.shadow-xl     { box-shadow: 0 20px 48px rgba(0,0,0,0.22); }
.shadow-2xl    { box-shadow: 0 32px 64px rgba(0,0,0,0.28); }

/* Inset */
.shadow-inset  { box-shadow: inset 0 2px 8px rgba(0,0,0,0.15); }

/* Colored — uses primary color: ${cfg.color} */
.shadow-colored { box-shadow: ${coloredShadow}; }

/* Neon glow */
.shadow-neon    { box-shadow: ${neonShadow}; }

/* Custom shadow (your current slider values) */
.shadow-custom  {
  box-shadow: ${customShadow};
  /* offsetX:${cfg.offsetX}px  offsetY:${cfg.offsetY}px
     blur:${cfg.blur}px  spread:${cfg.spread}px */
}`;
}

function initShadowsController() {
  const update = () => {
    state.shadows.color   = document.getElementById('shadow-color')?.value    || '#6366f1';
    state.shadows.blur    = parseInt(document.getElementById('shadow-blur')?.value)     || 20;
    state.shadows.spread  = parseInt(document.getElementById('shadow-spread')?.value)   || 0;
    state.shadows.offsetX = parseInt(document.getElementById('shadow-offset-x')?.value) || 0;
    state.shadows.offsetY = parseInt(document.getElementById('shadow-offset-y')?.value) || 8;

    renderShadowsPreview(state.shadows);
    setCodeOutput('shadows-code', generateShadowsCode(state.shadows));
  };

  ['shadow-color','shadow-blur','shadow-spread','shadow-offset-x','shadow-offset-y'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', update);
  });

  bindRangeLabel('shadow-blur',     'shadow-blur-val',     v => `${v}px`);
  bindRangeLabel('shadow-spread',   'shadow-spread-val',   v => `${v}px`);
  bindRangeLabel('shadow-offset-x', 'shadow-offset-x-val', v => `${v}px`);
  bindRangeLabel('shadow-offset-y', 'shadow-offset-y-val', v => `${v}px`);

  update();
}

// ══════════════════════════════════════════════════════════════
// SECTION: Component Controller — Gradients
// ══════════════════════════════════════════════════════════════

const GRADIENT_PRESETS = [
  { name:'Sunset',   css:`linear-gradient(135deg,#f97316,#ec4899,#8b5cf6)` },
  { name:'Ocean',    css:`linear-gradient(135deg,#06b6d4,#3b82f6,#6366f1)` },
  { name:'Forest',   css:`linear-gradient(135deg,#22c55e,#16a34a,#065f46)` },
  { name:'Candy',    css:`linear-gradient(135deg,#f43f5e,#fb7185,#fda4af)` },
  { name:'Fire',     css:`linear-gradient(135deg,#ef4444,#f97316,#facc15)` },
  { name:'Midnight', css:`linear-gradient(135deg,#0f172a,#1e1b4b,#312e81)` },
  { name:'Aurora',   css:`radial-gradient(ellipse at top,#10b981,#3b82f6,#8b5cf6)` },
  { name:'Nebula',   css:`radial-gradient(ellipse at 30% 60%,#7c3aed,#db2777,#0891b2)` },
  { name:'Rainbow',  css:`conic-gradient(from 0deg,#ef4444,#f97316,#eab308,#22c55e,#3b82f6,#8b5cf6,#ef4444)` },
  { name:'Metallic', css:`conic-gradient(from 45deg,#94a3b8,#e2e8f0,#94a3b8,#475569,#94a3b8)` },
];

function buildCustomGradient(cfg) {
  if (cfg.type === 'radial') {
    return `radial-gradient(ellipse at center,${cfg.color1},${cfg.color2})`;
  } else if (cfg.type === 'conic') {
    return `conic-gradient(from ${cfg.angle}deg,${cfg.color1},${cfg.color2},${cfg.color1})`;
  }
  return `linear-gradient(${cfg.angle}deg,${cfg.color1},${cfg.color2})`;
}

function renderGradientsPreview(cfg) {
  const container = document.getElementById('gradients-preview-content');
  if (!container) return;

  const custom = buildCustomGradient(cfg);

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:16px;padding:20px;">
      ${GRADIENT_PRESETS.map(p => `
        <div style="
          height:100px;border-radius:12px;
          background:${p.css};
          display:flex;align-items:flex-end;padding:10px 12px;
          position:relative;overflow:hidden;">
          <span style="
            font-size:0.72rem;font-weight:700;color:#fff;
            text-shadow:0 1px 4px rgba(0,0,0,0.5);
            letter-spacing:0.03em;">${p.name}</span>
        </div>`).join('')}
      <!-- Custom gradient -->
      <div style="
        height:100px;border-radius:12px;
        background:${custom};
        display:flex;align-items:flex-end;padding:10px 12px;
        border:1px dashed rgba(255,255,255,0.3);position:relative;">
        <span style="
          font-size:0.72rem;font-weight:700;color:#fff;
          text-shadow:0 1px 4px rgba(0,0,0,0.5);">
          Custom ✦
        </span>
      </div>
    </div>`;
}

function generateGradientsCode(cfg) {
  const custom = buildCustomGradient(cfg);
  return `/* ── Gradient Utility Classes ── */

/* Linear presets */
.gradient-sunset   { background: linear-gradient(135deg, #f97316, #ec4899, #8b5cf6); }
.gradient-ocean    { background: linear-gradient(135deg, #06b6d4, #3b82f6, #6366f1); }
.gradient-forest   { background: linear-gradient(135deg, #22c55e, #16a34a, #065f46); }
.gradient-candy    { background: linear-gradient(135deg, #f43f5e, #fb7185, #fda4af); }
.gradient-fire     { background: linear-gradient(135deg, #ef4444, #f97316, #facc15); }
.gradient-midnight { background: linear-gradient(135deg, #0f172a, #1e1b4b, #312e81); }

/* Radial presets */
.gradient-aurora   { background: radial-gradient(ellipse at top, #10b981, #3b82f6, #8b5cf6); }
.gradient-nebula   { background: radial-gradient(ellipse at 30% 60%, #7c3aed, #db2777, #0891b2); }

/* Conic presets */
.gradient-rainbow  { background: conic-gradient(from 0deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6, #ef4444); }
.gradient-metallic { background: conic-gradient(from 45deg, #94a3b8, #e2e8f0, #94a3b8, #475569, #94a3b8); }

/* Custom gradient (your current settings) */
.gradient-custom {
  background: ${custom};
  /* type: ${cfg.type}  angle: ${cfg.angle}deg
     color1: ${cfg.color1}  color2: ${cfg.color2} */
}

/* Usage tip: apply to any element */
.gradient-preview-card {
  height: 200px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 1.1rem;
  text-shadow: 0 2px 8px rgba(0,0,0,0.3);
}`;
}

function initGradientsController() {
  const update = () => {
    state.gradients.type   = document.getElementById('gradient-type')?.value   || 'linear';
    state.gradients.angle  = parseInt(document.getElementById('gradient-angle')?.value) || 135;
    state.gradients.color1 = document.getElementById('gradient-color1')?.value || '#6366f1';
    state.gradients.color2 = document.getElementById('gradient-color2')?.value || '#ec4899';

    renderGradientsPreview(state.gradients);
    setCodeOutput('gradients-code', generateGradientsCode(state.gradients));
  };

  ['gradient-type','gradient-angle','gradient-color1','gradient-color2'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', update);
  });

  bindRangeLabel('gradient-angle', 'gradient-angle-val', v => `${v}°`);

  update();
}

// ══════════════════════════════════════════════════════════════
// SECTION: Cloudflare AI Integration
// ══════════════════════════════════════════════════════════════

/**
 * Call Cloudflare Workers AI (Kimi K2.6) with the given prompt.
 */
async function callKimiK2(prompt, apiKey, accountId) {
  const url = `${CF_API_BASE}/${accountId}/ai/run/${MODEL_ID}`;
  const response = await fetch(url, {
    method  : 'POST',
    headers : {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type' : 'application/json',
    },
    body: JSON.stringify({
      messages: [
        {
          role   : 'system',
          content: 'You are an expert UI/UX developer. Generate clean, modern, production-ready HTML and CSS code for UI components. Always include complete styles inline in a <style> tag. Use CSS custom properties for theming. Provide only code, no explanations.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens  : 4096,
      temperature : 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`API Error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.result?.response
    || data.choices?.[0]?.message?.content
    || '';
}

/**
 * Show AI loading state in the response panel.
 */
function setAIPanelLoading(loading) {
  const btn      = document.getElementById('ai-send-btn');
  const response = document.getElementById('ai-response');
  if (btn) {
    btn.disabled    = loading;
    btn.textContent = loading ? '⏳ Generating…' : '✨ Send to Kimi K2.6';
  }
  if (loading && response) {
    response.innerHTML = `<span class="ai-placeholder" style="display:flex;align-items:center;gap:8px;">
      <span class="loader-inline"></span> Kimi K2.6 is thinking…
    </span>`;
  }
}

/**
 * Typewriter-effect output into #ai-response.
 */
function typewriterOutput(text, targetId = 'ai-response') {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.textContent = '';

  let i = 0;
  const interval = setInterval(() => {
    if (i >= text.length) {
      clearInterval(interval);
      return;
    }
    el.textContent += text[i];
    i += 3; // consume 3 chars per tick for speed
    el.scrollTop = el.scrollHeight;
  }, 16);
}

/** Collect the current config summary for the AI mega-prompt */
function buildMegaPrompt() {
  const s = state;
  return `Generate a complete, self-contained HTML file with embedded CSS for all 6 of the following UI component configurations:

1. BUTTON — variant: ${s.buttons.variant}, size: ${s.buttons.size}, border-radius: ${s.buttons.radius}px, color: ${s.buttons.color}, text: "${s.buttons.text}", loading: ${s.buttons.loading}, icon: ${s.buttons.icon}

2. CARD — variant: ${s.cards.variant}, border-radius: ${s.cards.radius}px, shadow-level: ${s.cards.shadow}/5, width: ${s.cards.width}px, title: "${s.cards.title}", body: "${s.cards.body}", badge: ${s.cards.badge}

3. MODAL — size: ${s.modals.size}, overlay-opacity: ${s.modals.opacity}, animation: ${s.modals.animation}, close-on-overlay: ${s.modals.overlayClose}

4. LOADERS — color: ${s.loaders.color}, size: ${s.loaders.size}px, speed: ${s.loaders.speed}x — include: spinner, dots, pulse, skeleton, progress, bars, orbit

5. SHADOWS — showcase: none, xs, sm, md, lg, xl, 2xl, inset, colored (${s.shadows.color}), neon. Custom: offsetX:${s.shadows.offsetX}px offsetY:${s.shadows.offsetY}px blur:${s.shadows.blur}px spread:${s.shadows.spread}px

6. GRADIENTS — custom type: ${s.gradients.type}, angle: ${s.gradients.angle}deg, colors: ${s.gradients.color1}→${s.gradients.color2}. Also include: sunset, ocean, forest, candy, fire, midnight, aurora, nebula, rainbow, metallic presets.

Output only the code.`;
}

/** Build a per-component AI prompt */
function buildComponentPrompt(component) {
  const cfg  = state[component];
  const desc = {
    buttons  : `a ${cfg.variant} button, ${cfg.size} size, ${cfg.radius}px radius, color ${cfg.color}, label "${cfg.text}"${cfg.loading ? ', with loading spinner' : ''}${cfg.icon ? ', with icon prefix' : ''}`,
    cards    : `a ${cfg.variant} card, ${cfg.radius}px radius, shadow level ${cfg.shadow}/5, width ${cfg.width}px, title "${cfg.title}", body "${cfg.body}"${cfg.badge ? ', with a NEW badge' : ''}`,
    modals   : `a ${cfg.size} modal with ${cfg.animation} animation, overlay opacity ${cfg.opacity}, close-on-overlay-click: ${cfg.overlayClose}`,
    loaders  : `all 7 loaders (spinner, dots, pulse, skeleton, progress, bars, orbit) using color ${cfg.color}, size ${cfg.size}px, animation speed ${cfg.speed}x`,
    shadows  : `a showcase of all 10 shadow variants from none to neon, using color ${cfg.color} for colored/neon variants`,
    gradients: `all 10 gradient presets plus a custom ${cfg.type}-gradient at ${cfg.angle}° from ${cfg.color1} to ${cfg.color2}`,
  };
  return `Generate a clean, self-contained HTML + CSS component for: ${desc[component] || component}. Output only code.`;
}

function initAIPanel() {
  // ── Collapse/expand toggle ──
  const toggle  = document.getElementById('ai-panel-toggle');
  const body    = document.getElementById('ai-panel-body');
  const chevron = document.getElementById('ai-chevron');

  toggle?.addEventListener('click', () => {
    const expanded = body?.classList.toggle('ai-panel-open');
    toggle.setAttribute('aria-expanded', String(!!expanded));
    if (chevron) chevron.textContent = expanded ? '▼' : '▲';
    if (body)    body.setAttribute('aria-hidden', String(!expanded));
  });

  // ── Send custom prompt ──
  document.getElementById('ai-send-btn')?.addEventListener('click', async () => {
    const apiKey    = document.getElementById('cf-api-key')?.value.trim();
    const accountId = document.getElementById('cf-account-id')?.value.trim();
    const prompt    = document.getElementById('ai-prompt')?.value.trim();

    if (!apiKey || !accountId) {
      showToast('⚠️ Please enter your Cloudflare API Key and Account ID first.', 'error');
      return;
    }
    if (!prompt) {
      showToast('Please enter a prompt.', 'info');
      return;
    }

    setAIPanelLoading(true);
    try {
      const result = await callKimiK2(prompt, apiKey, accountId);
      typewriterOutput(result);
      showToast('✨ AI response received!', 'success');
    } catch (err) {
      showToast(`AI Error: ${err.message}`, 'error', 5000);
      const res = document.getElementById('ai-response');
      if (res) res.textContent = `Error: ${err.message}`;
    } finally {
      setAIPanelLoading(false);
    }
  });

  // ── Generate All ──
  document.getElementById('generate-all-btn')?.addEventListener('click', async () => {
    const apiKey    = document.getElementById('cf-api-key')?.value.trim();
    const accountId = document.getElementById('cf-account-id')?.value.trim();

    if (!apiKey || !accountId) {
      showToast('⚠️ Enter your Cloudflare API Key and Account ID in the AI panel below.', 'error', 5000);
      // Open panel
      const body    = document.getElementById('ai-panel-body');
      const chevron = document.getElementById('ai-chevron');
      const toggle  = document.getElementById('ai-panel-toggle');
      if (body && !body.classList.contains('ai-panel-open')) {
        body.classList.add('ai-panel-open');
        body.setAttribute('aria-hidden', 'false');
        if (chevron) chevron.textContent = '▼';
        if (toggle)  toggle.setAttribute('aria-expanded', 'true');
      }
      return;
    }

    setAIPanelLoading(true);
    showToast('🤖 Sending all 6 components to Kimi K2.6…', 'info', 4000);

    try {
      const result = await callKimiK2(buildMegaPrompt(), apiKey, accountId);
      typewriterOutput(result);
      // Also push into buttons code as the primary output
      setCodeOutput('buttons-code', result);
      showToast('✅ All components generated!', 'success');
    } catch (err) {
      showToast(`AI Error: ${err.message}`, 'error', 5000);
    } finally {
      setAIPanelLoading(false);
    }
  });

  // ── Per-section AI Generate buttons ──
  document.querySelectorAll('.btn-ai-generate').forEach(btn => {
    btn.addEventListener('click', async () => {
      const component = btn.dataset.component;
      const apiKey    = document.getElementById('cf-api-key')?.value.trim();
      const accountId = document.getElementById('cf-account-id')?.value.trim();

      if (!apiKey || !accountId) {
        showToast('⚠️ Enter your Cloudflare API Key and Account ID in the AI panel.', 'error');
        return;
      }

      btn.disabled    = true;
      btn.textContent = '⏳ Generating…';
      showToast(`🤖 Generating ${component} with AI…`, 'info', 3000);

      try {
        const result = await callKimiK2(buildComponentPrompt(component), apiKey, accountId);
        setCodeOutput(`${component}-code`, result);
        showToast(`✅ ${component} code generated!`, 'success');
      } catch (err) {
        showToast(`AI Error: ${err.message}`, 'error', 5000);
      } finally {
        btn.disabled    = false;
        btn.textContent = '🤖 AI Generate';
      }
    });
  });

  // ── Persist credentials in localStorage ──
  const keyInput = document.getElementById('cf-api-key');
  const idInput  = document.getElementById('cf-account-id');

  if (keyInput) {
    keyInput.value = localStorage.getItem('craftui-cf-key') || '';
    keyInput.addEventListener('change', () =>
      localStorage.setItem('craftui-cf-key', keyInput.value)
    );
  }
  if (idInput) {
    idInput.value = localStorage.getItem('craftui-cf-id') || '';
    idInput.addEventListener('change', () =>
      localStorage.setItem('craftui-cf-id', idInput.value)
    );
  }
}

// ══════════════════════════════════════════════════════════════
// SECTION: Export & Copy
// ══════════════════════════════════════════════════════════════

/** Get raw text from a code output element */
function getCodeText(elementId) {
  const pre = document.getElementById(elementId);
  if (!pre) return '';
  // Use innerText to get rendered text without HTML tags
  const code = pre.querySelector('code') || pre;
  return code.innerText || code.textContent || '';
}

function initExportCopy() {
  // ── Copy buttons ──
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetId = btn.dataset.target;
      const text     = getCodeText(targetId);
      if (!text.trim()) {
        showToast('Nothing to copy yet — interact with the controls first.', 'info');
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        const original    = btn.textContent;
        btn.textContent   = '✅ Copied!';
        btn.style.color   = '#10b981';
        setTimeout(() => {
          btn.textContent = original;
          btn.style.color = '';
        }, 2000);
        showToast('Code copied to clipboard!', 'success');
      } catch {
        showToast('Copy failed — please select and copy manually.', 'error');
      }
    });
  });

  // ── Export buttons ──
  document.querySelectorAll('.btn-export').forEach(btn => {
    btn.addEventListener('click', () => {
      const component = btn.dataset.component;
      const codeId    = `${component}-code`;
      const text      = getCodeText(codeId);
      if (!text.trim()) {
        showToast('No code to export yet — interact with the controls first.', 'info');
        return;
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g,'-').slice(0,19);
      const filename  = `ui-playground-${component}-${timestamp}.html`;
      downloadFile(wrapInHtmlPage(text, component), filename, 'text/html');
      showToast(`💾 ${filename} downloaded!`, 'success');
    });
  });
}

function wrapInHtmlPage(code, name) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>CraftUI – ${name}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui,sans-serif; padding: 40px; background: #f4f4f8; color: #111; }
  </style>
</head>
<body>
${code}
</body>
</html>`;
}

function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════════════════════════
// SECTION: Init
// ══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  // 1. Theme
  initTheme();
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

  // 2. Navigation
  initNavigation();
  initMobileSidebar();

  // 3. Component controllers (render initial previews + wire controls)
  initButtonsController();
  initCardsController();
  initModalsController();
  initLoadersController();
  initShadowsController();
  initGradientsController();

  // 4. AI panel
  initAIPanel();

  // 5. Copy / Export
  initExportCopy();

  // 6. Inject toast styles dynamically so they always work
  injectToastStyles();

  // 7. Welcome toast
  setTimeout(() => {
    showToast('⚡ UI Playground loaded! Add your CF API key to generate AI code.', 'info', 5000);
  }, 600);
});

/** Inject dynamic styles needed for toasts and the inline loader */
function injectToastStyles() {
  if (document.getElementById('craftui-dynamic-styles')) return;
  const style = document.createElement('style');
  style.id    = 'craftui-dynamic-styles';
  style.textContent = `
    /* ── Toast styles ── */
    #toast-container {
      position: fixed;
      top: 72px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 500;
      max-width: 360px;
      pointer-events: all;
      transform: translateX(120%);
      opacity: 0;
      transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      backdrop-filter: blur(10px);
    }
    .toast-visible { transform: translateX(0); opacity: 1; }
    .toast-hiding  { transform: translateX(120%); opacity: 0; }
    .toast-info    { background: rgba(22,22,42,0.92); color: #c7c7e0; border: 1px solid rgba(99,102,241,0.3); }
    .toast-success { background: rgba(16,60,40,0.92);  color: #6ee7b7; border: 1px solid rgba(16,185,129,0.35); }
    .toast-error   { background: rgba(60,16,16,0.92);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.35); }
    .toast-icon    { font-size: 1rem; flex-shrink: 0; }
    .toast-message { flex: 1; line-height: 1.4; }
    .toast-close   {
      background: none; border: none; cursor: pointer; font-size: 0.75rem;
      opacity: 0.5; padding: 2px 4px; border-radius: 4px;
      transition: opacity 0.2s; color: inherit; flex-shrink: 0;
    }
    .toast-close:hover { opacity: 1; }

    /* ── AI panel open state ── */
    .ai-panel-body { display: none; }
    .ai-panel-body.ai-panel-open { display: flex !important; }

    /* ── Inline loading spinner in AI panel ── */
    @keyframes spin-inline { to { transform: rotate(360deg); } }
    .loader-inline {
      width: 14px; height: 14px;
      border: 2px solid rgba(99,102,241,0.3);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin-inline 0.7s linear infinite;
      display: inline-block;
      flex-shrink: 0;
    }

    /* ── Mobile sidebar open ── */
    @media (max-width: 768px) {
      .sidebar { transform: translateX(-100%); transition: transform 0.3s ease; }
      .sidebar.sidebar-open { transform: translateX(0); }
    }

    /* ── Modal open state ── */
    .modal-preview-overlay {
      display: none;
      position: absolute;
      inset: 0;
      z-index: 50;
      align-items: center;
      justify-content: center;
      border-radius: inherit;
    }
    .modal-preview-overlay.modal-open {
      display: flex;
      background: rgba(0,0,0,var(--modal-overlay-opacity, 0.6));
      animation: modal-fade-in 0.25s ease forwards;
    }
    @keyframes modal-fade-in { from{opacity:0} to{opacity:1} }
    .modal-container {
      background: var(--surface, #fff);
      border-radius: 16px;
      width: 90%;
      max-width: 500px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      animation: modal-scale-in 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards;
      color: var(--text, #111);
    }
    @keyframes modal-scale-in { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
    .modal-container.modal-sm  { max-width: 360px; }
    .modal-container.modal-md  { max-width: 500px; }
    .modal-container.modal-lg  { max-width: 700px; }
    .modal-container.modal-drawer {
      max-width: 380px; width: 380px;
      border-radius: 16px 0 0 16px;
      margin-left: auto;
      align-self: stretch;
      animation: drawer-in 0.3s ease forwards;
    }
    @keyframes drawer-in { from{transform:translateX(100%)} to{transform:translateX(0)} }
    .modal-container.modal-confirmation { max-width: 420px; }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 22px; border-bottom: 1px solid var(--border, rgba(0,0,0,0.08));
    }
    .modal-title { font-size: 1rem; font-weight: 700; margin: 0; }
    .modal-close {
      background: none; border: none; cursor: pointer; font-size: 0.9rem;
      opacity: 0.5; padding: 4px 8px; border-radius: 6px;
      transition: opacity 0.2s, background 0.2s; color: inherit;
    }
    .modal-close:hover { opacity: 1; background: rgba(0,0,0,0.06); }
    .modal-body  { padding: 22px; font-size: 0.88rem; line-height: 1.7; color: var(--text-muted,#666); }
    .modal-footer {
      display: flex; gap: 10px; justify-content: flex-end;
      padding: 14px 22px; border-top: 1px solid var(--border, rgba(0,0,0,0.08));
    }
    .btn-preview {
      padding: 8px 18px; border-radius: 8px; font-size: 0.84rem;
      font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .btn-preview-primary {
      background: linear-gradient(135deg,#6366f1,#4f46e5);
      color: #fff; border: none;
    }
    .btn-preview-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-preview-secondary {
      background: transparent;
      color: var(--text,#111);
      border: 1px solid var(--border-strong, rgba(0,0,0,0.15));
    }
    .btn-preview-secondary:hover { background: var(--surface-2, rgba(0,0,0,0.04)); }
    #modal-open-btn { width: 100%; margin-top: 4px; }
  `;
  document.head.appendChild(style);
}