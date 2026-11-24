/* ==========================================================
   PROTECCIÓN GLOBAL DE SESIÓN (PÁGINAS PRIVADAS + BFCACHE)
   ========================================================== */
function obtenerSesionValida() {
    try {
        const raw = localStorage.getItem('usuarioTuriStar');
        if (!raw) return null;
        const usr = JSON.parse(raw);
        const id = parseInt(usr?.idUsuario ?? usr?.IdUsuario, 10);
        if (!usr || isNaN(id) || id <= 0) return null;
        return usr;
    } catch {
        localStorage.removeItem('usuarioTuriStar');
        return null;
    }
}

function validarAccesoPagina() {
    const ruta = window.location.pathname.toLowerCase();
    const esLogin = ruta.endsWith('/login.html') || ruta === 'login.html';
    const paginasSoloAdmin = ['dashboard.html', 'gestion_categorias.html', 'empleados.html'];

    const sesion = obtenerSesionValida();

    // 1. Si no hay sesión y no estamos en login.html -> expulsar al login
    if (!sesion && !esLogin) {
        localStorage.removeItem('usuarioTuriStar');
        window.location.replace('login.html');
        return false;
    }

    // 2. Si intenta entrar a vistas de administrador siendo viajero -> regresar a explorar
    if (sesion && paginasSoloAdmin.some(p => ruta.endsWith('/' + p) || ruta === p)) {
        const esAdmin = Boolean(sesion.esAdmin ?? sesion.EsAdmin);
        if (!esAdmin) {
            window.location.replace('explorar.html');
            return false;
        }
    }

    return true;
}

// Ejecutar de inmediato al cargar el script
validarAccesoPagina();

// Revalidar si el usuario presiona "Atrás" tras cerrar sesión (bfcache)
window.addEventListener('pageshow', (e) => {
    if (e.persisted) validarAccesoPagina();
});

const SESSION_KEY = "usuarioTuriStar";

// Activar modo oscuro global de Bootstrap y color de barra móvil en todas las vistas
document.documentElement.setAttribute("data-bs-theme", "dark");
if (!document.querySelector('meta[name="theme-color"]')) {
    const metaTheme = document.createElement("meta");
    metaTheme.name = "theme-color";
    metaTheme.content = "#0b1320";
    document.head.appendChild(metaTheme);
}

async function cargarFooter() {
    if (document.getElementById("footer-turistar")) return;

    let placeholder = document.getElementById("footer-placeholder");
    if (!placeholder) {
        placeholder = document.createElement("div");
        placeholder.id = "footer-placeholder";
        document.body.appendChild(placeholder);
    }

    try {
        const resp = await fetch("components/footer.html?v=" + new Date().getTime());
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        placeholder.innerHTML = await resp.text();
    } catch (err) {
        console.error("Error cargando footer.html:", err);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    cargarFooter();

    fetch('components/navbar.html?v=' + new Date().getTime())
        .then(response => response.text())
        .then(data => {
            const placeholder = document.getElementById('navbar-placeholder');
            if (!placeholder) return;
            placeholder.innerHTML = data;

            const navElement = placeholder.querySelector('nav');
            if (navElement && !navElement.id) {
                navElement.id = 'mainNavbar';
            }

            const currentLocation = location.href;
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                if (link.href === currentLocation) {
                    link.classList.add('active');
                }
            });

            const valorSesion = localStorage.getItem(SESSION_KEY);
            const spanUsuario = document.getElementById('userGreeting');
            const btnCerrar = document.getElementById('btnCerrarSesion');
            const loginLink = document.getElementById('loginLink');

            if (valorSesion) {
                try {
                    const usuario = JSON.parse(valorSesion);
                    const nombreReal = usuario.nombre || usuario.nombres || usuario.Nombre || 'Usuario';
                    const esAdmin = Boolean(usuario.esAdmin ?? usuario.EsAdmin);

                    if (spanUsuario) {
                        spanUsuario.textContent = `Hola, ${nombreReal}`;
                        spanUsuario.classList.remove('d-none');
                        spanUsuario.style.display = 'inline-block';
                    }
                    if (btnCerrar) {
                        btnCerrar.classList.remove('d-none');
                        btnCerrar.style.setProperty('display', 'inline-flex', 'important');
                    }
                    if (loginLink) {
                        loginLink.classList.add('d-none');
                        loginLink.style.display = 'none';
                    }

                    // Botón de acceso a Gráficas (Dashboard) exclusivo para administradores
                    let btnAdmin = document.getElementById('btnAdminGraficas');
                    if (esAdmin && !btnAdmin) {
                        btnAdmin = document.createElement('a');
                        btnAdmin.id = 'btnAdminGraficas';
                        btnAdmin.href = 'dashboard.html';
                        btnAdmin.className = 'btn btn-glass-ios btn-sm text-decoration-none d-inline-flex align-items-center gap-1 me-2';
                        btnAdmin.innerHTML = '<i class="bi bi-bar-chart-fill text-turistar-green"></i> Gráficas';

                        if (spanUsuario && spanUsuario.parentElement) {
                            spanUsuario.parentElement.insertBefore(btnAdmin, spanUsuario);
                        } else {
                            const navList = placeholder.querySelector('.navbar-nav');
                            if (navList) {
                                const li = document.createElement('li');
                                li.className = 'nav-item d-flex align-items-center ms-lg-2';
                                li.appendChild(btnAdmin);
                                navList.appendChild(li);
                            }
                        }
                    } else if (!esAdmin && btnAdmin) {
                        btnAdmin.remove();
                    }
                } catch (e) {
                    localStorage.removeItem(SESSION_KEY);
                }
            } else {
                document.getElementById('btnAdminGraficas')?.remove();
                if (spanUsuario) {
                    spanUsuario.classList.add('d-none');
                    spanUsuario.style.display = 'none';
                }
                if (btnCerrar) {
                    btnCerrar.classList.add('d-none');
                    btnCerrar.style.setProperty('display', 'none', 'important');
                }
                if (loginLink) {
                    loginLink.classList.remove('d-none');
                    loginLink.style.display = 'inline-block';
                }
            }

            const navbar = document.getElementById('mainNavbar') || document.querySelector('.navbar-turistar');
            if (navbar) {
                let ticking = false;
                const handleScroll = () => {
                    if (!ticking) {
                        window.requestAnimationFrame(() => {
                            if (window.scrollY > 20) {
                                navbar.classList.add('navbar-scrolled');
                            } else {
                                navbar.classList.remove('navbar-scrolled');
                            }
                            ticking = false;
                        });
                        ticking = true;
                    }
                };
                window.addEventListener('scroll', handleScroll, { passive: true });
                handleScroll();
            }
        });
});

