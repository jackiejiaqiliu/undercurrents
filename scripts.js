/*****************
 * DEVICE DETECTION
 *****************/
function isDesktop() {
  // Use matchMedia for more reliable detection
  return window.matchMedia('(min-width: 1200px)').matches;
}

function isMobile() {
  // Use matchMedia for more reliable detection
  return window.matchMedia('(max-width: 865px)').matches;
}

function isTouchDevice() {
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}

// Debug: Log which layout is detected
console.log('Device detection:', {
  isDesktop: isDesktop(),
  isMobile: isMobile(),
  width: window.innerWidth,
  isTouchDevice: isTouchDevice()
});

/*****************
 * FORCE VIDEO PLAYBACK ON MOBILE
 *****************/
const video = document.getElementById('background-video');
if (video) {
  // Attempt to play video
  video.play().catch(err => {
    console.log('Video autoplay failed:', err);
  });
  
  // Try to play on user interaction for iOS
  if (isTouchDevice()) {
    document.addEventListener('touchstart', function() {
      video.play().catch(err => console.log('Video play on touch failed:', err));
    }, { once: true });
  }
}

/*****************
 * CUSTOM CURSOR (persistent across pages, DESKTOP ONLY)
 *****************/
const cursor = document.createElement("div");
cursor.classList.add("custom-cursor");
document.body.appendChild(cursor);

// Create a text-label cursor ONLY on the index (where .title exists)
const onIndex = !!document.querySelector(".title");
let cursorLabel = null;
if (onIndex) {
  cursorLabel = document.createElement("div");
  cursorLabel.className = "cursor-label";
  cursorLabel.style.color = "#f0f0f0";
  document.body.appendChild(cursorLabel);
}

let savedX = localStorage.getItem("cursorX");
let savedY = localStorage.getItem("cursorY");
if (savedX && savedY) {
  cursor.style.top = savedY + "px";
  cursor.style.left = savedX + "px";
  if (cursorLabel) {
    cursorLabel.style.top = savedY + "px";
    cursorLabel.style.left = savedX + "px";
  }
}

function moveCursors(x, y) {
  // Only move cursors on desktop
  if (!isDesktop()) return;
  
  cursor.style.top = y + "px";
  cursor.style.left = x + "px";

  if (cursorLabel) {
    cursorLabel.style.top = y + "px";
    cursorLabel.style.left = x + "px";

    // measure & nudge so it never goes off-screen (avoids weird wrapping)
    const rect = cursorLabel.getBoundingClientRect();
    const halfW = rect.width / 2;

    const overflowRight = Math.max(0, x + halfW - window.innerWidth + 2);
    const overflowLeft  = Math.max(0, halfW - x + 2);

    // net shift: push left if overflowing right; push right if overflowing left
    const xShift = overflowRight - overflowLeft;

    // keep your vertical centering intact
    cursorLabel.style.transform = `translate(calc(-50% - ${xShift}px), -50%)`;
  }

  localStorage.setItem("cursorX", x);
  localStorage.setItem("cursorY", y);
}

document.addEventListener("mousemove", (e) => {
  moveCursors(e.clientX, e.clientY);
  if (onIndex && isDesktop()) updateCursorLabel(e.clientX);
});

/*****************
 * TABLET: Hide/Show Elements Based on Screen Size
 *****************/
function updateForScreenSize() {
  const languageButtons = document.querySelector('.language-buttons');
  const invisibleLink = document.querySelector('.invisible-link');
  
  if (languageButtons && invisibleLink) {
    if (isDesktop()) {
      // Desktop: hide buttons, show invisible link
      languageButtons.style.display = 'none';
      invisibleLink.style.display = 'block';
    } else {
      // Tablet: show buttons, hide invisible link
      languageButtons.style.display = 'flex';
      invisibleLink.style.display = 'none';
    }
  }
}

// Run on load and resize (only on index)
if (onIndex) {
  updateForScreenSize();
  window.addEventListener('resize', updateForScreenSize);
}

/*****************
 * Ensure .title contains a .stack wrapper (for crossfade snapshot)
 *****************/
(function ensureStack() {
  const title = document.querySelector(".title");
  if (!title) return;
  if (!title.querySelector(".stack")) {
    const stack = document.createElement("div");
    stack.className = "stack";
    while (title.firstChild) stack.appendChild(title.firstChild);
    title.appendChild(stack);
  }
})();

/*****************
 * FLOATING TEXT CORE
 *****************/
