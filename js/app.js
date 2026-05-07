"use strict";

// ============================================================
// ESTADO GLOBAL DE LA APLICACIÓN
// ============================================================
const estado = {
  usuario: "",
  carrito: JSON.parse(localStorage.getItem("of_carrito")) || [],
  productos: [],
  productosFiltrados: [],
  ofertasIds: [101, 102, 103, 104, 105, 106],
  pendingDeleteId: null,
};

// ============================================================
// UTILIDADES
// ============================================================

// Formatea precio en miles sin centavos con separador de miles
function formatearPrecio(precio) {
  return `$${Math.round(precio * 1000).toLocaleString('es-AR')}`;
}

// Genera estrellas HTML según el rating
function generarEstrellas(rating) {
  const llenas = Math.floor(rating);
  const estrellas = "★".repeat(llenas) + "☆".repeat(5 - llenas);
  return `<span class="estrellas">${estrellas}</span>`;
}

// Toast SweetAlert2 para notificaciones no bloqueantes
function mostrarToast(mensaje, icono = "success") {
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: icono,
    title: mensaje,
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    customClass: { popup: "swal-toast-custom" },
  });
}

// ============================================================
// MODALES PERSONALIZADOS (sin alert/prompt/confirm nativos)
// ============================================================

function abrirModal(id) {
  document.getElementById(id).classList.add("active");
  document.getElementById("overlay").classList.add("active");
}

function cerrarModal(id) {
  document.getElementById(id).classList.remove("active");
  // Solo oculta el overlay si no hay otro modal abierto
  const hayModalActivo = document.querySelector(".modal-overlay.active");
  if (!hayModalActivo) {
    document.getElementById("overlay").classList.remove("active");
  }
}

// ============================================================
// CARGA DE PRODUCTOS DESDE JSON LOCAL (async/await)
// ============================================================

async function cargarProductos() {
  try {
    const respuesta = await fetch("./data/products.json");
    if (!respuesta.ok) throw new Error("No se pudo cargar products.json");
    const datos = await respuesta.json();
    estado.productos = datos;
    estado.productosFiltrados = [...datos];
    renderProductos(datos);
  } catch (error) {
    mostrarToast("Error al cargar productos. Recargá la página.", "error");
  }
}

// ============================================================
// Productos locales para la sección "Ofertas Especiales"
// ============================================================

async function cargarOfertas() {
  const grid = document.getElementById("ofertasGrid");
  if (!grid) return;

  grid.innerHTML = `<div class="loading-spinner"><span>Cargando ofertas...</span></div>`;

  await new Promise(resolve => setTimeout(resolve, 500));

  // Ofertas reales con descuentos fijos
  const ofertas = [
    {
      id: 101,
      imagen: "img/Diseño_jarratermica_afa.jpg",
      nombre: "Jarra 3D Chopp 500ml Selección Argentina",
      categoria: "chopp",
      precioOriginal: "$25.000",
      precioOferta: "$21.250",
      precio: 21250,
      descuento: 15,
      rating: 4.8
    },
    {
      id: 102,
      imagen: "img/Diseño_jarratermica_fernet.jpg",
      nombre: "Jarra 3D Chopp 500ml Fernet Branca",
      categoria: "chopp",
      precioOriginal: "$18.990",
      precioOferta: "$15.192",
      precio: 15192,
      descuento: 20,
      rating: 4.9
    },
    {
      id: 103,
      imagen: "img/Lampara_velador_boca.jpg",
      nombre: "Lámpara Velador 3D Escudo Boca Juniors",
      categoria: "lampara",
      precioOriginal: "$16.990",
      precioOferta: "$14.951",
      precio: 14951,
      descuento: 12,
      rating: 4.5
    },
    {
      id: 104,
      imagen: "img/Lampara_velador_river_plate.jpg",
      nombre: "Lámpara Velador 3D Escudo River Plate",
      categoria: "lampara",
      precioOriginal: "$11.000",
      precioOferta: "$9.020",
      precio: 9020,
      descuento: 18,
      rating: 4.6
    },
    {
      id: 105,
      imagen: "img/Diseño_jarratermica_lospiojos.jpg",
      nombre: "Jarra 3D Chopp 500ml Los Piojos",
      categoria: "chopp",
      precioOriginal: "$20.000",
      precioOferta: "$16.000",
      precio: 16000,
      descuento: 20,
      rating: 4.6
    },
    {
      id: 106,
      imagen: "img/Diseño_jarratermica_unpocoderuid.jpg",
      nombre: "Jarra 3D Chopp 500ml Un Poco de Ruido",
      categoria: "chopp",
      precioOriginal: "$12.500",
      precioOferta: "$9.375",
      precio: 9375,
      descuento: 25,
      rating: 4.5
    }
  ];

  renderOfertas(ofertas);
}

