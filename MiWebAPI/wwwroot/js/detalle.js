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


// --- CARGAR DATOS PRINCIPALES DEL DESTINO ---
async function cargarInfoDestino() {
    try {
        const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Destino/todos`);
        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.isSuccess) {
            const destino = resultado.objeto.find(d => d.idDestino == idDestinoActual);

            if (destino) {
                // Llenamos el HTML de la cabecera (usando || por si algún dato es null)
                document.getElementById('detalleNombre').textContent = destino.nombre;
                document.getElementById('detalleMunicipio').textContent = destino.municipio;
                document.getElementById('detalleDescripcion').textContent = destino.descripcion;
                const ulHorarios = document.getElementById('listaHorariosSemana');
                if (ulHorarios) {
                    ulHorarios.innerHTML = `
                        <li class="mb-1"><strong class="text-dark">Lunes:</strong> ${destino.horarioLunes || 'Sin dato'}</li>
                        <li class="mb-1"><strong class="text-dark">Martes:</strong> ${destino.horarioMartes || 'Sin dato'}</li>
                        <li class="mb-1"><strong class="text-dark">Miércoles:</strong> ${destino.horarioMiercoles || 'Sin dato'}</li>
                        <li class="mb-1"><strong class="text-dark">Jueves:</strong> ${destino.horarioJueves || 'Sin dato'}</li>
                        <li class="mb-1"><strong class="text-dark">Viernes:</strong> ${destino.horarioViernes || 'Sin dato'}</li>
                        <li class="mb-1"><strong class="text-dark">Sábado:</strong> ${destino.horarioSabado || 'Sin dato'}</li>
                        <li class="mb-1"><strong class="text-dark">Domingo:</strong> ${destino.horarioDomingo || 'Sin dato'}</li>
                    `;
                }
                document.getElementById('detallePrecioEntrada').textContent = destino.precioEntrada || "0";
                document.getElementById('detallePrecioEst').textContent = destino.precioEstacionamiento || "0";
                const lat = destino.latitud || 20.101061;
                const lng = destino.longitud || -98.759131;
                document.getElementById('btnComoLlegar').href = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

                // Si la calificación promedio viene nula, ponemos 0.0
                const promedio = destino.calificacionPromedio || 0;
                document.getElementById('detallePromedio').textContent = promedio.toFixed(1);

                document.getElementById('detalleImagenBg').style.backgroundImage = `url('${destino.urlFoto}')`;

                // Ocultamos el spinner global y mostramos el cuerpo de la página
                document.getElementById('spinnerGeneral').classList.add('d-none');
                document.getElementById('contenidoDestino').classList.remove('d-none');
            } else {
                window.location.replace("explorar.html");
            }
        }
    } catch (error) {
        console.error("Error al cargar datos del destino:", error);
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
            contenedor.innerHTML = `<div class="alert alert-light text-center border-0 text-muted small shadow-sm">Aún no hay reseñas para este lugar. ¡Sé el primero en opinar!</div>`;
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
                ? '<i class="bi bi-star-fill text-warning"></i> '
                : '<i class="bi bi-star text-muted"></i> ';
        }

        const fecha = new Date(resena.fechaCreacion).toLocaleDateString();

        const fotoHTML = resena.fotoUsuario
            ? `<img src="${resena.fotoUsuario}" class="rounded-circle object-fit-cover shadow-sm" style="width: 50px; height: 50px;">`
            : `<div class="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style="width: 50px; height: 50px; font-size: 1.2rem;">${resena.nombreUsuario.charAt(0).toUpperCase()}</div>`;

        // --- CÓDIGO NUEVO: Galería de fotos de la reseña ---
        let galeriaHTML = "";
        if (resena.fotos && resena.fotos.length > 0) {
            galeriaHTML = '<div class="d-flex gap-2 mt-3 flex-wrap">';
            resena.fotos.forEach(url => {
                // Usamos la URL base del backend para que encuentre las imágenes sin importar el puerto
                const urlBackend = CONFIG.API_URL_BASE.replace('/api/Auth', '').replace('/api/Resena', '').replace('/api', '');
                galeriaHTML += `<img src="${urlBackend}${url}" 
                                class="rounded-3 shadow-sm object-fit-cover" 
                                style="width: 100px; height: 100px; border: 1px solid #eaeaea;">`;
            });
            galeriaHTML += '</div>';
        }
        // ---------------------------------------------------

        const html = `
            <div class="card shadow-sm border-0 rounded-4 mb-3">
                <div class="card-body p-4">
                    <div class="d-flex align-items-start gap-3 mb-2">
                        ${fotoHTML}
                        <div>
                            <h6 class="fw-bold mb-0">${resena.nombreUsuario}</h6>
                            <small class="text-muted">${fecha}</small>
                        </div>
                    </div>
                    <div class="mb-2">
                        ${estrellasHTML}
                    </div>
                    <p class="text-secondary mb-0">${resena.comentario}</p>
                    
                    <!-- Insertamos la galería justo aquí debajo del texto -->
                    ${galeriaHTML}
                    
                </div>
            </div>
        `;
        contenedor.insertAdjacentHTML('beforeend', html);
    });
}


