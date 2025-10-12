/*****************
 * DEVICE DETECTION
 *****************/
function isDesktop() {
  return window.matchMedia("(min-width: 1200px)").matches;
}
function isMobile() {
  return window.matchMedia("(max-width: 865px)").matches;
}
function isTouchDevice() {
  return ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
}
const mqMobile = window.matchMedia("(max-width: 865px)");
const mqTablet = window.matchMedia("(min-width: 866px) and (max-width: 1199px)");

console.log("Device detection:", {
  isDesktop: isDesktop(),
  isMobile: isMobile(),
  width: window.innerWidth,
  isTouchDevice: isTouchDevice(),
});

/*****************
 * FORCE VIDEO PLAYBACK ON MOBILE
 *****************/
const video = document.getElementById("background-video");
if (video) {
  video.play().catch((err) => console.log("Video autoplay failed:", err));
  if (isTouchDevice()) {
    document.addEventListener(
      "touchstart",
      function () {
        video.play().catch((err) => console.log("Video play on touch failed:", err));
      },
      { once: true }
    );
  }
}

/*****************
 * CUSTOM CURSOR (desktop only)
 *****************/
const cursor = document.createElement("div");
cursor.classList.add("custom-cursor");
document.body.appendChild(cursor);

// Label only on index
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
  if (!isDesktop()) return;
  cursor.style.top = y + "px";
  cursor.style.left = x + "px";
  if (cursorLabel) {
    cursorLabel.style.top = y + "px";
    cursorLabel.style.left = x + "px";
    const rect = cursorLabel.getBoundingClientRect();
    const halfW = rect.width / 2;
    const overflowRight = Math.max(0, x + halfW - window.innerWidth + 2);
    const overflowLeft = Math.max(0, halfW - x + 2);
    const xShift = overflowRight - overflowLeft;
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
 * INDEX: show/hide language buttons vs invisible link
 *****************/
function updateForScreenSize() {
  const languageButtons = document.querySelector(".language-buttons");
  const invisibleLink = document.querySelector(".invisible-link");
  if (!languageButtons || !invisibleLink) return;

  if (isDesktop()) {
    languageButtons.style.display = "none";
    invisibleLink.style.display = "block";
  } else {
    languageButtons.style.display = "flex";
    invisibleLink.style.display = "none";
  }
}
if (onIndex) {
  updateForScreenSize();
  window.addEventListener("resize", updateForScreenSize);
}

/*****************
 * Ensure .title has .stack wrapper (for overlay snapshot)
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
 * FLOATING TEXT UTILITIES
 *****************/
function applyFloatToElement(el, options = {}) {
  if (!el || el.dataset.floatApplied === "true") return [];
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
    if (ch === " ") {
      el.appendChild(document.createTextNode(" "));
      continue;
    }
    const sp = document.createElement("span");
    sp.textContent = ch;
    sp.style.display = "inline-block";
    sp.style.willChange = "transform";
    sp.dataset.amplitude = (ampBase + Math.random() * ampVar).toString();
    sp.dataset.speed = (speedBase + Math.random() * speedVar).toString();
    sp.dataset.phase = (Math.random() * Math.PI * 2).toString();
    sp.dataset.noise = noise.toString();
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
function getSpans(el) {
  return el ? Array.from(el.querySelectorAll("span")) : [];
}
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
 * GLOBAL FLOAT OPTIONS (desktop vs tablet vs mobile)
 *****************/
const FLOAT_OPTS = {
  desktop: {
    h1:   { ampBase: 6.0, ampVar: 3.0, speedBase: 0.0018, speedVar: 0.0007, noise: 0.40 },
    h2:   { ampBase: 1.0, ampVar: 0.4, speedBase: 0.0018, speedVar: 0.0007, noise: 0.08 },
    logo: { ampBase: 1.2, ampVar: 0.6, speedBase: 0.0018, speedVar: 0.0007, noise: 0.06 }
  },
  tablet: {
    h1:   { ampBase: 4.2, ampVar: 2.0, speedBase: 0.0018, speedVar: 0.0007, noise: 0.30 },
    h2:   { ampBase: 0.8, ampVar: 0.3, speedBase: 0.0018, speedVar: 0.0007, noise: 0.06 },
    logo: { ampBase: 1.0, ampVar: 0.5, speedBase: 0.0018, speedVar: 0.0007, noise: 0.05 }
  },
  mobile: {
    h1:   { ampBase: 2.5, ampVar: 1.2, speedBase: 0.0018, speedVar: 0.0007, noise: 0.20 },
    h2:   { ampBase: 0.5, ampVar: 0.2, speedBase: 0.0018, speedVar: 0.0007, noise: 0.05 },
    logo: { ampBase: 0.7, ampVar: 0.3, speedBase: 0.0018, speedVar: 0.0007, noise: 0.03 }
  }
};

function h1Opts() {
  if (mqMobile.matches) return FLOAT_OPTS.mobile.h1;
  if (mqTablet.matches) return FLOAT_OPTS.tablet.h1;
  return FLOAT_OPTS.desktop.h1;
}
function h2Opts() {
  if (mqMobile.matches) return FLOAT_OPTS.mobile.h2;
  if (mqTablet.matches) return FLOAT_OPTS.tablet.h2;
  return FLOAT_OPTS.desktop.h2;
}
function logoOpts() {
  if (mqMobile.matches) return FLOAT_OPTS.mobile.logo;
  if (mqTablet.matches) return FLOAT_OPTS.tablet.logo;
  return FLOAT_OPTS.desktop.logo;
}

/*****************
 * RAF LOOP
 *****************/
let allSpans = [];
let animStarted = false;
let startTs = null;

function ensureAnimLoop() {
  if (!animStarted) {
    animStarted = true;
    requestAnimationFrame(tick);
  }
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
 * INITIAL FLOATS
 *****************/
allSpans.push(...setupFloat(".title h1", h1Opts()));
allSpans.push(...setupFloat(".title h2", h2Opts()));
allSpans.push(...setupFloat(".logo", logoOpts()));
if (allSpans.length) ensureAnimLoop();

/*****************
 * HOVER FLOAT FOR LINKS
 *****************/
function attachHoverFloatToLinks() {
  const links = document.querySelectorAll(".animated-links");
  links.forEach((link) => {
    const isPermanent = link.classList.contains("logo");
    link.addEventListener("mouseenter", () => {
      if (link.dataset.floatApplied === "true") return;
      const newSpans = applyFloatToElement(link, {
        ampBase: 1,
        ampVar: 0.4,
        speedBase: 0.0018,
        speedVar: 0.0007,
        noise: 0.08,
      });
      if (newSpans.length) {
        allSpans.push(...newSpans);
        ensureAnimLoop();
      }
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
 * CROSSFADE (INLINE OVERLAY — CSS-INDEPENDENT)
 *****************/
const TITLE_FADE_MS = 700; // tweak speed: 600=snappy, 900–1200=slower

function crossfadeSwap(setter) {
  const title = document.querySelector(".title");
  const stack = document.querySelector(".title .stack");
  if (!title || !stack) {
    setter?.();
    return;
  }

  // Overlay fills .title and centers cloned content
  const overlay = document.createElement("div");
  overlay.style.position = "absolute";
  overlay.style.inset = "0";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.pointerEvents = "none";
  overlay.style.zIndex = "999";
  overlay.style.opacity = "1";
  overlay.style.transition = `opacity ${TITLE_FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
  overlay.style.willChange = "opacity";

  // Clone current visible stack
  const snap = stack.cloneNode(true);
  snap.style.margin = "0";
  snap.style.display = "block";
  overlay.appendChild(snap);

  // Ensure .title is a positioning context (defensive)
  const prevTitlePos = getComputedStyle(title).position;
  if (prevTitlePos === "static") title.style.position = "relative";

  title.appendChild(overlay);

  // Force paint at opacity:1
  overlay.getBoundingClientRect();

  // Update underlying content
  setter?.();

  // Fade overlay away
  requestAnimationFrame(() => {
    overlay.style.opacity = "0";
  });

  // Cleanup on transition end (with safety timeout)
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    overlay.remove();
    if (prevTitlePos === "static") title.style.position = "";
  };
  overlay.addEventListener("transitionend", cleanup, { once: true });
  setTimeout(cleanup, TITLE_FADE_MS + 200);
}

/*****************
 * SIDE SWITCHING (DESKTOP) + AUTO SWAP (TABLET/MOBILE)
 *****************/
const h1El = document.querySelector(".title h1");
const h2El = document.querySelector(".title h2");
const invLink = document.querySelector(".invisible-link");

const RIGHT_H1 = h1El ? h1El.dataset.originalText || "Undercurrents" : "Undercurrents";
const RIGHT_H2 = h2El ? h2El.dataset.originalText || "January 9 – 19, 2026 • Venice, IT" : "January 9 – 19, 2026 • Venice, IT";

const LEFT_H1 = "Sottocorrente";
const LEFT_H2 = "9 – 19 Gennaio 2026 • Venezia, IT";

const LEFT_HREF = "about-it.html";
const RIGHT_HREF = "about.html";

let isLeftNow = null;
let lastSwitch = 0;
const DEAD_ZONE = 36;
const MIN_INTERVAL = 450;

function handleSideFromX(x) {
  if (!isDesktop()) return;
  const center = window.innerWidth / 2;
  if (Math.abs(x - center) < DEAD_ZONE) return;

  const wantLeft = x < center;
  const now = performance.now();
  if (wantLeft === isLeftNow || now - lastSwitch < MIN_INTERVAL) return;

  crossfadeSwap(() => {
    if (wantLeft) {
      setLineRaw(h1El, LEFT_H1, h1Opts());
      setLineRaw(h2El, LEFT_H2, h2Opts());
      if (invLink) invLink.href = LEFT_HREF;
    } else {
      setLineRaw(h1El, RIGHT_H1, h1Opts());
      setLineRaw(h2El, RIGHT_H2, h2Opts());
      if (invLink) invLink.href = RIGHT_HREF;
    }
  });

  isLeftNow = wantLeft;
  lastSwitch = now;
}

if (isDesktop()) {
  document.addEventListener("mousemove", (e) => handleSideFromX(e.clientX));
}

/*****************
 * CURSOR LABEL (INDEX ONLY, DESKTOP)
 *****************/
function updateCursorLabel(x) {
  if (!cursorLabel || !isDesktop()) return;
  const center = window.innerWidth / 2;
  const wantLeft = x < center;
  const next = wantLeft ? "←IT" : "EN→";
  if (cursorLabel.textContent !== next) cursorLabel.textContent = next;
  cursorLabel.classList.add("show");
  cursor.style.opacity = 0;
}

/*****************
 * INIT SIDE (AND AUTO SWAP FOR NON-DESKTOP)
 *****************/
(function initSide() {
  if (!onIndex) {
    cursor.style.opacity = 1;
    return;
  }

  if (!isDesktop()) {
    // Tablet & Mobile: auto swap every 5s with crossfade
    let showingItalian = false;

    setLineRaw(h1El, RIGHT_H1, h1Opts());
    setLineRaw(h2El, RIGHT_H2, h2Opts());

    setInterval(() => {
      crossfadeSwap(() => {
        if (showingItalian) {
          setLineRaw(h1El, RIGHT_H1, h1Opts());
          setLineRaw(h2El, RIGHT_H2, h2Opts());
        } else {
          setLineRaw(h1El, LEFT_H1, h1Opts());
          setLineRaw(h2El, LEFT_H2, h2Opts());
        }
        showingItalian = !showingItalian;
      });
    }, 5000);
    return;
  }

  // Desktop: initialize based on saved cursor position
  const x = savedX ? +savedX : window.innerWidth / 2 + 1;
  if (x < window.innerWidth / 2) {
    setLineRaw(h1El, LEFT_H1, h1Opts());
    setLineRaw(h2El, LEFT_H2, h2Opts());
    if (invLink) invLink.href = LEFT_HREF;
    isLeftNow = true;
  } else {
    setLineRaw(h1El, RIGHT_H1, h1Opts());
    setLineRaw(h2El, RIGHT_H2, h2Opts());
    if (invLink) invLink.href = RIGHT_HREF;
    isLeftNow = false;
  }
  updateCursorLabel(x);
})();

/*****************
 * LIVE-UPDATE FLOAT AMPLITUDE ON BREAKPOINT CHANGE
 *****************/
function reapplyFloatForBreakpoint() {
  const h1 = document.querySelector(".title h1");
  const h2 = document.querySelector(".title h2");
  const logo = document.querySelector(".logo");
  if (h1) setLineRaw(h1, h1.dataset.originalText || h1.textContent, h1Opts());
  if (h2) setLineRaw(h2, h2.dataset.originalText || h2.textContent, h2Opts());
  if (logo) {
    removeSpansFromAll(logo);
    revertFloat(logo);
    const spans = applyFloatToElement(logo, logoOpts());
    allSpans.push(...spans);
  }
}
mqMobile.addEventListener("change", reapplyFloatForBreakpoint);
mqTablet.addEventListener("change", reapplyFloatForBreakpoint);

/*****************
 * MOBILE HAMBURGER MENU (inner pages only)
 *****************/
(function initMobileMenu() {
  const isOnPagesView = document.body.classList.contains("pages");
  if (!isOnPagesView) return;

  const header = document.querySelector("header");
  if (!header) return;

  const hamburger = document.createElement("button");
  hamburger.className = "hamburger";
  hamburger.innerHTML = "<span></span><span></span><span></span>";
  hamburger.setAttribute("aria-label", "Menu");

  const overlay = document.createElement("div");
  overlay.className = "mobile-nav-overlay";

  const closeButton = document.createElement("button");
  closeButton.className = "close-button";
  closeButton.innerHTML = "<span></span><span></span><span></span>";
  closeButton.setAttribute("aria-label", "Close menu");
  overlay.appendChild(closeButton);

  const nav = header.querySelector("nav");
  if (nav) {
    const navClone = nav.cloneNode(true);
    overlay.appendChild(navClone);
  }

  header.appendChild(hamburger);
  document.body.appendChild(overlay);

  function shouldShowMobileMenu() {
    return isMobile();
  }
  function updateMenuVisibility() {
    if (shouldShowMobileMenu()) {
      hamburger.style.display = "flex";
    } else {
      hamburger.style.display = "none";
      closeMenu();
      overlay.style.display = "none";
    }
  }
  function closeMenu() {
    hamburger.classList.remove("open");
    overlay.classList.remove("open");
  }

  hamburger.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    hamburger.classList.add("open");
    overlay.classList.add("open");
  });
  closeButton.addEventListener("click", (e) => {
    e.stopPropagation();
    closeMenu();
  });
  overlay.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeMenu());
  });
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeMenu();
  });

  updateMenuVisibility();
  window.addEventListener("resize", () => {
    updateMenuVisibility();
    if (!shouldShowMobileMenu()) overlay.style.display = "none";
  });
})();
