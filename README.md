# 🌿 ProyectoFinalFeris — Organic Fruits

Ecommerce de frutas y verduras orgánicas. Proyecto final para CoderHouse JavaScript.

## 📁 Estructura del proyecto

```
ProyectoFinalFeris/
├── index.html              ← Página principal
├── css/
│   ├── styles.css          ← Estilos globales
│   └── pages.css           ← Estilos páginas internas
├── js/
│   └── app.js              ← Lógica principal JS
├── data/
│   └── products.json       ← Datos de productos (JSON local)
├── img/
│   ├── banner_1_.jpg
│   ├── manzana.jpg
│   ├── bananas.jpg
│   ├── pera.jpg
│   ├── uvas.jpg
│   ├── sandia.jpg
│   ├── naranja.jpg
│   ├── limon.jpg
│   ├── brocoli.jpg
│   ├── tomate.jpg
│   ├── zanahoria.jpg
│   ├── pimiento.jpg
│   └── berenjena.jpg
└── pages/
    ├── nosotros.html
    ├── preguntas.html
    ├── terminos.html
    └── politicas.html
```

## 🚀 Cómo abrir el proyecto

1. Cloná el repositorio
2. Copiá tus imágenes a la carpeta `/img/`
3. Abrí `index.html` en tu navegador  
   ⚠️ Para que el JSON local funcione, usá **Live Server** en VS Code

## ✅ Funcionalidades

- Catálogo de productos cargados desde `products.json` (async/await)
- Filtro por categoría (frutas, cítricos, verduras)
- Búsqueda en tiempo real
- Carrito con localStorage
- Descuento automático del 10% en compras mayores a $100
- Modales custom (sin alert/prompt/confirm)
- Notificaciones con **SweetAlert2**
- **FakeStore API** → sección Ofertas Especiales
- **JSONPlaceholder API** → sección Testimonios
- Páginas: Nosotros, Preguntas Frecuentes, Términos, Políticas de Envío

## 📚 Tecnologías

- HTML5 + CSS3 (variables, grid, flexbox)
- JavaScript ES6+ (async/await, fetch, localStorage, clases)
- SweetAlert2
- FakeStore API
- JSONPlaceholder API
