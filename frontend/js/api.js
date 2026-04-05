const API = {
  async _request(method, path, body) {
    const opts = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch((window.BACKEND_URL || '') + path, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  },

  getLeads() {
    return this._request("GET", "/leads");
  },

  createLead(data) {
    return this._request("POST", "/leads", data);
  },

  updateLead(id, data) {
    return this._request("PATCH", `/leads/${id}`, data);
  },

  getTimeline(id) {
    return this._request("GET", `/leads/${id}/timeline`);
  },

  addTimelineEvent(id, type, content) {
    return this._request("POST", `/leads/${id}/timeline`, { type, content });
  },
};
