/**
 * Industrial Contractor — Wireframe behaviour
 * Mobile navigation, submenus, footer accordions, project filters,
 * stat counters, contact-form validation and wireframe helpers.
 */

const DESKTOP_QUERY = window.matchMedia("(min-width: 1024px)");
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");

const $ = <T extends Element>(sel: string, root: ParentNode = document): T | null =>
  root.querySelector<T>(sel);
const $$ = <T extends Element>(sel: string, root: ParentNode = document): T[] =>
  Array.from(root.querySelectorAll<T>(sel));

/* ------------------------------------------------------------------
 * Primary navigation (off-canvas drawer below 1024px)
 * ------------------------------------------------------------------ */
function initNavigation(): void {
  const header = $<HTMLElement>(".site-header");
  const toggle = $<HTMLButtonElement>(".nav-toggle");
  const nav = $<HTMLElement>("#primary-nav");
  if (!header || !toggle || !nav) return;

  const submenuToggles = $$<HTMLButtonElement>(".submenu-toggle", nav);
  const submenuOf = (btn: HTMLButtonElement): HTMLElement | null =>
    btn.closest(".has-submenu")?.querySelector<HTMLElement>(".submenu") ?? null;

  /** Position the drawer directly below the header, wherever it currently sits. */
  const syncDrawerTop = (): void => {
    const bottom = Math.max(0, header.getBoundingClientRect().bottom);
    nav.style.setProperty("--nav-top", `${bottom}px`);
  };

  const setMenu = (open: boolean): void => {
    if (open) syncDrawerTop();
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".visually-hidden")!.textContent = open ? "Close menu" : "Menu";
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    if (!open) closeSubmenus();
  };

  const closeSubmenus = (except?: HTMLButtonElement): void => {
    submenuToggles.forEach((btn) => {
      if (btn === except) return;
      btn.setAttribute("aria-expanded", "false");
      submenuOf(btn)?.classList.remove("is-open");
    });
  };

  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));

  submenuToggles.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = btn.getAttribute("aria-expanded") !== "true";
      closeSubmenus(btn);
      btn.setAttribute("aria-expanded", String(open));
      submenuOf(btn)?.classList.toggle("is-open", open);
    });
  });

  // Close the drawer after choosing a link (also covers same-page anchors).
  $$<HTMLAnchorElement>("a", nav).forEach((link) =>
    link.addEventListener("click", () => {
      if (!DESKTOP_QUERY.matches) setMenu(false);
      else closeSubmenus();
    }),
  );

  // Escape closes menus and returns focus to the trigger.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const openSub = submenuToggles.find((b) => b.getAttribute("aria-expanded") === "true");
    if (openSub && DESKTOP_QUERY.matches) {
      closeSubmenus();
      openSub.focus();
    } else if (nav.classList.contains("is-open")) {
      setMenu(false);
      toggle.focus();
    }
  });

  // Clicking outside closes desktop dropdowns.
  document.addEventListener("click", (e) => {
    if (!nav.contains(e.target as Node)) closeSubmenus();
  });

  // Reset state when crossing the desktop breakpoint (rotation / resize).
  DESKTOP_QUERY.addEventListener("change", () => setMenu(false));

  // Header shadow once the page scrolls.
  const onScroll = (): void => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ------------------------------------------------------------------
 * Footer accordions (mobile only — CSS keeps them open on ≥768px)
 * ------------------------------------------------------------------ */
function initFooterAccordions(): void {
  $$<HTMLButtonElement>(".footer-toggle").forEach((btn) => {
    const list = btn.closest(".footer-col")?.querySelector(".footer-col__links");
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      list?.classList.toggle("is-open", open);
    });
  });
}

/* ------------------------------------------------------------------
 * Project filter chips
 * ------------------------------------------------------------------ */
function initProjectFilters(): void {
  const chips = $$<HTMLButtonElement>(".filters .chip");
  const cards = $$<HTMLElement>(".projects [data-category]");

  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      const filter = chip.dataset.filter ?? "all";
      chips.forEach((c) => {
        const active = c === chip;
        c.classList.toggle("is-active", active);
        c.setAttribute("aria-pressed", String(active));
      });
      cards.forEach((card) => {
        card.hidden = filter !== "all" && card.dataset.category !== filter;
      });
    }),
  );
}

/* ------------------------------------------------------------------
 * Animated stat counters (start when visible)
 * ------------------------------------------------------------------ */
