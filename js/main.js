/* Il Bettone — animazioni (GSAP + ScrollTrigger + Lenis) */
(() => {
  gsap.registerPlugin(ScrollTrigger);

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const body = document.body;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  $(".js-year").textContent = new Date().getFullYear();

  /* ---------------- SMOOTH SCROLL ---------------- */
  let lenis = null;
  if (!reduce) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else (typeof target === "number" ? scrollTo_native(target) : target.scrollIntoView());
  };
  const scrollTo_native = (y) => window.scrollTo(0, y);

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const el = id === "#top" ? 0 : $(id);
      if (el === null) return;
      e.preventDefault();
      closeMenu();
      const topic = a.dataset.topic;
      if (topic) {
        const box = $$('.chips input').find((i) => i.value === topic);
        if (box) box.checked = true;
      }
      scrollTo(el);
    });
  });

  /* ---------------- SPLIT ---------------- */
  // spezza in parole (e opzionalmente lettere) conservando i figli HTML
  function split(el, chars) {
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span");
            w.className = "w";
            w.setAttribute("aria-hidden", "true");
            if (chars) {
              [...part].forEach((c) => {
                const wrap = document.createElement("span");
                wrap.className = "ch-wrap";
                const ch = document.createElement("span");
                ch.className = "ch";
                ch.textContent = c;
                wrap.appendChild(ch);
                w.appendChild(wrap);
              });
            } else w.textContent = part;
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains("pill")) {
          walk(n);
        } else if (n.nodeType === 1) {
          n.classList.add("w");
        }
      });
    };
    walk(el);
  }

  function splitLines(el) {
    const text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.innerHTML = text.split(/\s+/).map((w) => `<span class="tmpw" aria-hidden="true">${w}</span>`).join(" ");
    const lines = [];
    let top = null;
    $$(".tmpw", el).forEach((w) => {
      if (top === null || Math.abs(w.offsetTop - top) > 4) { lines.push([]); top = w.offsetTop; }
      lines[lines.length - 1].push(w.textContent);
    });
    el.innerHTML = lines.map((l) => `<span class="line" aria-hidden="true"><span>${l.join(" ")}</span></span>`).join("");
    return $$(".line > span", el);
  }

  $$(".js-chars").forEach((el) => split(el, true));
  $$(".js-words").forEach((el) => split(el, false));

  /* ---------------- LINEE CHE TREMANO (stile cartoon) ---------------- */
  if (!reduce) {
    const turb = $("#boil feTurbulence");
    let seed = 1;
    setInterval(() => {
      if (document.hidden) return;
      seed = (seed % 3) + 1;
      turb.setAttribute("seed", seed);
    }, 160);
  }

  /* ---------------- PRELOADER ---------------- */
  const loader = $(".loader");
  function intro() {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.from(".hero__far, .hero__mid", { yPercent: 30, duration: 1.6, stagger: 0.08 }, 0)
      .from(".hero__near, .hero__front", { yPercent: 40, duration: 1.6, stagger: 0.08 }, 0.05)
      .from(".sun", { scale: 0, rotate: -90, transformOrigin: "50% 50%", duration: 1.4, ease: "back.out(1.8)" }, 0.3)
      .from(".cloud", { opacity: 0, x: -80, duration: 1.4, stagger: 0.1 }, 0.3)
      .from(".hl", { yPercent: -160, rotate: () => gsap.utils.random(-25, 25), opacity: 0, duration: 1.2, ease: "bounce.out", stagger: 0.06 }, 0.35)
      .from(".hero__kicker span", { y: 30, opacity: 0, duration: 0.9, stagger: 0.12 }, 0.9)
      .from(".hero__place", { scale: 0, rotate: -10, duration: 0.8, ease: "back.out(2.5)" }, 1.1)
      .fromTo(".header", { autoAlpha: 0, y: -30 }, { autoAlpha: 1, y: 0, duration: 1, clearProps: "transform" }, 1)
      .from(".hero__scroll", { opacity: 0, y: 20, duration: 0.8 }, 1.4);
    return tl;
  }

  function runLoader() {
    if (reduce) { loader.remove(); body.classList.remove("is-loading"); return; }
    const count = $(".js-count");
    const obj = { v: 0 };
    const ready = Promise.race([
      Promise.all([
        document.fonts ? document.fonts.ready : Promise.resolve(),
        new Promise((r) => (document.readyState === "complete" ? r() : addEventListener("load", r, { once: true }))),
      ]),
      new Promise((r) => setTimeout(r, 4500)),
    ]);

    const tl = gsap.timeline();
    tl.to(".loader__hills path, .loader__hills circle", { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut", stagger: 0.2 }, 0)
      .to(".loader__word", { "--cr": "0%", duration: 1.3, ease: "power2.inOut" }, 0.3)
      .to(obj, { v: 90, duration: 1.6, ease: "power1.inOut", onUpdate: () => (count.textContent = Math.round(obj.v)) }, 0);

    ready.then(() => {
      tl.then(() => {
        const out = gsap.timeline({
          onComplete: () => {
            loader.remove();
            body.classList.remove("is-loading");
            if (lenis) lenis.start();
            ScrollTrigger.refresh();
          },
        });
        out.to(obj, { v: 100, duration: 0.4, onUpdate: () => (count.textContent = Math.round(obj.v)) })
          .to(".loader__inner", { y: -60, opacity: 0, duration: 0.6, ease: "power3.in" })
          .to(".loader__bg path", { attr: { d: "M0 0 L100 0 L100 45 Q50 90 0 45 Z" }, duration: 0.55, ease: "power3.in" }, "-=0.15")
          .to(".loader__bg path", { attr: { d: "M0 0 L100 0 L100 0 Q50 0 0 0 Z" }, duration: 0.55, ease: "power3.out" })
          .add(intro(), "-=0.75");
      });
    });
  }
  runLoader();

  /* ---------------- CURSORE ---------------- */
  const cursor = $(".cursor");
  if (fine && !reduce) {
    root.classList.add("has-cursor");
    const dot = $(".cursor__dot"), ring = $(".cursor__ring"), label = $(".cursor__label");
    const dx = gsap.quickTo(dot, "x", { duration: 0.08 }), dy = gsap.quickTo(dot, "y", { duration: 0.08 });
    const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" }), ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
    addEventListener("mousemove", (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
    document.addEventListener("mouseover", (e) => {
      const lab = e.target.closest("[data-cursor]");
      const link = e.target.closest("a, button, label, .hl");
      cursor.classList.toggle("is-label", !!lab);
      cursor.classList.toggle("is-link", !lab && !!link);
      label.textContent = lab ? lab.dataset.cursor : "";
    });
    document.addEventListener("mouseleave", () => gsap.to(cursor, { opacity: 0, duration: 0.2 }));
    document.addEventListener("mouseenter", () => gsap.to(cursor, { opacity: 1, duration: 0.2 }));

    // calamita
    $$("[data-magnetic]").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      el.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
    });
  }

  // lettere del titolo che "rimbalzano" al passaggio
  $$(".hl").forEach((l) => {
    l.addEventListener("mouseenter", () => {
      gsap.fromTo(l, { scaleY: 0.7, scaleX: 1.25 }, { scaleX: 1, scaleY: 1, duration: 1, ease: "elastic.out(1.2, 0.3)", overwrite: "auto" });
    });
  });

  /* ---------------- HEADER + PROGRESS ---------------- */
  const header = $(".header");
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: (self) => {
      gsap.set(".progress i", { scaleX: self.progress });
      header.classList.toggle("is-hidden", self.direction === 1 && self.scroll() > window.innerHeight * 0.6 && !body.classList.contains("menu-open"));
    },
  });

  /* ---------------- MENU ---------------- */
  const menu = $(".menu"), burger = $(".burger");
  let menuTl = null;
  function openMenu() {
    body.classList.add("menu-open");
    burger.setAttribute("aria-expanded", "true");
    menu.setAttribute("aria-hidden", "false");
    lenis && lenis.stop();
    menuTl = gsap.timeline()
      .set(menu, { visibility: "visible" })
      .fromTo(menu, { clipPath: "circle(0% at calc(100% - 3rem) 2.5rem)" }, { clipPath: "circle(150% at calc(100% - 3rem) 2.5rem)", duration: 0.9, ease: "power3.inOut" })
      .from(".menu__links a span", { yPercent: 110, rotate: 6, duration: 0.8, stagger: 0.06, ease: "power4.out" }, 0.35)
      .from(".menu__side > *", { y: 20, opacity: 0, stagger: 0.08, duration: 0.6 }, 0.5);
  }
  function closeMenu() {
    if (!body.classList.contains("menu-open")) return;
    body.classList.remove("menu-open");
    burger.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-hidden", "true");
    lenis && lenis.start();
    gsap.to(menu, { clipPath: "circle(0% at calc(100% - 3rem) 2.5rem)", duration: 0.6, ease: "power3.inOut", onComplete: () => gsap.set(menu, { visibility: "hidden" }) });
  }
  burger.addEventListener("click", () => (body.classList.contains("menu-open") ? closeMenu() : openMenu()));
  addEventListener("keydown", (e) => e.key === "Escape" && closeMenu());

  // anteprima immagini nel menu
  const prev = $(".menu__preview"), prevImg = $(".menu__preview img");
  if (fine) {
    const px = gsap.quickTo(prev, "x", { duration: 0.6, ease: "power3" }), py = gsap.quickTo(prev, "y", { duration: 0.6, ease: "power3" });
    menu.addEventListener("mousemove", (e) => { px(e.clientX + 30); py(e.clientY - 150); });
    $$(".menu__links a").forEach((a) => {
      a.addEventListener("mouseenter", () => { prevImg.src = a.dataset.img; gsap.to(prev, { opacity: 1, scale: 1, rotate: gsap.utils.random(-8, 8), duration: 0.5, ease: "back.out(2)" }); });
      a.addEventListener("mouseleave", () => gsap.to(prev, { opacity: 0, scale: 0.4, duration: 0.3 }));
    });
  }

  /* ---------------- CAMBIO COLORE SEZIONI ---------------- */
  const themes = {
    cream: ["#f7f1e1", "#7f2a16"],
    leaf: ["#dce9cc", "#7f2a16"],
    brown: ["#7f2a16", "#f7f1e1"],
    olive: ["#b4c43a", "#4a1a0e"],
  };
  const setTheme = (name) => {
    const [bg, fg] = themes[name];
    gsap.to(root, { "--bg": bg, "--fg": fg, duration: 0.7, ease: "power2.out", overwrite: "auto" });
    cursor.classList.toggle("on-dark", name === "brown");
  };
  const themeTriggers = () => $$("[data-theme]").forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec, start: "top 55%", end: "bottom 55%",
      onToggle: (self) => self.isActive && setTheme(sec.dataset.theme),
    });
  });
  if (reduce) { themeTriggers(); return; }

  // da qui solo movimento

  /* ---------------- HERO: parallasse + finestra video ---------------- */
  const video = $(".hero__video");
  const heroTl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: ".hero", start: "top top", end: "bottom bottom", scrub: 1,
      onUpdate: (self) => {
        header.classList.toggle("on-dark", self.progress > 0.45 && self.progress < 0.995);
        cursor.classList.toggle("on-dark", self.progress > 0.45 && self.progress < 0.995);
        if (self.progress > 0.2 && video.paused) video.play().catch(() => {});
        if (self.progress <= 0.2 && !video.paused) video.pause();
      },
    },
  });
  heroTl
    .to(".hero__sky", { yPercent: 12 }, 0)
    .to(".hero__far", { yPercent: 6, scale: 1.08, transformOrigin: "50% 100%" }, 0)
    .to(".hero__mid", { yPercent: 14, scale: 1.25, transformOrigin: "50% 100%" }, 0)
    .to(".hero__title-wrap", { yPercent: -38, scale: 0.8, opacity: 0, duration: 0.45 }, 0)
    .to(".hero__near", { yPercent: 28, scale: 1.5, transformOrigin: "30% 100%" }, 0)
    .to(".hero__front", { yPercent: 45, scale: 2.2, transformOrigin: "50% 100%" }, 0)
    .to(".hero__scroll", { opacity: 0, duration: 0.1 }, 0)
    .fromTo(".hero__window", { "--wy": "46%", "--wx": "44%", "--wr": "40px", opacity: 0 }, { opacity: 1, duration: 0.06 }, 0.22)
    .to(".hero__window", { "--wy": "0%", "--wx": "0%", "--wr": "0px", duration: 0.5, ease: "power2.inOut" }, 0.24)
    .fromTo(".hero__video", { scale: 1.6 }, { scale: 1, duration: 0.6 }, 0.22)
    .fromTo(".hero__caption", { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.15 }, 0.72)
    .to({}, { duration: 0.12 });

  /* ---------------- TITOLI A LETTERE ---------------- */
  $$(".js-chars").forEach((el) => {
    gsap.from($$(".ch", el), {
      yPercent: 115, rotate: 12, duration: 1.1, ease: "power4.out", stagger: 0.03,
      scrollTrigger: { trigger: el, start: "top 85%" },
    });
  });
  $$(".eyebrow, .lead, .card__num").forEach((el) => {
    if (el.closest(".card, .stack__card, .zoom")) return;
    gsap.from(el, { y: 30, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } });
  });

  /* ---------------- MANIFESTO: parole che si accendono ---------------- */
  const words = $$(".manifesto__text .w");
  gsap.set(words, { opacity: 0.12 });
  gsap.to(words, {
    opacity: 1, ease: "none", stagger: 0.1,
    scrollTrigger: { trigger: ".manifesto__text", start: "top 75%", end: "bottom 45%", scrub: 1 },
  });
  $$(".manifesto .pill").forEach((p) => {
    gsap.from(p, { scale: 0, rotate: -20, duration: 0.8, ease: "back.out(2.5)", scrollTrigger: { trigger: p, start: "top 78%", toggleActions: "play none none reverse" } });
  });
  $$(".js-num").forEach((n) => {
    const to = +n.dataset.to, o = { v: 0 };
    gsap.to(o, {
      v: to, duration: 2, ease: "power2.out",
      scrollTrigger: { trigger: n, start: "top 88%" },
      onUpdate: () => (n.textContent = Math.round(o.v)),
    });
  });
  gsap.from(".stat", { y: 60, opacity: 0, stagger: 0.12, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".stats", start: "top 85%" } });

  /* ---------------- MARQUEE guidato dalla velocità ---------------- */
  $$(".band").forEach((band, i) => {
    const track = $(".band__track", band);
    track.innerHTML += track.innerHTML + track.innerHTML;
    const dir = i === 0 ? -1 : 1;
    let x = 0, boost = 0, sign = 1;
    const wrap = () => track.scrollWidth / 3;
    gsap.ticker.add((t, dt) => {
      const v = lenis ? lenis.velocity : 0;
      if (Math.abs(v) > 0.1) sign = v > 0 ? 1 : -1;
      boost += (Math.min(Math.abs(v), 60) - boost) * 0.1;
      x += dir * sign * (0.06 + boost * 0.012) * dt;
      const w = wrap();
      x = gsap.utils.wrap(-w, 0, x);
      gsap.set(track, { x });
    });
  });
  gsap.fromTo(".band--a", { rotate: -6 }, { rotate: -2, ease: "none", scrollTrigger: { trigger: ".bands", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.fromTo(".band--b", { rotate: 5 }, { rotate: 1.5, ease: "none", scrollTrigger: { trigger: ".bands", start: "top bottom", end: "bottom top", scrub: true } });

  /* ---------------- FATTORIA: scroll orizzontale ---------------- */
  const track = $(".farm__track");
  const dist = () => track.scrollWidth - window.innerWidth;
  const farmTween = gsap.to(track, {
    x: () => -dist(), ease: "none",
    scrollTrigger: {
      trigger: ".farm", pin: ".farm__pin", scrub: 1, start: "top top",
      end: () => "+=" + dist(), invalidateOnRefresh: true, anticipatePin: 1,
    },
  });
  gsap.to(".farm__path path", {
    strokeDashoffset: 0, ease: "none",
    scrollTrigger: { trigger: ".farm", start: "top top", end: () => "+=" + dist(), scrub: 1, invalidateOnRefresh: true },
  });
  gsap.to(".farm__ghost", {
    x: () => -dist() * 0.25, ease: "none",
    scrollTrigger: { trigger: ".farm", start: "top top", end: () => "+=" + dist(), scrub: 1, invalidateOnRefresh: true },
  });
  $$(".farm .card").forEach((card) => {
    const art = $$(".animal", card);
    gsap.from(art, {
      yPercent: 60, scale: 0.3, rotate: -20, opacity: 0, duration: 1, ease: "back.out(1.8)", stagger: 0.12,
      scrollTrigger: { trigger: card, containerAnimation: farmTween, start: "left 80%", toggleActions: "play none none reverse" },
    });
    gsap.fromTo(card, { rotate: 5, y: 40 }, {
      rotate: -2, y: -10, ease: "none",
      scrollTrigger: { trigger: card, containerAnimation: farmTween, start: "left right", end: "right left", scrub: true },
    });
  });
  $$(".farm .photo").forEach((ph) => {
    gsap.fromTo($("img", ph), { xPercent: -8 }, {
      xPercent: 8, ease: "none",
      scrollTrigger: { trigger: ph, containerAnimation: farmTween, start: "left right", end: "right left", scrub: true },
    });
    gsap.fromTo(ph, { "--ct": "100%" }, { "--ct": "0%", duration: 1.2, ease: "power4.out", scrollTrigger: { trigger: ph, containerAnimation: farmTween, start: "left 85%" } });
  });
  gsap.from(".farm__end > *", {
    y: 60, opacity: 0, stagger: 0.12, duration: 0.9, ease: "back.out(2)",
    scrollTrigger: { trigger: ".farm__end", containerAnimation: farmTween, start: "left 80%" },
  });

  /* ---------------- DIDATTICA: carte impilate ---------------- */
  const cards = $$(".stack__card");
  cards.forEach((c, i) => {
    const next = cards[i + 1];
    if (!next) return;
    gsap.to(c, {
      scale: 0.9 + i * 0.02, rotate: i % 2 ? 1.5 : -1.5, ease: "none",
      scrollTrigger: { trigger: next, start: "top bottom", end: "top 20%", scrub: true },
    });
  });
  cards.forEach((c) => {
    gsap.from($(".stack__photo", c), { scale: 1.3, ease: "none", scrollTrigger: { trigger: c, start: "top bottom", end: "top 20%", scrub: true } });
  });

  /* ---------------- SPUNTINI ---------------- */
  $$(".reveal-img").forEach((f) => {
    gsap.fromTo(f, { "--ct": "100%" }, { "--ct": "0%", duration: 1.4, ease: "power4.inOut", scrollTrigger: { trigger: f, start: "top 85%" } });
  });
  $$(".snacks [data-speed]").forEach((el) => {
    const s = parseFloat(el.dataset.speed);
    gsap.to(el, {
      y: () => -s * 120, ease: "none",
      scrollTrigger: { trigger: ".snacks__media", start: "top bottom", end: "bottom top", scrub: true },
    });
  });
  $$(".snacks__img img").forEach((img) => {
    gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: img.parentNode, start: "top bottom", end: "bottom top", scrub: true } });
  });
  $$(".sticker").forEach((s) => {
    gsap.from(s, {
      scale: 0, rotate: gsap.utils.random(-120, 120), duration: 1.1, ease: "elastic.out(1, 0.5)",
      scrollTrigger: { trigger: s, start: "top 92%", toggleActions: "play none none reverse" },
    });
    gsap.to(s, { rotate: gsap.utils.random(-25, 25), ease: "none", scrollTrigger: { trigger: ".snacks", start: "top bottom", end: "bottom top", scrub: true } });
    if (fine) {
      s.style.pointerEvents = "auto";
      s.addEventListener("mouseenter", () => gsap.fromTo(s, { scale: 1.25 }, { scale: 1, duration: 1, ease: "elastic.out(1.2, 0.3)" }));
    }
  });
  // badge che gira più veloce quando scorri
  const badge = $(".badge svg");
  let rot = 0;
  gsap.ticker.add((t, dt) => {
    const v = lenis ? Math.abs(lenis.velocity) : 0;
    rot += (0.012 + Math.min(v, 80) * 0.004) * dt;
    gsap.set(badge, { rotate: rot });
  });

  /* ---------------- ALLOGGIO: zoom ---------------- */
  const mmZoom = gsap.matchMedia();
  mmZoom.add({ desk: "(min-width: 701px)", mob: "(max-width: 700px)" }, (ctx) => {
    const { mob } = ctx.conditions;
    const scales = mob ? [2, 4, 4, 4, 4, 4, 4] : [4, 5, 6, 5, 6, 8, 9];
    const zt = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: ".zoom", start: "top top", end: "bottom bottom", scrub: 1 } });
    $$(".zoom__el").forEach((el, i) => zt.to(el, { scale: scales[i], duration: 1 }, 0));
    zt.to(".zoom__el:nth-child(1) .zoom__img img", { scale: 1.08, duration: 1 }, 0)
      .to(".zoom__over", { opacity: 1, duration: 0.3 }, 0.72)
      .from(".zoom__title", { yPercent: 40, duration: 0.3 }, 0.72);
    if (mob) zt.to(".zoom__el:nth-child(1) .zoom__img", { height: "50vh", duration: 1 }, 0);
  });

  const stayText = $(".js-lines");
  let stayAnim;
  const buildStay = () => {
    stayAnim && stayAnim.scrollTrigger && stayAnim.scrollTrigger.kill();
    stayAnim && stayAnim.kill();
    const lines = splitLines(stayText);
    stayAnim = gsap.from(lines, { yPercent: 110, duration: 1.1, ease: "power4.out", stagger: 0.08, scrollTrigger: { trigger: stayText, start: "top 82%" } });
  };
  document.fonts ? document.fonts.ready.then(buildStay) : buildStay();
  let rw;
  addEventListener("resize", () => { clearTimeout(rw); rw = setTimeout(() => { stayText.textContent = stayText.getAttribute("aria-label"); buildStay(); }, 250); });

  $$(".stay__ph").forEach((ph) => {
    gsap.from(ph, { y: 120, rotate: gsap.utils.random(-4, 4), opacity: 0, duration: 1.3, ease: "power4.out", scrollTrigger: { trigger: ph, start: "top 92%" } });
    gsap.fromTo($("img", ph), { yPercent: -20 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ph, start: "top bottom", end: "bottom top", scrub: true } });
  });

  /* ---------------- CHI SIAMO: polaroid a ventaglio ---------------- */
  const mmTeam = gsap.matchMedia();
  mmTeam.add("(min-width: 701px)", () => {
    const pol = $$(".polaroid");
    const xs = [-112, 0, 112], rs = [-7, 2, 6], ys = [30, -20, 40];
    gsap.set(pol, { xPercent: 0, rotate: (i) => [-6, 3, 9][i], y: 60 });
    gsap.to(pol, {
      xPercent: (i) => xs[i], rotate: (i) => rs[i], y: (i) => ys[i], ease: "power2.out",
      scrollTrigger: { trigger: ".team__deck", start: "top 85%", end: "center 55%", scrub: 1 },
    });
    pol.forEach((p, i) => {
      p.addEventListener("mouseenter", () => gsap.to(p, { rotate: 0, scale: 1.04, duration: 0.6, ease: "back.out(2)", overwrite: "auto" }));
      p.addEventListener("mouseleave", () => gsap.to(p, { rotate: rs[i], scale: 1, duration: 0.6, ease: "back.out(2)", overwrite: "auto" }));
    });
  });
  mmTeam.add("(max-width: 700px)", () => {
    $$(".polaroid").forEach((p, i) => gsap.from(p, { y: 100, rotate: i % 2 ? 8 : -8, opacity: 0, duration: 1.1, ease: "back.out(1.6)", scrollTrigger: { trigger: p, start: "top 90%" } }));
  });

  /* ---------------- CONTATTI ---------------- */
  gsap.to(".js-write", { "--cr": "0%", duration: 1.6, ease: "power2.inOut", scrollTrigger: { trigger: ".contact__title", start: "top 70%" } });
  gsap.from(".contact__list li", { x: -80, opacity: 0, duration: 1, stagger: 0.1, ease: "power4.out", scrollTrigger: { trigger: ".contact__list", start: "top 85%" } });
  gsap.from(".form", { y: 120, rotate: 6, opacity: 0, duration: 1.3, ease: "back.out(1.4)", scrollTrigger: { trigger: ".form", start: "top 90%" } });

  /* ---------------- FOOTER ---------------- */
  gsap.from(".footer__big span", {
    yPercent: 100, rotate: (i) => (i % 2 ? 10 : -10), ease: "back.out(1.6)", stagger: 0.04,
    scrollTrigger: { trigger: ".footer__big", start: "top bottom", end: "bottom bottom", scrub: 1 },
  });
  gsap.from(".footer__hills", { scaleY: 0.2, transformOrigin: "50% 100%", ease: "none", scrollTrigger: { trigger: ".footer", start: "top bottom", end: "top 50%", scrub: true } });

  // i cambi colore vanno creati dopo i pin, così le posizioni tengono conto dello spazio aggiunto
  themeTriggers();
  ScrollTrigger.sort();
  addEventListener("load", () => ScrollTrigger.refresh());
})();

/* ---------------- FORM → email / WhatsApp ---------------- */
(() => {
  const form = document.querySelector(".form");
  if (!form) return;
  let via = "mail";
  form.querySelectorAll("[data-via]").forEach((b) => b.addEventListener("click", () => (via = b.dataset.via)));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const nome = (d.get("nome") || "").trim();
    const rec = (d.get("recapito") || "").trim();
    const msg = (d.get("messaggio") || "").trim();
    const err = form.querySelector(".form__err");
    if (!nome || !rec || !msg) { err.textContent = "Compila nome, recapito e messaggio, grazie!"; return; }
    err.textContent = "";
    const topics = d.getAll("topic");
    const text = `Ciao! Sono ${nome}.` + (topics.length ? `\nMi interessa: ${topics.join(", ")}.` : "") + `\n\n${msg}\n\nRecapito: ${rec}`;
    if (via === "wa") {
      window.open("https://wa.me/393402680393?text=" + encodeURIComponent(text), "_blank", "noopener");
    } else {
      const subj = "Richiesta dal sito" + (topics.length ? " — " + topics.join(", ") : "");
      location.href = "mailto:info@ilbettone.com?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(text);
    }
  });
})();
