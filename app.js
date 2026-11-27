// Shared bits for the three pages: screen (index.html), guest (join.html), moderator (host.html).
// The screen is the bookkeeper: guests and the moderator send it events, it sends everyone the state.
window.LW = (() => {
  const BROKERS = {
    emqx: 'wss://broker.emqx.io:8084/mqtt',
    hivemq: 'wss://broker.hivemq.com:8884/mqtt',
  };
  const params = new URLSearchParams(location.search);
  const brokerKey = BROKERS[params.get('b')] ? params.get('b') : 'emqx';
  const PREFIX = 'djh-live/v1/';

  // Footer credit. Change once the studio has a name and a page.
  const MADE_BY = { text: 'Made by (Studio)', href: '#' };

  const PALETTE = [
    { c: '#e07a3f', n: 'Orange · 柿色' },
    { c: '#6d8340', n: 'Moos · 苔色' },
    { c: '#8a5a3b', n: 'Erde · 土色' },
    { c: '#ee9fb0', n: 'Sakura · 桜' },
    { c: '#3d5a8c', n: 'Indigo · 藍' },
    { c: '#f4d35e', n: 'Gelb · 山吹' },
    { c: '#fbf6ec', n: 'Weiß · 白' },
  ];

  function rid(n = 6) {
    const a = 'abcdefghjkmnpqrstuvwxyz23456789';
    let s = '';
    for (const x of crypto.getRandomValues(new Uint8Array(n))) s += a[x % a.length];
    return s;
  }

  function cid() {
    let c = localStorage.getItem('lw-cid');
    if (!c) { c = rid(10); localStorage.setItem('lw-cid', c); }
    return c;
  }

  function connect(onStatus) {
    const c = mqtt.connect(BROKERS[brokerKey], {
      clientId: 'lw_' + rid(10), clean: true, reconnectPeriod: 2000, connectTimeout: 8000, keepalive: 30,
    });
    const set = (s) => onStatus && onStatus(s);
    c.on('connect', () => set('on'));
    c.on('reconnect', () => set('wait'));
    c.on('offline', () => set('off'));
    c.on('close', () => set('off'));
    return c;
  }

  const topic = (room, sub) => PREFIX + room + '/' + sub;
  const send = (c, t, obj, opts = {}) => c.publish(t, JSON.stringify(obj), { qos: 1, ...opts });
  const parse = (buf) => { try { return JSON.parse(buf.toString()); } catch { return null; } };

  // Links the screen hands out keep the broker choice.
  function link(page, extra) {
    const u = new URL(page, location.href);
    for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v);
    if (brokerKey !== 'emqx') u.searchParams.set('b', brokerKey);
    return u.toString();
  }

  function qrSvg(text) {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: 8, margin: 0, scalable: true });
  }

  // ---- language (phone pages show one language, with a switch) ----
  const T = {
    de: {
      connecting: 'Verbinde …',
      offline: 'Keine Verbindung – versuche es weiter …',
      ask_ph: 'Deine Frage …',
      send: 'Senden',
      anon: 'Anonym. Niemand sieht, wer fragt.',
      thanks_review: 'Danke! Die Moderation schaut kurz drüber.',
      thanks_live: 'Danke! Deine Frage ist jetzt auf der Leinwand.',
      too_fast: 'Kurz warten …',
      list_head: 'Fragen der anderen',
      list_hint: 'Tippe auf „Ich auch“, wenn du das auch wissen willst.',
      empty: 'Noch keine Fragen. Sei die erste Person!',
      me_too: 'Ich auch',
      answered: 'beantwortet',
      hold_up: 'Halte dein Handy hoch!',
      no_room: 'Dieser Link ist unvollständig. Bitte den QR-Code noch einmal scannen.',
      // moderator
      tab_q: 'Fragen',
      tab_color: 'Farbe',
      review: 'Erst prüfen, dann zeigen',
      pending: 'Wartet auf dich',
      none_pending: 'Nichts zu prüfen.',
      shown: 'Auf der Leinwand',
      none_shown: 'Noch nichts auf der Leinwand.',
      hidden_head: 'Ausgeblendet',
      show: 'Zeigen',
      hide: 'Ausblenden',
      done: 'Beantwortet',
      undo: 'Zurück',
      title: 'Titel der Veranstaltung',
      save: 'Speichern',
      color_head: 'Alle Handys in einer Farbe',
      color_hint: 'Tippe eine Farbe – alle Handys im Raum wechseln sofort.',
      rainbow: 'Regenbogen',
      back_wall: 'Zurück zur Fragewand',
      samples: 'Beispielfragen einfügen',
      reset: 'Alle Fragen löschen',
      reset_confirm: 'Wirklich alle Fragen löschen?',
      phones: 'Handys verbunden',
      votes: 'Stimmen',
      mod_need_screen: 'Die Leinwand ist nicht offen. Öffne zuerst die Leinwand auf dem Laptop.',
    },
    ja: {
      connecting: '接続中…',
      offline: '接続できません。再接続しています…',
      ask_ph: '質問を書いてください…',
      send: '送信',
      anon: '匿名です。誰が質問したかは表示されません。',
      thanks_review: 'ありがとう！司会者が確認してから表示されます。',
      thanks_live: 'ありがとう！質問がスクリーンに表示されました。',
      too_fast: '少し待ってください…',
      list_head: 'みんなの質問',
      list_hint: '自分も聞きたい質問には「私も」を押してください。',
      empty: 'まだ質問はありません。最初の一人になろう！',
      me_too: '私も',
      answered: '回答済み',
      hold_up: 'スマホを高く掲げて！',
      no_room: 'リンクが不完全です。QRコードをもう一度読み取ってください。',
      tab_q: '質問',
      tab_color: '色',
      review: '確認してから表示',
      pending: '確認待ち',
      none_pending: '確認待ちはありません。',
      shown: 'スクリーンに表示中',
      none_shown: 'まだ何も表示されていません。',
      hidden_head: '非表示',
      show: '表示',
      hide: '非表示',
      done: '回答済み',
      undo: '戻す',
      title: 'イベント名',
      save: '保存',
      color_head: '全員のスマホを同じ色に',
      color_hint: '色を押すと、会場の全員のスマホが一斉に変わります。',
      rainbow: '虹',
      back_wall: '質問ボードに戻る',
      samples: 'サンプル質問を入れる',
      reset: '質問をすべて削除',
      reset_confirm: '本当にすべての質問を削除しますか？',
      phones: '台のスマホが接続中',
      votes: '票',
      mod_need_screen: 'スクリーンが開いていません。先にノートPCでスクリーンを開いてください。',
    },
  };

  let L = localStorage.getItem('lw-lang') || ((navigator.language || '').toLowerCase().startsWith('ja') ? 'ja' : 'de');
  const t = (k) => T[L][k] ?? k;

  // Fill [data-t] texts and [data-tph] placeholders, wire the DE / 日本語 switch.
  function applyLang(root = document) {
    document.documentElement.lang = L;
    root.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
    root.querySelectorAll('[data-tph]').forEach((el) => { el.placeholder = t(el.dataset.tph); });
    document.querySelectorAll('.lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === L));
  }
  function langSwitch(onChange) {
    document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => {
      L = b.dataset.lang;
      localStorage.setItem('lw-lang', L);
      applyLang();
      onChange && onChange();
    }));
    applyLang();
  }

  // Watercolour washes behind everything (hand-made look, matches the house's brush logo colours).
  function wash() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'wash');
    svg.setAttribute('viewBox', '0 0 1000 1000');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.innerHTML = `
      <defs>
        <filter id="wc" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="7" result="n"/>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="90"/>
          <feGaussianBlur stdDeviation="6"/>
        </filter>
      </defs>
      <g filter="url(#wc)">
        <ellipse cx="120" cy="140" rx="230" ry="150" fill="#e07a3f" opacity=".16"/>
        <ellipse cx="900" cy="860" rx="260" ry="170" fill="#6d8340" opacity=".15"/>
        <ellipse cx="860" cy="120" rx="150" ry="110" fill="#ee9fb0" opacity=".14"/>
        <ellipse cx="160" cy="900" rx="170" ry="120" fill="#8a5a3b" opacity=".10"/>
      </g>`;
    document.body.prepend(svg);
  }

  function madeBy(el) {
    if (!el) return;
    const a = document.createElement('a');
    a.href = MADE_BY.href;
    a.textContent = MADE_BY.text;
    a.target = '_blank';
    a.rel = 'noopener';
    el.replaceChildren(a);
  }

  // Re-order keyed children with a short slide (FLIP), so rising questions visibly move up.
  function keyedRender(list, items, make, update) {
    const before = new Map();
    for (const el of list.children) before.set(el.dataset.id, el.getBoundingClientRect().top);
    const keep = new Set(items.map((x) => x.id));
    for (const el of [...list.children]) if (!keep.has(el.dataset.id)) el.remove();
    const els = items.map((it) => {
      let el = list.querySelector(`[data-id="${CSS.escape(it.id)}"]`);
      if (!el) { el = make(it); el.dataset.id = it.id; el.classList.add('enter'); }
      update(el, it);
      return el;
    });
    els.forEach((el) => list.appendChild(el));
    for (const el of els) {
      const was = before.get(el.dataset.id);
      if (was === undefined) continue;
      const dy = was - el.getBoundingClientRect().top;
      if (Math.abs(dy) < 1) continue;
      el.style.transition = 'none';
      el.style.transform = `translateY(${dy}px)`;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1)';
        el.style.transform = '';
      }));
    }
  }

  // "Deutsch · 日本語" titles: one language per line, never break inside a word.
  function setTitle(el, text) {
    el.replaceChildren(...String(text).split(/\s+·\s+/).map((part) => {
      const s = document.createElement('span');
      s.className = 'tline';
      s.textContent = part;
      return s;
    }));
  }

  // White text on dark colours, ink on light ones.
  function inkFor(hex) {
    const n = parseInt(String(hex).replace('#', ''), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    return 0.299 * r + 0.587 * g + 0.114 * b > 165 ? '#3b2a20' : '#ffffff';
  }

  return {
    setTitle, inkFor,
    params, brokerKey, PALETTE, rid, cid, connect, topic, send, parse, link, qrSvg,
    t, applyLang, langSwitch, get lang() { return L; }, wash, madeBy, keyedRender,
  };
})();
