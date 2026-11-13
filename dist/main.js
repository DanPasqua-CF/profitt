"use strict";
/**
 * Industrial Contractor — Wireframe behaviour
 * Mobile navigation, submenus, footer accordions, project filters,
 * stat counters, contact-form validation and wireframe helpers.
 */
const DESKTOP_QUERY = window.matchMedia("(min-width: 1024px)");
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
/* ------------------------------------------------------------------
 * Primary navigation (off-canvas drawer below 1024px)
 * ------------------------------------------------------------------ */
function initNavigation() {
    const header = $(".site-header");
    const toggle = $(".nav-toggle");
    const nav = $("#primary-nav");
    if (!header || !toggle || !nav)
        return;
    const submenuToggles = $$(".submenu-toggle", nav);
    const submenuOf = (btn) => btn.closest(".has-submenu")?.querySelector(".submenu") ?? null;
    /** Position the drawer directly below the header, wherever it currently sits. */
    const syncDrawerTop = () => {
        const bottom = Math.max(0, header.getBoundingClientRect().bottom);
        nav.style.setProperty("--nav-top", `${bottom}px`);
    };
    const setMenu = (open) => {
        if (open)
            syncDrawerTop();
        toggle.setAttribute("aria-expanded", String(open));
        toggle.querySelector(".visually-hidden").textContent = open ? "Close menu" : "Menu";
        nav.classList.toggle("is-open", open);
        document.body.classList.toggle("nav-open", open);
        if (!open)
            closeSubmenus();
    };
    const closeSubmenus = (except) => {
        submenuToggles.forEach((btn) => {
            if (btn === except)
                return;
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
    $$("a", nav).forEach((link) => link.addEventListener("click", () => {
        if (!DESKTOP_QUERY.matches)
            setMenu(false);
        else
            closeSubmenus();
    }));
    // Escape closes menus and returns focus to the trigger.
    document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape")
            return;
        const openSub = submenuToggles.find((b) => b.getAttribute("aria-expanded") === "true");
        if (openSub && DESKTOP_QUERY.matches) {
            closeSubmenus();
            openSub.focus();
        }
        else if (nav.classList.contains("is-open")) {
            setMenu(false);
            toggle.focus();
        }
    });
    // Clicking outside closes desktop dropdowns.
    document.addEventListener("click", (e) => {
        if (!nav.contains(e.target))
            closeSubmenus();
    });
    // Reset state when crossing the desktop breakpoint (rotation / resize).
    DESKTOP_QUERY.addEventListener("change", () => setMenu(false));
    // Header shadow once the page scrolls.
    const onScroll = () => {
        header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
}
/* ------------------------------------------------------------------
 * Footer accordions (mobile only — CSS keeps them open on ≥768px)
 * ------------------------------------------------------------------ */
function initFooterAccordions() {
    $$(".footer-toggle").forEach((btn) => {
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
function initProjectFilters() {
    const chips = $$(".filters .chip");
    const cards = $$(".projects [data-category]");
    chips.forEach((chip) => chip.addEventListener("click", () => {
        const filter = chip.dataset.filter ?? "all";
        chips.forEach((c) => {
            const active = c === chip;
            c.classList.toggle("is-active", active);
            c.setAttribute("aria-pressed", String(active));
        });
        cards.forEach((card) => {
            card.hidden = filter !== "all" && card.dataset.category !== filter;
        });
    }));
}
/* ------------------------------------------------------------------
 * Animated stat counters (start when visible)
 * ------------------------------------------------------------------ */
function initCounters() {
    const counters = $$("[data-count]");
    const format = (el, value) => `${el.dataset.prefix ?? ""}${Math.round(value).toLocaleString()}${el.dataset.suffix ?? ""}`;
    const run = (el) => {
        const target = Number(el.dataset.count ?? 0);
        if (REDUCED_MOTION.matches || target === 0) {
            el.textContent = format(el, target);
            return;
        }
        const duration = 1200;
        const start = performance.now();
        const step = (now) => {
            const t = Math.min(1, (now - start) / duration);
            el.textContent = format(el, target * (1 - Math.pow(1 - t, 3)));
            if (t < 1)
                requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };
    if (!("IntersectionObserver" in window)) {
        counters.forEach(run);
        return;
    }
    const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting)
            return;
        run(entry.target);
        io.unobserve(entry.target);
    }), { threshold: 0.4 });
    counters.forEach((c) => io.observe(c));
}
function initContactForm() {
    const form = $("#contact-form");
    if (!form)
        return;
    const status = $(".form__status", form);
    const fields = $$("input, textarea", form);
    const messageFor = (el) => {
        const v = el.validity;
        if (v.valueMissing)
            return "This field is required.";
        if (v.typeMismatch && el.type === "email")
            return "Enter a valid email address.";
        if (v.tooShort)
            return `Please enter at least ${el.getAttribute("minlength")} characters.`;
        if (el.type === "tel" && el.value && !/^[\d\s()+.-]{7,}$/.test(el.value))
            return "Enter a valid phone number.";
        return "";
    };
    const validate = (el) => {
        const msg = messageFor(el);
        const field = el.closest(".field");
        field?.classList.toggle("has-error", Boolean(msg));
        el.setAttribute("aria-invalid", String(Boolean(msg)));
        const err = field?.querySelector(".field__error");
        if (err)
            err.textContent = msg;
        return !msg;
    };
    fields.forEach((el) => {
        el.addEventListener("blur", () => validate(el));
        el.addEventListener("input", () => {
            if (el.closest(".field")?.classList.contains("has-error"))
                validate(el);
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
function initHelpers() {
    const backToTop = $(".back-to-top");
    if (backToTop) {
        const update = () => {
            backToTop.hidden = window.scrollY < 600;
        };
        window.addEventListener("scroll", update, { passive: true });
        backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: REDUCED_MOTION.matches ? "auto" : "smooth" }));
        update();
    }
    const annotate = $(".annotate-toggle");
    annotate?.addEventListener("click", () => {
        const on = document.body.classList.toggle("show-labels");
        annotate.setAttribute("aria-pressed", String(on));
    });
    const year = $("#year");
    if (year)
        year.textContent = String(new Date().getFullYear());
}
/* ------------------------------------------------------------------
 * Pages live in folders (about/index.html) and are linked as "about/".
 * Web servers resolve that to index.html; when the site is opened
 * straight from disk (file://) the browser would show a folder listing,
 * so point those links at index.html explicitly.
 * ------------------------------------------------------------------ */
function initFileProtocolLinks() {
    if (location.protocol !== "file:")
        return;
    $$("a[href]").forEach((link) => {
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
//# sourceMappingURL=main.js.map