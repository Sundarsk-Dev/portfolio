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
  let projectsSubject;
  let projectsCancelled = false;
  let projectsTimeout;
  const projectsAnimations = [];
  let publicationsArt;
  let publicationsObserver;
  let publicationsTimeout;
  let publicationsCancelled = false;
  let publicationsStarted = false;
  const publicationsLayers = [];
  const publicationsAnimations = [];
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
  const finishProjects = () => {
    if (projectsCancelled) return;
    projectsCancelled = true;
    root.classList.remove("projects-entering");
    window.clearTimeout(projectsTimeout);
    projectsAnimations.forEach(animation => animation.cancel());
    if (projectsSubject) projectsSubject.remove();
  };
  const finishPublications = () => {
    publicationsCancelled = true;
    root.classList.remove("publications-entering");
    window.clearTimeout(publicationsTimeout);
    if (publicationsObserver) publicationsObserver.disconnect();
    publicationsAnimations.forEach(animation => animation.cancel());
    publicationsLayers.forEach(layer => layer.remove());
  };
  const cancelEntrances = () => {
    cancelHero();
    finishProjects();
    finishPublications();
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
  document.addEventListener("wheel", finishProjects, { passive: true });
  document.addEventListener("touchmove", finishProjects, { passive: true });
  window.addEventListener("scroll", () => {
    if (window.scrollY > 0) finishProjects();
    if (publicationsStarted && !publicationsCancelled) {
      const bounds = publicationsArt.getBoundingClientRect();
      const header = document.querySelector(".masthead").getBoundingClientRect();
      if (bounds.bottom <= header.bottom || bounds.top >= window.innerHeight) finishPublications();
    }
  }, { passive: true });
  window.addEventListener("pagehide", finishProjects);
  window.addEventListener("resize", finishProjects);
  window.addEventListener("pagehide", finishPublications);
  window.addEventListener("resize", finishPublications);
  window.addEventListener("pageshow", event => { if (event.persisted) finishPublications(); });
  document.addEventListener("focusin", event => {
    if (event.target.closest && event.target.closest(".reveal-pending")) cancelEntrances();
    if (event.target.closest && event.target.closest(".projects-hero")) finishProjects();
    if (event.target.closest && event.target.closest(".publications-hero")) finishPublications();
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
  const projectsMask = document.querySelector("template[data-projects-mask]");
  const publicationsEntrance = document.querySelector("script[data-publications-entrance]");
  if (publicationsEntrance && heroEligible && heroSupported) {
    root.classList.add("publications-entering");
    publicationsTimeout = window.setTimeout(finishPublications, 3500);
  }
  if (projectsMask && heroEligible && heroSupported) {
    root.classList.add("projects-entering");
    projectsTimeout = window.setTimeout(finishProjects, 3500);
  }
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

  async function revealProjects() {
    if (!projectsMask || !heroSupported || projectsCancelled) return;
    const hero = document.querySelector(".projects-hero");
    const room = hero && hero.querySelector(".projects-room");
    if (!room) { finishProjects(); return; }
    const bounds = room.getBoundingClientRect();
    if (bounds.top + bounds.height * .55 > window.innerHeight) { finishProjects(); return; }
    try {
      const mask = new Image();
      // A data URL also works for local file previews, where external masks fail CORS.
      mask.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(projectsMask.innerHTML);
      await Promise.all([mask.decode(), room.querySelector("img").decode()]);
      if (projectsCancelled || still() || inputMode === "keyboard" || location.hash || window.scrollY > 0) { finishProjects(); return; }
      // Reuse the exact responsive pixels under the traced mask.
      projectsSubject = room.cloneNode(true);
      projectsSubject.className = "projects-subject";
      // The responsive mask follows both sleeves; soften only the lower body.
      projectsSubject.style.maskImage = `url("${mask.src}"), linear-gradient(#000 76%, transparent 94%)`;
      room.after(projectsSubject);
      const fade = (element, duration, delay = 0) => {
        const animation = animate(element, [{ opacity: 0 }, { opacity: 1 }], {
          duration, delay, easing: "cubic-bezier(.4,0,.2,1)", fill: "both"
        });
        projectsAnimations.push(animation);
        return animation.finished;
      };
      await Promise.all([
        fade(projectsSubject, 750),
        fade(room, 650, 750),
        fade(hero.querySelector("h1"), 400, 850),
        fade(hero.querySelector(".index-hero-copy"), 400, 950),
        fade(hero.querySelector("figcaption"), 350, 1050)
      ]);
    } catch (_) {
      // Missing/slow assets and interrupted animations leave the original still.
    } finally {
      finishProjects();
    }
  }

  async function revealPublications() {
    if (!publicationsEntrance || !heroSupported || publicationsCancelled) return;
    publicationsArt = document.querySelector(".publications-hero .index-art");
    const room = publicationsArt && publicationsArt.querySelector("picture");
    if (!room || !window.IntersectionObserver) { finishPublications(); return; }
    try {
      await room.querySelector("img").decode();
      if (publicationsCancelled || still() || inputMode === "keyboard" || location.hash) { finishPublications(); return; }
      window.clearTimeout(publicationsTimeout);
      const start = async () => {
        if (publicationsCancelled || publicationsStarted) return;
        publicationsStarted = true;
        publicationsObserver.disconnect();
        try {
          const bounds = publicationsArt.getBoundingClientRect();
          const mobile = window.innerWidth <= 1100;
          const width = mobile ? 900 : 1586, height = mobile ? 757 : 992;
          const scale = Math.min(bounds.width / width, bounds.height / height);
          const unit = mobile ? scale * 900 / 1180 : scale;
          const left = mobile ? (bounds.width - width * scale) / 2 : 0;
          const top = (bounds.height - height * scale) * (mobile ? 1 : .5);
          const point = (x, y) => [left + (mobile ? (x - 60) * 900 / 1180 : x) * scale,
            top + (mobile ? y * 757 / 992 : y) * scale];
          const mask = (x, y, rx, ry) => {
            const [px, py] = point(x, y);
            return `radial-gradient(ellipse ${rx * unit}px ${ry * unit}px at ${px}px ${py}px, #000 45%, transparent 100%)`;
          };
          const layer = (name, shape) => {
            const picture = room.cloneNode(true);
            picture.className = `publications-light publications-${name}`;
            picture.setAttribute("aria-hidden", "true");
            picture.style.maskImage = shape;
            publicationsLayers.push(picture);
            publicationsArt.append(picture);
            return picture;
          };
          const lamp = layer("lamp", mask(mobile ? 78 : 48, 245, 130, 140));
          const profile = layer("profile", mask(620, 490, 410, 480));
          const fade = (element, duration, delay = 0) => {
            const animation = animate(element, [{ opacity: 0 }, { opacity: 1 }], {
              duration, delay, easing: "cubic-bezier(.22,1,.36,1)", fill: "both"
            });
            publicationsAnimations.push(animation);
            return animation.finished;
          };
          await Promise.all([
            fade(lamp, mobile ? 160 : 180),
            fade(profile, mobile ? 320 : 480, mobile ? 90 : 140),
            fade(room, mobile ? 440 : 780, mobile ? 160 : 250)
          ]);
        } catch (_) {
          // The original responsive picture is the final frame and every fallback.
        } finally { finishPublications(); }
      };
      // On phones the heading precedes the art. Wait for the artwork itself.
      publicationsObserver = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .45)) start();
      }, { threshold: .45 });
      publicationsObserver.observe(publicationsArt);
    } catch (_) { finishPublications(); }
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
      // CSS places anchor targets 24px below the header; probe just inside the section.
      const contentsMarker = atEnd ? window.innerHeight : headerHeight + 25;
      const activeHome = homeSections.filter(section => section.getBoundingClientRect().top <= marker).pop();
      const activeContents = contents.filter(section => section && section.getBoundingClientRect().top <= contentsMarker).pop();
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
    if (heroEligible) revealProjects();
    if (heroEligible) revealPublications();
    if (still() || incomingInput === "keyboard" || location.hash || (navigation && navigation.type === "back_forward")) return;
    if (!incomingInput) {
      document.querySelectorAll(".hero-copy > *, .case-hero > *").forEach((element, index) => {
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
    document.querySelectorAll(".work-row, .paper-preview, .archive-entry, .publication, .review-section, .case-section, .project-interlude").forEach(element => {
      if (!element.animate || element.getBoundingClientRect().top < window.innerHeight) return;
      element.classList.add("reveal-pending");
      pending.add(element);
      revealObserver.observe(element);
    });
  });
})();
