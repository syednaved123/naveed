/* Dublin Startup — landing page interactions */
(function () {
  "use strict";

  // Current year in footer
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /*
   * Waitlist / newsletter signup.
   *
   * Set FORM_ENDPOINT to your form backend to start collecting emails for real.
   * Easiest options (no server needed):
   *   - Formspree:   https://formspree.io        -> "https://formspree.io/f/XXXXXXX"
   *   - Buttondown:  https://buttondown.email     (newsletter-native)
   *   - ConvertKit / Beehiiv / MailerLite form action URL
   * Until it's set, submissions are stored locally so you can demo the flow.
   */
  var FORM_ENDPOINT = ""; // <-- TODO: paste your Formspree/newsletter endpoint here

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function markSuccess(form) {
    form.classList.add("is-success");
    if (!form.querySelector(".signup__success")) {
      var msg = document.createElement("p");
      msg.className = "signup__success";
      msg.textContent = "🎉 You're on the list — check your inbox.";
      form.appendChild(msg);
    }
  }

  function storeLocally(email) {
    try {
      var key = "dublinstartup.waitlist";
      var list = JSON.parse(localStorage.getItem(key) || "[]");
      if (list.indexOf(email) === -1) list.push(email);
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {
      /* storage unavailable — ignore */
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    var form = e.currentTarget;
    var input = form.querySelector('input[type="email"]');
    var email = (input && input.value || "").trim();

    if (!isValidEmail(email)) {
      if (input) {
        input.focus();
        input.style.borderColor = "#ff6b6b";
      }
      return;
    }

    storeLocally(email);

    if (FORM_ENDPOINT) {
      var btn = form.querySelector("button");
      if (btn) { btn.disabled = true; btn.textContent = "Joining…"; }
      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, source: "dublinstartup.ie" })
      })
        .then(function () { markSuccess(form); })
        .catch(function () { markSuccess(form); }); // fail soft — email already stored locally
    } else {
      markSuccess(form);
    }
  }

  var forms = document.querySelectorAll("[data-signup]");
  Array.prototype.forEach.call(forms, function (form) {
    form.addEventListener("submit", handleSubmit);
  });
})();
