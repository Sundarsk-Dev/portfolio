(() => {
  "use strict";
  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const savingData = Boolean(window.navigator && window.navigator.connection && window.navigator.connection.saveData);
  const navigationKey = "portfolio-navigation-input";
  let inputMode = "pointer";
  let incomingInput = "";
  const entrances = new Set();
  const pending = new Set();
  let revealObserver;
  let heroFrame;
  let heroCancelled = false;
  let heroTimeout;
  try {
    incomingInput = sessionStorage.getItem(navigationKey) || "";
    sessionStorage.removeItem(navigationKey);
  } catch (_) {}
  const still = () => reduced.matches || savingData;
  const cancelHero = () => {
    heroCancelled = true;
    root.classList.remove("hero-entering");
    if (heroFrame) heroFrame.classList.remove("is-revealing");
    window.clearTimeout(heroTimeout);
  };
  const cancelEntrances = () => {
    cancelHero();
    entrances.forEach(animation => animation.cancel());
    entrances.clear();
    if (revealObserver) revealObserver.disconnect();
    pending.forEach(element => element.classList.remove("reveal-pending"));
    pending.clear();
  };
  const animate = (element, frames, options) => {
    if (!element.animate) return;
    const animation = element.animate(frames, options);
    entrances.add(animation);
    animation.finished.catch(() => {}).finally(() => entrances.delete(animation));
    return animation;
  };
  const useKeyboard = () => {
    inputMode = "keyboard";
    root.classList.remove("pointer-navigation");
    root.classList.add("keyboard-navigation");
    cancelEntrances();
  };
  const usePointer = () => {
    inputMode = "pointer";
    root.classList.remove("keyboard-navigation");
    root.classList.add("pointer-navigation");
  };
  incomingInput === "keyboard" ? useKeyboard() : usePointer();
  document.addEventListener("keydown", useKeyboard, { passive: true });
  document.addEventListener("pointerdown", usePointer, { passive: true });
  document.addEventListener("wheel", usePointer, { passive: true });
  document.addEventListener("focusin", event => {
    if (event.target.closest && event.target.closest(".reveal-pending")) cancelEntrances();
  });

  // Native navigation preserves downloads, modifier clicks, history and new tabs.
  document.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target.closest && event.target.closest("a[href]");
    if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;
    const destination = new URL(anchor.href, location.href);
    if (destination.origin !== location.origin || destination.pathname === location.pathname) return;
    if (!["http:", "https:", "file:"].includes(destination.protocol)) return;
    try {
      sessionStorage.setItem(navigationKey, event.detail === 0 ? "keyboard" : "pointer");
    } catch (_) {}
  });

  reduced.addEventListener("change", () => {
    if (reduced.matches) cancelEntrances();
  });
  // The opt-in lives in render-blocking CSS so both documents agree before rendering.
  window.addEventListener("pageswap", event => {
    if (!event.viewTransition) return;
    event.viewTransition.ready.catch(() => {});
    if (still() || inputMode === "keyboard") event.viewTransition.skipTransition();
  });
  window.addEventListener("pagereveal", event => {
    if (!event.viewTransition) return;
    event.viewTransition.ready.catch(() => {});
    if (still() || incomingInput === "keyboard") event.viewTransition.skipTransition();
  });

  const navigation = performance.getEntriesByType("navigation")[0];
  const heroEligible = !still() && incomingInput !== "keyboard" && !location.hash && !(navigation && navigation.type === "back_forward");
  const heroSupported = window.CSS && window.CSS.supports("mask-image", "linear-gradient(#000, transparent)") && root.animate;
  if (heroEligible && heroSupported) {
    root.classList.add("hero-entering");
    // Fall back to the original if a layer stalls or initialization is interrupted.
    heroTimeout = window.setTimeout(cancelHero, 4000);
  }
  async function revealHero() {
    heroFrame = document.querySelector(".hero-picture");
    const template = heroFrame && heroFrame.querySelector(".hero-layer-template");
    if (!template || !heroSupported || heroCancelled) { cancelHero(); return; }
    const started = performance.now();
    const layers = template.content.firstElementChild.cloneNode(true);
    layers.addEventListener("error", cancelHero, true);
    heroFrame.append(layers);
    try {
      await Promise.all([...layers.querySelectorAll("img")].map(img => img.decode()));
      if (heroCancelled || still() || inputMode === "keyboard" || location.hash) { cancelHero(); return; }
      const animation = animate(layers.querySelector(".hero-subject"), [
        { maskPosition: "0% 0%" }, { maskPosition: "0% 100%" }
      ], { duration: 1100, delay: Math.max(0, (incomingInput ? 220 : 850) - (performance.now() - started)), easing: "cubic-bezier(.45,0,.2,1)", fill: "backwards" });
      heroFrame.classList.add("is-revealing");
      root.classList.remove("hero-entering");
      window.clearTimeout(heroTimeout);
      await animation.finished;
    } catch (_) {
      cancelHero();
      layers.remove();
    }
  }

  function trackScroll() {
    if (!window.requestAnimationFrame) return;
    const header = document.querySelector(".masthead");
    const progress = document.createElement("div");
    progress.className = "scroll-progress";
    progress.setAttribute("aria-hidden", "true");
    document.body.append(progress);
    const homeLinks = [...document.querySelectorAll(".main-nav [data-section]")];
    const homeSections = homeLinks.length ? [...document.querySelectorAll("main > section[id]")] : [];
    const contentsLinks = [...document.querySelectorAll(".case-nav a, .publication-nav a")];
    const contents = contentsLinks.map(link => document.getElementById(new URL(link.href).hash.slice(1)));
    let headerHeight = 0;
    let scheduled = false;
    const update = () => {
      scheduled = false;
      const scroll = window.scrollY;
      const distance = root.scrollHeight - window.innerHeight;
      const atEnd = distance > 0 && scroll >= distance - 2;
      const marker = atEnd ? window.innerHeight : headerHeight + Math.min(180, window.innerHeight * .22);
      const activeHome = homeSections.filter(section => section.getBoundingClientRect().top <= marker).pop();
      const activeContents = contents.filter(section => section && section.getBoundingClientRect().top <= marker).pop();
      progress.style.transform = `scaleX(${distance > 0 ? Math.max(0, Math.min(1, scroll / distance)) : 0})`;
      header.classList.toggle("is-scrolled", scroll > 12);
      homeLinks.forEach(link => {
        if (activeHome && link.dataset.section === activeHome.id) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
      contentsLinks.forEach((link, index) => {
        if (activeContents && contents[index] === activeContents) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };
    const schedule = () => {
      if (!scheduled) {
        scheduled = true;
        window.requestAnimationFrame(update);
      }
    };
    const resize = () => {
      headerHeight = header.getBoundingClientRect().height;
      root.style.setProperty("--header-height", headerHeight + "px");
      schedule();
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pageshow", schedule);
    window.addEventListener("hashchange", () => { cancelEntrances(); schedule(); });
    if (window.ResizeObserver) new ResizeObserver(resize).observe(header);
    resize();
  }
  document.addEventListener("DOMContentLoaded", () => {
    trackScroll();

    if (heroEligible) revealHero();
    if (still() || incomingInput === "keyboard" || location.hash || (navigation && navigation.type === "back_forward")) return;
    if (!incomingInput) {
      document.querySelectorAll(".hero-copy > *, .case-hero > *, .projects-hero > div > *, .publications-hero > div > *").forEach((element, index) => {
        animate(element, [
          { opacity: 0, transform: "translateY(14px)" },
          { opacity: 1, transform: "translateY(0)" }
        ], { duration: 520, delay: index * 65, easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" });
      });
    }
    if (!window.IntersectionObserver) return;
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        revealObserver.unobserve(element);
        element.classList.remove("reveal-pending");
        pending.delete(element);
        if (!still() && inputMode !== "keyboard") {
          animate(element, [
            { opacity: 0, transform: "translateY(18px)" },
            { opacity: 1, transform: "translateY(0)" }
          ], { duration: 480, easing: "cubic-bezier(.22,1,.36,1)", fill: "none" });
        }
      });
    }, { threshold: .08 });
    document.querySelectorAll(".work-row, .paper-preview, .education-entry, .experience article, .about-copy, .contact-inner, .archive-entry, .publication, .review-section, .case-section, .project-interlude").forEach(element => {
      if (!element.animate || element.getBoundingClientRect().top < window.innerHeight) return;
      element.classList.add("reveal-pending");
      pending.add(element);
      revealObserver.observe(element);
    });
  });
})();