function renderOfertas(ofertas) {
  const grid = document.getElementById("ofertasGrid");

  const html = ofertas.map((p) => {
    return `
      <div class="oferta-card">
        <div class="oferta-badge">-${p.descuento}%</div>
        <img src="${p.imagen}" alt="${p.nombre}" class="oferta-img" loading="lazy">
        <div class="oferta-info">
          <span class="oferta-categoria">${p.categoria}</span>
          <h3 class="oferta-nombre">${p.nombre}</h3>
          ${generarEstrellas(p.rating)}
          <div class="oferta-precios">
            <span class="precio-original">${p.precioOriginal}</span>
            <span class="precio-oferta">${p.precioOferta}</span>
          </div>
          <p class="oferta-promo">Llevando 2 del mismo artículo: -15% OFF</p>
          <button class="btn-agregar-oferta" data-id="${p.id}" data-nombre="${p.nombre}" data-precio="${p.precio}" data-imagen="${p.imagen}">
            + Agregar al carrito
          </button>
        </div>
      </div>`;
  }).join("");

  grid.innerHTML = html;

  // Eventos de botones de ofertas
  grid.querySelectorAll(".btn-agregar-oferta").forEach((btn) => {
    btn.addEventListener("click", () => {
      const producto = {
        id: Number(btn.dataset.id),
        nombre: btn.dataset.nombre,
        precio: Number(btn.dataset.precio),
        imagen: btn.dataset.imagen,
        unidad: "UNI"
      };
      agregarOfertaAlCarrito(producto);
    });
  });
}

function agregarOfertaAlCarrito(producto) {
  const itemExistente = estado.carrito.find((i) => i.id === producto.id);

  if (itemExistente) {
    itemExistente.cantidad += 2;
  } else {
    estado.carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen,
      unidad: producto.unidad,
      cantidad: 2,
    });
  }

  guardarCarritoStorage();
  actualizarCarritoUI();
  mostrarToast(`${producto.nombre} (x2) agregado al carrito 🛒`);
}

// ============================================================
// API EXTERNA 2 - JSONPlaceholder → Sección "Testimonios"
// ============================================================

async function cargarTestimonios() {
  const grid = document.getElementById("testimoniosGrid");
  if (!grid) return;

  renderTestimonios();
}

// Datos de testimonios
const testimoniosData = [
  { nombre: "Nahuel Riso", ciudad: "Argentina, La 24" },
  { nombre: "Cristian Ferrari", ciudad: "La Matanza" },
  { nombre: "Flavio Galimberti", ciudad: "Vicente Lopez" },
  { nombre: "Joaquin Echeverri", ciudad: "Lanus" },
];

// Reviews predefinidas para cada usuario
const reviewsTexto = [
  "La pieza personalizada quedó perfecta. El acabado en PLA fue impecable y la entrega muy rápida. Sin dudas volveré a pedir más.",
  "Me sorprendió la calidad de los soportes impresos en 3D. Resistentes y con un diseño muy prolijo. Excelente servicio.",
  "Necesitaba un prototipo para mi proyecto y lo recibí en tiempo récord. La precisión del diseño fue increíble.",
  "Los accesorios impresos son únicos y de gran calidad. La atención al cliente fue excelente, me asesoraron en todo el proceso.",
];

function renderTestimonios() {
  const grid = document.getElementById("testimoniosGrid");
  const avatarColores = ["#52b788", "#40916c", "#f4a261", "#2d6a4f"];

  const html = testimoniosData.map((t, i) => {
    const iniciales = t.nombre.split(" ").slice(0, 2).map((n) => n[0]).join("");
    return `
      <div class="testimonio-card">
        <div class="testimonio-avatar" style="background:${avatarColores[i]}">
          ${iniciales}
        </div>
        <div class="testimonio-estrellas">★★★★★</div>
        <p class="testimonio-texto">"${reviewsTexto[i]}"</p>
        <div class="testimonio-autor">
          <strong>${t.nombre}</strong>
          <span>${t.ciudad}</span>
        </div>
      </div>`;
  }).join("");

  grid.innerHTML = html;
}