function applyFloatToElement(el, options = {}) {
  if (!el) return [];
  if (el.dataset.floatApplied === "true") return []; // prevent double-wrap

  const {
    ampBase = 2,
    ampVar = 1,
    speedBase = 0.0018,
    speedVar = 0.0007,
    noise = 0.15,
  } = options;

  const original = el.textContent;
  el.textContent = "";
  el.dataset.floatApplied = "true";
  el.dataset.originalText = original;
  const spans = [];

  for (const ch of original) {
    if (ch === " ") { el.appendChild(document.createTextNode(" ")); continue; }
    const sp = document.createElement("span");
    sp.textContent = ch;
    sp.style.display = "inline-block";
    sp.style.willChange = "transform";
    sp.dataset.amplitude = (ampBase + Math.random() * ampVar).toString();
    sp.dataset.speed     = (speedBase + Math.random() * speedVar).toString();
    sp.dataset.phase     = (Math.random() * Math.PI * 2).toString();
    sp.dataset.noise     = noise.toString();
    el.appendChild(sp);
    spans.push(sp);
  }
  return spans;
}

function revertFloat(el) {
  if (!el || el.dataset.floatApplied !== "true") return;
  const original = el.dataset.originalText ?? el.textContent;
  el.textContent = original;
  delete el.dataset.floatApplied;
  delete el.dataset.originalText;
}

function setupFloat(selector, opts) {
  const el = document.querySelector(selector);
  return el ? applyFloatToElement(el, opts) : [];
}

/*****************
 * RAF LOOP
 *****************/
let allSpans = [];
let animStarted = false;
let startTs = null;

function ensureAnimLoop() {
  if (!animStarted) { animStarted = true; requestAnimationFrame(tick); }
}
function tick(ts) {
  if (startTs === null) startTs = ts;
  const t = ts - startTs;
  for (const sp of allSpans) {
    const amp = +sp.dataset.amplitude;
    const speed = +sp.dataset.speed;
    const phase = +sp.dataset.phase;
    const noise = +sp.dataset.noise;
    const baseY = Math.sin(t * speed + phase) * amp;
    const wobble = Math.sin(t * 0.0005 + phase) * noise;
    sp.style.transform = `translateY(${baseY + wobble}px)`;
  }
  requestAnimationFrame(tick);
}

/*****************
 * INITIAL ALWAYS-ON FLOATS
 *****************/
allSpans.push(
  ...setupFloat(".title h1", { ampBase: 6, ampVar: 3, speedBase: 0.0018, speedVar: 0.0007, noise: 0.4 })
);
allSpans.push(
  ...setupFloat(".title h2", { ampBase: 1, ampVar: 0.4, speedBase: 0.0018, speedVar: 0.0007, noise: 0.08 })
);
allSpans.push(
  ...setupFloat(".logo", { ampBase: 1, ampVar: 0.5, speedBase: 0.0018, speedVar: 0.0007, noise: 0.03 })
);
if (allSpans.length) ensureAnimLoop();

/*****************
 * OPTIONAL: hover float for links with .animated-links
 *****************/
function attachHoverFloatToLinks() {
  const links = document.querySelectorAll(".animated-links");
  links.forEach((link) => {
    const isPermanent = link.classList.contains("logo");
    link.addEventListener("mouseenter", () => {
      if (link.dataset.floatApplied === "true") return;
      const newSpans = applyFloatToElement(link, {
        ampBase: 1, ampVar: 0.4, speedBase: 0.0018, speedVar: 0.0007, noise: 0.08,
      });
      if (newSpans.length) { allSpans.push(...newSpans); ensureAnimLoop(); }
    });
    link.addEventListener("mouseleave", () => {
      if (isPermanent) return;
      if (link.dataset.floatApplied === "true") {
        const spansToRemove = Array.from(link.querySelectorAll("span"));
        allSpans = allSpans.filter((sp) => !spansToRemove.includes(sp));
        revertFloat(link);
      }
    });
  });
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", attachHoverFloatToLinks);
} else {
  attachHoverFloatToLinks();
}

/*****************
 * HELPERS for raw replacement (no kerning weirdness)
 *****************/
function getSpans(el) { return el ? Array.from(el.querySelectorAll("span")) : []; }

function removeSpansFromAll(el) {
  const spans = getSpans(el);
  if (!spans.length) return;
  allSpans = allSpans.filter((sp) => !spans.includes(sp));
}

function setLineRaw(el, text, floatOpts) {
  if (!el) return;
  removeSpansFromAll(el);
  revertFloat(el);
  el.textContent = text;
  const newSpans = applyFloatToElement(el, floatOpts || {});
  allSpans.push(...newSpans);
}

/*****************
 * CROSSFADE (snapshot overlay)
 * (duration controlled by CSS: .title .ghost transition)
 *****************/
