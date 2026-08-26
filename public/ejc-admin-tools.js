(function () {
  function ready(callback) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    else callback();
  }

  function confirmDelete(event) {
    var form = event.target;
    if (!form || form.dataset.confirmedDelete === "1") return;
    var button = event.submitter;
    var text = ((button && button.textContent) || "").trim().toLowerCase();
    var input = form.querySelector('input[name="intent"][value="delete"]');
    if (!input && text !== "excluir") return;
    event.preventDefault();
    if (
      confirm("Tem certeza que deseja excluir? Essa acao nao tem como voltar.")
    ) {
      form.dataset.confirmedDelete = "1";
      if (form.requestSubmit && button) form.requestSubmit(button);
      else form.submit();
    }
  }

  function setupMenu() {
    var sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;
    var existing = sidebar.querySelector(".ejc-menu-toggle");
    if (sidebar.dataset.menuReady === "1" && existing) return;
    var brand = sidebar.querySelector(".brand-lockup");
    if (!brand) return;
    var button = existing || document.createElement("button");
    if (!existing) {
      button.type = "button";
      button.className = "ejc-menu-toggle";
      button.setAttribute("aria-expanded", "false");
      button.textContent = "Menu";
      brand.insertAdjacentElement("afterend", button);
    }
    sidebar.dataset.menuReady = "1";
    function setOpen(open) {
      sidebar.classList.toggle("sidebar-open", open);
      button.setAttribute("aria-expanded", open ? "true" : "false");
      button.textContent = open ? "Fechar" : "Menu";
    }
    button.addEventListener("click", function () {
      setOpen(!sidebar.classList.contains("sidebar-open"));
    });
    sidebar.addEventListener("click", function (event) {
      if (
        event.target &&
        event.target.closest &&
        event.target.closest("a[href]")
      )
        setOpen(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setOpen(false);
    });
  }

  function setupFinancePeriod() {
    var card = document.querySelector(".finance-filter-card");
    if (!card || card.dataset.periodReady === "1") return;
    card.dataset.periodReady = "1";
    var controls =
      card.querySelector(".quick-filters") ||
      card.querySelector('[aria-label*="Atalhos"]');
    var form = card.querySelector(".period-form");
    if (!controls || !form) return;
    form.classList.add("ejc-period-custom-form");
    var button = document.createElement("button");
    button.type = "button";
    button.className = "button secondary ejc-custom-period-button";
    button.textContent = "Personalizado";
    button.addEventListener("click", function () {
      card.classList.toggle("period-open");
    });
    controls.appendChild(button);
  }

  function cleanText(value) {
    return String(value || "")
      .replace(/P.blico/g, "Publico")
      .replace(/descri..o/gi, "descricao")
      .replace(/Calend.rio/g, "Calendario")
      .trim();
  }

  function openCalendarModal(title, html) {
    var overlay = document.querySelector(".ejc-calendar-day-modal");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "ejc-calendar-day-modal";
      overlay.innerHTML =
        '<div class="ejc-calendar-day-card"><button type="button" class="ejc-calendar-day-close" aria-label="Fechar"></button><div class="ejc-calendar-day-content"></div></div>';
      overlay
        .querySelector(".ejc-calendar-day-close")
        .addEventListener("click", function () {
          overlay.classList.remove("is-open");
        });
      document.body.appendChild(overlay);
    }
    var hasStructuredTitle = html.indexOf("calendar-detail-title") !== -1;
    overlay.querySelector(".ejc-calendar-day-content").innerHTML =
      (hasStructuredTitle ? "" : "<h2>" + cleanText(title) + "</h2>") + html;
    overlay.classList.add("is-open");
  }

  function setupCalendarModal() {
    if (!location.pathname.includes("/membros/calendario")) return;
    if (document.documentElement.dataset.calendarModalReady === "1") return;
    document.documentElement.dataset.calendarModalReady = "1";
    document.addEventListener(
      "click",
      function (event) {
        var summary =
          event.target &&
          event.target.closest &&
          event.target.closest(
            "details.calendar-real-day>summary, details.calendar-record-item>summary",
          );
        if (!summary) return;
        var details = summary.parentElement;
        event.preventDefault();
        details.open = false;
        var title = cleanText(summary.textContent || "Evento");
        var source = details.querySelector(
          ".calendar-day-details,.calendar-record-details",
        );
        var html = source ? source.innerHTML : "<p>Sem detalhes.</p>";
        html = html
          .replace(/P.blico/g, "Publico")
          .replace(/descri..o/gi, "descricao");
        openCalendarModal(title, html);
      },
      true,
    );
  }

  function setupPublicLanding() {
    if (location.pathname !== "/" || !document.querySelector("main.site-shell"))
      return;

    var topline = document.querySelector(".carousel-topline");
    if (topline) {
      var eyebrow = topline.querySelector(".hero-eyebrow");
      if (eyebrow) eyebrow.textContent = "EJC Aparecida";
      var heading = topline.querySelector("h1");
      if (!heading) {
        heading = document.createElement("h1");
        if (eyebrow) eyebrow.insertAdjacentElement("afterend", heading);
        else topline.insertBefore(heading, topline.firstChild);
      }
      heading.textContent = "Encontro de Jovens com Cristo";
      var description = topline.querySelector("p");
      if (description)
        description.textContent =
          "Fé, amizade e serviço na Paróquia Nossa Senhora Aparecida, no Valentina.";
    }

    var heroContainer = document.querySelector(".hero > .container");
    if (heroContainer) heroContainer.classList.add("public-hero-layout");

    document.querySelectorAll(".team-card.image-only").forEach(function (card) {
      if (card.querySelector(".team-card-caption")) return;
      var image = card.querySelector(".team-photo");
      if (!image) return;
      var label = String(image.getAttribute("alt") || "")
        .replace(/^Equipe dirigente\s*-\s*/i, "")
        .trim();
      if (!label) return;
      var caption = document.createElement("div");
      caption.className = "team-card-caption";
      caption.innerHTML =
        '<strong class="team-card-name"></strong><span>Equipe dirigente</span>';
      caption.querySelector(".team-card-name").textContent = label;
      card.appendChild(caption);
    });

    var pix = document.querySelector(".pix-box");
    if (pix && !pix.querySelector(".pix-copy-button")) {
      var key = pix.querySelector("strong");
      if (key) {
        var copy = document.createElement("button");
        copy.type = "button";
        copy.className = "pix-copy-button";
        copy.textContent = "Copiar chave PIX";
        copy.addEventListener("click", function () {
          if (!navigator.clipboard || !window.isSecureContext) return;
          navigator.clipboard
            .writeText(key.textContent.trim())
            .then(function () {
              copy.textContent = "Chave copiada";
              copy.classList.add("is-copied");
              window.setTimeout(function () {
                copy.textContent = "Copiar chave PIX";
                copy.classList.remove("is-copied");
              }, 2200);
            })
            .catch(function () {});
        });
        pix.appendChild(copy);
      }
    }

    var grid = document.querySelector(".location-grid");
    if (grid && grid.dataset.tabsReady !== "1") {
      var cards = Array.prototype.slice.call(
        grid.querySelectorAll(":scope > .location-card"),
      );
      if (cards.length > 1) {
        grid.dataset.tabsReady = "1";
        grid.classList.add("location-tabs-ready");
        var tabs = document.createElement("div");
        tabs.className = "location-tabs";
        tabs.setAttribute("role", "tablist");
        tabs.setAttribute("aria-label", "Escolha uma localização");
        var coordinates = [
          "-7.1989285,-34.8501989",
          "-7.1970228,-34.8601213",
          "-7.1925773,-34.8514029",
          "-7.1945149,-34.8483804",
        ];
        cards.forEach(function (card, index) {
          var title = card.querySelector("h3");
          var iframe = card.querySelector("iframe");
          if (iframe && coordinates[index]) {
            iframe.src =
              "https://www.google.com/maps?q=" +
              encodeURIComponent(coordinates[index]) +
              "&z=18&output=embed";
          }
          var locationText = card.querySelector("p");
          if (locationText) {
            locationText.textContent =
              index === 0
                ? "Valentina — João Pessoa/PB"
                : "Comunidade do Valentina — João Pessoa/PB";
            locationText.classList.add("location-address");
          }
          var mapsLink = card.querySelector("a.button");
          if (mapsLink) mapsLink.textContent = "Ver rota no Google Maps";
          var tab = document.createElement("button");
          var panelId = "location-panel-" + (index + 1);
          var tabId = "location-tab-" + (index + 1);
          tab.type = "button";
          tab.id = tabId;
          tab.className = "location-tab" + (index === 0 ? " is-active" : "");
          tab.setAttribute("role", "tab");
          tab.setAttribute("aria-selected", index === 0 ? "true" : "false");
          tab.setAttribute("aria-controls", panelId);
          tab.textContent = title
            ? title.textContent.trim()
            : "Local " + (index + 1);
          card.id = panelId;
          card.setAttribute("role", "tabpanel");
          card.setAttribute("aria-labelledby", tabId);
          card.hidden = index !== 0;
          tab.addEventListener("click", function () {
            cards.forEach(function (item, itemIndex) {
              item.hidden = itemIndex !== index;
            });
            tabs
              .querySelectorAll(".location-tab")
              .forEach(function (item, itemIndex) {
                var active = itemIndex === index;
                item.classList.toggle("is-active", active);
                item.setAttribute("aria-selected", active ? "true" : "false");
              });
          });
          tabs.appendChild(tab);
        });
        grid.insertAdjacentElement("beforebegin", tabs);
      }
    }
  }

  document.addEventListener("submit", confirmDelete, true);
  ready(function () {
    setupPublicLanding();
    setupMenu();
    setupFinancePeriod();
    setupCalendarModal();
  });
  window.addEventListener("pageshow", function () {
    setupPublicLanding();
    setupMenu();
    setupFinancePeriod();
    setupCalendarModal();
  });
})();