// ============================================================
// RENDER PRODUCTOS EN GRID
// ============================================================

function renderProductos(lista) {
  const grid = document.getElementById("productsGrid");

  if (lista.length === 0) {
    grid.innerHTML = `<div class="no-resultados">
      <span>UPPSS....🤐​🤐​🤐​</span>
      <p>No se encontraron productos</p>
    </div>`;
    return;
  }

  grid.innerHTML = lista.map((p) => crearTarjetaProducto(p)).join("");

  // Vincula eventos a los botones de agregar al carrito
  grid.querySelectorAll(".btn-agregar").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const producto = estado.productos.find((p) => p.id === id);
      if (producto) agregarAlCarrito(producto);
    });
  });
}

function crearTarjetaProducto(producto) {
  const badge = producto.badge
    ? `<span class="product-badge">${producto.badge}</span>`
    : "";

  return `
    <div class="product-card" data-id="${producto.id}">
      ${badge}
      <div class="product-img-wrapper">
        <img src="${producto.imagen}" alt="${producto.nombre}" class="product-img" loading="lazy">
      </div>
      <div class="product-info">
        <h3 class="product-name">${producto.nombre}</h3>
        <p class="product-desc">${producto.descripcion}</p>
        ${generarEstrellas(producto.rating)}
        <div class="product-footer">
          <div class="product-price-wrap">
            <span class="product-price">${formatearPrecio(producto.precio)}</span>
            <span class="product-unit">/ ${producto.unidad}</span>
          </div>
          <button class="btn-agregar" data-id="${producto.id}">
            + Agregar
          </button>
        </div>
      </div>
    </div>`;
}

// ============================================================
// FILTROS DE CATEGORÍA
// ============================================================

function filtrarPorCategoria(categoria) {
  if (categoria === "todos") {
    estado.productosFiltrados = [...estado.productos];
  } else {
    estado.productosFiltrados = estado.productos.filter(
      (p) => p.categoria === categoria
    );
  }
  renderProductos(estado.productosFiltrados);
}

// ============================================================
// BÚSQUEDA DE PRODUCTOS
// ============================================================

function buscarProductos(termino) {
  const terminoLower = termino.toLowerCase().trim();
  if (terminoLower === "") {
    estado.productosFiltrados = [...estado.productos];
  } else {
    estado.productosFiltrados = estado.productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(terminoLower) ||
        p.descripcion.toLowerCase().includes(terminoLower) ||
        p.categoria.toLowerCase().includes(terminoLower)
    );
  }
  renderProductos(estado.productosFiltrados);
}

// ============================================================
// CARRITO - OPERACIONES
// ============================================================

function agregarAlCarrito(producto) {
  const itemExistente = estado.carrito.find((i) => i.id === producto.id);

  if (itemExistente) {
    itemExistente.cantidad++;
  } else {
    estado.carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen,
      unidad: producto.unidad,
      cantidad: 1,
    });
  }

  guardarCarritoStorage();
  actualizarCarritoUI();
  mostrarToast(`${producto.nombre} agregado al carrito 🛒`);
}

function cambiarCantidad(id, delta) {
  const item = estado.carrito.find((i) => i.id === id);
  if (!item) return;

  if (item.cantidad === 2 && delta === -1) {
    Swal.fire({
      icon: "warning",
      title: "¡Atención!",
      html: `Si bajás a <strong>1 unidad</strong> de <em>"${item.nombre}"</em>, perdés el <strong>descuento del 15%</strong>.`,
      showCancelButton: true,
      confirmButtonText: "Sí, quitar uno",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#e63946",
      cancelButtonColor: "#6b7280",
    }).then((result) => {
      if (result.isConfirmed) {
        item.cantidad += delta;
        guardarCarritoStorage();
        actualizarCarritoUI();
        mostrarToast("Descuento x2 eliminado", "info");
      }
    });
    return;
  }

  item.cantidad += delta;
  if (item.cantidad <= 0) {
    estado.carrito = estado.carrito.filter((i) => i.id !== id);
  }

  guardarCarritoStorage();
  actualizarCarritoUI();
}

