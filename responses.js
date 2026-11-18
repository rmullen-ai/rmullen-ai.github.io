// Paste the web app URL from your Google Apps Script deployment between the quotes.
// While it is empty, the forms run in practice mode: answers save on this device but are not sent.
const RESPONSES_URL = "https://script.google.com/macros/s/AKfycbzPMEtWwWtCAVeideyim9rbDoj1SD6ypq1aXEmexz6ZIMSzOgnByHGO7tMfQk3SVWXM/exec";

(() => {
  const PREFIX = "mads-responses:";
  const NAME_KEY = PREFIX + "my-name";
  const store = {
    get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } },
    remove(key) { try { localStorage.removeItem(key); } catch {} }
  };
  const now = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const fieldsOf = form => [...form.querySelectorAll("[name]")];
  const labelOf = el => el.dataset.label || el.labels?.[0]?.textContent.trim() || el.name;

  async function fillNames(form) {
    const selects = form.querySelectorAll("select[data-roster]");
    if (!selects.length) return true;
    try {
      const people = await window.madsRoster;
      selects.forEach(select => people.forEach(({ name }) => select.add(new Option(name, name))));
      return true;
    } catch {
      return false;
    }
  }

  async function init(form) {
    if (!form || form.dataset.ready) return;
    form.dataset.ready = "true";
    const key = PREFIX + form.dataset.responseForm;
    const status = form.querySelector(".save-status");
    const button = form.querySelector("button[type='submit']");
    const say = text => { status.textContent = text; };

    if (!(await fillNames(form))) say("Names couldn’t load. Try refreshing the page.");

    const saved = store.get(key);
    if (saved?.values) {
      fieldsOf(form).forEach(el => {
        if (el.type !== "hidden" && saved.values[el.name] != null) el.value = saved.values[el.name];
      });
      say("Your saved answers are back.");
    }
    const me = form.querySelector("select[name='participant']");
    const lastName = store.get(NAME_KEY);
    if (me && !me.value && lastName) me.value = lastName;

    let timer = null;
    const save = () => {
      clearTimeout(timer);
      timer = null;
      const values = {};
      fieldsOf(form).forEach(el => { values[el.name] = el.value; });
      if (store.set(key, { values })) {
        say(`Saved on this device at ${now()}.`);
      } else {
        say("This browser can’t save drafts. Copy your answers somewhere safe before you leave the page.");
      }
      if (me?.value) store.set(NAME_KEY, me.value);
    };
    form.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(save, 400); });
    form.addEventListener("change", save);
    window.addEventListener("pagehide", () => { if (timer) { clearTimeout(timer); save(); } });

    form.addEventListener("submit", async event => {
      event.preventDefault();
      clearTimeout(timer);
      save();
      if (!RESPONSES_URL) {
        say("Practice mode: this page isn’t connected to a spreadsheet yet, so nothing was sent. Your answers are still saved on this device.");
        return;
      }
      button.disabled = true;
      say("Sending…");
      const payload = {
        form: form.dataset.sheet,
        fields: fieldsOf(form).map(el => ({ label: labelOf(el), value: el.value.trim() }))
      };
      try {
        const response = await fetch(RESPONSES_URL, { method: "POST", body: JSON.stringify(payload) });
        const result = await response.json();
        if (!result.ok) throw new Error(result.error);
        store.remove(key);
        fieldsOf(form).forEach(el => { if (el.tagName === "TEXTAREA") el.value = ""; });
        say(`Sent at ${now()}. Thank you.`);
      } catch {
        say("Your answers didn’t send. They’re still saved on this device, so try Submit again in a moment.");
      } finally {
        button.disabled = false;
      }
    });
  }

  window.madsInitResponseForm = init;
  document.querySelectorAll("form[data-response-form]").forEach(init);
})();
