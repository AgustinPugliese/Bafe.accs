var WHATSAPP_NUM = '5491124012946';
var INSTAGRAM = 'bafe.accs';
var carrito = [];
var slideActual = 0;

/* ─── LIGHTBOX ───────────────────────────────────────────── */
var lightboxImages = [];
var lightboxIndex = 0;

function abrirLightbox(wrap) {
  if (!wrap) return;
  var images = [];
  try { images = JSON.parse(wrap.dataset.images || '[]'); } catch(e) {
    var img = wrap.querySelector('img');
    if (img && img.src) images = [img.src];
  }
  if (!images.length) return;
  lightboxImages = images;
  lightboxIndex = parseInt(wrap.dataset.current || '0', 10);
  document.getElementById('lightbox-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  actualizarLightbox();
}

function cerrarLightbox() {
  document.getElementById('lightbox-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function navLightbox(e, dir) {
  e.stopPropagation();
  if (!lightboxImages.length) return;
  lightboxIndex = (lightboxIndex + dir + lightboxImages.length) % lightboxImages.length;
  actualizarLightbox();
}

function actualizarLightbox() {
  var imgEl = document.getElementById('lightbox-img');
  var dotsEl = document.getElementById('lightbox-dots');
  imgEl.style.opacity = '0';
  setTimeout(function() { imgEl.src = lightboxImages[lightboxIndex]; imgEl.style.opacity = '1'; }, 120);
  var prev = document.querySelector('.lightbox-prev');
  var next = document.querySelector('.lightbox-next');
  var vis = lightboxImages.length > 1 ? 'flex' : 'none';
  if (prev) prev.style.display = vis;
  if (next) next.style.display = vis;
  if (dotsEl) {
    dotsEl.innerHTML = lightboxImages.length > 1
      ? lightboxImages.map(function(_, i) {
          return '<button class="lightbox-dot' + (i === lightboxIndex ? ' active' : '') + '" onclick="irALightbox(' + i + ')"></button>';
        }).join('') : '';
  }
}

function irALightbox(idx) { lightboxIndex = idx; actualizarLightbox(); }

document.addEventListener('keydown', function(e) {
  var ov = document.getElementById('lightbox-overlay');
  if (!ov || !ov.classList.contains('open')) return;
  if (e.key === 'Escape') cerrarLightbox();
  if (e.key === 'ArrowLeft') { lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length; actualizarLightbox(); }
  if (e.key === 'ArrowRight') { lightboxIndex = (lightboxIndex + 1) % lightboxImages.length; actualizarLightbox(); }
});

/* ─── STOCK ──────────────────────────────────────────────── */
function getQtyEnCarrito(nombre) {
  return carrito.reduce(function(t, i) { return i.nombre === nombre ? t + i.qty : t; }, 0);
}

function configurarStockInicial() {
  document.querySelectorAll('.producto-card').forEach(function(card) {
    var el = card.querySelector('.prod-stock');
    if (el && !card.dataset.stockInicial) card.dataset.stockInicial = el.dataset.stock || '0';
  });
}

function actualizarEstadoStockCard(card) {
  var el = card.querySelector('.prod-stock');
  var btn = card.querySelector('.btn-agregar');
  var ini = parseInt(card.dataset.stockInicial || 0, 10);
  var disp = Math.max(ini - getQtyEnCarrito(card.dataset.nombre), 0);
  if (el) {
    el.dataset.stock = String(disp);
    if (disp === 0) { el.innerHTML = '<strong>Sin stock</strong>'; el.classList.add('agotado'); }
    else { el.innerHTML = 'Stock: <strong>' + disp + '</strong> disponibles'; el.classList.remove('agotado'); }
  }
  if (btn) { btn.disabled = disp === 0; btn.textContent = disp === 0 ? 'Sin stock' : '+ Agregar al carrito'; }
}

function sincronizarStockVisual() {
  document.querySelectorAll('.producto-card').forEach(actualizarEstadoStockCard);
}

/* ─── IMÁGENES ROTAS ─────────────────────────────────────── */
/*
  FIX DEFINITIVO: Si una imagen falla al cargar, la ignoramos silenciosamente.
  NO mostramos placeholder ni destruimos la card. Así el producto siempre se ve bien.
*/
function configurarImagenesRotas() {
  document.querySelectorAll('.prod-img-wrap img').forEach(function(img) {
    img.addEventListener('error', function() {
      // Solo ocultamos si es la imagen única de una card simple (no multi-img)
      var wrap = img.closest('.prod-img-wrap');
      if (wrap && !wrap.classList.contains('multi-img') && !wrap.querySelector('.prod-img-placeholder')) {
        img.style.opacity = '0';
      }
      // Para prod-img-main: no hacemos nada, la foto original sigue ahí
    });
  });
}

/* ─── MULTI-IMAGEN: solo flechas, SIN hover ─────────────── */
function actualizarMultiImagen(wrap, index) {
  if (!wrap || !wrap.dataset.images) return;
  var imgs = JSON.parse(wrap.dataset.images);
  var main = wrap.querySelector('.prod-img-main');
  var dots = wrap.querySelectorAll('.img-dot');
  if (!imgs.length || !main) return;
  var next = ((index % imgs.length) + imgs.length) % imgs.length;
  wrap.dataset.current = next;
  main.style.opacity = '0';
  setTimeout(function() { main.src = imgs[next]; main.style.opacity = '1'; }, 120);
  dots.forEach(function(d, i) { d.classList.toggle('active', i === next); });
}

function imgNav(e, btn, dir) {
  e.stopPropagation();
  var wrap = btn.closest('.prod-img-wrap');
  if (!wrap || !wrap.dataset.images) return;
  var imgs = JSON.parse(wrap.dataset.images);
  var cur = parseInt(wrap.dataset.current || '0', 10);
  actualizarMultiImagen(wrap, (cur + dir + imgs.length) % imgs.length);
}

/* ─── CARRITO ────────────────────────────────────────────── */
function toggleCarrito() {
  document.getElementById('carrito-panel').classList.toggle('open');
  document.getElementById('carrito-overlay').classList.toggle('open');
}

function agregarAlCarrito(btn) {
  var card = btn.closest('.producto-card');
  var nombre = card.dataset.nombre;
  var precio = parseInt(card.dataset.precio || '0', 10) || 0;
  var disp = parseInt(card.querySelector('.prod-stock').dataset.stock || '0', 10);
  if (disp <= 0) return;
  var existe = carrito.find(function(i) { return i.nombre === nombre; });
  if (existe) { existe.qty++; }
  else { carrito.push({ nombre: nombre, precio: precio, qty: 1, stock: parseInt(card.dataset.stockInicial || disp, 10) }); }
  actualizarCarrito();
  btn.textContent = '✓ Agregado'; btn.style.backgroundColor = '#28a745';
  setTimeout(function() { if (!btn.disabled) btn.textContent = '+ Agregar al carrito'; btn.style.backgroundColor = ''; }, 1000);
  toggleCarrito();
}

function actualizarCarrito() {
  var itemsEl = document.getElementById('carrito-items');
  var badgeEl = document.getElementById('carrito-badge');
  var totalEl = document.getElementById('carrito-total');
  var footerEl = document.getElementById('carrito-footer');
  var qty = carrito.reduce(function(s, i) { return s + i.qty; }, 0);
  badgeEl.textContent = qty;
  if (!carrito.length) {
    itemsEl.innerHTML = '<p class="carrito-vacio">Tu carrito está vacío 🛒</p>';
    totalEl.textContent = '$0'; footerEl.style.display = 'none';
    sincronizarStockVisual(); guardarCarrito(); return;
  }
  footerEl.style.display = 'block';
  itemsEl.innerHTML = carrito.map(function(item, idx) {
    var sub = item.precio > 0 ? '$' + (item.precio * item.qty).toLocaleString('es-AR') : 'Precio a confirmar';
    return '<div class="carrito-item"><div class="carrito-item-info"><p class="carrito-item-nombre">' + item.nombre + '</p><div class="carrito-item-qty"><button class="qty-btn" onclick="cambiarQty(' + idx + ',-1)">−</button><span class="qty-num">' + item.qty + '</span><button class="qty-btn" onclick="cambiarQty(' + idx + ',1)">+</button><span style="font-size:.75rem;color:#aaa;margin-left:8px">' + sub + '</span></div></div><span class="carrito-item-eliminar" onclick="eliminarItem(' + idx + ')">🗑</span></div>';
  }).join('');
  if (carrito.some(function(i) { return i.precio > 0; })) {
    totalEl.textContent = '$' + carrito.reduce(function(s, i) { return s + (i.precio * i.qty); }, 0).toLocaleString('es-AR');
  } else { totalEl.textContent = 'Consultá precio'; }
  sincronizarStockVisual(); guardarCarrito();
}

function cambiarQty(idx, d) {
  var item = carrito[idx]; if (!item) return;
  var n = item.qty + d;
  if (n <= 0) { eliminarItem(idx); return; }
  if (d > 0 && n > item.stock) return;
  item.qty = n; actualizarCarrito();
}

function eliminarItem(idx) { carrito.splice(idx, 1); actualizarCarrito(); }

function armarMensaje() {
  if (!carrito.length) return '';
  var nom = (document.getElementById('cliente-nombre') || {}).value || '';
  var pos = (document.getElementById('cliente-postal') || {}).value || '';
  var pag = (document.getElementById('cliente-pago') || {}).value || '';
  var msg = '🛍️ *PEDIDO BAFE.ACCS* 🛍️\n\n';
  if (nom) msg += '👤 *Nombre:* ' + nom + '\n';
  if (pos) msg += '📍 *CP:* ' + pos + '\n';
  if (pag) msg += '💳 *Pago:* ' + pag + '\n';
  if (nom || pos || pag) msg += '\n';
  msg += '*Productos:*\n';
  carrito.forEach(function(i) {
    msg += '• ' + i.nombre + ' x' + i.qty;
    msg += i.precio > 0 ? ' → $' + (i.precio * i.qty).toLocaleString('es-AR') : ' → *Precio a confirmar*';
    msg += '\n';
  });
  if (carrito.some(function(i) { return i.precio > 0; })) {
    msg += '\n*TOTAL estimado:* $' + carrito.reduce(function(s, i) { return s + (i.precio * i.qty); }, 0).toLocaleString('es-AR');
    if (carrito.some(function(i) { return i.precio === 0; })) msg += ' *(+ productos a consultar)*';
  } else { msg += '\n*TOTAL:* A consultar'; }
  msg += '\n\n✨ _Gracias por elegir Bafe.accs!_ ✨';
  return msg;
}

function pedirPorWhatsapp() {
  if (!carrito.length) { alert('Todavía no agregaste ningún producto.'); return; }
  window.open('https://wa.me/' + WHATSAPP_NUM + '?text=' + encodeURIComponent(armarMensaje()), '_blank');
}

function pedirPorInstagram() {
  if (!carrito.length) { alert('Todavía no agregaste ningún producto.'); return; }
  var msg = armarMensaje();
  // Web Share API — funciona nativo en celular (abre menú para compartir)
  if (navigator.share) {
    navigator.share({ text: msg })
      .then(function() { window.open('https://instagram.com/' + INSTAGRAM, '_blank'); })
      .catch(function() { mostrarModalIG(msg); });
    return;
  }
  // Desktop: copiar al portapapeles
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(msg).then(mostrarToastIG).catch(function() { mostrarModalIG(msg); });
  } else {
    mostrarModalIG(msg);
  }
}

function mostrarModalIG(msg) {
  var modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
  modal.innerHTML = '<div style="background:white;border-radius:12px;padding:24px;max-width:420px;width:100%;position:relative;">'
    + '<button onclick="this.closest(\'div\').parentNode.remove()" style="position:absolute;top:10px;right:14px;background:none;border:none;font-size:1.3rem;cursor:pointer;color:#666;">✕</button>'
    + '<p style="font-size:0.85rem;font-weight:600;margin-bottom:10px;color:#9B0404;">Copiá este mensaje y envialo por DM a @' + INSTAGRAM + '</p>'
    + '<textarea id="msg-ig" style="width:100%;height:160px;font-size:0.75rem;padding:10px;border:1px solid #ddd;border-radius:6px;resize:none;font-family:sans-serif;">' + msg + '</textarea>'
    + '<button onclick="var t=document.getElementById(\'msg-ig\');t.select();t.setSelectionRange(0,99999);document.execCommand(\'copy\');this.textContent=\'✅ Copiado!\';this.style.background=\'#28a745\';" style="width:100%;padding:12px;background:#9B0404;color:white;border:none;border-radius:6px;margin-top:10px;font-size:0.78rem;cursor:pointer;font-family:Jost,sans-serif;letter-spacing:1px;">Copiar mensaje</button>'
    + '<a href="https://instagram.com/' + INSTAGRAM + '" target="_blank" style="display:block;text-align:center;margin-top:12px;font-size:0.78rem;color:#9B0404;text-decoration:underline;">Ir a Instagram →</a>'
    + '</div>';
  document.body.appendChild(modal);
  modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
}

function mostrarToastIG() {
  var t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#9B0404;color:white;padding:14px 28px;border-radius:8px;font-size:0.82rem;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.3);text-align:center;max-width:90vw;font-family:Jost,sans-serif;';
  t.innerHTML = '✅ ¡Mensaje copiado! Te redirigimos a Instagram.<br><small style="opacity:0.8">Pegá el mensaje en el DM de @' + INSTAGRAM + '</small>';
  document.body.appendChild(t);
  setTimeout(function() { window.open('https://instagram.com/' + INSTAGRAM, '_blank'); setTimeout(function() { if (t.parentNode) document.body.removeChild(t); }, 3000); }, 800);
}

function alertIG(msg) {
  alert('📸 Te redirigimos a Instagram.\n\nCopiá y envialo por DM a @' + INSTAGRAM + ':\n\n' + msg);
  window.open('https://instagram.com/' + INSTAGRAM, '_blank');
}

function guardarCarrito() { try { localStorage.setItem('carrito', JSON.stringify(carrito)); } catch(e) {} }

function cargarCarrito() {
  try { var d = localStorage.getItem('carrito'); if (d) carrito = JSON.parse(d) || []; }
  catch(e) { carrito = []; try { localStorage.removeItem('carrito'); } catch(e2) {} }
  actualizarCarrito();
}

/* ─── TABS ───────────────────────────────────────────────── */
function showTab(name, btn) {
  document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  var p = document.getElementById('tab-' + name); if (p) p.classList.add('active');
  if (btn) btn.classList.add('active');
}

/* ─── CARRUSEL EDITORIAL ─────────────────────────────────── */
function cambiarSlide(dir) {
  var slides = document.querySelectorAll('.carrusel-slide');
  var dots = document.querySelectorAll('.carrusel-dot');
  if (!slides.length) return;
  slides[slideActual].classList.remove('active');
  if (dots.length) dots[slideActual].classList.remove('active');
  slideActual = (slideActual + dir + slides.length) % slides.length;
  slides[slideActual].classList.add('active');
  if (dots.length) dots[slideActual].classList.add('active');
}

function irASlide(idx) {
  var slides = document.querySelectorAll('.carrusel-slide');
  var dots = document.querySelectorAll('.carrusel-dot');
  if (!slides.length || idx < 0 || idx >= slides.length) return;
  slides[slideActual].classList.remove('active');
  if (dots.length) dots[slideActual].classList.remove('active');
  slideActual = idx;
  slides[slideActual].classList.add('active');
  if (dots.length) dots[slideActual].classList.add('active');
}

setInterval(function() { cambiarSlide(1); }, 3000);

/* ─── CÁLCULO DE ENVÍO ───────────────────────────────────── */
function calcularEnvio() {
  var postal = document.getElementById('postal').value.trim();
  var result = document.getElementById('envio-result');
  if (!postal || !/^\d{4,8}$/.test(postal)) {
    result.textContent = 'Ingresá un código postal válido (4 a 8 dígitos).';
    result.className = 'envio-result error'; return;
  }
  var cp = parseInt(postal, 10), zona = '', precio = 0, dias = '';
  if      (cp >= 1000 && cp <= 1499) { zona = 'CABA';                                  precio = 2200; dias = '1 a 2 días hábiles'; }
  else if (cp >= 1600 && cp <= 2000) { zona = 'Gran Buenos Aires';                      precio = 2600; dias = '1 a 3 días hábiles'; }
  else if (cp >= 2001 && cp <= 7999) { zona = 'Provincia de Buenos Aires';              precio = 3200; dias = '2 a 4 días hábiles'; }
  else if ((cp >= 3000 && cp <= 3999)||(cp >= 5000 && cp <= 5999)) { zona = 'Córdoba / Santa Fe / Entre Ríos'; precio = 3600; dias = '2 a 4 días hábiles'; }
  else if (cp >= 4000 && cp <= 4799) { zona = 'NOA (Salta, Jujuy, Tucumán…)';          precio = 4100; dias = '3 a 6 días hábiles'; }
  else if (cp >= 3100 && cp <= 3799) { zona = 'NEA (Misiones, Corrientes, Chaco…)';    precio = 4100; dias = '3 a 6 días hábiles'; }
  else if (cp >= 5400 && cp <= 5699) { zona = 'Cuyo (Mendoza, San Juan)';              precio = 4300; dias = '3 a 5 días hábiles'; }
  else if (cp >= 8300 && cp <= 9430) { zona = 'Patagonia';                             precio = 5200; dias = '4 a 8 días hábiles'; }
  else {
    result.innerHTML = '📦 No encontramos ese código postal.<br><small>Consultanos por <a href="https://wa.me/' + WHATSAPP_NUM + '" target="_blank" style="color:var(--bordo)">WhatsApp</a>.</small>';
    result.className = 'envio-result error'; return;
  }
  result.innerHTML = '🚚 <strong>' + zona + '</strong> — Correo Argentino<br><strong>$' + precio.toLocaleString('es-AR') + '</strong> · Entrega estimada: ' + dias + '<br><small style="color:#888;font-size:0.75rem">* Precio orientativo, puede variar según peso.</small>';
  result.className = 'envio-result success';
}

/* ─── INICIO ─────────────────────────────────────────────── */
configurarStockInicial();
configurarImagenesRotas();
cargarCarrito();
/* ─── ANIMACIONES DE ENTRADA AL SCROLL ───────────────────── */
(function () {
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  function init() {
    document.querySelectorAll('.producto-card, .info-item').forEach(function (el, i) {
      el.classList.add('fade-in');
      el.style.transitionDelay = (i % 4) * 0.07 + 's';
      observer.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();