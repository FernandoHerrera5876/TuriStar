// js/detalle.js

// 1. Obtenemos el ID del destino desde la URL (ej: detalle.html?id=2)
const urlParams = new URLSearchParams(window.location.search);
const idDestinoActual = urlParams.get('id');

document.addEventListener("DOMContentLoaded", () => {
    if (!idDestinoActual) {
        window.location.replace("explorar.html");
        return;
    }

    // --- ¡AQUÍ ESTÁ LA VALIDACIÓN QUE FALTABA! ---
    const usuarioSesion = JSON.parse(localStorage.getItem('usuarioTuriStar'));
    if (usuarioSesion) {
        // C# puede mandarlo como esAdmin o EsAdmin
        const esAdministrador = usuarioSesion.esAdmin || usuarioSesion.EsAdmin;

        if (esAdministrador) {
            const btnEditar = document.getElementById('btnEditarDestino');
            const btnBorrar = document.getElementById('btnBorrarDestino');
            if (btnBorrar) btnBorrar.classList.remove('d-none');
            if (btnEditar) {
                btnEditar.classList.remove('d-none'); // Lo hace visible
                btnEditar.href = `nuevo_destino.html?editId=${idDestinoActual}`; // Le pasa el ID
            }
        }
    }
    // ---------------------------------------------

    cargarInfoDestino();
    cargarResenas();
    configurarFormularioResena();
    verificarEstadoFavorito();
});