// --- ENVIAR NUEVA RESEÑA ---
function configurarFormularioResena() {
    const form = document.getElementById("formNuevaResena");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const usuarioSesion = JSON.parse(localStorage.getItem('usuarioTuriStar'));
        if (!usuarioSesion) {
            mostrarAlertaResena("Debes iniciar sesión para publicar una reseña.", false);
            setTimeout(() => { window.location.href = "login.html"; }, 2000);
            return;
        }

        const btn = document.getElementById("btnEnviarResena");
        btn.disabled = true;
        btn.textContent = "Publicando...";

        // Cuidar el ID (dependiendo si se guardó como idUsuario o IdUsuario en JS)
        const idDelUsuario = usuarioSesion.idUsuario || usuarioSesion.IdUsuario;

        // 1. Construimos el FormData (ya NO es un objeto JSON)
        const formData = new FormData();
        formData.append("idUsuario", idDelUsuario);
        formData.append("idDestino", parseInt(idDestinoActual));
        formData.append("calificacion", document.getElementById("inputCalificacion").value);
        formData.append("comentario", document.getElementById("inputComentario").value.trim());

        // 2. Extraemos las fotos si el usuario seleccionó alguna
        const inputFotos = document.getElementById("inputFotosResena");
        if (inputFotos && inputFotos.files.length > 0) {
            for (let i = 0; i < inputFotos.files.length; i++) {
                formData.append("fotos", inputFotos.files[i]);
            }
        }

        try {
            const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Resena/registrar`, {
                method: "POST",
                // IMPORTANTE: Quitamos el "Content-Type". 
                // El navegador pondrá automáticamente "multipart/form-data" al ver que es un FormData.
                body: formData
            });

            const resultado = await respuesta.json();

            if (respuesta.ok && resultado.isSuccess) {
                mostrarAlertaResena("¡Tu reseña ha sido publicada!", true);
                form.reset();

                setTimeout(() => {
                    document.getElementById("alertaResena").classList.add("d-none");
                    cargarResenas();
                }, 1500);

            } else {
                mostrarAlertaResena(resultado.respuesta || resultado.mensaje || "No se pudo publicar la reseña.", false);
            }
        } catch (error) {
            console.error("Error al enviar reseña:", error);
            mostrarAlertaResena("Error de conexión al servidor.", false);
        } finally {
            btn.disabled = false;
            btn.textContent = "Publicar Reseña";
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
    if (esFavorito) {
        btn.innerHTML = `<i class="bi bi-bookmark-heart-fill"></i> Guardado`;
        btn.classList.replace('btn-outline-success', 'btn-success');
        btn.style.color = '#fff';
    } else {
        btn.innerHTML = `<i class="bi bi-bookmark-heart"></i> Guardar en favoritos`;
        btn.classList.replace('btn-success', 'btn-outline-success');
        btn.style.color = '#528233';
    }
}

document.getElementById('btnBorrarDestino')?.addEventListener('click', async function (e) {
    e.preventDefault();

    // Truco de doble confirmación integrado en el HTML
    if (!this.classList.contains('confirming')) {
        this.classList.add('confirming');
        const textoOriginal = this.innerHTML;
        this.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i> ¿Seguro? Clic para borrar';

        // Si no hace clic en 3 segundos, regresa a la normalidad
        setTimeout(() => {
            this.classList.remove('confirming');
            this.innerHTML = textoOriginal;
        }, 3000);
        return;
    }

    // Si llegó aquí, es porque dio el SEGUNDO clic
    this.innerHTML = "Borrando...";
    try {
        const req = await fetch(`${CONFIG.API_URL_BASE}/Destino/eliminar/${idDestinoActual}`, { method: 'DELETE' });
        const res = await req.json();
        if (res.isSuccess) {
            window.location.replace("explorar.html"); // Lo mandamos al inicio
        }
    } catch (error) { console.error(error); }
});