function crossfadeSwap(setter) {
  const title = document.querySelector(".title");
  const stack = document.querySelector(".title .stack");
  if (!title || !stack) { setter(); return; }

  const ghost = document.createElement("div");
  ghost.className = "ghost";
  const snap = stack.cloneNode(true);
  ghost.appendChild(snap);
  title.appendChild(ghost);

  // Force reflow
  ghost.offsetHeight;
  
  requestAnimationFrame(() => {
    ghost.classList.add("show");
    requestAnimationFrame(() => {
      setter(); // apply new content underneath
      requestAnimationFrame(() => {
        ghost.classList.remove("show");
        setTimeout(() => ghost.remove(), 600); // Match CSS transition time
      });
    });
  });
}

/*****************
 * SIDE SWITCHING: left/right content + link targets (DESKTOP ONLY)
 *****************/
const h1El = document.querySelector(".title h1");
const h2El = document.querySelector(".title h2");
const invLink = document.querySelector(".invisible-link");

const RIGHT_H1 = h1El ? (h1El.dataset.originalText || "Undercurrents") : "Undercurrents";
const RIGHT_H2 = h2El ? (h2El.dataset.originalText || "January 9 – 19, 2026 • Venice, IT") : "January 9 – 19, 2026 • Venice, IT";

// LEFT content (edit to taste)
const LEFT_H1 = "Sottocorrente";
const LEFT_H2 = "9 – 19 Gennaio 2026 • Venezia, IT";

// link targets
const LEFT_HREF  = "about-it.html";
const RIGHT_HREF = "about.html";

let isLeftNow = null;
let lastSwitch = 0;
const DEAD_ZONE    = 36;  // px near center to avoid jitter
const MIN_INTERVAL = 450; // slightly longer to suit slower fade

function handleSideFromX(x) {
  // Only handle side switching on desktop
  if (!isDesktop()) return;
  
  const center = window.innerWidth / 2;
  if (Math.abs(x - center) < DEAD_ZONE) return;
  const wantLeft = x < center;
  const now = performance.now();
  if (wantLeft === isLeftNow || now - lastSwitch < MIN_INTERVAL) return;

  crossfadeSwap(() => {
    if (wantLeft) {
      setLineRaw(h1El, LEFT_H1, { ampBase: 6, ampVar: 3, speedBase: 0.0018, speedVar: 0.0007, noise: 0.4 });
      setLineRaw(h2El, LEFT_H2, { ampBase: 1, ampVar: 0.4, speedBase: 0.0018, speedVar: 0.0007, noise: 0.08 });
      if (invLink) invLink.href = LEFT_HREF;
    } else {
      setLineRaw(h1El, RIGHT_H1, { ampBase: 6, ampVar: 3, speedBase: 0.0018, speedVar: 0.0007, noise: 0.4 });
      setLineRaw(h2El, RIGHT_H2, { ampBase: 1, ampVar: 0.4, speedBase: 0.0018, speedVar: 0.0007, noise: 0.08 });
      if (invLink) invLink.href = RIGHT_HREF;
    }
  });

  isLeftNow = wantLeft;
  lastSwitch = now;
}

// react to movement (desktop only)
if (isDesktop()) {
  document.addEventListener("mousemove", (e) => handleSideFromX(e.clientX));
}

/*****************
 * Cursor label logic (index only, desktop only)
 *****************/
function updateCursorLabel(x) {
  if (!cursorLabel || !isDesktop()) return;
  const center = window.innerWidth / 2;
  const wantLeft = x < center;
  const next = wantLeft ? "←IT" : "EN→";
  if (cursorLabel.textContent !== next) cursorLabel.textContent = next;

  // show the label and hide the dot ONLY on the index page
  cursorLabel.classList.add("show");
  cursor.style.opacity = 0;
}