function mostrarEstadoDetalle({ icono, titulo, mensaje, mostrarReintentar = false }) {
    const spinner = document.getElementById('spinnerGeneral');
    const contenido = document.getElementById('contenidoDestino');
    if (contenido) contenido.classList.add('d-none');

    if (spinner) {
        spinner.classList.remove('d-none');
        spinner.innerHTML = `
            <div class="container py-5" style="max-width: 560px;">
                <div class="card detalle-glass-card text-center p-4 p-md-5 rounded-4">
                    <i class="bi ${icono} fs-1 text-warning mb-3"></i>
                    <h2 class="h4 fw-bold text-white mb-2">${titulo}</h2>
                    <p class="text-light opacity-75 small mb-4">${mensaje}</p>
                    <div class="d-flex justify-content-center gap-2 flex-wrap">
                        ${mostrarReintentar ? `
                            <button type="button" class="btn btn-glass-ios px-4" onclick="window.location.reload()">
                                <i class="bi bi-arrow-clockwise me-1"></i> Reintentar
                            </button>
                        ` : ''}
                        <a href="explorar.html" class="btn btn-outline-light rounded-pill px-4">
                            <i class="bi bi-compass me-1"></i> Volver a Explorar
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
}

async function cargarInfoDestino() {
    try {
        const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Destino/${encodeURIComponent(idDestinoActual)}`);

        if (respuesta.status === 404) {
            mostrarEstadoDetalle({
                icono: 'bi-search',
                titulo: 'Destino no encontrado',
                mensaje: `El registro solicitado (ID ${idDestinoActual}) no existe o fue eliminado.`
            });
            return;
        }

        if (!respuesta.ok) {
            throw new Error(`HTTP ${respuesta.status}`);
        }

        const resultado = await respuesta.json();
        const destino = resultado?.objeto;

        if (!resultado.isSuccess || !destino) {
            mostrarEstadoDetalle({
                icono: 'bi-search',
                titulo: 'Destino no encontrado',
                mensaje: resultado?.respuesta || 'El destino que buscas no existe en el sistema.'
            });
            return;
        }

        // Llenar los datos en pantalla
        document.getElementById('detalleNombre').textContent = destino.nombre || 'Sin nombre';
        document.getElementById('detalleMunicipio').textContent = destino.municipio || 'Hidalgo';
        document.getElementById('detalleDescripcion').textContent = destino.descripcion || 'Sin descripción.';

        const ulHorarios = document.getElementById('listaHorariosSemana');
        if (ulHorarios) {
            ulHorarios.innerHTML = `
                <li class="mb-1"><strong class="text-white">Lunes:</strong> ${destino.horarioLunes || 'Sin dato'}</li>
                <li class="mb-1"><strong class="text-white">Martes:</strong> ${destino.horarioMartes || 'Sin dato'}</li>
                <li class="mb-1"><strong class="text-white">Miércoles:</strong> ${destino.horarioMiercoles || 'Sin dato'}</li>
                <li class="mb-1"><strong class="text-white">Jueves:</strong> ${destino.horarioJueves || 'Sin dato'}</li>
                <li class="mb-1"><strong class="text-white">Viernes:</strong> ${destino.horarioViernes || 'Sin dato'}</li>
                <li class="mb-1"><strong class="text-white">Sábado:</strong> ${destino.horarioSabado || 'Sin dato'}</li>
                <li class="mb-1"><strong class="text-white">Domingo:</strong> ${destino.horarioDomingo || 'Sin dato'}</li>
            `;
        }

        const elEntrada = document.getElementById('detallePrecioEntrada');
        if (elEntrada) elEntrada.textContent = destino.precioEntrada ?? "0";
        const elEst = document.getElementById('detallePrecioEst');
        if (elEst) elEst.textContent = destino.precioEstacionamiento ?? "0";

        const elComoLlegar = document.getElementById('detalleComoLlegar');
        if (elComoLlegar && destino.comoLlegar) {
            elComoLlegar.textContent = destino.comoLlegar;
        }

        const lat = destino.latitud || 20.101061;
        const lng = destino.longitud || -98.759131;
        const btnMapa = document.getElementById('btnComoLlegar');
        if (btnMapa) {
            btnMapa.href = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        }

        const promedio = Number(destino.calificacionPromedio || 0);
        document.getElementById('detallePromedio').textContent = promedio.toFixed(1);
        document.getElementById('detalleImagenBg').style.backgroundImage = `url('${destino.urlFoto}')`;

        document.getElementById('spinnerGeneral').classList.add('d-none');
        document.getElementById('contenidoDestino').classList.remove('d-none');
    } catch (error) {
        console.error("Error al cargar datos del destino:", error);
        mostrarEstadoDetalle({
            icono: 'bi-wifi-off',
            titulo: 'API no disponible',
            mensaje: 'No se pudo conectar con el servidor para cargar este destino. Verifica tu conexión e intenta de nuevo.',
            mostrarReintentar: true
        });
    }
}


// --- CARGAR RESEÑAS DE LA BASE DE DATOS ---
async function cargarResenas() {
    const contenedor = document.getElementById("contenedorResenasDestino");

    try {
        const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Resena/destino/${idDestinoActual}`);
        const resultado = await respuesta.json();

        contenedor.innerHTML = "";

        if (respuesta.ok && resultado.isSuccess && resultado.objeto.length > 0) {
            generarHTMLResenas(resultado.objeto, contenedor);
        } else {
            contenedor.innerHTML = `<div class="card detalle-glass-card text-center p-4 text-muted small">Aún no hay reseñas para este lugar. ¡Sé el primero en opinar!</div>`;
        }
    } catch (error) {
        console.error("Error al cargar reseñas:", error);
        contenedor.innerHTML = `<div class="alert alert-danger text-center small">Error al cargar las reseñas.</div>`;
    }
}

function generarHTMLResenas(listaResenas, contenedor) {
    listaResenas.forEach(resena => {
        let estrellasHTML = "";
        for (let i = 1; i <= 5; i++) {
            estrellasHTML += i <= resena.calificacion
                ? '<i class="bi bi-star-fill text-warning" style="filter: drop-shadow(0 0 6px rgba(250, 204, 21, 0.45));"></i> '
                : '<i class="bi bi-star text-secondary"></i> ';
        }

        const fecha = new Date(resena.fechaCreacion).toLocaleDateString();
        const nombreUsuario = resena.nombreUsuario || "Viajero";

        const fotoHTML = resena.fotoUsuario
            ? `<img src="${resena.fotoUsuario}" class="rounded-circle object-fit-cover shadow-sm" style="width: 50px; height: 50px; border: 1.5px solid #4ade80;">`
            : `<div class="bg-turistar-green text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style="width: 50px; height: 50px; font-size: 1.2rem;">${nombreUsuario.charAt(0).toUpperCase()}</div>`;

        const galeriaHTML = construirGaleriaResenaHTML(resena.fotos ?? resena.Fotos ?? resena.fotosResena);

        const html = `
            <div class="card shadow-sm border-0 rounded-4 mb-3">
                <div class="card-body p-4">
                    <div class="d-flex align-items-start gap-3 mb-2">
                        ${fotoHTML}
                        <div>
                            <h6 class="fw-bold mb-0 text-white">${nombreUsuario}</h6>
                            <small class="text-muted">${fecha}</small>
                        </div>
                    </div>
                    <div class="mb-2">
                        ${estrellasHTML}
                    </div>
                    <p class="mb-0" style="color: #cbd5e1;">${resena.comentario}</p>

                    ${galeriaHTML}
                </div>
            </div>
        `;
        contenedor.insertAdjacentHTML('beforeend', html);
    });
}