function cerrarSesion() {
    localStorage.removeItem(SESSION_KEY);
    window.location.replace('login.html');
}

// Búsqueda con Enter
document.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const elementoActivo = e.target;
        if (elementoActivo.tagName === "INPUT" && elementoActivo.closest("#navbar-placeholder, nav, header")) {
            e.preventDefault();
            const termino = elementoActivo.value.trim();
            if (termino !== "") {
                window.location.href = `explorar.html?q=${encodeURIComponent(termino)}`;
            }
        }
    }
});

// Búsqueda con clic en la lupa
document.addEventListener("click", (e) => {
    const iconoLupa = e.target.closest(".bi-search, .input-group-text");
    if (iconoLupa && iconoLupa.closest("#navbar-placeholder, nav, header")) {
        const inputAsociado = iconoLupa.closest(".input-group").querySelector("input");
        if (inputAsociado && inputAsociado.value.trim() !== "") {
            window.location.href = `explorar.html?q=${encodeURIComponent(inputAsociado.value.trim())}`;
        }
    }
});

/* ==========================================================
   CONTROLADOR DE DESENFOQUE DINÁMICO POR SCROLL (CARRUSEL)
   ========================================================== */
window.addEventListener('scroll', function () {
    const marquee = document.querySelector('.marquee-container');
    if (!marquee) return;

    const scrollPos = window.scrollY;
    let blurAmount = Math.max(0, 18 - (scrollPos * 0.08));
    let opacityAmount = Math.min(1, 0.2 + (scrollPos * 0.005));
    let translateYAmount = Math.max(0, 40 - (scrollPos * 0.15));

    marquee.style.filter = `blur(${blurAmount}px)`;
    marquee.style.opacity = opacityAmount;
    marquee.style.transform = `translateY(${translateYAmount}px)`;
    marquee.style.transition = 'filter 0.1s ease-out, opacity 0.1s ease-out, transform 0.1s ease-out';
}, { passive: true });

/* ==========================================================
   HELPER GLOBAL DE PAGINACIÓN (ESTILO CRISTAL)
   ========================================================== */
