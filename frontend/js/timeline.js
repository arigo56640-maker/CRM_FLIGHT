async function loadTimeline(leadId) {
  try {
    const events = await API.getTimeline(leadId);
    renderTimeline(events);
  } catch (e) {
    console.error("Failed to load timeline:", e);
  }
}

function renderTimeline(events) {
  const feed = document.getElementById("timeline-feed");
  if (!feed) return;

  if (!events.length) {
    feed.innerHTML = '<p class="timeline-empty">No activity yet.</p>';
    return;
  }

  feed.innerHTML = events
    .map((ev) => {
      const typeClass = `timeline-event--${ev.type === "status_change" ? "status" : ev.type}`;
      const icon = ev.type === "bot" ? "🤖" : ev.type === "status_change" ? "🔄" : "📝";
      const time = new Date(ev.created_at).toLocaleString();
      return `
        <div class="timeline-event ${typeClass}">
          <span class="timeline-event__icon">${icon}</span>
          <div class="timeline-event__body">
            <p class="timeline-event__content">${escapeHtml(ev.content)}</p>
            <time class="timeline-event__time">${time}</time>
          </div>
        </div>`;
    })
    .join("");
}
