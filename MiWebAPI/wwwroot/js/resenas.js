let todasLasResenas = [];
let filtroDestinoId = "todos";
let filtroDestinoNombre = "";
let paginaActualResenas = 1;
const RESENAS_POR_PAGINA = 5;

document.addEventListener("DOMContentLoaded", () => {
    const btnLimpiar = document.getElementById("btnLimpiarFiltro");
    if (btnLimpiar) {
        btnLimpiar.addEventListener("click", () => aplicarFiltroLugar("todos", ""));
    }

    cargarMuroResenas();
});

async function cargarMuroResenas() {
    const contenedor = document.getElementById("muroResenas");

    try {
        const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Resena/todas`);
        const resultado = await respuesta.json();

        contenedor.innerHTML = "";

        if (respuesta.ok && resultado.isSuccess && resultado.objeto.length > 0) {
            todasLasResenas = resultado.objeto;
            poblarMenuLugares(todasLasResenas);
            actualizarVistaResenas();
        } else {
            poblarMenuLugares([]);
            contenedor.innerHTML = `
                <div class="card review-card border-0 text-center py-5 px-4">
                    <h5 class="text-white mb-2">Aún no hay reseñas en la comunidad.</h5>
                    <p class="small text-muted mb-4">¡Sé el primero en compartir tu experiencia!</p>
                    <a href="explorar.html" class="btn btn-glass-ios mx-auto rounded-pill px-4">Explorar Destinos</a>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error al cargar muro:", error);
        contenedor.innerHTML = `<div class="alert alert-danger text-center rounded-4">Error al cargar la comunidad.</div>`;
    }
}

function poblarMenuLugares(listaResenas) {
    const menu = document.getElementById("menuFiltroLugares");
    if (!menu) return;

    // Agrupamos destinos únicos con su cantidad de reseñas
    const mapaDestinos = new Map();
    listaResenas.forEach(r => {
        const clave = String(r.idDestino ?? r.nombreDestino);
        const nombre = r.nombreDestino || "Sin nombre";
        if (!mapaDestinos.has(clave)) {
            mapaDestinos.set(clave, { id: clave, nombre, total: 1 });
        } else {
            mapaDestinos.get(clave).total++;
        }
    });

    const destinosOrdenados = Array.from(mapaDestinos.values())
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

    menu.innerHTML = "";

    // Opción "Todos los lugares"
    const liTodos = document.createElement("li");
    const btnTodos = document.createElement("button");
    btnTodos.type = "button";
    btnTodos.className = `dropdown-item${filtroDestinoId === "todos" ? " active" : ""}`;
    btnTodos.innerHTML = `
        <span><i class="bi bi-grid-fill me-2"></i>Todos los lugares</span>
        <span class="filter-count-pill">${listaResenas.length}</span>
    `;
    btnTodos.addEventListener("click", () => aplicarFiltroLugar("todos", ""));
    liTodos.appendChild(btnTodos);
    menu.appendChild(liTodos);

    if (destinosOrdenados.length > 0) {
        const divider = document.createElement("li");
        divider.innerHTML = `<hr class="dropdown-divider border-secondary border-opacity-25 my-1">`;
        menu.appendChild(divider);
    }

    destinosOrdenados.forEach(dest => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `dropdown-item${filtroDestinoId === dest.id ? " active" : ""}`;
        btn.innerHTML = `
            <span class="text-truncate"><i class="bi bi-geo-alt-fill text-turistar-green me-2"></i>${escaparHtmlResena(dest.nombre)}</span>
            <span class="filter-count-pill">${dest.total}</span>
        `;
        btn.addEventListener("click", () => aplicarFiltroLugar(dest.id, dest.nombre));
        li.appendChild(btn);
        menu.appendChild(li);
    });
}

function aplicarFiltroLugar(idDestino, nombreDestino) {
    filtroDestinoId = String(idDestino);
    filtroDestinoNombre = nombreDestino || "";
    paginaActualResenas = 1;

    const textoBtn = document.getElementById("textoBtnFiltro");
    const btnLimpiar = document.getElementById("btnLimpiarFiltro");

    if (filtroDestinoId === "todos") {
        if (textoBtn) textoBtn.textContent = "Filtrar por lugar";
        if (btnLimpiar) btnLimpiar.classList.add("d-none");
    } else {
        if (textoBtn) textoBtn.textContent = filtroDestinoNombre;
        if (btnLimpiar) btnLimpiar.classList.remove("d-none");
    }

    poblarMenuLugares(todasLasResenas);
    actualizarVistaResenas();
}

