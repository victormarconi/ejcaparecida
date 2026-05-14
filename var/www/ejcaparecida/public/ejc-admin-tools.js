(function () {
  function ready(callback) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback, { once: true });
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
    if (confirm("Tem certeza que deseja excluir? Essa acao nao tem como voltar.")) {
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
      if (event.target && event.target.closest && event.target.closest("a[href]")) setOpen(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setOpen(false);
    });
  }

  function setupFinancePeriod() {
    var card = document.querySelector(".finance-filter-card");
    if (!card || card.dataset.periodReady === "1") return;
    card.dataset.periodReady = "1";
    var controls = card.querySelector(".quick-filters") || card.querySelector('[aria-label*="Atalhos"]');
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
      overlay.innerHTML = '<div class="ejc-calendar-day-card"><button type="button" class="ejc-calendar-day-close" aria-label="Fechar"></button><div class="ejc-calendar-day-content"></div></div>';
      overlay.querySelector(".ejc-calendar-day-close").addEventListener("click", function () {
        overlay.classList.remove("is-open");
      });
      document.body.appendChild(overlay);
    }
    var hasStructuredTitle = html.indexOf("calendar-detail-title") !== -1;
    overlay.querySelector(".ejc-calendar-day-content").innerHTML = (hasStructuredTitle ? "" : '<h2>' + cleanText(title) + '</h2>') + html;
    overlay.classList.add("is-open");
  }

  function setupCalendarModal() {
    if (!location.pathname.includes("/membros/calendario")) return;
    if (document.documentElement.dataset.calendarModalReady === "1") return;
    document.documentElement.dataset.calendarModalReady = "1";
    document.addEventListener("click", function (event) {
      var summary = event.target && event.target.closest && event.target.closest("details.calendar-real-day>summary, details.calendar-record-item>summary");
      if (!summary) return;
      var details = summary.parentElement;
      event.preventDefault();
      details.open = false;
      var title = cleanText(summary.textContent || "Evento");
      var source = details.querySelector(".calendar-day-details,.calendar-record-details");
      var html = source ? source.innerHTML : '<p>Sem detalhes.</p>';
      html = html.replace(/P.blico/g, "Publico").replace(/descri..o/gi, "descricao");
      openCalendarModal(title, html);
    }, true);
  }

  document.addEventListener("submit", confirmDelete, true);
  ready(function () {
    setupMenu();
    setupFinancePeriod();
    setupCalendarModal();
  });
  window.addEventListener("pageshow", function () {
    setupMenu();
    setupFinancePeriod();
    setupCalendarModal();
  });
})();