// initialize side and cursor label based on saved X (default to right side)
(function initSide() {
  if (!isDesktop() && onIndex) {
    // TABLET: Auto-switch between languages every 5 seconds with crossfade
    let showingItalian = false;
    
    // Start with English
    setLineRaw(h1El, RIGHT_H1, { ampBase: 6, ampVar: 3, speedBase: 0.0018, speedVar: 0.0007, noise: 0.4 });
    setLineRaw(h2El, RIGHT_H2, { ampBase: 1, ampVar: 0.4, speedBase: 0.0018, speedVar: 0.0007, noise: 0.08 });
    
    if (h1El && h2El) {
      // Switch every 5 seconds with crossfade transition
      setInterval(() => {
        crossfadeSwap(() => {
          if (showingItalian) {
            // Switch to English
            setLineRaw(h1El, RIGHT_H1, { ampBase: 6, ampVar: 3, speedBase: 0.0018, speedVar: 0.0007, noise: 0.4 });
            setLineRaw(h2El, RIGHT_H2, { ampBase: 1, ampVar: 0.4, speedBase: 0.0018, speedVar: 0.0007, noise: 0.08 });
          } else {
            // Switch to Italian
            setLineRaw(h1El, LEFT_H1, { ampBase: 6, ampVar: 3, speedBase: 0.0018, speedVar: 0.0007, noise: 0.4 });
            setLineRaw(h2El, LEFT_H2, { ampBase: 1, ampVar: 0.4, speedBase: 0.0018, speedVar: 0.0007, noise: 0.08 });
          }
          showingItalian = !showingItalian;
        });
      }, 5000);
    }
    
    return;
  }

  // DESKTOP: Initialize based on saved cursor position
  if (isDesktop()) {
    const x = savedX ? +savedX : window.innerWidth / 2 + 1;

    if (x < window.innerWidth / 2) {
      setLineRaw(h1El, LEFT_H1, { ampBase: 6, ampVar: 3, speedBase: 0.0018, speedVar: 0.0007, noise: 0.4 });
      setLineRaw(h2El, LEFT_H2, { ampBase: 1, ampVar: 0.4, speedBase: 0.0018, speedVar: 0.0007, noise: 0.08 });
      if (invLink) invLink.href = LEFT_HREF;
      isLeftNow = true;
    } else {
      setLineRaw(h1El, RIGHT_H1, { ampBase: 6, ampVar: 3, speedBase: 0.0018, speedVar: 0.0007, noise: 0.4 });
      setLineRaw(h2El, RIGHT_H2, { ampBase: 1, ampVar: 0.4, speedBase: 0.0018, speedVar: 0.0007, noise: 0.08 });
      if (invLink) invLink.href = RIGHT_HREF;
      isLeftNow = false;
    }

    if (onIndex) {
      updateCursorLabel(x);
    } else {
      // not on index: keep the original grey dot cursor visible
      cursor.style.opacity = 1;
    }
  }
})();

/*****************
 * MOBILE HAMBURGER MENU
 *****************/
(function initMobileMenu() {
  // Only run on pages with header (not index)
  const isOnPagesView = document.body.classList.contains('pages');
  if (!isOnPagesView) return;
  
  const header = document.querySelector('header');
  if (!header) return;
  
  // Create hamburger button
  const hamburger = document.createElement('button');
  hamburger.className = 'hamburger';
  hamburger.innerHTML = '<span></span><span></span><span></span>';
  hamburger.setAttribute('aria-label', 'Menu');
  
  // Create mobile nav overlay
  const overlay = document.createElement('div');
  overlay.className = 'mobile-nav-overlay';
  
  // Create close button - same style as hamburger
  const closeButton = document.createElement('button');
  closeButton.className = 'close-button';
  closeButton.innerHTML = '<span></span><span></span><span></span>';
  closeButton.setAttribute('aria-label', 'Close menu');
  overlay.appendChild(closeButton);
  
  // Clone nav content into overlay
  const nav = header.querySelector('nav');
  if (nav) {
    const navClone = nav.cloneNode(true);
    overlay.appendChild(navClone);
  }
  
  // Add elements to DOM
  header.appendChild(hamburger);
  document.body.appendChild(overlay);
  
  // Function to check if we should show mobile menu
  function shouldShowMobileMenu() {
    return isMobile();
  }
  
  // Update visibility based on screen size
  function updateMenuVisibility() {
    if (shouldShowMobileMenu()) {
      hamburger.style.display = 'flex';
    } else {
      hamburger.style.display = 'none';
      closeMenu(); // Close menu if it was open
      // Hide overlay completely on desktop/tablet
      overlay.style.display = 'none';
    }
  }
  
  // Toggle menu open
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    hamburger.classList.add('open');
    overlay.classList.add('open');
  });
  
  // Close menu function
  function closeMenu() {
    hamburger.classList.remove('open');
    overlay.classList.remove('open');
  }
  
  // Close button click
  closeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    closeMenu();
  });
  
  // Close menu when clicking a link
  overlay.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });
  
  // Close menu when clicking overlay background
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeMenu();
    }
  });
  
  // Initial setup
  updateMenuVisibility();
  
  // Update on resize
  window.addEventListener('resize', () => {
    updateMenuVisibility();
    // Ensure overlay is properly hidden on desktop/tablet
    if (!shouldShowMobileMenu()) {
      overlay.style.display = 'none';
    }
  });
})();