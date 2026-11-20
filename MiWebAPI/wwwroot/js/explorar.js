// js/explorar.js
let todosLosDestinos = [];

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("inputBuscarDestino");

    // Si llegaste desde la búsqueda del navbar (explorar.html?q=...)
    const q = new URLSearchParams(window.location.search).get("q");
    if (input && q) input.value = q;

    if (input) {
        input.addEventListener("input", () => pintarDestinos(filtrarDestinos(input.value)));
    }

    cargarDestinos();
});

async function cargarDestinos() {
    const spinner = document.getElementById("spinnerCarga");
    const input = document.getElementById("inputBuscarDestino");

    try {
        const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Destino/todos`);
        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.isSuccess) {
            todosLosDestinos = resultado.objeto || [];
            pintarDestinos(filtrarDestinos(input ? input.value : ""));
        } else {
            mostrarMensaje(resultado.respuesta || resultado.mensaje || "No se pudieron cargar los destinos.", "danger");
        }
    } catch (error) {
        console.error("Error al cargar destinos:", error);
        mostrarMensaje("Ocurrió un error de conexión con el servidor.", "danger");
    } finally {
        // Siempre quitamos el spinner, haya éxito o error
        if (spinner) spinner.classList.add("d-none");
    }
}

function filtrarDestinos(texto) {
    const t = (texto || "").trim().toLowerCase();
    if (!t) return todosLosDestinos;
    return todosLosDestinos.filter(d =>
        (d.nombre || "").toLowerCase().includes(t) ||
        (d.municipio || "").toLowerCase().includes(t)
    );
}

function pintarDestinos(lista) {
    const contenedor = document.getElementById("contenedorDestinos");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    if (lista.length === 0) {
        contenedor.innerHTML = `
            <div class="col-12 text-center py-5 text-muted">
                <i class="bi bi-search" style="font-size: 3rem;"></i>
                <h5 class="mt-3">No encontramos destinos</h5>
            </div>`;
        return;
    }

    lista.forEach(destino => {
        const calificacion = Number(destino.calificacionPromedio) || 0;
        const categoria = destino.nombreCategoria || destino.categoria || "";
        const descripcion = destino.descripcion || destino.descripcionCorta || "";
        contenedor.insertAdjacentHTML("beforeend", `
            <div class="col">
                <div class="card destination-card h-100" style="overflow: hidden;">
                    <img src="${destino.urlFoto || ''}" alt="${escaparHtml(destino.nombre)}" class="card-img-top" style="height: 200px; object-fit: cover;">
                    <div class="card-body p-3 d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
                            <h5 class="fw-bold mb-0">${escaparHtml(destino.nombre)}</h5>
                            <span class="rating-badge text-nowrap"><i class="bi bi-star-fill"></i> ${calificacion.toFixed(1)}</span>
                        </div>
                        <p class="text-turistar-green small mb-2"><i class="bi bi-geo-alt-fill me-1"></i>${escaparHtml(destino.municipio)}</p>
                        ${categoria ? `<p class="text-muted small mb-2"><i class="bi bi-tag-fill me-1"></i>${escaparHtml(categoria)}</p>` : ""}
                        ${descripcion ? `<p class="text-muted small mb-3" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${escaparHtml(descripcion)}</p>` : ""}
                        <a href="detalle.html?id=${destino.idDestino}" class="btn btn-glass-ios btn-sm w-100 mt-auto">
                            <i class="bi bi-eye me-1"></i>Ver más detalles
                        </a>
                    </div>
                </div>
            </div>`);
    });
}

function mostrarMensaje(texto, tipo) {
    const mensaje = document.getElementById("mensajeEstado");
    if (!mensaje) return;
    mensaje.textContent = texto;
    mensaje.className = `alert alert-${tipo} text-center`;
}

function escaparHtml(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}