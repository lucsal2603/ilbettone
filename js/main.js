/* Il Bettone — animazioni (GSAP + ScrollTrigger + Lenis) */
(() => {
  gsap.registerPlugin(ScrollTrigger);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const body = document.body;

  /* ---------------- SPLIT HELPERS ---------------- */
  function splitChars(el) {
    const text = el.textContent;
    el.setAttribute("aria-label", text.trim());
    el.innerHTML = "";
    text.split(/(\s+)/).forEach((part) => {
      if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(" ")); return; }
      const w = document.createElement("span");
      w.className = "wrap-word";
      [...part].forEach((ch) => {
        const c = document.createElement("span");
        c.className = "char"; c.textContent = ch; c.setAttribute("aria-hidden", "true");
        w.appendChild(c);
      });
      el.appendChild(w);
    });
    return $$(".char", el);
  }
  function splitWords(el, cls = "w") {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w) => `<span class="${cls}">${w}</span>`).join(" ");
    return $$("." + cls, el);
  }
  function splitLines(el) {
    const words = splitWords(el, "tmpw");
    const lines = []; let top = null;
    words.forEach((w) => {
      const t = w.offsetTop;
      if (top === null || Math.abs(t - top) > 4) { lines.push([]); top = t; }
      lines[lines.length - 1].push(w.textContent);
    });
    el.innerHTML = lines.map((l) => `<span class="lw"><span class="li">${l.join(" ")}</span></span>`).join("");
    return $$(".li", el);
  }

  /* ---------------- LENIS ---------------- */
  let lenis = null;
  if (!reduce) {
    lenis = new Lenis({ duration: 1.25, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { duration: 1.8, offset: 0 });
    else (typeof target === "string" ? $(target) : target)?.scrollIntoView({ behavior: "smooth" });
  };

  /* ---------------- CURSOR ---------------- */
  const cursor = $(".cursor");
  if (fine && cursor) {
    const dot = $(".cursor__dot"), ring = $(".cursor__ring"), label = $(".cursor__label");
    const dx = gsap.quickTo(dot, "x", { duration: 0.1 }), dy = gsap.quickTo(dot, "y", { duration: 0.1 });
    const rx = gsap.quickTo(ring, "x", { duration: 0.55, ease: "power3" }), ry = gsap.quickTo(ring, "y", { duration: 0.55, ease: "power3" });
    window.addEventListener("mousemove", (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
    document.addEventListener("mouseover", (e) => {
      const view = e.target.closest(".reveal, .hcard__img, .scard__img, .zoom__img, .expand__frame");
      const hov = e.target.closest("a, button, [data-hover], .product, input, select, textarea");
      cursor.classList.toggle("is-view", !!view && !hov);
      cursor.classList.toggle("is-hover", !!hov);
      label.textContent = view && !hov ? "Guarda" : "";
    });
    document.addEventListener("mouseleave", () => gsap.to(cursor, { opacity: 0 }));
    document.addEventListener("mouseenter", () => gsap.to(cursor, { opacity: 1 }));
  }

  /* ---------------- MAGNETIC ---------------- */
  if (fine) {
    $$("[data-magnetic]").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1,0.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1,0.4)" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.35);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
    });
  }

  /* ---------------- MENU ---------------- */
  const menuTl = gsap.timeline({ paused: true, onReverseComplete: () => body.classList.remove("menu-visible") })
    .to(".menu__bg", { clipPath: "circle(150% at calc(100% - 60px) 45px)", duration: 1, ease: "power4.inOut" })
    .to(".menu__links a span", { yPercent: -110, duration: 0.9, stagger: 0.07, ease: "power4.out" }, "-=0.45")
    .to(".menu__links a em", { y: 0, yPercent: -300, duration: 0.9, stagger: 0.07, ease: "power4.out" }, "<")
    .to(".menu__foot", { opacity: 1, duration: 0.5 }, "-=0.5");
  let menuOpen = false;
  const toggleMenu = (force) => {
    menuOpen = typeof force === "boolean" ? force : !menuOpen;
    body.classList.toggle("menu-open", menuOpen);
    $(".menu").setAttribute("aria-hidden", String(!menuOpen));
    if (menuOpen) { body.classList.add("menu-visible"); menuTl.timeScale(1).play(); lenis && lenis.stop(); }
    else { menuTl.timeScale(1.6).reverse(); lenis && lenis.start(); }
  };
  $(".burger").addEventListener("click", () => toggleMenu());

  /* ---------------- ANCHORS ---------------- */
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length < 2 && id !== "#") return;
    const target = id === "#top" ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    if (menuOpen) { toggleMenu(false); setTimeout(() => scrollTo(target), 500); }
    else scrollTo(target);
  }));

  /* ---------------- FORM → WHATSAPP ---------------- */
  $(".js-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const d = f.get("data") ? new Date(f.get("data")).toLocaleDateString("it-IT") : "da definire";
    const msg = `Ciao Federica! Sono ${f.get("nome")}.\nMi interessa: ${f.get("cosa")}\nQuando: ${d}\nPersone: ${f.get("persone") || "-"}\n${f.get("messaggio") || ""}`;
    window.open(`https://wa.me/393402680393?text=${encodeURIComponent(msg)}`, "_blank");
  });

  /* ---------------- PRELOADER ---------------- */
  function preloader() {
    return new Promise((resolve) => {
      if (reduce) { $(".preloader").remove(); resolve(); return; }
      const imgs = $$("img");
      let loaded = 0;
      const prog = { v: 0 };
      const target = () => Math.max(0.25, loaded / imgs.length);
      imgs.forEach((img) => {
        if (img.complete) loaded++;
        else { img.addEventListener("load", () => loaded++, { once: true }); img.addEventListener("error", () => loaded++, { once: true }); }
      });
      const count = $(".js-count"), bar = $(".preloader__bar i");
      gsap.to(".preloader__word span", { yPercent: -110, duration: 1.2, stagger: 0.12, ease: "power4.out", delay: 0.2 });
      const start = performance.now();
      const tick = () => {
        const elapsed = (performance.now() - start) / 1000;
        const goal = Math.min(1, Math.min(target(), elapsed / 1.6) + (elapsed > 3.5 ? 1 : 0));
        prog.v += (goal - prog.v) * 0.08;
        if (goal >= 1 && prog.v > 0.995) prog.v = 1;
        count.textContent = Math.round(prog.v * 100);
        bar.style.transform = `scaleX(${prog.v})`;
        if (prog.v < 1) requestAnimationFrame(tick);
        else {
          gsap.timeline({ onComplete: () => { $(".preloader").remove(); resolve(); } })
            .to(".preloader__word span", { yPercent: -220, duration: 0.8, stagger: 0.05, ease: "power3.in" })
            .to(".preloader__count, .preloader__bar", { opacity: 0, duration: 0.3 }, "<")
            .to(".preloader__panel--1", { yPercent: -100, duration: 0.9, ease: "power4.inOut" }, "-=0.2")
            .to(".preloader__panel--2", { yPercent: -100, duration: 0.9, ease: "power4.inOut" }, "-=0.75")
            .to(".preloader", { yPercent: -100, duration: 1, ease: "power4.inOut" }, "-=0.35")
            .set(".preloader__panel", { autoAlpha: 0 });
        }
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------------- BUILD ---------------- */
  function build() {
    // pre-split
    const heroChars = splitChars($(".hero__title .js-split-chars"));
    $$(".contact__title .js-split-chars").forEach(splitChars);
    const footChars = splitChars($(".js-split-chars-footer"));
    const introWords = splitWords($(".js-words"));
    $$(".js-split-words").forEach((el) => {
      splitWords(el, "word-in");
      $$(".word-in", el).forEach((w) => { const o = document.createElement("span"); o.style.cssText = "display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.08em"; w.parentNode.insertBefore(o, w); o.appendChild(w); });
    });
    $$(".js-split-lines").forEach((el) => { el.innerHTML = `<span class="li">${el.innerHTML}</span>`; });
    $$(".js-lines").forEach(splitLines);

    if (reduce) { gsap.set(heroChars, { yPercent: 0 }); return null; }

    // initial states
    gsap.set(heroChars, { yPercent: 115, rotate: 6 });
    gsap.set(".hero .js-fade", { y: 30, opacity: 0 });
    gsap.set(".hero__badge", { scale: 0, rotate: -90 });
    gsap.set(footChars, { yPercent: 100 });

    /* ---- HERO INTRO ---- */
    const intro = gsap.timeline({ paused: true, defaults: { ease: "power4.out" } });
    intro.to(heroChars, { yPercent: 0, rotate: 0, duration: 1.4, stagger: 0.045 })
      .from(".hero__frame", { yPercent: 25, duration: 1.6 }, 0.1)
      .to(".hero .js-fade", { y: 0, opacity: 1, duration: 1, stagger: 0.12 }, 0.5)
      .to(".hero__badge", { scale: 1, rotate: 0, duration: 1.2, ease: "back.out(1.6)" }, 0.8)
      .add(() => lenis && lenis.start(), 0.6);

    /* ---- HERO SCROLL ---- */
    const heroMq = window.innerWidth < 700 ? "inset(10% 8% 0% 8% round 200px 200px 0px 0px)" : "inset(18% 22% 0% 22% round 300px 300px 0px 0px)";
    gsap.fromTo(".hero__frame", { clipPath: heroMq }, {
      clipPath: "inset(0% 0% 0% 0% round 0px 0px 0px 0px)", ease: "none",
      scrollTrigger: { trigger: ".hero__media", start: "top 70%", end: "bottom bottom", scrub: true },
    });
    gsap.to(".hero__img", { scale: 1, yPercent: -12, ease: "none", scrollTrigger: { trigger: ".hero__media", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.to(".hero__title", { yPercent: -40, letterSpacing: "-0.02em", opacity: 0.15, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "+=700", scrub: true } });
    gsap.to(".hero__badge svg", { rotate: 360, ease: "none", scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: 1 } });
    gsap.to(".hero__badge", { yPercent: -200, ease: "none", scrollTrigger: { trigger: ".hero__media", start: "top 80%", end: "center center", scrub: true } });

    /* ---- MARQUEE (velocity-reactive) ---- */
    const mq = gsap.to(".marquee__track", { xPercent: -50, duration: 22, ease: "none", repeat: -1 });
    let dir = 1;
    ScrollTrigger.create({
      trigger: ".marquee", start: "top bottom", end: "bottom top",
      onUpdate: (self) => {
        const v = self.getVelocity();
        dir = self.direction;
        gsap.to(mq, { timeScale: dir * (1 + Math.min(Math.abs(v) / 250, 6)), duration: 0.2, overwrite: true });
        gsap.to(mq, { timeScale: dir, duration: 1.2, delay: 0.2, ease: "power2.out", overwrite: false });
      },
    });
    gsap.to(".marquee__item i", { rotate: 360, ease: "none", scrollTrigger: { trigger: ".marquee", start: "top bottom", end: "bottom top", scrub: true } });

    /* ---- INTRO WORDS SCRUB ---- */
    gsap.to(introWords, { opacity: 1, stagger: 0.08, ease: "none", scrollTrigger: { trigger: ".intro__text", start: "top 80%", end: "bottom 45%", scrub: true } });

    /* ---- COUNTERS ---- */
    $$(".js-counter").forEach((el) => {
      const to = +el.dataset.to, pre = el.dataset.prefix || "", o = { v: 0 };
      ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () =>
        gsap.to(o, { v: to, duration: 2.2, ease: "power3.out", onUpdate: () => (el.textContent = pre + Math.round(o.v)) }) });
    });
    gsap.from(".stat", { y: 60, opacity: 0, stagger: 0.12, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: ".stats", start: "top 85%" } });

    /* ---- HEADINGS ---- */
    $$(".js-split-lines .li").forEach((li) => {
      gsap.from(li, { yPercent: 110, rotate: 3, duration: 1.4, ease: "power4.out", scrollTrigger: { trigger: li.closest(".line"), start: "top 88%" } });
    });
    $$(".section-head__t").forEach((h) => {
      gsap.to(h, { xPercent: -6, ease: "none", scrollTrigger: { trigger: h, start: "top bottom", end: "bottom top", scrub: true } });
    });
    $$(".js-lines").forEach((p) => {
      gsap.from($$(".li", p), { yPercent: 105, duration: 1.1, stagger: 0.09, ease: "power4.out", scrollTrigger: { trigger: p, start: "top 85%" } });
    });
    $$(".js-fade").forEach((el) => {
      if (el.closest(".hero")) return;
      gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } });
    });
    $$(".contact__title .line").forEach((line, i) => {
      gsap.from($$(".char", line), { yPercent: 115, rotate: 8, duration: 1.2, stagger: 0.035, ease: "power4.out", delay: i * 0.15, scrollTrigger: { trigger: ".contact__title", start: "top 80%" } });
    });

    /* ---- IMAGE REVEALS + PARALLAX ---- */
    $$(".reveal").forEach((r) => {
      const img = $("img, iframe", r);
      const tl = gsap.timeline({ scrollTrigger: { trigger: r, start: "top 85%" } });
      tl.to(r, { clipPath: "inset(0% 0 0 0)", duration: 1.5, ease: "power4.inOut" });
      if (img && img.tagName === "IMG") tl.to(img, { scale: 1, duration: 1.8, ease: "power3.out" }, 0.1);
    });
    $$("img[data-speed]").forEach((img) => {
      const s = parseFloat(img.dataset.speed);
      gsap.fromTo(img, { yPercent: -(1 - s) * 40 }, { yPercent: (1 - s) * 40, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });

    /* ---- HORIZONTAL SCROLL ---- */
    const track = $(".hscroll__track");
    const hTween = gsap.to(track, {
      x: () => -(track.scrollWidth - window.innerWidth), ease: "none",
      scrollTrigger: { trigger: ".hscroll", pin: ".hscroll__pin", start: "top top", end: () => "+=" + (track.scrollWidth - window.innerWidth), scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 },
    });
    $$(".hcard__img img").forEach((img) => {
      gsap.fromTo(img, { xPercent: -10 }, { xPercent: 10, ease: "none", scrollTrigger: { trigger: img.closest(".hcard"), containerAnimation: hTween, start: "left right", end: "right left", scrub: true } });
    });
    $$(".hcard:not(.hcard--intro)").forEach((card, i) => {
      gsap.from(card, { y: i % 2 ? 120 : -60, rotate: i % 2 ? 4 : -4, ease: "none", scrollTrigger: { trigger: card, containerAnimation: hTween, start: "left right", end: "center center", scrub: true } });
    });
    gsap.from(".hcard--intro h3", { xPercent: -20, opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".hscroll", start: "top 60%" } });

    /* ---- STACK CARDS ---- */
    const cards = $$(".scard");
    cards.forEach((card, i) => {
      if (i === cards.length - 1) return;
      gsap.to(card, { scale: 0.88 + i * 0.03, rotate: i % 2 ? 1.5 : -1.5, filter: "brightness(.75)", ease: "none",
        scrollTrigger: { trigger: cards[i + 1], start: "top bottom", end: "top 12%", scrub: true } });
    });
    cards.forEach((card) => {
      gsap.from($(".scard__img img", card), { scale: 1.4, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "top 12%", scrub: true } });
      gsap.from($(".scard__n", card), { yPercent: 80, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 70%" } });
    });

    /* ---- SPUNTINI ZOOM ---- */
    const ztl = gsap.timeline({ scrollTrigger: { trigger: ".zoom", start: "top top", end: "bottom bottom", scrub: true } });
    ztl.to(".zoom__img", { width: "100vw", height: "100vh", borderRadius: 0, ease: "power2.inOut" }, 0)
      .to(".zoom__img img", { scale: 1, ease: "none" }, 0)
      .fromTo(".zoom__w", { letterSpacing: "-0.05em", scale: 0.8 }, { letterSpacing: "0.02em", scale: 1.1, ease: "none" }, 0)
      .fromTo(".zoom__text p", { y: 40, opacity: 0 }, { y: 0, opacity: 1, ease: "none" }, 0.3);
    gsap.from(".open-badge", { scale: 0, rotate: -180, duration: 1.4, ease: "back.out(1.7)", scrollTrigger: { trigger: ".open-badge", start: "top 85%" } });
    gsap.to(".open-badge", { rotate: 12, ease: "none", scrollTrigger: { trigger: ".spuntini__content", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.from(".product", { yPercent: 60, opacity: 0, stagger: 0.1, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".products", start: "top 80%" } });

    // floating image on product hover
    const pf = $(".product-float"), pfImg = $("img", pf);
    if (fine) {
      const px = gsap.quickTo(pf, "x", { duration: 0.6, ease: "power3" }), py = gsap.quickTo(pf, "y", { duration: 0.6, ease: "power3" });
      gsap.set(pf, { xPercent: -50, yPercent: -50 });
      $(".products").addEventListener("mousemove", (e) => { px(e.clientX); py(e.clientY); gsap.to(pf, { rotate: gsap.utils.clamp(-12, 12, e.movementX * 0.8), duration: 0.5 }); });
      $$(".product").forEach((p) => p.addEventListener("mouseenter", () => { pfImg.src = p.dataset.img; }));
      $(".products").addEventListener("mouseenter", () => gsap.to(pf, { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" }));
      $(".products").addEventListener("mouseleave", () => gsap.to(pf, { opacity: 0, scale: 0.6, duration: 0.4 }));
    }

    /* ---- ALLOGGIO EXPAND ---- */
    const etl = gsap.timeline({ scrollTrigger: { trigger: ".expand", start: "top top", end: "bottom bottom", scrub: true } });
    etl.to(".expand__frame", { width: "100vw", height: "100vh", borderRadius: 0, ease: "power2.inOut" }, 0)
      .to(".expand__frame img", { scale: 1, ease: "none" }, 0)
      .from(".expand__caption span", { yPercent: 100, opacity: 0, ease: "none" }, 0.2)
      .from(".expand__caption strong", { yPercent: 60, opacity: 0, ease: "none" }, 0.25);
    gsap.from(".features li", { x: -40, opacity: 0, stagger: 0.12, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".features", start: "top 85%" } });

    /* ---- TERRITORIO ---- */
    const path = $(".hills-line path"), len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(path, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ".territorio", start: "top 70%", end: "bottom 60%", scrub: true } });
    gsap.fromTo(".territorio__bg", { yPercent: -10 }, { yPercent: 10, ease: "none", scrollTrigger: { trigger: ".territorio", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.from(".big-quote .word-in", { yPercent: 110, rotate: 5, opacity: 0, stagger: 0.05, duration: 1.2, ease: "power4.out", scrollTrigger: { trigger: ".big-quote", start: "top 80%" } });

    /* ---- TEAM ---- */
    $$(".member").forEach((m, i) => {
      gsap.to(m, { y: -(i * 60), ease: "none", scrollTrigger: { trigger: ".team__grid", start: "top bottom", end: "bottom top", scrub: true } });
      if (fine) {
        const inner = m;
        inner.addEventListener("mousemove", (e) => {
          const r = inner.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(inner, { rotateY: x * 10, rotateX: -y * 10, transformPerspective: 900, duration: 0.6, ease: "power3.out" });
        });
        inner.addEventListener("mouseleave", () => gsap.to(inner, { rotateY: 0, rotateX: 0, duration: 0.9, ease: "elastic.out(1,0.5)" }));
      }
    });

    /* ---- FOOTER ---- */
    gsap.to(footChars, { yPercent: 0, stagger: 0.05, duration: 1.3, ease: "power4.out", scrollTrigger: { trigger: ".footer__big", start: "top 95%" } });
    gsap.from(".footer__badges img, .footer__logo", { y: 30, opacity: 0, stagger: 0.1, duration: 1, scrollTrigger: { trigger: ".footer", start: "top 85%" } });

    /* ---- BACKGROUND COLOR SWITCH ---- */
    $$("[data-bg]").forEach((sec) => {
      const last = sec.classList.contains("footer");
      ScrollTrigger.create({
        trigger: sec, start: last ? "top 90%" : "top 55%", end: last ? "bottom top" : "bottom 55%",
        onToggle: (self) => { if (self.isActive) { body.classList.remove("bg-green", "bg-terra"); if (sec.dataset.bg !== "cream") body.classList.add("bg-" + sec.dataset.bg); } },
      });
    });

    /* ---- PROGRESS + HEADER ---- */
    gsap.to(".progress i", { scaleX: 1, ease: "none", scrollTrigger: { trigger: document.documentElement, start: "top top", end: "bottom bottom", scrub: 0.3 } });
    const header = $(".header");
    ScrollTrigger.create({ start: 0, end: "max", onUpdate: (self) => header.classList.toggle("is-hidden", self.direction === 1 && self.scroll() > 300 && !menuOpen) });
    return intro;
  }

  /* ---------------- INIT ---------------- */
  const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 2500))]);
  window.scrollTo(0, 0);
  let intro = null;
  fontsReady.then(() => {
    intro = build();
    return preloader();
  }).then(() => {
    body.classList.remove("is-loading");
    ScrollTrigger.refresh();
    if (intro) intro.play(); else if (lenis) lenis.start();
  });
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
