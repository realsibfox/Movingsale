/* Moving sale site — reads items from a published Google Sheet (CSV). */
(function () {
  'use strict';

  var CFG = window.SALE_CONFIG || {};
  var main = document.getElementById('main');

  /* ───────────── Text in both languages ───────────── */
  var I18N = {
    en: {
      skip: 'Skip to content',
      loading: 'Loading items…',
      loadError: 'Sorry, the items could not be loaded. Please try again in a minute.',
      retry: 'Try again',
      sampleNote: 'Preview with sample items.',
      howItWorks: 'How it works',
      meetAreas: 'Meet-up areas',
      meetNote: 'We agree on the exact place and time over WhatsApp.',
      payment: 'Payment',
      until: 'Sale ends',
      contactWa: 'Message me on WhatsApp',
      interested: "I'm interested — WhatsApp",
      search: 'Search items',
      searchPh: 'Search…',
      category: 'Category',
      all: 'All',
      price: 'Price',
      min: 'Min',
      max: 'Max',
      sort: 'Sort by',
      newest: 'Newest',
      priceAsc: 'Price: low to high',
      priceDesc: 'Price: high to low',
      clear: 'Clear filters',
      count: function (n) { return n === 1 ? '1 item' : n + ' items'; },
      none: 'No items match these filters.',
      sold: 'Sold',
      free: 'Free',
      noPrice: 'Ask',
      back: '← Back to all items',
      share: 'Share',
      copied: 'Link copied',
      soldNote: 'This item has been sold.',
      notFound: 'This item is no longer listed.',
      photo: function (i, n) { return 'Photo ' + i + ' of ' + n; },
      prev: 'Previous photo',
      next: 'Next photo',
      noPhoto: 'No photo yet',
      waGeneral: 'Hi! I saw your moving sale.',
      waItem: function (title, price, url) {
        return 'Hi! I\'m interested in "' + title + '" (' + price + '). Is it still available?\n' + url;
      },
      footer: 'Prices and availability may change.',
    },
    es: {
      skip: 'Ir al contenido',
      loading: 'Cargando artículos…',
      loadError: 'No se pudieron cargar los artículos. Intenta de nuevo en un minuto.',
      retry: 'Reintentar',
      sampleNote: 'Vista previa con artículos de ejemplo.',
      howItWorks: 'Cómo funciona',
      meetAreas: 'Zonas de entrega',
      meetNote: 'Acordamos el lugar y la hora exactos por WhatsApp.',
      payment: 'Pago',
      until: 'La venta termina',
      contactWa: 'Escríbeme por WhatsApp',
      interested: 'Me interesa — WhatsApp',
      search: 'Buscar artículos',
      searchPh: 'Buscar…',
      category: 'Categoría',
      all: 'Todo',
      price: 'Precio',
      min: 'Mín.',
      max: 'Máx.',
      sort: 'Ordenar por',
      newest: 'Más recientes',
      priceAsc: 'Precio: menor a mayor',
      priceDesc: 'Precio: mayor a menor',
      clear: 'Quitar filtros',
      count: function (n) { return n === 1 ? '1 artículo' : n + ' artículos'; },
      none: 'Ningún artículo coincide con estos filtros.',
      sold: 'Vendido',
      free: 'Gratis',
      noPrice: 'Preguntar',
      back: '← Ver todos los artículos',
      share: 'Compartir',
      copied: 'Enlace copiado',
      soldNote: 'Este artículo ya se vendió.',
      notFound: 'Este artículo ya no está publicado.',
      photo: function (i, n) { return 'Foto ' + i + ' de ' + n; },
      prev: 'Foto anterior',
      next: 'Foto siguiente',
      noPhoto: 'Sin foto todavía',
      waGeneral: '¡Hola! Vi tu venta por mudanza.',
      waItem: function (title, price, url) {
        return '¡Hola! Me interesa "' + title + '" (' + price + '). ¿Todavía está disponible?\n' + url;
      },
      footer: 'Los precios y la disponibilidad pueden cambiar.',
    },
  };

  // Spanish (Mexico) names for common categories. Others are shown as written.
  var CATEGORY_ES = {
    'furniture': 'Muebles',
    'kitchen': 'Cocina',
    'clothing': 'Ropa',
    'clothes': 'Ropa',
    'home & linens': 'Hogar y blancos',
    'home and linens': 'Hogar y blancos',
    'domestics': 'Hogar y blancos',
    'linens': 'Blancos',
    'home': 'Hogar',
    'electronics': 'Electrónica',
    'appliances': 'Electrodomésticos',
    'decor': 'Decoración',
    'books': 'Libros',
    'toys': 'Juguetes',
    'kids': 'Niños',
    'tools': 'Herramientas',
    'sports': 'Deportes',
    'shoes': 'Zapatos',
    'bathroom': 'Baño',
    'office': 'Oficina',
    'garden': 'Jardín',
    'other': 'Otros',
  };

  /* ───────────── State ───────────── */
  var state = {
    lang: initialLang(),
    items: [],
    loaded: false,
    error: false,
    sample: !CFG.sheetCsvUrl,
    q: '',
    cat: 'all',
    min: '',
    max: '',
    sort: 'newest',
    listScroll: 0,
  };

  function initialLang() {
    var p = new URLSearchParams(location.search).get('lang');
    if (p === 'en' || p === 'es') return p;
    try {
      var s = localStorage.getItem('lang');
      if (s === 'en' || s === 'es') return s;
    } catch (e) { /* storage blocked */ }
    return (navigator.language || '').toLowerCase().indexOf('es') === 0 ? 'es' : 'en';
  }

  function t(key) {
    var v = I18N[state.lang][key];
    return v === undefined ? I18N.en[key] : v;
  }
  function L(obj) { // pick language from a {en, es} config object
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[state.lang] || obj.en || '';
  }

  /* ───────────── Helpers ───────────── */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  }
  function hash(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  function parseCSV(text) {
    var rows = [], row = [], field = '', inQ = false;
    text = text.replace(/^﻿/, '');
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQ) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false;
        } else field += c;
      } else if (c === '"') inQ = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c !== '\r') field += c;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  // Column headers the site recognises (compared without spaces/accents/case).
  var FIELDS = {
    timestamp: ['timestamp', 'marcatemporal'],
    title: ['title', 'titleen', 'name', 'item', 'titulo'],
    description: ['description', 'descriptionen', 'desc', 'descripcion'],
    price: ['price', 'precio'],
    category: ['category', 'categoria'],
    photos: ['photos', 'photo', 'images', 'pictures', 'fotos'],
    status: ['status', 'estado', 'sold'],
    titleEs: ['titlees', 'titlespanish', 'spanishtitle'],
    descEs: ['descriptiones', 'descriptionspanish', 'spanishdescription'],
    titleEsFix: ['titleesfix', 'fixtitlees'],
    descEsFix: ['descriptionesfix', 'fixdescriptiones'],
  };

  function rowsToItems(rows) {
    if (!rows.length) return [];
    var idx = {};
    rows[0].forEach(function (h, i) {
      var n = norm(h);
      Object.keys(FIELDS).forEach(function (k) {
        if (idx[k] === undefined && FIELDS[k].indexOf(n) !== -1) idx[k] = i;
      });
    });
    function get(r, k) { return idx[k] === undefined ? '' : String(r[idx[k]] || '').trim(); }

    var seen = {}, items = [];
    rows.slice(1).forEach(function (r, i) {
      var title = get(r, 'title');
      if (!title) return;
      var status = get(r, 'status').toLowerCase();
      if (/hide|hidden|ocult/.test(status)) return;

      var rawPrice = get(r, 'price');
      var num = parseFloat(rawPrice.replace(/[^0-9.]/g, ''));
      var ts = get(r, 'timestamp');
      var tsNum = Date.parse(ts);

      var id = hash(ts + '|' + title);
      while (seen[id]) id = hash(id + 'x');
      seen[id] = true;

      var es = (get(r, 'titleEsFix') || get(r, 'titleEs'));
      var esDesc = (get(r, 'descEsFix') || get(r, 'descEs'));
      // GOOGLETRANSLATE shows "#N/A" or "Loading..." while it works — ignore those.
      if (/^#|^loading/i.test(es)) es = '';
      if (/^#|^loading/i.test(esDesc)) esDesc = '';

      items.push({
        id: id,
        row: i,
        ts: isNaN(tsNum) ? 0 : tsNum,
        title: { en: title, es: es || title },
        desc: { en: get(r, 'description'), es: esDesc || get(r, 'description') },
        price: isNaN(num) ? null : num,
        category: get(r, 'category') || 'Other',
        photos: get(r, 'photos').split(/[\s,]+/).filter(function (u) { return /^https?:\/\//.test(u); }),
        sold: /sold|vendid/.test(status),
      });
    });
    return items;
  }

  function driveId(url) {
    var m = url.match(/[?&]id=([\w-]{10,})/) || url.match(/\/d\/([\w-]{10,})/);
    return m ? m[1] : null;
  }
  function imgUrl(url, width) {
    var id = driveId(url);
    return id ? 'https://drive.google.com/thumbnail?id=' + id + '&sz=w' + width : url;
  }

  function catLabel(cat) {
    if (state.lang !== 'es') return cat;
    return CATEGORY_ES[cat.toLowerCase().trim()] || cat;
  }
  function priceLabel(p) {
    if (p === null) return t('noPrice');
    if (p === 0) return t('free');
    var locale = state.lang === 'es' ? 'es-MX' : 'en-US';
    return (CFG.currencySymbol || '$') + p.toLocaleString(locale, { maximumFractionDigits: 2 });
  }

  function itemUrl(item) {
    return location.origin + location.pathname + '#/item/' + item.id;
  }
  function waLink(item) {
    var num = String(CFG.whatsappNumber || '').replace(/\D/g, '');
    var msg = item
      ? t('waItem')(item.title[state.lang], priceLabel(item.price), itemUrl(item))
      : t('waGeneral');
    return 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg);
  }

  var WA_ICON = '<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3c.2-.6.2-1.1.2-1.3l-.6-.3Z"/></svg>';

  var PH_ICON = '<svg aria-hidden="true" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-8 8"/></svg>';
  function placeholder() {
    return '<div class="ph" role="img" aria-label="' + esc(t('noPhoto')) + '">' + PH_ICON + '</div>';
  }

  /* ───────────── Shared "How it works" block ───────────── */
  function saleInfo(compact) {
    var areas = (CFG.meetAreas || []).map(L).filter(Boolean);
    var parts = [];
    if (areas.length) {
      parts.push('<li><strong>' + esc(t('meetAreas')) + ':</strong> ' + esc(areas.join(' · ')) +
        '<br><span class="muted">' + esc(t('meetNote')) + '</span></li>');
    }
    if (CFG.payment) parts.push('<li><strong>' + esc(t('payment')) + ':</strong> ' + esc(L(CFG.payment)) + '</li>');
    if (CFG.endDate) {
      var d = new Date(CFG.endDate + 'T12:00:00');
      var ds = isNaN(d) ? CFG.endDate : d.toLocaleDateString(state.lang === 'es' ? 'es-MX' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
      parts.push('<li><strong>' + esc(t('until')) + ':</strong> ' + esc(ds) + '</li>');
    }
    (CFG.extraRules || []).forEach(function (r) { var s = L(r); if (s) parts.push('<li>' + esc(s) + '</li>'); });

    return '<section class="info' + (compact ? ' info-compact' : '') + '" aria-labelledby="info-h-' + (compact ? 'c' : 'd') + '">' +
      '<h2 id="info-h-' + (compact ? 'c' : 'd') + '">' + esc(t('howItWorks')) + '</h2>' +
      '<ul>' + parts.join('') + '</ul>' +
      (compact ? '<a class="btn btn-wa" href="' + esc(waLink(null)) + '" target="_blank" rel="noopener">' + WA_ICON + esc(t('contactWa')) + '</a>' : '') +
      '</section>';
  }

  /* ───────────── List view ───────────── */
  function categories() {
    var counts = {};
    state.items.forEach(function (it) { counts[it.category] = (counts[it.category] || 0) + 1; });
    var order = (CFG.categoryOrder || []).map(function (c) { return c.toLowerCase(); });
    return Object.keys(counts).sort(function (a, b) {
      var ia = order.indexOf(a.toLowerCase()), ib = order.indexOf(b.toLowerCase());
      if (ia === -1) ia = 999;
      if (ib === -1) ib = 999;
      return ia - ib || a.localeCompare(b);
    }).map(function (c) { return { name: c, count: counts[c] }; });
  }

  function filtered() {
    var q = norm(state.q);
    var min = parseFloat(state.min), max = parseFloat(state.max);
    var list = state.items.filter(function (it) {
      if (state.cat !== 'all' && it.category !== state.cat) return false;
      if (!isNaN(min) && (it.price === null || it.price < min)) return false;
      if (!isNaN(max) && (it.price === null || it.price > max)) return false;
      if (q) {
        var hay = norm(it.title.en + it.title.es + it.desc.en + it.desc.es + it.category + catLabel(it.category));
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    list.sort(function (a, b) {
      if (a.sold !== b.sold) return a.sold ? 1 : -1; // sold items last
      if (state.sort === 'priceAsc') return (a.price === null ? Infinity : a.price) - (b.price === null ? Infinity : b.price);
      if (state.sort === 'priceDesc') return (b.price === null ? -1 : b.price) - (a.price === null ? -1 : a.price);
      return (b.ts - a.ts) || (b.row - a.row);
    });
    return list;
  }

  function card(it) {
    var img = it.photos.length
      ? '<img src="' + esc(imgUrl(it.photos[0], 600)) + '" alt="" loading="lazy" decoding="async">'
      : placeholder();
    return '<li class="card' + (it.sold ? ' is-sold' : '') + '">' +
      '<a href="#/item/' + it.id + '">' +
      '<div class="card-img">' + img + (it.sold ? '<span class="badge-sold">' + esc(t('sold')) + '</span>' : '') + '</div>' +
      '<div class="card-body">' +
      '<span class="card-title">' + esc(it.title[state.lang]) + '</span>' +
      '<span class="card-price">' + (it.sold ? '<span class="visually-hidden">' + esc(t('sold')) + ', </span>' : '') + esc(priceLabel(it.price)) + '</span>' +
      '<span class="card-cat">' + esc(catLabel(it.category)) + '</span>' +
      '</div></a></li>';
  }

  function renderList() {
    document.title = L(CFG.title) || 'Moving Sale';
    var cats = categories();
    var chips = '<button type="button" class="chip" data-cat="all" aria-pressed="' + (state.cat === 'all') + '">' +
      esc(t('all')) + ' <span class="chip-n">' + state.items.length + '</span></button>' +
      cats.map(function (c) {
        return '<button type="button" class="chip" data-cat="' + esc(c.name) + '" aria-pressed="' + (state.cat === c.name) + '">' +
          esc(catLabel(c.name)) + ' <span class="chip-n">' + c.count + '</span></button>';
      }).join('');

    main.innerHTML =
      '<h1 class="page-title" tabindex="-1">' + esc(L(CFG.title)) + '</h1>' +
      (L(CFG.intro) ? '<p class="intro">' + esc(L(CFG.intro)) + '</p>' : '') +
      (state.sample ? '<p class="sample-note">' + esc(t('sampleNote')) + '</p>' : '') +
      saleInfo(true) +
      '<section class="filters" aria-label="' + esc(t('search')) + '">' +
      '<label class="visually-hidden" for="q">' + esc(t('search')) + '</label>' +
      '<input id="q" type="search" placeholder="' + esc(t('searchPh')) + '" value="' + esc(state.q) + '" autocomplete="off">' +
      '<div class="chips" role="group" aria-label="' + esc(t('category')) + '">' + chips + '</div>' +
      '<div class="row">' +
      '<fieldset class="price"><legend>' + esc(t('price')) + '</legend>' +
      '<label><span class="visually-hidden">' + esc(t('price')) + ' </span>' + esc(t('min')) +
      '<input id="min" type="number" inputmode="numeric" min="0" value="' + esc(state.min) + '"></label>' +
      '<label><span class="visually-hidden">' + esc(t('price')) + ' </span>' + esc(t('max')) +
      '<input id="max" type="number" inputmode="numeric" min="0" value="' + esc(state.max) + '"></label>' +
      '</fieldset>' +
      '<label class="sort">' + esc(t('sort')) +
      '<select id="sort">' +
      ['newest', 'priceAsc', 'priceDesc'].map(function (s) {
        return '<option value="' + s + '"' + (state.sort === s ? ' selected' : '') + '>' + esc(t(s)) + '</option>';
      }).join('') +
      '</select></label>' +
      '</div>' +
      '</section>' +
      '<div class="results-bar"><p id="count" aria-live="polite"></p>' +
      '<button type="button" id="clear" class="link-btn">' + esc(t('clear')) + '</button></div>' +
      '<ul class="grid" id="grid"></ul>';

    updateGrid();

    main.querySelector('#q').addEventListener('input', function (e) { state.q = e.target.value; updateGrid(); });
    main.querySelector('#min').addEventListener('input', function (e) { state.min = e.target.value; updateGrid(); });
    main.querySelector('#max').addEventListener('input', function (e) { state.max = e.target.value; updateGrid(); });
    main.querySelector('#sort').addEventListener('change', function (e) { state.sort = e.target.value; updateGrid(); });
    main.querySelector('.chips').addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      state.cat = b.getAttribute('data-cat');
      main.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c === b)); });
      updateGrid();
    });
    main.querySelector('#clear').addEventListener('click', function () {
      state.q = ''; state.cat = 'all'; state.min = ''; state.max = ''; state.sort = 'newest';
      renderList();
    });
  }

  function updateGrid() {
    var list = filtered();
    var grid = main.querySelector('#grid');
    grid.innerHTML = list.length ? list.map(card).join('') : '<li class="empty">' + esc(t('none')) + '</li>';
    main.querySelector('#count').textContent = t('count')(list.length);
    var active = state.q || state.cat !== 'all' || state.min || state.max || state.sort !== 'newest';
    main.querySelector('#clear').hidden = !active;
    grid.querySelectorAll('img').forEach(function (img) {
      img.addEventListener('error', function () {
        img.outerHTML = placeholder();
      }, { once: true });
    });
  }

  /* ───────────── Item view ───────────── */
  function renderItem(id) {
    var it = state.items.filter(function (x) { return x.id === id; })[0];
    if (!it) {
      main.innerHTML = '<p><a href="#/">' + esc(t('back')) + '</a></p><h1 class="page-title" tabindex="-1">' + esc(t('notFound')) + '</h1>';
      return;
    }
    document.title = it.title[state.lang] + ' — ' + (L(CFG.title) || 'Moving Sale');
    var n = it.photos.length;
    var gallery = n
      ? '<div class="gallery" role="region" aria-roledescription="carousel" aria-label="' + esc(it.title[state.lang]) + '">' +
        '<div class="slides" tabindex="0">' +
        it.photos.map(function (p, i) {
          return '<a class="slide" href="' + esc(imgUrl(p, 2000)) + '" target="_blank" rel="noopener">' +
            '<img src="' + esc(imgUrl(p, 1200)) + '" alt="' + esc(it.title[state.lang] + ' — ' + t('photo')(i + 1, n)) + '"' + (i ? ' loading="lazy"' : '') + '></a>';
        }).join('') +
        '</div>' +
        (n > 1 ? '<button type="button" class="nav prev" aria-label="' + esc(t('prev')) + '">‹</button>' +
          '<button type="button" class="nav next" aria-label="' + esc(t('next')) + '">›</button>' +
          '<p class="counter" aria-live="polite">' + esc(t('photo')(1, n)) + '</p>' : '') +
        (it.sold ? '<span class="badge-sold big">' + esc(t('sold')) + '</span>' : '') +
        '</div>'
      : '<div class="gallery">' + placeholder() + (it.sold ? '<span class="badge-sold big">' + esc(t('sold')) + '</span>' : '') + '</div>';

    main.innerHTML =
      '<p class="back"><a href="#/">' + esc(t('back')) + '</a></p>' +
      '<article class="item' + (it.sold ? ' is-sold' : '') + '">' +
      gallery +
      '<div class="item-body">' +
      '<p class="item-cat">' + esc(catLabel(it.category)) + '</p>' +
      '<h1 class="page-title" tabindex="-1">' + esc(it.title[state.lang]) + '</h1>' +
      '<p class="item-price">' + esc(priceLabel(it.price)) + (it.sold ? ' <span class="pill-sold">' + esc(t('sold')) + '</span>' : '') + '</p>' +
      (it.desc[state.lang] ? '<div class="item-desc">' + esc(it.desc[state.lang]) + '</div>' : '') +
      '<div class="actions">' +
      (it.sold
        ? '<p class="sold-note">' + esc(t('soldNote')) + '</p>'
        : '<a class="btn btn-wa" href="' + esc(waLink(it)) + '" target="_blank" rel="noopener">' + WA_ICON + esc(t('interested')) + '</a>') +
      '<button type="button" class="btn btn-ghost" id="share">' + esc(t('share')) + '</button>' +
      '</div>' +
      saleInfo(false) +
      '</div></article>';

    var slides = main.querySelector('.slides');
    if (slides && n > 1) {
      var counter = main.querySelector('.counter');
      var current = function () { return Math.round(slides.scrollLeft / slides.clientWidth); };
      var timer;
      slides.addEventListener('scroll', function () {
        clearTimeout(timer);
        timer = setTimeout(function () { counter.textContent = t('photo')(current() + 1, n); }, 80);
      });
      var go = function (d) {
        var i = Math.max(0, Math.min(n - 1, current() + d));
        slides.scrollTo({ left: i * slides.clientWidth, behavior: 'smooth' });
      };
      main.querySelector('.prev').addEventListener('click', function () { go(-1); });
      main.querySelector('.next').addEventListener('click', function () { go(1); });
      slides.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      });
    }
    main.querySelectorAll('.gallery img').forEach(function (img) {
      img.addEventListener('error', function () { img.outerHTML = placeholder(); }, { once: true });
    });

    main.querySelector('#share').addEventListener('click', function (e) {
      var btn = e.currentTarget, url = itemUrl(it);
      if (navigator.share) {
        navigator.share({ title: it.title[state.lang], url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
          btn.textContent = t('copied');
          setTimeout(function () { btn.textContent = t('share'); }, 2000);
        });
      }
    });
  }

  /* ───────────── Routing & chrome ───────────── */
  var lastRoute = null;
  function route() {
    var m = location.hash.match(/^#\/item\/([\w-]+)/);
    var r = m ? 'item' : 'list';

    if (lastRoute === 'list' && r === 'item') state.listScroll = window.scrollY;
    updateChrome();

    if (!state.loaded) {
      main.innerHTML = state.error
        ? '<p class="status-msg">' + esc(t('loadError')) + '</p><p><button type="button" class="btn btn-ghost" id="retry">' + esc(t('retry')) + '</button></p>'
        : '<p class="status-msg">' + esc(t('loading')) + '</p>';
      var rb = document.getElementById('retry');
      if (rb) rb.addEventListener('click', load);
      return;
    }

    if (r === 'item') renderItem(m[1]); else renderList();

    var h1 = main.querySelector('.page-title');
    if (lastRoute !== null && lastRoute !== r && h1) h1.focus({ preventScroll: true });
    window.scrollTo(0, r === 'list' && lastRoute === 'item' ? state.listScroll : 0);
    lastRoute = r;
  }

  function updateChrome() {
    document.documentElement.lang = state.lang === 'es' ? 'es-MX' : 'en';
    document.getElementById('brand').textContent = L(CFG.title) || 'Moving Sale';
    document.getElementById('footer-text').textContent = t('footer');
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    document.querySelectorAll('.lang button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === state.lang));
    });
  }

  document.querySelector('.lang').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-lang]');
    if (!b || b.getAttribute('data-lang') === state.lang) return;
    state.lang = b.getAttribute('data-lang');
    try { localStorage.setItem('lang', state.lang); } catch (err) { /* ignore */ }
    var y = window.scrollY;
    lastRoute = null; // re-render in place, no focus jump
    route();
    window.scrollTo(0, y);
    lastRoute = location.hash.indexOf('#/item/') === 0 ? 'item' : 'list';
  });

  window.addEventListener('hashchange', route);

  function load() {
    state.error = false;
    route();
    var p = state.sample
      ? Promise.resolve(window.SAMPLE_CSV || '')
      : fetch(CFG.sheetCsvUrl + (CFG.sheetCsvUrl.indexOf('?') === -1 ? '?' : '&') + '_=' + Date.now())
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); });
    p.then(function (text) {
      state.items = rowsToItems(parseCSV(text));
      state.loaded = true;
      route();
    }).catch(function () {
      state.error = true;
      route();
    });
  }

  load();
})();
