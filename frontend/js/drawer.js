let _currentLeadId = null;

function openDrawer(leadId) {
  _currentLeadId = leadId;
  const lead = getLeadById(leadId);
  if (!lead) return;

  const drawer = document.getElementById("lead-drawer");
  if (!drawer) return;

  // Populate fields
  _setVal("drawer-name", lead.name);
  _setVal("drawer-phone", lead.phone);
  _setVal("drawer-email", lead.email);
  _setVal("drawer-destination", lead.destination);
  _setVal("drawer-departure-date", lead.departure_date);
  _setVal("drawer-status", lead.status);
  _setCheck("drawer-baggage-required", lead.baggage_required);
  _setVal("drawer-baggage-details", lead.baggage_details);
  _setCheck("drawer-date-change-requested", lead.date_change_requested);
  _setVal("drawer-date-change-details", lead.date_change_details);

  // Clear note input
  const noteInput = document.getElementById("note-input");
  if (noteInput) noteInput.value = "";

  drawer.classList.add("drawer--open");
  loadTimeline(leadId);
}

function closeDrawer() {
  const drawer = document.getElementById("lead-drawer");
  if (drawer) drawer.classList.remove("drawer--open");
  _currentLeadId = null;
}

function _setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || "";
}

function _setCheck(id, value) {
  const el = document.getElementById(id);
  if (el) el.checked = !!value;
}

document.addEventListener("DOMContentLoaded", () => {
  // Close button
  const closeBtn = document.getElementById("drawer-close");
  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);

  // Save lead edits
  const editForm = document.getElementById("lead-edit-form");
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!_currentLeadId) return;
      const fd = new FormData(editForm);
      const data = Object.fromEntries(fd.entries());
      data.baggage_required = fd.has("baggage_required");
      data.date_change_requested = fd.has("date_change_requested");
      try {
        await API.updateLead(_currentLeadId, data);
        await loadLeads();
        await loadTimeline(_currentLeadId);
      } catch (e) {
        alert("Error saving: " + e.message);
      }
    });
  }

  // Quick action buttons
  document.querySelectorAll("[data-quick-action]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!_currentLeadId) return;
      const action = btn.dataset.quickAction;
      const statusMap = {
        contacted: "Contacted",
        "close-won": "Closed-Won",
        "close-lost": "Closed-Lost",
      };
      const newStatus = statusMap[action];
      if (!newStatus) return;
      try {
        await API.updateLead(_currentLeadId, { status: newStatus });
        await loadLeads();
        // Re-open drawer with fresh data
        openDrawer(_currentLeadId);
      } catch (e) {
        alert("Error: " + e.message);
      }
    });
  });

  // Add note button
  const addNoteBtn = document.getElementById("add-note-btn");
  if (addNoteBtn) {
    addNoteBtn.addEventListener("click", async () => {
      if (!_currentLeadId) return;
      const noteInput = document.getElementById("note-input");
      const content = noteInput ? noteInput.value.trim() : "";
      if (!content) return;
      try {
        await API.addTimelineEvent(_currentLeadId, "note", content);
        noteInput.value = "";
        await loadTimeline(_currentLeadId);
      } catch (e) {
        alert("Error adding note: " + e.message);
      }
    });
  }
});