/* EJC_INLINE_PRODUCTION_POLISH_20260824E */
(function () {
  var s = document.createElement("style");
  s.setAttribute("data-ejc-production-polish", "2");
  s.textContent =
    '/* EJC public visual refinement — 2026-08-24 v2 */\n:root {\n  --accent-text: #89620a;\n  --public-radius-sm: 12px;\n  --public-radius: 18px;\n  --public-radius-lg: 24px;\n  --public-shadow: 0 16px 48px rgba(6, 43, 73, 0.11);\n}\n\n:root[data-theme="dark"] {\n  --accent-text: #f1cb68;\n  --public-shadow: 0 18px 54px rgba(0, 0, 0, 0.28);\n}\n\nhtml body main.site-shell {\n  background:\n    radial-gradient(circle at 12% 7%, rgba(213, 165, 51, 0.15), transparent 25rem),\n    radial-gradient(circle at 88% 15%, rgba(21, 92, 138, 0.13), transparent 28rem),\n    var(--paper) !important;\n}\n\nhtml[data-theme="dark"] body main.site-shell {\n  background:\n    radial-gradient(circle at 12% 7%, rgba(226, 184, 79, 0.13), transparent 25rem),\n    radial-gradient(circle at 88% 15%, rgba(99, 179, 216, 0.12), transparent 28rem),\n    var(--paper) !important;\n}\n\n.site-shell .topbar {\n  border-bottom-color: color-mix(in srgb, var(--line) 75%, transparent) !important;\n  box-shadow: 0 8px 24px rgba(6, 43, 73, 0.05);\n}\n\n.site-shell .topbar-inner {\n  min-height: 76px;\n}\n\n.site-shell .brand-lockup {\n  color: var(--brand-dark) !important;\n  margin: 0 !important;\n  font-size: 0.93rem;\n}\n\nhtml[data-theme="dark"] .site-shell .brand-lockup {\n  color: var(--ink) !important;\n}\n\n.site-shell .nav-links a {\n  border-radius: 10px;\n  padding: 8px 4px;\n  transition: color 160ms ease, background 160ms ease;\n}\n\n.site-shell .nav-links a:hover {\n  color: var(--brand-dark);\n  background: color-mix(in srgb, var(--brand) 9%, transparent);\n}\n\n.site-shell .hero {\n  padding: 56px 0 44px;\n}\n\n.site-shell .public-hero-layout {\n  display: grid;\n  grid-template-columns: minmax(250px, 0.76fr) minmax(360px, 1.24fr);\n  align-items: center;\n  gap: clamp(32px, 6vw, 76px);\n}\n\n.site-shell .carousel-topline {\n  width: auto;\n  margin: 0;\n  text-align: left;\n}\n\n.site-shell .carousel-topline h1 {\n  max-width: 620px;\n  margin: 12px 0 18px;\n  color: var(--ink);\n  font-size: clamp(2.6rem, 5.3vw, 5rem);\n  line-height: 0.98;\n  letter-spacing: -0.055em;\n}\n\n.site-shell .carousel-topline p {\n  max-width: 530px;\n  margin: 0;\n  color: var(--muted);\n  font-size: clamp(1rem, 1.4vw, 1.12rem);\n  line-height: 1.7;\n}\n\n.site-shell .eyebrow {\n  color: var(--accent-text) !important;\n  letter-spacing: 0.075em;\n}\n\n.site-shell .notice-carousel {\n  justify-self: end;\n  width: min(100%, 560px);\n  padding: 0;\n  border: 1px solid var(--line) !important;\n  border-radius: var(--public-radius-lg) !important;\n  box-shadow: var(--public-shadow) !important;\n  overflow: hidden;\n}\n\n.site-shell .carousel-stage {\n  width: 100%;\n  border: 0;\n  border-radius: 0;\n}\n\n.site-shell .carousel-art {\n  aspect-ratio: 16 / 11;\n  min-height: 300px;\n}\n\n.site-shell .carousel-caption {\n  padding: 20px 22px 22px;\n}\n\n.site-shell .carousel-caption strong {\n  font-size: 1.18rem;\n}\n\n.site-shell .carousel-thumbs {\n  grid-column: 1 / -1;\n  width: min(760px, 100%);\n  margin: 26px auto 0;\n}\n\n.site-shell .thumb {\n  border-radius: var(--public-radius-sm);\n}\n\n.site-shell .mission-strip {\n  padding: 24px 0 68px;\n}\n\n.site-shell .mission-card {\n  padding: clamp(24px, 4vw, 38px);\n  border: 1px solid var(--line) !important;\n  border-radius: var(--public-radius-lg) !important;\n  box-shadow: var(--public-shadow) !important;\n}\n\n.site-shell .mission-card h2,\n.site-shell .section-title h2 {\n  color: var(--ink);\n  font-size: clamp(1.7rem, 3vw, 2.45rem);\n  letter-spacing: -0.035em;\n}\n\n.site-shell .pix-box {\n  min-width: min(410px, 100%);\n  padding: 20px;\n  border-radius: var(--public-radius) !important;\n}\n\n.site-shell .pix-copy-button {\n  width: 100%;\n  min-height: 44px;\n  margin-top: 12px;\n  color: #061d32;\n  background: var(--accent);\n  border: 0;\n  border-radius: var(--public-radius-sm);\n  cursor: pointer;\n  font-weight: 900;\n}\n\n.site-shell .section {\n  padding: 82px 0;\n}\n\n.site-shell .section-title {\n  margin-bottom: 34px;\n}\n\n.site-shell .section-title p {\n  font-size: 1rem;\n}\n\n.site-shell .event-showcase {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  max-width: 920px;\n}\n\n.site-shell .event-showcase .event-card {\n  display: flex !important;\n  flex-direction: column !important;\n  min-height: 230px !important;\n  padding: 26px !important;\n  color: var(--ink) !important;\n  background: var(--surface-strong) !important;\n  border: 1px solid var(--line) !important;\n  border-radius: var(--public-radius) !important;\n  box-shadow: var(--public-shadow) !important;\n}\n\n.site-shell .event-showcase .event-card::before {\n  width: 5px;\n  background: linear-gradient(180deg, var(--accent), var(--brand));\n}\n\n.site-shell .event-showcase .event-card h3 {\n  min-height: 0 !important;\n  margin: 24px 0 8px !important;\n  color: var(--ink) !important;\n  font-size: 1.38rem !important;\n  line-height: 1.3;\n}\n\n.site-shell .event-showcase .event-card p:empty {\n  display: none !important;\n}\n\n.site-shell .event-showcase .event-card strong {\n  margin-top: auto;\n  padding-top: 22px;\n  color: var(--muted) !important;\n}\n\n.site-shell .tag {\n  color: var(--brand-dark) !important;\n  background: color-mix(in srgb, var(--brand) 10%, var(--surface-strong)) !important;\n  border: 1px solid color-mix(in srgb, var(--brand) 20%, var(--line));\n}\n\nhtml[data-theme="dark"] .site-shell .tag {\n  color: var(--ink) !important;\n  background: color-mix(in srgb, var(--brand) 18%, var(--surface-strong)) !important;\n}\n\n.site-shell .team-grid {\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 20px;\n}\n\n.site-shell .team-card {\n  position: relative;\n  overflow: hidden;\n  padding: 0 !important;\n  border: 1px solid var(--line) !important;\n  border-radius: var(--public-radius) !important;\n  box-shadow: var(--public-shadow) !important;\n}\n\n.site-shell .team-photo {\n  aspect-ratio: 4 / 4.75;\n  border-radius: 0 !important;\n  transition: transform 240ms ease;\n}\n\n.site-shell .team-card:hover .team-photo {\n  transform: scale(1.025);\n}\n\n.site-shell .team-card-caption {\n  position: absolute;\n  inset: auto 0 0;\n  display: grid;\n  gap: 3px;\n  padding: 58px 18px 18px;\n  color: #fff;\n  background: linear-gradient(180deg, transparent, rgba(3, 18, 31, 0.92));\n  pointer-events: none;\n}\n\n.site-shell .team-card-caption strong {\n  font-size: 1.04rem;\n}\n\n.site-shell .team-card-caption span {\n  color: #f3ce72;\n  font-size: 0.72rem;\n  font-weight: 900;\n  letter-spacing: 0.06em;\n  text-transform: uppercase;\n}\n\n.site-shell .instagram-links {\n  gap: 20px;\n}\n\n.site-shell .instagram-link-card {\n  min-height: 112px;\n  padding: 24px;\n  border: 1px solid var(--line) !important;\n  border-radius: var(--public-radius) !important;\n  box-shadow: var(--public-shadow) !important;\n}\n\n.site-shell .location-tabs {\n  display: flex;\n  justify-content: center;\n  gap: 8px;\n  margin: 0 auto 22px;\n  overflow-x: auto;\n  padding: 4px;\n  background: color-mix(in srgb, var(--surface) 78%, transparent);\n  border: 1px solid var(--line);\n  border-radius: 16px;\n  width: fit-content;\n  max-width: 100%;\n}\n\n.site-shell .location-tab {\n  flex: 0 0 auto;\n  min-height: 44px;\n  padding: 0 16px;\n  color: var(--muted);\n  background: transparent;\n  border: 0;\n  border-radius: 12px;\n  cursor: pointer;\n  font-weight: 800;\n}\n\n.site-shell .location-tab.is-active {\n  color: #fff;\n  background: var(--brand);\n  box-shadow: 0 8px 22px color-mix(in srgb, var(--brand) 25%, transparent);\n}\n\n.site-shell .location-grid.location-tabs-ready {\n  display: block !important;\n  width: min(820px, 100%);\n  margin: 0 auto;\n}\n\n.site-shell .location-grid.location-tabs-ready .location-card[hidden] {\n  display: none !important;\n}\n\n.site-shell .location-card {\n  min-height: 0;\n  padding: 24px;\n  border: 1px solid var(--line) !important;\n  border-radius: var(--public-radius-lg) !important;\n  box-shadow: var(--public-shadow) !important;\n}\n\n.site-shell .location-card h3 {\n  margin: 12px 0 6px;\n  font-size: 1.55rem;\n}\n\n.site-shell .location-address {\n  margin-bottom: 8px !important;\n}\n\n.site-shell .location-card iframe {\n  height: min(390px, 52vw) !important;\n  min-height: 250px;\n  border-radius: 14px;\n}\n\n.site-shell .location-card .button {\n  width: 100%;\n  border-radius: var(--public-radius-sm) !important;\n}\n\n.site-shell :is(a, button, input, select, textarea):focus-visible,\n.form-shell :is(a, button, input, select, textarea):focus-visible {\n  outline: 3px solid color-mix(in srgb, var(--brand) 65%, white);\n  outline-offset: 3px;\n}\n\nhtml[data-theme="dark"] .site-shell :is(.notice-carousel, .mission-card, .event-card, .team-card, .instagram-link-card, .location-card),\nhtml[data-theme="dark"] .form-shell {\n  color: var(--ink) !important;\n  background: var(--surface-strong) !important;\n  border-color: var(--line) !important;\n}\n\n/* Preserve and repair dashboard dark surfaces without changing its structure. */\nhtml[data-theme="dark"] .app-layout :is(.finance-entry, .event-card, .event-item, .finance-item, .ledger-item, .compact-item, .admin-event-row, .statement-day, .statement-entry, .calendar-card, .panel, .card, .metric) {\n  color: var(--ink) !important;\n  background: var(--surface-strong) !important;\n  border-color: var(--line) !important;\n}\n\nhtml[data-theme="dark"] .app-layout :is(.field input, .field textarea, .field select, .period-form input, .button.secondary, .inline-editor > summary, .transaction-editor > summary) {\n  color: var(--ink) !important;\n  background: var(--surface) !important;\n  border-color: var(--line) !important;\n}\n\n@media (max-width: 900px) {\n  .site-shell .topbar-inner {\n    align-items: stretch !important;\n  }\n\n  .site-shell .nav-links {\n    display: flex !important;\n    gap: 8px !important;\n    overflow-x: auto !important;\n    padding: 4px 0 9px !important;\n    scrollbar-width: thin;\n  }\n\n  .site-shell .nav-links a:not(.login-link) {\n    width: auto !important;\n    min-width: max-content !important;\n    height: 40px !important;\n    padding: 0 12px !important;\n    border: 1px solid var(--line);\n    border-radius: 10px !important;\n  }\n\n  .site-shell .nav-links a span {\n    position: static !important;\n    width: auto !important;\n    height: auto !important;\n    overflow: visible !important;\n    clip: auto !important;\n  }\n\n  .site-shell .nav-links .theme-toggle,\n  .site-shell .nav-links .login-link {\n    flex: 0 0 40px !important;\n    width: 40px !important;\n    min-width: 40px !important;\n    height: 40px !important;\n  }\n\n  .site-shell .public-hero-layout {\n    grid-template-columns: 1fr;\n    gap: 30px;\n  }\n\n  .site-shell .carousel-topline {\n    text-align: center;\n  }\n\n  .site-shell .carousel-topline p {\n    margin: 0 auto;\n  }\n\n  .site-shell .notice-carousel {\n    justify-self: center;\n  }\n\n  .site-shell .carousel-art {\n    min-height: 240px;\n  }\n\n  .site-shell .carousel-thumbs,\n  .site-shell .event-showcase {\n    grid-template-columns: 1fr;\n  }\n\n  .site-shell .mission-card {\n    gap: 24px;\n  }\n\n  .site-shell .pix-box {\n    min-width: 0;\n  }\n\n  .site-shell .location-tabs {\n    justify-content: flex-start;\n    width: 100%;\n  }\n\n  .site-shell .location-card iframe {\n    height: 300px !important;\n  }\n}\n\n@media (max-width: 620px) {\n  .site-shell .hero {\n    padding-top: 38px;\n  }\n\n  .site-shell .carousel-topline h1 {\n    font-size: clamp(2.45rem, 13vw, 3.55rem);\n  }\n\n  .site-shell .section {\n    padding: 64px 0;\n  }\n\n  .site-shell .team-grid {\n    display: flex;\n    gap: 14px;\n  }\n\n  .site-shell .team-card {\n    flex-basis: min(78vw, 310px);\n  }\n\n  .site-shell .location-card {\n    padding: 16px;\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .site-shell *,\n  .form-shell * {\n    scroll-behavior: auto !important;\n    transition-duration: 0.01ms !important;\n    animation-duration: 0.01ms !important;\n  }\n}\n';
  (document.head || document.documentElement).appendChild(s);
})();