function renderizarPaginacion({
    contenedorId,
    totalItems,
    porPagina,
    paginaActual,
    onCambioPagina,
    compacto = false,
    scrollTargetId = null
}) {
    const nav = document.getElementById(contenedorId);
    if (!nav) return;

    const totalPaginas = Math.ceil(totalItems / porPagina);
    nav.innerHTML = "";

    // Si todo cabe en 1 página, ocultamos los controles
    if (totalPaginas <= 1) return;

    const irAPagina = (nuevaPagina) => {
        if (nuevaPagina < 1 || nuevaPagina > totalPaginas || nuevaPagina === paginaActual) return;
        onCambioPagina(nuevaPagina);
        if (scrollTargetId) {
            const target = document.getElementById(scrollTargetId);
            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    };

    const crearBoton = (contenidoHtml, disabled, active, onClick, ariaLabel) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `turistar-page-btn${active ? " active" : ""}`;
        btn.innerHTML = contenidoHtml;
        btn.disabled = disabled;
        if (ariaLabel) btn.setAttribute("aria-label", ariaLabel);
        if (!disabled) btn.addEventListener("click", onClick);
        return btn;
    };

    // Botón Anterior
    nav.appendChild(crearBoton(
        compacto ? '<i class="bi bi-chevron-left"></i>' : '<i class="bi bi-chevron-left"></i> Anterior',
        paginaActual === 1,
        false,
        () => irAPagina(paginaActual - 1),
        "Página anterior"
    ));

    // Ventana de páginas visibles (para no saturar si hay muchas)
    const maxBotones = compacto ? 3 : 5;
    let inicio = Math.max(1, paginaActual - Math.floor(maxBotones / 2));
    let fin = Math.min(totalPaginas, inicio + maxBotones - 1);
    if (fin - inicio + 1 < maxBotones) {
        inicio = Math.max(1, fin - maxBotones + 1);
    }

    if (!compacto && inicio > 1) {
        nav.appendChild(crearBoton("1", false, paginaActual === 1, () => irAPagina(1)));
        if (inicio > 2) {
            const puntos = document.createElement("span");
            puntos.className = "text-muted px-1";
            puntos.textContent = "…";
            nav.appendChild(puntos);
        }
    }

    for (let i = inicio; i <= fin; i++) {
        nav.appendChild(crearBoton(String(i), false, i === paginaActual, () => irAPagina(i)));
    }

    if (!compacto && fin < totalPaginas) {
        if (fin < totalPaginas - 1) {
            const puntos = document.createElement("span");
            puntos.className = "text-muted px-1";
            puntos.textContent = "…";
            nav.appendChild(puntos);
        }
        nav.appendChild(crearBoton(String(totalPaginas), false, paginaActual === totalPaginas, () => irAPagina(totalPaginas)));
    }

    // Botón Siguiente
    nav.appendChild(crearBoton(
        compacto ? '<i class="bi bi-chevron-right"></i>' : 'Siguiente <i class="bi bi-chevron-right"></i>',
        paginaActual === totalPaginas,
        false,
        () => irAPagina(paginaActual + 1),
        "Página siguiente"
    ));

    // Texto informativo
    const desde = (paginaActual - 1) * porPagina + 1;
    const hasta = Math.min(paginaActual * porPagina, totalItems);
    const info = document.createElement("div");
    info.className = "turistar-page-info";
    info.textContent = compacto
        ? `Página ${paginaActual} de ${totalPaginas} (${totalItems} lugares)`
        : `Mostrando ${desde}–${hasta} de ${totalItems} resultados`;
    nav.appendChild(info);
}

/* ==========================================================
   GALERÍA Y VISOR LIGHTBOX GLOBAL PARA IMÁGENES DE RESEÑAS
   ========================================================== */
function obtenerUrlImagenResena(url) {
    if (!url) return "";
    const limpio = String(url).trim();
    if (!limpio) return "";
    if (/^(https?:|data:|blob:)/i.test(limpio)) return limpio;

    const base = (typeof CONFIG !== "undefined" && CONFIG.API_URL_BASE)
        ? CONFIG.API_URL_BASE.replace('/api/Auth', '').replace('/api/Resena', '').replace('/api', '')
        : "";
    return `${base}${limpio.startsWith("/") ? limpio : "/" + limpio}`;
}

function construirGaleriaResenaHTML(fotos) {
    let lista = [];
    if (Array.isArray(fotos)) {
        lista = fotos;
    } else if (typeof fotos === "string" && fotos.trim() !== "") {
        lista = fotos.split(",");
    }

    const urlsValidas = lista
        .map(u => obtenerUrlImagenResena(u))
        .filter(u => u !== "");

    if (urlsValidas.length === 0) return "";

    const imgs = urlsValidas.map((src, idx) => `
        <img src="${src}"
             alt="Foto de reseña ${idx + 1}"
             loading="lazy"
             class="resena-thumb rounded-3 shadow-sm object-fit-cover">
    `).join("");

    return `<div class="resena-galeria d-flex gap-2 mt-3 flex-wrap">${imgs}</div>`;
}