function initCounters(): void {
  const counters = $$<HTMLElement>("[data-count]");
  const format = (el: HTMLElement, value: number): string =>
    `${el.dataset.prefix ?? ""}${Math.round(value).toLocaleString()}${el.dataset.suffix ?? ""}`;

  const run = (el: HTMLElement): void => {
    const target = Number(el.dataset.count ?? 0);
    if (REDUCED_MOTION.matches || target === 0) {
      el.textContent = format(el, target);
      return;
    }
    const duration = 1200;
    const start = performance.now();
    const step = (now: number): void => {
      const t = Math.min(1, (now - start) / duration);
      el.textContent = format(el, target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (!("IntersectionObserver" in window)) {
    counters.forEach(run);
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target as HTMLElement);
        io.unobserve(entry.target);
      }),
    { threshold: 0.4 },
  );
  counters.forEach((c) => io.observe(c));
}

/* ------------------------------------------------------------------
 * Contact form — client-side validation (wireframe: no submission)
 * ------------------------------------------------------------------ */
type FieldEl = HTMLInputElement | HTMLTextAreaElement;

function initContactForm(): void {
  const form = $<HTMLFormElement>("#contact-form");
  if (!form) return;
  const status = $<HTMLElement>(".form__status", form)!;
  const fields = $$<FieldEl>("input, textarea", form);

  const messageFor = (el: FieldEl): string => {
    const v = el.validity;
    if (v.valueMissing) return "This field is required.";
    if (v.typeMismatch && el.type === "email") return "Enter a valid email address.";
    if (v.tooShort) return `Please enter at least ${el.getAttribute("minlength")} characters.`;
    if (el.type === "tel" && el.value && !/^[\d\s()+.-]{7,}$/.test(el.value)) return "Enter a valid phone number.";
    return "";
  };

  const validate = (el: FieldEl): boolean => {
    const msg = messageFor(el);
    const field = el.closest(".field");
    field?.classList.toggle("has-error", Boolean(msg));
    el.setAttribute("aria-invalid", String(Boolean(msg)));
    const err = field?.querySelector(".field__error");
    if (err) err.textContent = msg;
    return !msg;
  };

  fields.forEach((el) => {
    el.addEventListener("blur", () => validate(el));
    el.addEventListener("input", () => {
      if (el.closest(".field")?.classList.contains("has-error")) validate(el);
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const invalid = fields.filter((el) => !validate(el));
    status.classList.remove("is-success");
    if (invalid.length) {
      status.textContent = "Please correct the highlighted fields.";
      invalid[0].focus();
      return;
    }
    status.textContent = "Thank you — lorem ipsum dolor sit amet. (Wireframe: nothing was sent.)";
    status.classList.add("is-success");
    form.reset();
  });
}

/* ------------------------------------------------------------------
 * Wireframe helpers: back-to-top, section labels, footer year
 * ------------------------------------------------------------------ */
function initHelpers(): void {
  const backToTop = $<HTMLButtonElement>(".back-to-top");
  if (backToTop) {
    const update = (): void => {
      backToTop.hidden = window.scrollY < 600;
    };
    window.addEventListener("scroll", update, { passive: true });
    backToTop.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: REDUCED_MOTION.matches ? "auto" : "smooth" }),
    );
    update();
  }

  const annotate = $<HTMLButtonElement>(".annotate-toggle");
  annotate?.addEventListener("click", () => {
    const on = document.body.classList.toggle("show-labels");
    annotate.setAttribute("aria-pressed", String(on));
  });

  const year = $<HTMLElement>("#year");
  if (year) year.textContent = String(new Date().getFullYear());
}

/* ------------------------------------------------------------------
 * Pages live in folders (about/index.html) and are linked as "about/".
 * Web servers resolve that to index.html; when the site is opened
 * straight from disk (file://) the browser would show a folder listing,
 * so point those links at index.html explicitly.
 * ------------------------------------------------------------------ */
function initFileProtocolLinks(): void {
  if (location.protocol !== "file:") return;
  $$<HTMLAnchorElement>("a[href]").forEach((link) => {
    const url = new URL(link.href);
    if (url.protocol === "file:" && url.pathname.endsWith("/")) {
      url.pathname += "index.html";
      link.href = url.href;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initFileProtocolLinks();
  initNavigation();
  initFooterAccordions();
  initProjectFilters();
  initCounters();
  initContactForm();
  initHelpers();
});
