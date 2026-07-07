(function () {
  "use strict";

  const root = document.documentElement;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const transitionMs = 190;

  const showPage = () => {
    root.classList.remove("is-leaving");
    root.classList.add("is-loaded");
  };

  const isPlainClick = (event) =>
    event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

  const shouldTransition = (link, event) => {
    if (!link || !isPlainClick(event) || prefersReducedMotion.matches) return false;
    if (link.target || link.hasAttribute("download")) return false;
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return false;
    }

    const nextUrl = new URL(link.href, window.location.href);
    if (nextUrl.origin !== window.location.origin) return false;
    return !(nextUrl.pathname === window.location.pathname && nextUrl.hash);
  };

  window.addEventListener("pageshow", showPage);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => window.requestAnimationFrame(showPage), {
      once: true
    });
  } else {
    window.requestAnimationFrame(showPage);
  }

  document.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!shouldTransition(link, event)) return;

    event.preventDefault();
    root.classList.add("is-leaving");
    window.setTimeout(() => {
      window.location.href = link.href;
    }, transitionMs);
  });
})();