let _lightboxUrls = [];
let _lightboxIndice = 0;

function asegurarVisorLightbox() {
    let overlay = document.getElementById("turistarLightbox");
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = "turistarLightbox";
    overlay.className = "turistar-lightbox";
    overlay.innerHTML = `
        <div class="turistar-lightbox-box">
            <button type="button" class="turistar-lightbox-btn turistar-lightbox-close" id="lightboxCerrar" aria-label="Cerrar">
                <i class="bi bi-x-lg"></i>
            </button>
            <button type="button" class="turistar-lightbox-btn turistar-lightbox-prev d-none" id="lightboxPrev" aria-label="Anterior">
                <i class="bi bi-chevron-left"></i>
            </button>
            <img id="lightboxImagen" class="turistar-lightbox-img" src="" alt="Vista ampliada">
            <button type="button" class="turistar-lightbox-btn turistar-lightbox-next d-none" id="lightboxNext" aria-label="Siguiente">
                <i class="bi bi-chevron-right"></i>
            </button>
            <div id="lightboxContador" class="turistar-lightbox-counter"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    const cerrar = () => {
        overlay.classList.remove("active");
        document.body.style.overflow = "";
    };

    const mover = (delta) => {
        if (_lightboxUrls.length <= 1) return;
        _lightboxIndice = (_lightboxIndice + delta + _lightboxUrls.length) % _lightboxUrls.length;
        actualizarVistaLightbox();
    };

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) cerrar();
    });
    overlay.querySelector("#lightboxCerrar").addEventListener("click", cerrar);
    overlay.querySelector("#lightboxPrev").addEventListener("click", () => mover(-1));
    overlay.querySelector("#lightboxNext").addEventListener("click", () => mover(1));

    document.addEventListener("keydown", (e) => {
        if (!overlay.classList.contains("active")) return;
        if (e.key === "Escape") cerrar();
        if (e.key === "ArrowLeft") mover(-1);
        if (e.key === "ArrowRight") mover(1);
    });

    return overlay;
}

function actualizarVistaLightbox() {
    const img = document.getElementById("lightboxImagen");
    const contador = document.getElementById("lightboxContador");
    const btnPrev = document.getElementById("lightboxPrev");
    const btnNext = document.getElementById("lightboxNext");

    if (img) img.src = _lightboxUrls[_lightboxIndice] || "";
    const tieneMultiples = _lightboxUrls.length > 1;
    if (btnPrev) btnPrev.classList.toggle("d-none", !tieneMultiples);
    if (btnNext) btnNext.classList.toggle("d-none", !tieneMultiples);
    if (contador) {
        contador.textContent = tieneMultiples
            ? `Foto ${_lightboxIndice + 1} de ${_lightboxUrls.length}`
            : "Haz clic fuera o presiona Esc para cerrar";
    }
}

function abrirVisorImagenes(urls, indiceInicial = 0) {
    if (!Array.isArray(urls) || urls.length === 0) return;
    _lightboxUrls = urls;
    _lightboxIndice = Math.min(Math.max(0, indiceInicial), urls.length - 1);

    const overlay = asegurarVisorLightbox();
    actualizarVistaLightbox();
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
}

// Delegación global: cualquier foto con .resena-thumb abre el visor al hacer clic
document.addEventListener("click", (e) => {
    const thumb = e.target.closest(".resena-thumb");
    if (!thumb) return;
    e.preventDefault();
    e.stopPropagation();

    const galeria = thumb.closest(".resena-galeria");
    const imagenes = galeria
        ? Array.from(galeria.querySelectorAll(".resena-thumb"))
        : [thumb];

    const urls = imagenes.map(img => img.src);
    const indice = Math.max(0, imagenes.indexOf(thumb));
    abrirVisorImagenes(urls, indice);
});

/* ==========================================================
   MODAL GLOBAL DE CONFIRMACIÓN / CANCELACIÓN DE ELIMINACIÓN
   ========================================================== */
function confirmarEliminacionModal({ titulo = "¿Confirmar eliminación?", mensaje = "Esta acción no se puede deshacer.", textoConfirmar = "Sí, eliminar" } = {}) {
    return new Promise((resolve) => {
        let modalEl = document.getElementById('modalConfirmarEliminacion');
        if (!modalEl) {
            modalEl = document.createElement('div');
            modalEl.id = 'modalConfirmarEliminacion';
            modalEl.className = 'modal fade';
            modalEl.tabIndex = -1;
            modalEl.setAttribute('aria-hidden', 'true');
            modalEl.innerHTML = `
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 rounded-4 shadow-lg" style="background: linear-gradient(155deg, rgba(22,35,58,0.98) 0%, rgba(11,19,32,0.99) 100%); border: 1px solid rgba(248,113,113,0.45) !important; color: #f8fafc;">
                        <div class="modal-header border-0 pb-0">
                            <h5 class="modal-title fw-bold text-white" id="modalConfirmarTitulo"></h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                        </div>
                        <div class="modal-body text-light small" id="modalConfirmarMensaje"></div>
                        <div class="modal-footer border-0 pt-0">
                            <button type="button" class="btn btn-outline-light btn-sm rounded-pill px-3" id="btnCancelarEliminacion" data-bs-dismiss="modal">
                                Cancelar
                            </button>
                            <button type="button" class="btn btn-danger btn-sm rounded-pill px-4 fw-semibold" id="btnConfirmarEliminacion"></button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modalEl);
        }

        document.getElementById('modalConfirmarTitulo').innerHTML = `<i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>${titulo}`;
        document.getElementById('modalConfirmarMensaje').textContent = mensaje;
        const btnConfirmar = document.getElementById('btnConfirmarEliminacion');
        btnConfirmar.textContent = textoConfirmar;

        const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
        let resuelto = false;

        const onConfirmar = () => {
            resuelto = true;
            bsModal.hide();
            resolve(true);
        };

        const onOcultar = () => {
            btnConfirmar.removeEventListener('click', onConfirmar);
            modalEl.removeEventListener('hidden.bs.modal', onOcultar);
            if (!resuelto) resolve(false);
        };

        btnConfirmar.addEventListener('click', onConfirmar);
        modalEl.addEventListener('hidden.bs.modal', onOcultar);
        bsModal.show();
    });
}