function eliminarDelCarrito(id) {
  estado.carrito = estado.carrito.filter((i) => i.id !== id);
  guardarCarritoStorage();
  actualizarCarritoUI();
  mostrarToast("Producto eliminado del carrito", "info");
}

function vaciarCarrito() {
  estado.carrito = [];
  guardarCarritoStorage();
  actualizarCarritoUI();
}

function guardarCarritoStorage() {
  localStorage.setItem("of_carrito", JSON.stringify(estado.carrito));
}

// ============================================================
// CALCULAR TOTALES DEL CARRITO
// ============================================================

function calcularTotales() {
  const descuentoX2 = 0.15;
  let subtotal = 0;
  let descuento = 0;

  estado.carrito.forEach((item) => {
    const linea = item.precio * item.cantidad;
    subtotal += linea;

    if (item.cantidad >= 2) {
      descuento += linea * descuentoX2;
    }
  });

  const umbralDescuento = 60000;
  const porcentajeExtra = 0.10;
  const descuentoExtra = subtotal >= umbralDescuento ? subtotal * porcentajeExtra : 0;
  descuento += descuentoExtra;

  const total = subtotal - descuento;

  return { subtotal, descuento, total, umbralDescuento };
}

// ============================================================
// ACTUALIZAR UI DEL CARRITO
// ============================================================

