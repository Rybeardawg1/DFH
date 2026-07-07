(function () {
  "use strict";

  const contactEmail = "hello@developerforhire.dev";
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const header = document.querySelector("[data-header]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const menu = document.querySelector("[data-menu]");

  const closeMenu = () => {
    if (!navToggle || !menu) return;
    navToggle.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  };

  if (navToggle && menu) {
    navToggle.addEventListener("click", () => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!isOpen));
      menu.classList.toggle("is-open", !isOpen);
      document.body.classList.toggle("menu-open", !isOpen);
    });

    menu.addEventListener("click", (event) => {
      if (event.target instanceof HTMLAnchorElement) {
        closeMenu();
      }
    });
  }

  if (header) {
    const updateHeader = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  const focusTarget = (target) => {
    const focusable = /^(A|BUTTON|INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
    if (!focusable && !target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
    }
    target.focus({ preventScroll: true });
  };

  const getScrollTarget = (target) => {
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
    return Math.max(0, Math.round(top));
  };

  const animateScroll = (targetY, done) => {
    const startY = window.scrollY;
    const distance = targetY - startY;
    const duration = Math.min(820, Math.max(360, Math.abs(distance) * 0.42));
    const started = performance.now();

    const step = (now) => {
      const elapsed = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      window.scrollTo(0, startY + distance * eased);
      if (elapsed < 1) {
        window.requestAnimationFrame(step);
      } else if (done) {
        done();
      }
    };

    window.requestAnimationFrame(step);
  };

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.getElementById(hash.slice(1));
      if (!target) return;

      event.preventDefault();
      closeMenu();

      const targetY = getScrollTarget(target);
      if (prefersReducedMotion.matches) {
        window.scrollTo(0, targetY);
        focusTarget(target);
      } else {
        animateScroll(targetY, () => focusTarget(target));
      }

      if (window.location.hash !== hash) {
        history.pushState(null, "", hash);
      }
    });
  });

  const tiltItems = document.querySelectorAll("[data-tilt]");
  const canTilt = window.matchMedia("(pointer: fine)");

  if (tiltItems.length && canTilt.matches && !prefersReducedMotion.matches) {
    tiltItems.forEach((item) => {
      item.addEventListener(
        "pointermove",
        (event) => {
          const rect = item.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;
          item.style.setProperty("--tilt-x", `${(-y * 5).toFixed(2)}deg`);
          item.style.setProperty("--tilt-y", `${(x * 6).toFixed(2)}deg`);
        },
        { passive: true }
      );

      item.addEventListener("pointerleave", () => {
        item.style.setProperty("--tilt-x", "0deg");
        item.style.setProperty("--tilt-y", "0deg");
      });
    });
  }

  const revealItems = document.querySelectorAll(".reveal");
  if (revealItems.length && "IntersectionObserver" in window && !prefersReducedMotion.matches) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const fitTool = document.querySelector("[data-fit-tool]");
  const fitResult = document.querySelector("[data-fit-result]");
  const fitData = {
    "1-static": ["One-page launch site", "Typical range: $900-$1,500"],
    "1-forms": ["Lead-focused landing page", "Typical range: $1,100-$1,800"],
    "1-dynamic": ["Custom web app discovery", "Starts around $3,750+"],
    "5-static": ["Five-page small-business site", "Typical range: $1,500-$2,625"],
    "5-forms": ["Five-page lead generation site", "Typical range: $1,900-$3,200"],
    "5-dynamic": ["Dynamic business website", "Starts around $3,750+"],
    "10-static": ["Expanded brochure website", "Typical range: $2,400-$4,000"],
    "10-forms": ["Multi-page conversion website", "Typical range: $2,800-$4,600"],
    "10-dynamic": ["Custom workflow platform", "Scoped after discovery"]
  };

  const updateFit = () => {
    if (!fitTool || !fitResult) return;
    const formData = new FormData(fitTool);
    const key = `${formData.get("pages")}-${formData.get("complexity")}`;
    const [title, range] = fitData[key] || fitData["1-static"];
    fitResult.innerHTML = `<span class="fit-label">Best starting point</span><strong>${title}</strong><span>${range}</span>`;
  };

  if (fitTool) {
    fitTool.addEventListener("change", updateFit);
    updateFit();
  }

  const contactForm = document.querySelector("[data-contact-form]");
  const formNote = document.querySelector("[data-form-note]");

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(contactForm);
      const name = String(formData.get("name") || "").trim();
      const business = String(formData.get("business") || "").trim();
      const email = String(formData.get("email") || "").trim();
      const message = String(formData.get("message") || "").trim();

      const subject = encodeURIComponent(`Website consult for ${business || "my business"}`);
      const body = encodeURIComponent(
        `Name: ${name}\nBusiness: ${business}\nEmail: ${email}\n\nWhat I need:\n${message}`
      );

      window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
      if (formNote) {
        formNote.textContent = "Your email app should open with the message ready to send.";
      }
    });
  }

  const hero = document.querySelector(".hero");
  if (hero) {
    hero.addEventListener(
      "pointermove",
      (event) => {
        const rect = hero.getBoundingClientRect();
        const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
        const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);
        hero.style.setProperty("--cursor-x", `${x}%`);
        hero.style.setProperty("--cursor-y", `${y}%`);
      },
      { passive: true }
    );
  }

  const canvas = document.querySelector("[data-hero-canvas]");
  if (!(canvas instanceof HTMLCanvasElement)) return;

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  let width = 0;
  let height = 0;
  let deviceScale = 1;
  let animationFrame = 0;
  let pointerX = 0.68;
  let pointerY = 0.36;

  const panels = [
    { x: 0.58, y: 0.16, w: 0.26, h: 0.2, color: "#eab308", speed: 0.42 },
    { x: 0.73, y: 0.44, w: 0.2, h: 0.16, color: "#0f766e", speed: 0.34 },
    { x: 0.49, y: 0.66, w: 0.28, h: 0.18, color: "#be3455", speed: 0.28 },
    { x: 0.82, y: 0.72, w: 0.16, h: 0.14, color: "#2563eb", speed: 0.36 }
  ];

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    deviceScale = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(width * deviceScale);
    canvas.height = Math.floor(height * deviceScale);
    context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
  }

  function roundedRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + w, y, x + w, y + h, radius);
    context.arcTo(x + w, y + h, x, y + h, radius);
    context.arcTo(x, y + h, x, y, radius);
    context.arcTo(x, y, x + w, y, radius);
    context.closePath();
  }

  function drawPanel(panel, index, time) {
    const drift = Math.sin(time * panel.speed + index) * 9;
    const parallaxX = (pointerX - 0.5) * 24 * (index + 1);
    const parallaxY = (pointerY - 0.5) * 18 * (index + 1);
    const x = panel.x * width + parallaxX;
    const y = panel.y * height + drift + parallaxY;
    const w = Math.max(120, panel.w * width);
    const h = Math.max(86, panel.h * height);

    context.save();
    context.globalAlpha = 0.82;
    roundedRect(x, y, w, h, 8);
    context.fillStyle = "rgba(255, 255, 255, 0.13)";
    context.fill();
    context.strokeStyle = "rgba(255, 255, 255, 0.26)";
    context.lineWidth = 1;
    context.stroke();

    context.fillStyle = panel.color;
    roundedRect(x + 14, y + 14, w * 0.32, 9, 5);
    context.fill();

    context.fillStyle = "rgba(255, 255, 255, 0.78)";
    roundedRect(x + 14, y + 36, w * 0.7, 8, 4);
    context.fill();
    context.globalAlpha = 0.55;
    roundedRect(x + 14, y + 55, w * 0.48, 8, 4);
    context.fill();

    context.globalAlpha = 0.64;
    context.fillStyle = "rgba(255, 255, 255, 0.22)";
    const barY = y + h - 24;
    for (let i = 0; i < 4; i += 1) {
      roundedRect(x + 14 + i * 36, barY, 24, 8 + ((i + index) % 3) * 7, 4);
      context.fill();
    }

    context.restore();
  }

  function draw(timeStamp) {
    const time = timeStamp / 1000;
    context.clearRect(0, 0, width, height);

    const gridSize = width < 720 ? 56 : 72;
    context.save();
    context.globalAlpha = 0.18;
    context.strokeStyle = "rgba(255, 255, 255, 0.35)";
    context.lineWidth = 1;
    for (let x = (time * 8) % gridSize; x < width; x += gridSize) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = (time * 6) % gridSize; y < height; y += gridSize) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    context.restore();

    panels.forEach((panel, index) => drawPanel(panel, index, time));

    if (!prefersReducedMotion.matches && document.visibilityState === "visible") {
      animationFrame = window.requestAnimationFrame(draw);
    }
  }

  function startCanvas() {
    window.cancelAnimationFrame(animationFrame);
    resizeCanvas();
    draw(0);
    if (!prefersReducedMotion.matches) {
      animationFrame = window.requestAnimationFrame(draw);
    }
  }

  canvas.addEventListener(
    "pointermove",
    (event) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width;
      pointerY = (event.clientY - rect.top) / rect.height;
    },
    { passive: true }
  );

  window.addEventListener("resize", startCanvas, { passive: true });
  document.addEventListener("visibilitychange", startCanvas);
  prefersReducedMotion.addEventListener("change", startCanvas);
  startCanvas();
})();