/* ==========================================================
   BOTÓN TACHE (×) AUTOMÁTICO EN BARRAS DE BÚSQUEDA
   ========================================================== */
function inicializarBotonesLimpiarBusqueda() {
    const selectores = [
        '#inputBuscarDestino',
        '#navbar-placeholder .input-group input[type="text"]',
        '#navbar-placeholder .input-group input[type="search"]',
        'nav .input-group input[type="text"]',
        'nav .input-group input[type="search"]'
    ];

    const inputs = document.querySelectorAll(selectores.join(', '));

    inputs.forEach((input) => {
        if (input.dataset.clearReady === '1') {
            // Re-sincronizar visibilidad por si JS llenó el valor desde ?q=...
            const btnExistente = input.closest('.search-clear-wrap')?.querySelector('.btn-clear-search');
            if (btnExistente) btnExistente.classList.toggle('d-none', input.value.length === 0);
            return;
        }

        const grupo = input.closest('.input-group');
        if (!grupo) return;

        input.dataset.clearReady = '1';
        grupo.classList.add('search-clear-wrap');
        input.classList.add('search-clear-input');

        const btnLimpiar = document.createElement('button');
        btnLimpiar.type = 'button';
        btnLimpiar.className = 'btn-clear-search d-none';
        btnLimpiar.setAttribute('aria-label', 'Limpiar búsqueda');
        btnLimpiar.setAttribute('title', 'Limpiar búsqueda');
        btnLimpiar.innerHTML = '<i class="bi bi-x-lg"></i>';

        grupo.appendChild(btnLimpiar);

        const actualizarVisibilidad = () => {
            btnLimpiar.classList.toggle('d-none', input.value.length === 0);
        };

        input.addEventListener('input', actualizarVisibilidad);
        input.addEventListener('change', actualizarVisibilidad);

        btnLimpiar.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            input.value = '';
            actualizarVisibilidad();

            // Dispara el filtrado en tiempo real (ej. explorar.js muestra todos los destinos de nuevo)
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));

            // Si la URL tenía ?q=..., la limpia para que al recargar no regrese el filtro borrado
            if (input.id === 'inputBuscarDestino' && window.location.search.includes('q=')) {
                window.history.replaceState({}, '', window.location.pathname);
            }

            input.focus();
        });

        actualizarVisibilidad();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    inicializarBotonesLimpiarBusqueda();

    // Cubre cuando el navbar se inyecta de forma asíncrona o cuando explorar.js llena ?q=
    setTimeout(inicializarBotonesLimpiarBusqueda, 250);

    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    if (navbarPlaceholder) {
        const observer = new MutationObserver(() => inicializarBotonesLimpiarBusqueda());
        observer.observe(navbarPlaceholder, { childList: true, subtree: true });
    }
});