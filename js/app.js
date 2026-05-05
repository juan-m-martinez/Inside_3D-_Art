"use strict";

// ============================================================
// ESTADO GLOBAL DE LA APLICACIÓN
// ============================================================
const estado = {
  usuario: "",
  carrito: JSON.parse(localStorage.getItem("of_carrito")) || [],
  productos: [],
  productosFiltrados: [],
  pendingDeleteId: null,
};

// ============================================================
// UTILIDADES
// ============================================================

// Formatea precio a dos decimales con símbolo $
function formatearPrecio(precio) {
  return `$${Number(precio).toFixed(2)}`;
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
    timer: 2200,
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
// API EXTERNA 1 - FakeStore API → Sección "Ofertas Especiales"
// ============================================================

async function cargarOfertas() {
  const grid = document.getElementById("ofertasGrid");
  if (!grid) return;

  grid.innerHTML = `<div class="loading-spinner"><span>Cargando ofertas...</span></div>`;

  try {
    const respuesta = await fetch("https://fakestoreapi.com/products?limit=4");
    if (!respuesta.ok) throw new Error("FakeStore API no disponible");
    const productos = await respuesta.json();
    renderOfertas(productos);
  } catch (error) {
    grid.innerHTML = `<p class="api-error">No se pudieron cargar las ofertas en este momento.</p>`;
  }
}

function renderOfertas(productos) {
  const grid = document.getElementById("ofertasGrid");

  // Usamos imágenes locales de estado.productos (verduras y frutas)
  // Los precios y ratings vienen de FakeStore API
  const productosLocales = estado.productos.filter(p => p.categoria === "verduras" || p.categoria === "frutas");
  const ofertasLocales = productosLocales.slice(0, 4);

  const html = productos.map((p, i) => {
    const local = ofertasLocales[i % ofertasLocales.length];
    const precioARS = (p.price * 950).toFixed(2);
    const precioOriginal = (p.price * 950 * 1.15).toFixed(2);
    const descuento = Math.floor(Math.random() * 20) + 10;

    return `
      <div class="oferta-card">
        <div class="oferta-badge">-${descuento}%</div>
        <img src="${local.imagen}" alt="${local.nombre}" class="oferta-img" loading="lazy">
        <div class="oferta-info">
          <span class="oferta-categoria">${local.categoria}</span>
          <h3 class="oferta-nombre">${local.nombre}</h3>
          ${generarEstrellas(p.rating.rate)}
          <div class="oferta-precios">
            <span class="precio-original">$${precioOriginal}</span>
            <span class="precio-oferta">$${precioARS}</span>
          </div>
        </div>
      </div>`;
  }).join("");

  grid.innerHTML = html;
}

// ============================================================
// API EXTERNA 2 - JSONPlaceholder → Sección "Testimonios"
// ============================================================

async function cargarTestimonios() {
  const grid = document.getElementById("testimoniosGrid");
  if (!grid) return;

  try {
    const respuesta = await fetch("https://jsonplaceholder.typicode.com/users?_limit=4");
    if (!respuesta.ok) throw new Error("JSONPlaceholder no disponible");
    const usuarios = await respuesta.json();
    renderTestimonios(usuarios);
  } catch (error) {
    grid.innerHTML = "";
  }
}

// Reviews predefinidas para cada usuario
const reviewsTexto = [
  "La pieza personalizada quedó perfecta. El acabado en PLA fue impecable y la entrega muy rápida. Sin dudas volveré a pedir más.",
  "Me sorprendió la calidad de los soportes impresos en 3D. Resistentes y con un diseño muy prolijo. Excelente servicio.",
  "Necesitaba un prototipo para mi proyecto y lo recibí en tiempo récord. La precisión del diseño fue increíble.",
  "Los accesorios impresos son únicos y de gran calidad. La atención al cliente fue excelente, me asesoraron en todo el proceso.",
];

function renderTestimonios(usuarios) {
  const grid = document.getElementById("testimoniosGrid");
  const avatarColores = ["#52b788", "#40916c", "#f4a261", "#2d6a4f"];

  const html = usuarios.map((u, i) => {
    const iniciales = u.name.split(" ").slice(0, 2).map((n) => n[0]).join("");
    return `
      <div class="testimonio-card">
        <div class="testimonio-avatar" style="background:${avatarColores[i]}">
          ${iniciales}
        </div>
        <div class="testimonio-estrellas">★★★★★</div>
        <p class="testimonio-texto">"${reviewsTexto[i]}"</p>
        <div class="testimonio-autor">
          <strong>${u.name}</strong>
          <span>${u.address.city}</span>
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
  const subtotal = estado.carrito.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0
  );
  const umbralDescuento = 100;
  const porcentajeDescuento = 0.1;
  const descuento = subtotal >= umbralDescuento ? subtotal * porcentajeDescuento : 0;
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
    cartItems.innerHTML = estado.carrito.map((item) => `
      <div class="cart-item">
        <img src="${item.imagen}" alt="${item.nombre}" class="cart-item-img">
        <div class="cart-item-info">
          <p class="cart-item-name">${item.nombre}</p>
          <p class="cart-item-price">${formatearPrecio(item.precio)} / ${item.unidad}</p>
          <div class="cart-item-controls">
            <button class="qty-btn" data-id="${item.id}" data-delta="-1">−</button>
            <span class="qty-value">${item.cantidad}</span>
            <button class="qty-btn" data-id="${item.id}" data-delta="1">+</button>
          </div>
        </div>
        <div class="cart-item-right">
          <p class="cart-item-total">${formatearPrecio(item.precio * item.cantidad)}</p>
          <button class="cart-item-delete" data-id="${item.id}">🗑️</button>
        </div>
      </div>`).join("");

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
      <p class="checkout-msg">¡Gracias por tu compra, ${estado.usuario}! Te contactaremos pronto. 🌿</p>
    </div>`;

  abrirModal("checkoutModal");
  vaciarCarrito();
}

// ============================================================
// BIENVENIDA - MODAL INICIAL
// ============================================================

function iniciarBienvenida() {
  // Pre-carga el input con un nombre de ejemplo
  document.getElementById("inputNombreUsuario").value = "vanesa";

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
    mostrarToast(`¡Bienvenida, ${nombre}!`);
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
