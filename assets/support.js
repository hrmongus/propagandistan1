// FanpageKit landing — placeholder behaviour pending import of the design's support.js
(function () {
  'use strict';

  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Monthly / yearly pricing toggle
  var billing = document.querySelector('.billing-toggle');
  if (billing) {
    var buttons = billing.querySelectorAll('button[data-period]');
    var amounts = document.querySelectorAll('.pricing-grid .amount');
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener('click', function () {
        var period = btn.getAttribute('data-period');
        Array.prototype.forEach.call(buttons, function (b) { b.classList.toggle('active', b === btn); });
        Array.prototype.forEach.call(amounts, function (el) {
          var value = el.getAttribute('data-' + period);
          if (value !== null) el.textContent = '€' + value;
        });
      });
    });
  }

  // Handle forms: keep the handle in sync between hero and CTA, and lightly sanitise it
  var inputs = document.querySelectorAll('input[name="handle"]');
  Array.prototype.forEach.call(inputs, function (input) {
    input.addEventListener('input', function () {
      var clean = input.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (clean !== input.value) input.value = clean;
      Array.prototype.forEach.call(inputs, function (other) {
        if (other !== input) other.value = clean;
      });
    });
  });

  // Footer year
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