function actualizarCarritoUI() {
  const { subtotal, descuento, total, umbralDescuento } = calcularTotales();
  const cantidadTotal = estado.carrito.reduce((acc, i) => acc + i.cantidad, 0);

  // Actualiza contador del header
  document.getElementById("cartCount").textContent = cantidadTotal;

  // Renderiza items
  const cartItems = document.getElementById("cartItems");
  if (estado.carrito.length === 0) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <span class="cart-empty-icon">🛒</span>
        <p>Tu carrito está vacío</p>
      </div>`;
  } else {
    cartItems.innerHTML = estado.carrito.map((item) => {
      const tieneDescuentoX2 = item.cantidad >= 2;
      const esProductoOferta = estado.ofertasIds.includes(item.id);
      const totalLinea = item.precio * item.cantidad;
      const descuentoLinea = tieneDescuentoX2 ? totalLinea * 0.15 : 0;
      const totalFinal = totalLinea - descuentoLinea;

      // Si es de oferta pero perdió el descuento (cantidad < 2)
      const perdioDescuento = esProductoOferta && !tieneDescuentoX2 && item.cantidad >= 1;
      const precioConDescuento = totalLinea * 0.85;

      return `
      <div class="cart-item ${tieneDescuentoX2 ? 'cart-item--descuento' : ''} ${perdioDescuento ? 'cart-item--perdio' : ''}">
        <img src="${item.imagen}" alt="${item.nombre}" class="cart-item-img">
        <div class="cart-item-info">
          <p class="cart-item-name">
            ${item.nombre}
            ${tieneDescuentoX2 ? '<span class="badge-x2">-15% x2+</span>' : ''}
            ${perdioDescuento ? '<span class="badge-perdio">Sin descuento</span>' : ''}
          </p>
          <p class="cart-item-price">${formatearPrecio(item.precio)} / ${item.unidad}</p>
          <div class="cart-item-controls">
            <button class="qty-btn" data-id="${item.id}" data-delta="-1">−</button>
            <span class="qty-value">${item.cantidad}</span>
            <button class="qty-btn" data-id="${item.id}" data-delta="1">+</button>
          </div>
        </div>
        <div class="cart-item-right">
          <p class="cart-item-total">${formatearPrecio(totalFinal)}</p>
          ${tieneDescuentoX2 ? `<p class="cart-item-original">${formatearPrecio(totalLinea)}</p>` : ''}
          ${perdioDescuento ? `<p class="cart-item-original">${formatearPrecio(precioConDescuento)}</p>` : ''}
          <button class="cart-item-delete" data-id="${item.id}">🗑️</button>
        </div>
      </div>`;
    }).join("");

    // Eventos de cantidad y eliminar
    cartItems.querySelectorAll(".qty-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        cambiarCantidad(Number(btn.dataset.id), Number(btn.dataset.delta));
      });
    });

    cartItems.querySelectorAll(".cart-item-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        estado.pendingDeleteId = Number(btn.dataset.id);
        const item = estado.carrito.find((i) => i.id === estado.pendingDeleteId);
        document.getElementById("confirmMessage").textContent =
          `¿Eliminás "${item.nombre}" del carrito?`;
        abrirModal("confirmModal");
      });
    });
  }

  // Actualiza totales
  document.getElementById("subtotal").textContent = formatearPrecio(subtotal);
  document.getElementById("discount").textContent = formatearPrecio(descuento);
  document.getElementById("total").textContent = formatearPrecio(total);

  // Barra de progreso de descuento
  const progressContainer = document.getElementById("discountProgressContainer");
  const progressFill = document.getElementById("discountProgressFill");
  const progressLabel = document.getElementById("discountProgressLabel");

  if (subtotal >= umbralDescuento) {
    progressFill.style.width = "100%";
    progressLabel.textContent = "🎉 ¡Descuento del 10% aplicado!";
  } else {
    const progreso = Math.min((subtotal / umbralDescuento) * 100, 100);
    progressFill.style.width = `${progreso}%`;
    const falta = (umbralDescuento - subtotal).toFixed(2);
    progressLabel.textContent = `Agregá $${falta} más para obtener 10% de descuento`;
  }

  progressContainer.style.display = estado.carrito.length > 0 ? "block" : "none";
}

// ============================================================
// PROCESO DE COMPRA (CHECKOUT)
// ============================================================

function procesarCompra() {
  if (estado.carrito.length === 0) {
    mostrarToast("Tu carrito está vacío", "warning");
    return;
  }

  const { subtotal, descuento, total } = calcularTotales();
  const fecha = new Date().toLocaleDateString("es-AR", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const nroPedido = Math.floor(Math.random() * 90000) + 10000;

  const itemsHTML = estado.carrito.map((item) => `
    <div class="checkout-item">
      <span>${item.nombre} x${item.cantidad}</span>
      <span>${formatearPrecio(item.precio * item.cantidad)}</span>
    </div>`).join("");

  document.getElementById("checkoutBody").innerHTML = `
    <div class="checkout-summary">
      <p class="checkout-pedido">Pedido N° <strong>#${nroPedido}</strong></p>
      <p class="checkout-fecha">📅 ${fecha}</p>
      <p class="checkout-cliente">👤 ${estado.usuario}</p>
      <div class="checkout-items">${itemsHTML}</div>
      <div class="checkout-totales">
        <div class="checkout-row"><span>Subtotal:</span><span>${formatearPrecio(subtotal)}</span></div>
        ${descuento > 0 ? `<div class="checkout-row descuento"><span>Descuento 10%:</span><span>-${formatearPrecio(descuento)}</span></div>` : ""}
        <div class="checkout-row total-final"><span>TOTAL:</span><span>${formatearPrecio(total)}</span></div>
      </div>
      <p class="checkout-msg">¡Gracias por tu compra, ${estado.usuario}! Te contactaremos pronto.</p>
    </div>`;

  abrirModal("checkoutModal");
  vaciarCarrito();
}

// ============================================================
// BIENVENIDA - MODAL INICIAL
// ============================================================

function iniciarBienvenida() {
  // Pre-carga el input con un nombre de ejemplo
  document.getElementById("inputNombreUsuario").value = "";

  abrirModal("welcomeModal");

  document.getElementById("welcomeBtn").addEventListener("click", () => {
    const nombre = document.getElementById("inputNombreUsuario").value.trim();
    const errorEl = document.getElementById("welcomeError");

    if (!nombre) {
      errorEl.style.display = "block";
      return;
    }

    errorEl.style.display = "none";
    estado.usuario = nombre;
    cerrarModal("welcomeModal");
    document.getElementById("userGreeting").textContent = `Hola, ${nombre} 👋`;
    document.getElementById("cartUsername").textContent = `de ${nombre}`;
    mostrarToast(`¡Bienvenido a Inside 3D Art, ${nombre}!`);
  });

  // Enter en el input también confirma
  document.getElementById("inputNombreUsuario").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("welcomeBtn").click();
  });
}

// ============================================================
// EVENTOS GLOBALES
// ============================================================

function iniciarEventos() {
  // Abrir/cerrar carrito
  document.getElementById("cartBtn").addEventListener("click", () => {
    document.getElementById("cartSidebar").classList.add("open");
    document.getElementById("overlay").classList.add("active");
  });

  document.getElementById("cartClose").addEventListener("click", cerrarCarrito);

  document.getElementById("overlay").addEventListener("click", () => {
    cerrarCarrito();
    document.querySelectorAll(".modal-overlay.active").forEach((m) =>
      m.classList.remove("active")
    );
    document.getElementById("overlay").classList.remove("active");
  });

  // Filtros de categoría
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((b) =>
        b.classList.remove("active")
      );
      btn.classList.add("active");
      filtrarPorCategoria(btn.dataset.categoria);
    });
  });

  // Búsqueda
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", () => buscarProductos(searchInput.value));

  // Vaciar carrito
  document.getElementById("vaciarCarritoBtn").addEventListener("click", () => {
    if (estado.carrito.length === 0) return;
    Swal.fire({
      title: "¿Vaciar carrito?",
      text: "Se eliminarán todos los productos.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e76f51",
      cancelButtonColor: "#40916c",
      confirmButtonText: "Sí, vaciar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        vaciarCarrito();
        mostrarToast("Carrito vaciado", "info");
      }
    });
  });

  // Checkout
  document.getElementById("checkoutBtn").addEventListener("click", procesarCompra);

  // Modal confirm - eliminar item
  document.getElementById("confirmAceptar").addEventListener("click", () => {
    if (estado.pendingDeleteId !== null) {
      eliminarDelCarrito(estado.pendingDeleteId);
      estado.pendingDeleteId = null;
    }
    cerrarModal("confirmModal");
  });

  document.getElementById("confirmCancelar").addEventListener("click", () => {
    estado.pendingDeleteId = null;
    cerrarModal("confirmModal");
  });

  // Modal checkout - cerrar
  document.getElementById("checkoutCerrar").addEventListener("click", () => {
    cerrarModal("checkoutModal");
  });

  // Modal descuento - info
  document.getElementById("discountInfoBtn").addEventListener("click", () => {
    abrirModal("discountModal");
  });

  document.getElementById("discountCerrar").addEventListener("click", () => {
    cerrarModal("discountModal");
  });
}

function cerrarCarrito() {
  document.getElementById("cartSidebar").classList.remove("open");
  const hayModal = document.querySelector(".modal-overlay.active");
  if (!hayModal) document.getElementById("overlay").classList.remove("active");
}


// ============================================================
// PARALLAX - efecto translate3d en la imagen de fondo del hero
// ============================================================
function iniciarParalaje() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  window.addEventListener("scroll", () => {
    const offset = window.scrollY * 0.45;
    hero.style.setProperty("--parallax-y", `${offset}px`);
  }, { passive: true });
}

// ============================================================
// MENÚ HAMBURGUESA - creado dinámicamente para no tocar el HTML
// ============================================================
function iniciarMenuMovil() {
  const nav = document.querySelector(".nav");
  const headerContent = document.querySelector(".header-content");
  if (!nav || !headerContent) return;

  // Crear botón hamburguesa
  const hamburger = document.createElement("button");
  hamburger.className = "hamburger-btn";
  hamburger.setAttribute("aria-label", "Abrir menú");
  hamburger.innerHTML = `<span></span><span></span><span></span>`;

  // Insertar antes del nav
  headerContent.insertBefore(hamburger, nav);

  hamburger.addEventListener("click", () => {
    nav.classList.toggle("nav--open");
    hamburger.classList.toggle("hamburger-btn--open");
  });

  // Cerrar menú al hacer click en un link
  nav.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("nav--open");
      hamburger.classList.remove("hamburger-btn--open");
    });
  });
}

// ============================================================
// INICIALIZACIÓN
// ============================================================

async function init() {
  iniciarBienvenida();
  iniciarEventos();
  iniciarMenuMovil();
  iniciarParalaje();
  await cargarProductos();
  await cargarOfertas();
  await cargarTestimonios();
  actualizarCarritoUI();
}

init();
