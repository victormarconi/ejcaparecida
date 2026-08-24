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
    if (topline && !topline.querySelector("h1")) {
      var eyebrow = topline.querySelector(".hero-eyebrow");
      var heading = document.createElement("h1");
      heading.textContent = "EJC Nossa Senhora Aparecida";
      if (eyebrow) eyebrow.insertAdjacentElement("afterend", heading);
      else topline.insertBefore(heading, topline.firstChild);
    }

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
        tabs.setAttribute("aria-label", "Escolha uma localizaÃƒÂ§ÃƒÂ£o");
        cards.forEach(function (card, index) {
          var title = card.querySelector("h3");
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

/* EJC_INLINE_PRODUCTION_POLISH_20260824D */
(function () {
  var s = document.createElement("style");
  s.setAttribute("data-ejc-production-polish", "1");
  s.textContent =
    '/* EJC production theme and public-layout correction — 2026-08-24 */\n\n/* Restore the public shell after legacy admin selectors leaked into generic elements. */\nhtml body main.site-shell {\n  background:\n    radial-gradient(\n      circle at 18% 14%,\n      color-mix(in srgb, var(--accent) 16%, transparent),\n      transparent 28%\n    ),\n    radial-gradient(\n      circle at 82% 20%,\n      color-mix(in srgb, var(--brand) 15%, transparent),\n      transparent 26%\n    ),\n    linear-gradient(\n      180deg,\n      var(--surface) 0%,\n      var(--paper) 46%,\n      var(--background) 46%,\n      var(--background) 100%\n    ) !important;\n}\n\nhtml[data-theme="dark"] body main.site-shell {\n  background:\n    radial-gradient(\n      circle at 18% 14%,\n      color-mix(in srgb, var(--accent) 18%, transparent),\n      transparent 28%\n    ),\n    radial-gradient(\n      circle at 82% 20%,\n      color-mix(in srgb, var(--brand) 14%, transparent),\n      transparent 26%\n    ),\n    linear-gradient(\n      180deg,\n      var(--background) 0%,\n      #0a2a45 48%,\n      var(--paper) 48%,\n      var(--paper) 100%\n    ) !important;\n}\n\n.topbar .brand-lockup,\n.form-shell .brand-lockup {\n  color: var(--brand-dark) !important;\n  margin: 0 !important;\n  min-height: auto !important;\n}\n\nhtml[data-theme="dark"] .topbar .brand-lockup,\nhtml[data-theme="dark"] .form-shell .brand-lockup {\n  color: var(--ink) !important;\n}\n\n/* Public event cards must never inherit the compact admin-row layout. */\n.site-shell .event-showcase .event-card {\n  display: flex !important;\n  flex: 0 1 390px !important;\n  flex-direction: column !important;\n  align-items: stretch !important;\n  gap: 0 !important;\n  min-height: 250px !important;\n  padding: 24px !important;\n  color: var(--ink) !important;\n  background: var(--surface-strong) !important;\n  border: 1px solid var(--line) !important;\n  border-radius: 16px !important;\n  box-shadow: var(--shadow) !important;\n}\n\n.site-shell .event-showcase .event-card::before {\n  content: "";\n  position: absolute;\n  inset: 0 auto 0 0;\n  width: 4px;\n  background: linear-gradient(180deg, var(--accent), var(--brand));\n}\n\n.site-shell .event-showcase .event-card .event-card-top {\n  width: 100%;\n}\n\n.site-shell .event-showcase .event-card h3 {\n  min-height: 0 !important;\n  margin: 22px 0 10px !important;\n  color: var(--ink) !important;\n  font-size: clamp(1.3rem, 2vw, 1.55rem) !important;\n  line-height: 1.25;\n}\n\n.site-shell .event-showcase .event-card p:empty {\n  display: none !important;\n}\n\n.site-shell .event-showcase .event-card strong {\n  margin-top: auto;\n  padding-top: 22px;\n  color: var(--brand-dark) !important;\n}\n\n/* Modern, consistent public surfaces. */\n.site-shell .notice-carousel,\n.site-shell .mission-card,\n.site-shell .team-card,\n.site-shell .instagram-link-card,\n.site-shell .location-card,\n.form-shell {\n  border-color: color-mix(in srgb, var(--line) 82%, transparent) !important;\n  border-radius: 16px !important;\n}\n\n.site-shell .notice-carousel,\n.site-shell .mission-card,\n.form-shell {\n  box-shadow: 0 22px 60px color-mix(in srgb, var(--brand) 17%, transparent) !important;\n}\n\nhtml[data-theme="dark"] .site-shell .notice-carousel,\nhtml[data-theme="dark"] .site-shell .mission-card,\nhtml[data-theme="dark"] .site-shell .team-card,\nhtml[data-theme="dark"] .site-shell .instagram-link-card,\nhtml[data-theme="dark"] .site-shell .location-card,\nhtml[data-theme="dark"] .form-shell {\n  color: var(--ink) !important;\n  background: var(--surface-strong) !important;\n  border-color: var(--line) !important;\n  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.26) !important;\n}\n\n.site-shell .tag {\n  color: var(--brand-dark) !important;\n  background: color-mix(\n    in srgb,\n    var(--brand) 12%,\n    var(--surface-strong)\n  ) !important;\n  border: 1px solid color-mix(in srgb, var(--brand) 25%, transparent);\n}\n\nhtml[data-theme="dark"] .site-shell .tag {\n  color: var(--ink) !important;\n  background: color-mix(\n    in srgb,\n    var(--brand) 20%,\n    var(--surface-strong)\n  ) !important;\n  border-color: color-mix(in srgb, var(--brand) 38%, transparent);\n}\n\n.site-shell .mission-card,\n.site-shell .instagram-link-card,\n.site-shell .location-card {\n  transition:\n    border-color 160ms ease,\n    box-shadow 160ms ease,\n    transform 160ms ease;\n}\n\n.site-shell .instagram-link-card:hover,\n.site-shell .location-card:hover {\n  transform: translateY(-2px);\n  border-color: color-mix(in srgb, var(--brand) 48%, var(--line)) !important;\n  box-shadow: 0 20px 48px color-mix(in srgb, var(--brand) 15%, transparent) !important;\n}\n\n.site-shell .team-card {\n  position: relative;\n  overflow: hidden;\n  padding: 0 !important;\n}\n\n.site-shell .team-card .team-photo {\n  border-radius: 15px !important;\n  transition: transform 240ms ease;\n}\n\n.site-shell .team-card:hover .team-photo {\n  transform: scale(1.025);\n}\n\n.site-shell .pix-box {\n  border-radius: 12px !important;\n}\n\n.site-shell .button,\n.form-shell .button,\n.site-shell .caption-link {\n  border-radius: 10px !important;\n}\n\n.site-shell .theme-toggle,\n.site-shell .login-link {\n  color: var(--brand-dark) !important;\n  background: var(--surface-strong) !important;\n}\n\nhtml[data-theme="dark"] .site-shell .theme-toggle,\nhtml[data-theme="dark"] .site-shell .login-link {\n  color: var(--ink) !important;\n  background: var(--surface) !important;\n}\n\n.site-shell :is(a, button, input, select, textarea):focus-visible,\n.form-shell :is(a, button, input, select, textarea):focus-visible {\n  outline: 3px solid color-mix(in srgb, var(--brand) 65%, white);\n  outline-offset: 3px;\n}\n\n/* Repair fixed light surfaces inside private/admin pages. */\nhtml[data-theme="dark"] .app-layout .finance-entry,\nhtml[data-theme="dark"] .app-layout .event-card,\nhtml[data-theme="dark"] .app-layout .event-item,\nhtml[data-theme="dark"] .app-layout .finance-item,\nhtml[data-theme="dark"] .app-layout .ledger-item,\nhtml[data-theme="dark"] .app-layout .compact-item,\nhtml[data-theme="dark"] .app-layout .admin-event-row,\nhtml[data-theme="dark"] .app-layout .statement-day,\nhtml[data-theme="dark"] .app-layout .statement-entry,\nhtml[data-theme="dark"] .app-layout .calendar-card,\nhtml[data-theme="dark"] .app-layout .panel,\nhtml[data-theme="dark"] .app-layout .card,\nhtml[data-theme="dark"] .app-layout .metric {\n  color: var(--ink) !important;\n  background: var(--surface-strong) !important;\n  border-color: var(--line) !important;\n}\n\nhtml[data-theme="dark"]\n  .app-layout\n  :is(\n    .finance-entry,\n    .event-card,\n    .event-item,\n    .finance-item,\n    .ledger-item,\n    .compact-item,\n    .admin-event-row,\n    .statement-entry\n  )\n  :is(strong, h2, h3, h4) {\n  color: var(--ink) !important;\n}\n\nhtml[data-theme="dark"]\n  .app-layout\n  :is(\n    .finance-entry,\n    .event-card,\n    .event-item,\n    .finance-item,\n    .ledger-item,\n    .compact-item,\n    .admin-event-row,\n    .statement-entry\n  )\n  p {\n  color: var(--muted) !important;\n}\n\nhtml[data-theme="dark"]\n  .app-layout\n  :is(\n    .field input,\n    .field textarea,\n    .field select,\n    .period-form input,\n    .button.secondary,\n    .inline-editor > summary,\n    .transaction-editor > summary\n  ) {\n  color: var(--ink) !important;\n  background: var(--surface) !important;\n  border-color: var(--line) !important;\n}\n\nhtml[data-theme="dark"] .app-layout .statement-entry-values {\n  color: var(--ink) !important;\n  background: color-mix(in srgb, var(--brand) 24%, var(--surface)) !important;\n  border-color: var(--line) !important;\n}\n\nhtml[data-theme="dark"] .app-layout .statement-entry-values :is(strong, small) {\n  color: var(--ink) !important;\n}\n\n.site-shell .team-card-caption {\n  position: absolute;\n  inset: auto 0 0;\n  display: grid;\n  gap: 3px;\n  padding: 48px 16px 16px;\n  color: #fff;\n  background: linear-gradient(180deg, transparent, rgba(3, 18, 31, 0.9));\n  pointer-events: none;\n}\n\n.site-shell .team-card-caption strong {\n  font-size: 1rem;\n}\n\n.site-shell .team-card-caption span {\n  color: rgba(255, 255, 255, 0.78);\n  font-size: 0.76rem;\n  font-weight: 800;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n}\n\n.site-shell .pix-copy-button {\n  width: fit-content;\n  min-height: 40px;\n  margin-top: 10px;\n  padding: 0 14px;\n  color: #061d32;\n  background: var(--accent);\n  border: 1px solid color-mix(in srgb, var(--accent) 68%, var(--ink));\n  border-radius: 10px;\n  cursor: pointer;\n  font-weight: 900;\n}\n\n.site-shell .pix-copy-button.is-copied {\n  color: #fff;\n  background: var(--green);\n  border-color: var(--green);\n}\n\n.site-shell .location-tabs {\n  display: flex;\n  justify-content: center;\n  gap: 8px;\n  margin: 0 auto 18px;\n  overflow-x: auto;\n  padding: 2px 2px 8px;\n}\n\n.site-shell .location-tab {\n  flex: 0 0 auto;\n  min-height: 42px;\n  padding: 0 14px;\n  color: var(--muted);\n  background: var(--surface-strong);\n  border: 1px solid var(--line);\n  border-radius: 10px;\n  cursor: pointer;\n  font-weight: 800;\n}\n\n.site-shell .location-tab.is-active {\n  color: #fff;\n  background: var(--brand);\n  border-color: var(--brand);\n}\n\n.site-shell .location-grid.location-tabs-ready {\n  display: block !important;\n  width: min(720px, 100%);\n  margin: 0 auto;\n}\n\n.site-shell .location-grid.location-tabs-ready .location-card {\n  min-height: 0;\n}\n\n.site-shell .location-grid.location-tabs-ready .location-card[hidden] {\n  display: none !important;\n}\n\n.site-shell .location-grid.location-tabs-ready .location-card iframe {\n  height: min(340px, 46vw);\n  min-height: 220px;\n}\n\n@media (max-width: 900px) {\n  .site-shell .topbar-inner {\n    align-items: stretch !important;\n  }\n\n  .site-shell .nav-links {\n    display: flex !important;\n    gap: 8px !important;\n    overflow-x: auto !important;\n    padding: 2px 0 8px !important;\n    scrollbar-width: thin;\n  }\n\n  .site-shell .nav-links a:not(.login-link) {\n    width: auto !important;\n    min-width: max-content !important;\n    height: 40px !important;\n    padding: 0 12px !important;\n    border-radius: 10px !important;\n  }\n\n  .site-shell .nav-links a span {\n    position: static !important;\n    width: auto !important;\n    height: auto !important;\n    overflow: visible !important;\n    clip: auto !important;\n  }\n\n  .site-shell .nav-links .theme-toggle,\n  .site-shell .nav-links .login-link {\n    flex: 0 0 40px !important;\n    width: 40px !important;\n    min-width: 40px !important;\n    height: 40px !important;\n  }\n\n  .site-shell .event-showcase .event-card {\n    flex-basis: 100% !important;\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .site-shell *,\n  .form-shell * {\n    scroll-behavior: auto !important;\n    transition-duration: 0.01ms !important;\n    animation-duration: 0.01ms !important;\n  }\n}\n';
  (document.head || document.documentElement).appendChild(s);
})();
