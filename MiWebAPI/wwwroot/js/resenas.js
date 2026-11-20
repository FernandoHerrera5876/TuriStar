document.addEventListener("DOMContentLoaded", () => {
    cargarMuroResenas();
});

async function cargarMuroResenas() {
    const contenedor = document.getElementById("muroResenas");

    try {
        const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Resena/todas`);
        const resultado = await respuesta.json();

        contenedor.innerHTML = ""; // Quita el spinner

        if (respuesta.ok && resultado.isSuccess && resultado.objeto.length > 0) {
            generarMuroHTML(resultado.objeto, contenedor);
        } else {
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

        const fotoHTML = resena.fotoUsuario
            ? `<img src="${resena.fotoUsuario}" alt="${nombre}" class="rounded-circle object-fit-cover review-avatar-ring">`
            : `<div class="bg-turistar-green text-white rounded-circle d-flex align-items-center justify-content-center fw-bold review-avatar-ring" style="font-size: 1.45rem;">${nombre.charAt(0).toUpperCase()}</div>`;

        const html = `
            <div class="card review-card mb-4">
                <div class="card-body p-4">
                    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                        <div class="d-flex align-items-center gap-3">
                            ${fotoHTML}
                            <div>
                                <h6 class="fw-bold mb-0 text-white">${nombre}</h6>
                                <small class="text-muted">${fecha}</small>
                            </div>
                        </div>
                        <div class="text-end">
                            <span class="review-destination-badge">
                                <i class="bi bi-geo-alt-fill text-turistar-green"></i> ${resena.nombreDestino}
                            </span>
                        </div>
                    </div>

                    <div class="mb-2 fs-5">
                        ${estrellasHTML}
                    </div>

                    <p class="review-quote mb-3" style="font-size: 1.03rem;">"${resena.comentario}"</p>

                    <div class="text-end">
                        <a href="detalle.html?id=${resena.idDestino}" class="btn btn-review-glass">
                            Ver destino <i class="bi bi-arrow-right-short"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
        contenedor.insertAdjacentHTML('beforeend', html);
    });
}