/* raumrent.de – Funktionen für alle Seiten
   1 Kopfzeile: Linie beim Scrollen
   2 Mobiles Menü
   3 Anfrage-Formular: bereitet eine E-Mail an raumrent vor (kein Server), Texte je nach Seitensprache (de/en)
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
    const T = {
      de: {
        pick: 'Bitte mindestens eine Containerart auswählen.',
        head: 'Anfrage über raumrent.de', interest: 'Interesse an', art: 'Mieten oder kaufen', message: 'Nachricht',
        firma: 'Firma', name: 'Name', strasse: 'Straße / Hausnr.', ort: 'PLZ / Ort', telefon: 'Telefon', email: 'E-Mail',
        subject: 'Anfrage', to: 'An', subj: 'Betreff', copied: 'Anfrage kopiert',
        select: 'Text markiert – mit Strg/Cmd + C kopieren',
      },
      en: {
        pick: 'Please select at least one container type.',
        head: 'Enquiry via raumrent.de (English page)', interest: 'Interested in', art: 'Rent or buy', message: 'Message',
        firma: 'Company', name: 'Name', strasse: 'Street / No.', ort: 'Postcode / Town', telefon: 'Phone', email: 'Email',
        subject: 'Enquiry', to: 'To', subj: 'Subject', copied: 'Enquiry copied',
        select: 'Text selected – copy with Ctrl/Cmd + C',
      },
    };
    const t = T[(document.documentElement.lang || 'de').slice(0, 2)] || T.de;
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
        error.textContent = t.pick;
        form.querySelector('input[name="interesse"]').focus();
        return;
      }
      if (!form.checkValidity()) { error.textContent = ''; form.reportValidity(); return; }
      error.textContent = '';

      const lines = [
        t.head,
        '',
        `${t.interest}: ${interests.join(', ')}`,
        `${t.art}: ${value('art') || '–'}`,
        '',
        `${t.message}:`,
        value('nachricht') || '–',
        '',
        `${t.firma}: ${value('firma') || '–'}`,
        `${t.name}: ${value('name')}`,
        `${t.strasse}: ${value('strasse') || '–'}`,
        `${t.ort}: ${value('ort') || '–'}`,
        `${t.telefon}: ${value('telefon')}`,
        `${t.email}: ${value('email')}`,
      ];
      const body = lines.join('\n');
      const subject = `${t.subject}: ${interests.join(', ')}`;
      const href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      if (preview) preview.textContent = `${t.to}: ${to}\n${t.subj}: ${subject}\n\n${body}`;
      if (fallback) fallback.hidden = false;
      window.location.href = href;
    });

    if (copyBtn && preview) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(preview.textContent);
          copyBtn.textContent = t.copied;
        } catch {
          const range = document.createRange();
          range.selectNodeContents(preview);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          copyBtn.textContent = t.select;
        }
      });
    }
  }

  // 4 Jahreszahl
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
