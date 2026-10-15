/* raumrent.de – Funktionen für alle Seiten
   1 Kopfzeile: Linie beim Scrollen
   2 Mobiles Menü
   3 Anfrage-Formular: bereitet eine E-Mail an raumrent vor (kein Server)
   4 Jahreszahl im Fuß */
(() => {
  'use strict';

  // 1 Kopfzeile
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.toggleAttribute('data-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // 2 Mobiles Menü
  const btn = document.querySelector('.menu-btn');
  const menu = document.getElementById('mnav');
  if (btn && menu) {
    const setOpen = (open) => {
      btn.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
      document.body.classList.toggle('menu-open', open);
    };
    btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { setOpen(false); btn.focus(); }
    });
    window.matchMedia('(min-width: 80em)').addEventListener('change', (mq) => { if (mq.matches) setOpen(false); });
  }

  // 3 Anfrage-Formular
  const form = document.getElementById('anfrage');
  if (form) {
    const to = form.dataset.to;
    const error = form.querySelector('.form__error');
    const fallback = document.getElementById('anfrage-fallback');
    const preview = fallback && fallback.querySelector('pre');
    const copyBtn = fallback && fallback.querySelector('[data-copy]');

    // Vorauswahl über ?interesse=buero|lager|sanitaer|anlagen
    const pre = new URLSearchParams(location.search).get('interesse');
    if (pre) {
      const box = form.querySelector(`input[name="interesse"][data-key="${pre}"]`);
      if (box) box.checked = true;
    }

    const value = (name) => (form.elements[name] && form.elements[name].value || '').trim();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const interests = [...form.querySelectorAll('input[name="interesse"]:checked')].map((i) => i.value);
      if (!interests.length) {
        error.textContent = 'Bitte mindestens eine Containerart auswählen.';
        form.querySelector('input[name="interesse"]').focus();
        return;
      }
      if (!form.checkValidity()) { error.textContent = ''; form.reportValidity(); return; }
      error.textContent = '';

      const lines = [
        'Anfrage über raumrent.de',
        '',
        'Interesse an: ' + interests.join(', '),
        'Mieten oder kaufen: ' + (value('art') || '–'),
        '',
        'Nachricht:',
        value('nachricht') || '–',
        '',
        'Firma: ' + (value('firma') || '–'),
        'Name: ' + value('name'),
        'Straße / Hausnr.: ' + (value('strasse') || '–'),
        'PLZ / Ort: ' + (value('ort') || '–'),
        'Telefon: ' + value('telefon'),
        'E-Mail: ' + value('email'),
      ];
      const body = lines.join('\n');
      const subject = 'Anfrage: ' + interests.join(', ');
      const href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      if (preview) preview.textContent = `An: ${to}\nBetreff: ${subject}\n\n${body}`;
      if (fallback) fallback.hidden = false;
      window.location.href = href;
    });

    if (copyBtn && preview) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(preview.textContent);
          copyBtn.textContent = 'Anfrage kopiert';
        } catch {
          const range = document.createRange();
          range.selectNodeContents(preview);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          copyBtn.textContent = 'Text markiert – mit Strg/Cmd + C kopieren';
        }
      });
    }
  }

  // 4 Jahreszahl
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