// --- ENVIAR NUEVA RESEÑA ---
let enviandoResena = false;

function configurarFormularioResena() {
    const form = document.getElementById("formNuevaResena");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (enviandoResena) return;

        const usuarioSesion = JSON.parse(localStorage.getItem('usuarioTuriStar'));
        if (!usuarioSesion) {
            mostrarAlertaResena("Debes iniciar sesión para publicar una reseña.", false);
            setTimeout(() => { window.location.href = "login.html"; }, 2000);
            return;
        }

        enviandoResena = true;
        const btn = document.getElementById("btnEnviarResena");
        const htmlOriginal = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Publicando...';

        const idDelUsuario = usuarioSesion.idUsuario || usuarioSesion.IdUsuario;

        const formData = new FormData();
        formData.append("idUsuario", idDelUsuario);
        formData.append("idDestino", parseInt(idDestinoActual, 10));
        formData.append("calificacion", document.getElementById("inputCalificacion").value);
        formData.append("comentario", document.getElementById("inputComentario").value.trim());

        const inputFotos = document.getElementById("inputFotosResena");
        if (inputFotos && inputFotos.files.length > 0) {
            for (let i = 0; i < inputFotos.files.length; i++) {
                formData.append("fotos", inputFotos.files[i]);
            }
        }

        let exito = false;

        try {
            const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Resena/registrar`, {
                method: "POST",
                body: formData
            });

            const resultado = await respuesta.json();

            if (respuesta.ok && resultado.isSuccess) {
                exito = true;
                mostrarAlertaResena("¡Tu reseña ha sido publicada!", true);
                form.reset();

                setTimeout(async () => {
                    document.getElementById("alertaResena").classList.add("d-none");
                    await cargarResenas();
                    await cargarInfoDestino();
                    enviandoResena = false;
                    btn.disabled = false;
                    btn.innerHTML = htmlOriginal;
                }, 1500);
            } else {
                mostrarAlertaResena(resultado.respuesta || resultado.mensaje || "No se pudo publicar la reseña.", false);
            }
        } catch (error) {
            console.error("Error al enviar reseña:", error);
            mostrarAlertaResena("Error de conexión al servidor.", false);
        } finally {
            if (!exito) {
                enviandoResena = false;
                btn.disabled = false;
                btn.innerHTML = htmlOriginal;
            }
        }
    });
}

function mostrarAlertaResena(mensaje, esExito) {
    const alerta = document.getElementById("alertaResena");
    alerta.textContent = mensaje;
    alerta.className = `alert mt-3 py-2 small text-center ${esExito ? 'alert-success' : 'alert-danger'}`;
    alerta.classList.remove("d-none");
}

// --- LÓGICA DE FAVORITOS ---
async function verificarEstadoFavorito() {
    const usuarioSesion = JSON.parse(localStorage.getItem('usuarioTuriStar'));
    if (!usuarioSesion) return; // Si no hay sesión, no hace nada

    const idDelUsuario = usuarioSesion.idUsuario || usuarioSesion.IdUsuario;

    try {
        // Agregamos un "timestamp" falso para engañar al navegador y que NUNCA use caché
        const url = `${CONFIG.API_URL_BASE}/Favorito/verificar/${idDelUsuario}/${idDestinoActual}?t=${new Date().getTime()}`;

        const respuesta = await fetch(url, { cache: "no-store" }); // Forzamos a no usar caché
        const resultado = await respuesta.json();

        if (respuesta.ok) {
            actualizarBotonFavorito(resultado.isFavorito);
        }
    } catch (error) {
        console.error("Error al verificar favorito", error);
    }
}

document.getElementById('btnGuardarFavorito').addEventListener('click', async () => {
    const usuarioSesion = JSON.parse(localStorage.getItem('usuarioTuriStar'));
    if (!usuarioSesion) {
        window.location.href = "login.html"; // Manda a login si no ha iniciado sesión
        return;
    }

    const btn = document.getElementById('btnGuardarFavorito');
    btn.disabled = true;

    try {
        const idDelUsuario = usuarioSesion.idUsuario || usuarioSesion.IdUsuario;
        const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Favorito/toggle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ IdUsuario: idDelUsuario, IdDestino: parseInt(idDestinoActual) })
        });

        const resultado = await respuesta.json();
        if (respuesta.ok && resultado.isSuccess) {
            actualizarBotonFavorito(resultado.isFavorito);
        }
    } catch (error) { console.error("Error al guardar favorito", error); }
    finally { btn.disabled = false; }
});

function actualizarBotonFavorito(esFavorito) {
    const btn = document.getElementById('btnGuardarFavorito');
    if (!btn) return;
    btn.style.color = '';
    if (esFavorito) {
        btn.innerHTML = `<i class="bi bi-bookmark-heart-fill me-1"></i> Guardado`;
        btn.classList.remove('btn-ios-outline-green');
        btn.classList.add('btn-ios-green');
    } else {
        btn.innerHTML = `<i class="bi bi-bookmark-heart me-1"></i> Guardar en favoritos`;
        btn.classList.remove('btn-ios-green');
        btn.classList.add('btn-ios-outline-green');
    }
}

let borrandoDestino = false;

document.getElementById('btnBorrarDestino')?.addEventListener('click', async function (e) {
    e.preventDefault();
    if (borrandoDestino) return;

    const confirmado = await confirmarEliminacionModal({
        titulo: 'Eliminar destino',
        mensaje: '¿Seguro que deseas eliminar este lugar? Si haces clic en Cancelar, el destino permanecerá intacto.',
        textoConfirmar: 'Sí, eliminar lugar'
    });

    // Cancelación de eliminación: no se llama a la API
    if (!confirmado) return;

    borrandoDestino = true;
    const htmlOriginal = this.innerHTML;
    this.classList.add('disabled');
    this.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Borrando...';

    try {
        const req = await fetch(`${CONFIG.API_URL_BASE}/Destino/eliminar/${idDestinoActual}`, { method: 'DELETE' });
        const res = await req.json();
        if (req.ok && res.isSuccess) {
            window.location.replace("explorar.html");
            return;
        }
        mostrarAlertaResena?.(res.mensaje || "No se pudo eliminar el destino.", false);
    } catch (error) {
        console.error(error);
        mostrarAlertaResena?.("Error de conexión con la API al intentar eliminar.", false);
    }

    borrandoDestino = false;
    this.classList.remove('disabled');
    this.innerHTML = htmlOriginal;
});