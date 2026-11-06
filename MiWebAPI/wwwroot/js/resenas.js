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
                <div class="card border-0 shadow-sm rounded-4 text-center py-5">
                    <h5 class="text-muted">Aún no hay reseñas en la comunidad.</h5>
                    <p class="small text-secondary mb-4">¡Sé el primero en compartir tu experiencia!</p>
                    <a href="explorar.html" class="btn bg-turistar-green text-white mx-auto rounded-pill px-4">Explorar Destinos</a>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error al cargar muro:", error);
        contenedor.innerHTML = `<div class="alert alert-danger text-center">Error al cargar la comunidad.</div>`;
    }
}

function generarMuroHTML(listaResenas, contenedor) {
    listaResenas.forEach(resena => {
        let estrellasHTML = "";
        for (let i = 1; i <= 5; i++) {
            estrellasHTML += i <= resena.calificacion
                ? '<i class="bi bi-star-fill text-warning"></i> '
                : '<i class="bi bi-star text-muted"></i> ';
        }

        const fecha = new Date(resena.fechaCreacion).toLocaleDateString();

        const fotoHTML = resena.fotoUsuario
            ? `<img src="${resena.fotoUsuario}" class="rounded-circle object-fit-cover shadow-sm border border-white" style="width: 60px; height: 60px; border-width: 3px !important;">`
            : `<div class="bg-turistar-green text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm border border-white" style="width: 60px; height: 60px; border-width: 3px !important; font-size: 1.5rem;">${resena.nombreUsuario.charAt(0).toUpperCase()}</div>`;

        const html = `
            <div class="card shadow-sm border-0 rounded-4 mb-4" style="background-color: #ffffff;">
                <div class="card-body p-4">
                    <div class="d-flex align-items-center justify-content-between mb-3">
                        <div class="d-flex align-items-center gap-3">
                            ${fotoHTML}
                            <div>
                                <h6 class="fw-bold mb-0">${resena.nombreUsuario}</h6>
                                <small class="text-muted">${fecha}</small>
                            </div>
                        </div>
                        <div class="text-end">
                            <span class="badge bg-light text-dark border p-2 fw-medium">
                                <i class="bi bi-geo-alt-fill text-success"></i> ${resena.nombreDestino}
                            </span>
                        </div>
                    </div>
                    <div class="mb-2 fs-5">
                        ${estrellasHTML}
                    </div>
                    <p class="text-secondary mb-3" style="font-size: 1.05rem;">"${resena.comentario}"</p>
                    
                    <div class="text-end">
                        <a href="detalle.html?id=${resena.idDestino}" class="btn btn-sm btn-outline-success rounded-pill fw-medium px-3" style="color: #528233; border-color: #528233;">
                            Ver destino
                        </a>
                    </div>
                </div>
            </div>
        `;
        contenedor.insertAdjacentHTML('beforeend', html);
    });
}