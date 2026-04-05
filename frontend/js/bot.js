const BOT_TEMPLATES = {
  passport:
    "Could you please share your passport details? (Full name as per passport, passport number, and expiry date)",
  baggage:
    "Just confirming — will you need to check in any baggage? If yes, how many bags and approximate total weight?",
  "date-change":
    "We have some flexibility on the travel date. Would you like to explore alternative dates that might offer a better fare?",
};

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-bot]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.bot;
      const template = BOT_TEMPLATES[key];
      if (!template) return;
      const noteInput = document.getElementById("note-input");
      if (noteInput) {
        noteInput.value = template;
        noteInput.focus();
      }
    });
  });
});