function actualizarVistaResenas() {
    const contenedor = document.getElementById("muroResenas");
    const estadoFiltro = document.getElementById("estadoFiltroResenas");
    if (!contenedor) return;

    const filtradas = filtroDestinoId === "todos"
        ? todasLasResenas
        : todasLasResenas.filter(r => String(r.idDestino ?? r.nombreDestino) === filtroDestinoId);

    if (estadoFiltro) {
        estadoFiltro.innerHTML = filtroDestinoId === "todos"
            ? `Mostrando <strong class="text-white">${filtradas.length}</strong> reseñas en total`
            : `Filtrado por <strong class="text-turistar-green">${escaparHtmlResena(filtroDestinoNombre)}</strong> (${filtradas.length})`;
    }

    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / RESENAS_POR_PAGINA));
    if (paginaActualResenas > totalPaginas) paginaActualResenas = totalPaginas;

    const inicio = (paginaActualResenas - 1) * RESENAS_POR_PAGINA;
    const paginaItems = filtradas.slice(inicio, inicio + RESENAS_POR_PAGINA);

    contenedor.innerHTML = "";

    if (paginaItems.length === 0) {
        contenedor.innerHTML = `
            <div class="card review-card border-0 text-center py-5 px-4">
                <h5 class="text-white mb-2">No hay reseñas para este lugar.</h5>
                <p class="small text-muted mb-3">Prueba seleccionando otro destino o vuelve a ver todas.</p>
                <button type="button" class="btn btn-glass-ios mx-auto rounded-pill px-4" onclick="aplicarFiltroLugar('todos', '')">Ver todas las reseñas</button>
            </div>
        `;
    } else {
        generarMuroHTML(paginaItems, contenedor);
    }

    renderizarPaginacion({
        contenedorId: "paginacionResenas",
        totalItems: filtradas.length,
        porPagina: RESENAS_POR_PAGINA,
        paginaActual: paginaActualResenas,
        scrollTargetId: "muroResenas",
        onCambioPagina: (nuevaPagina) => {
            paginaActualResenas = nuevaPagina;
            actualizarVistaResenas();
        }
    });
}

function generarMuroHTML(listaResenas, contenedor) {
    listaResenas.forEach(resena => {
        let estrellasHTML = "";
        for (let i = 1; i <= 5; i++) {
            estrellasHTML += i <= resena.calificacion
                ? '<i class="bi bi-star-fill text-warning" style="filter: drop-shadow(0 0 6px rgba(250, 204, 21, 0.45));"></i> '
                : '<i class="bi bi-star text-secondary"></i> ';
        }

        const fecha = new Date(resena.fechaCreacion).toLocaleDateString();
        const nombre = resena.nombreUsuario || "Viajero";
        const destinoClave = String(resena.idDestino ?? resena.nombreDestino);

        const fotoHTML = resena.fotoUsuario
            ? `<img src="${resena.fotoUsuario}" alt="${escaparHtmlResena(nombre)}" class="rounded-circle object-fit-cover review-avatar-ring">`
            : `<div class="bg-turistar-green text-white rounded-circle d-flex align-items-center justify-content-center fw-bold review-avatar-ring" style="font-size: 1.45rem;">${escaparHtmlResena(nombre.charAt(0).toUpperCase())}</div>`;

        // Galería de imágenes de la reseña (punto 2.2 y 2.3)
        const galeriaHTML = construirGaleriaResenaHTML(resena.fotos ?? resena.Fotos ?? resena.fotosResena);

        const card = document.createElement("div");
        card.className = "card review-card mb-4";
        card.innerHTML = `
            <div class="card-body p-4">
                <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                    <div class="d-flex align-items-center gap-3">
                        ${fotoHTML}
                        <div>
                            <h6 class="fw-bold mb-0 text-white">${escaparHtmlResena(nombre)}</h6>
                            <small class="text-muted">${fecha}</small>
                        </div>
                    </div>
                    <div class="text-end">
                        <span class="review-destination-badge" title="Filtrar reseñas de este lugar">
                            <i class="bi bi-geo-alt-fill text-turistar-green"></i> ${escaparHtmlResena(resena.nombreDestino)}
                        </span>
                    </div>
                </div>

                <div class="mb-2 fs-5">
                    ${estrellasHTML}
                </div>

                <p class="review-quote mb-0" style="font-size: 1.03rem;">"${escaparHtmlResena(resena.comentario)}"</p>

                ${galeriaHTML}

                <div class="text-end mt-3">
                    <a href="detalle.html?id=${resena.idDestino}" class="btn btn-review-glass">
                        Ver destino <i class="bi bi-arrow-right-short"></i>
                    </a>
                </div>
            </div>
        `;

        const badge = card.querySelector(".review-destination-badge");
        if (badge) {
            badge.addEventListener("click", () => aplicarFiltroLugar(destinoClave, resena.nombreDestino));
        }

        contenedor.appendChild(card);
    });
}

function escaparHtmlResena(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}