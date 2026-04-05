let _leads = [];

async function loadLeads() {
  try {
    _leads = await API.getLeads();
    renderLeadsTable(_leads);
    updateCounters(_leads);
  } catch (e) {
    console.error("Failed to load leads:", e);
  }
}

function renderLeadsTable(leads) {
  const tbody = document.getElementById("leads-tbody");
  if (!tbody) return;

  tbody.innerHTML = leads
    .map((lead) => {
      const rowClass = lead.is_overdue
        ? "lead-row--overdue"
        : lead.is_stale
        ? "lead-row--stale"
        : lead.status === "New"
        ? "lead-row--new"
        : "";

      const lastContact = lead.last_contacted_at
        ? new Date(lead.last_contacted_at).toLocaleString()
        : "—";

      const departure = lead.departure_date
        ? new Date(lead.departure_date).toLocaleDateString()
        : "—";

      return `
        <tr class="lead-row ${rowClass}" data-id="${lead.id}" style="cursor:pointer">
          <td>${escapeHtml(lead.name)}</td>
          <td>${escapeHtml(lead.destination || "—")}</td>
          <td>${departure}</td>
          <td><span class="status-badge status--${lead.status.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}">${escapeHtml(lead.status)}</span></td>
          <td>${lastContact}</td>
          <td>
            <button class="btn btn--sm" onclick="event.stopPropagation(); openDrawer('${lead.id}')">View</button>
          </td>
        </tr>`;
    })
    .join("");

  // Row click also opens drawer
  tbody.querySelectorAll(".lead-row").forEach((row) => {
    row.addEventListener("click", () => openDrawer(row.dataset.id));
  });
}

function updateCounters(leads) {
  const newCount = leads.filter((l) => l.status === "New" && !l.is_overdue).length;
  const overdueCount = leads.filter((l) => l.is_overdue).length;
  const staleCount = leads.filter((l) => l.is_stale && !l.is_overdue).length;

  const el = (id) => document.getElementById(id);
  if (el("count-new")) el("count-new").textContent = newCount;
  if (el("count-overdue")) el("count-overdue").textContent = overdueCount;
  if (el("count-stale")) el("count-stale").textContent = staleCount;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getLeadById(id) {
  return _leads.find((l) => l.id === id) || null;
}

// Auto-refresh every 60 seconds
function startPolling() {
  setInterval(loadLeads, 60_000);
}

// Add Lead modal wiring
document.addEventListener("DOMContentLoaded", () => {
  loadLeads();
  startPolling();

  const addBtn = document.getElementById("add-lead-btn");
  const modal = document.getElementById("add-lead-modal");
  const cancelBtn = document.getElementById("modal-cancel");
  const form = document.getElementById("add-lead-form");

  if (addBtn) addBtn.addEventListener("click", () => modal.classList.remove("modal--hidden"));
  if (cancelBtn) cancelBtn.addEventListener("click", () => modal.classList.add("modal--hidden"));

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());
      // Convert checkboxes
      data.baggage_required = fd.has("baggage_required");
      data.date_change_requested = fd.has("date_change_requested");
      try {
        await API.createLead(data);
        form.reset();
        modal.classList.add("modal--hidden");
        await loadLeads();
      } catch (e) {
        alert("Error creating lead: " + e.message);
      }
    });
  }
});
