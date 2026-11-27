let enviandoDestino = false;

function mostrarAlerta(mensaje, esExito) {
    const alerta = document.getElementById("alertaDestino");
    if (!alerta) return;
    alerta.textContent = mensaje;
    alerta.className = `alert small py-2 text-center rounded-3 mb-3 ${esExito ? "alert-success" : "alert-danger"}`;
    alerta.classList.remove("d-none");
}

const MAX_BYTES_IMAGEN = 5 * 1024 * 1024; // 5 MB
const EXT_IMAGEN_PERMITIDAS = /\.(jpe?g|png|webp|gif)$/i;
const MIME_IMAGEN_PERMITIDOS = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

function validarArchivoImagenLocal(archivo) {
    if (!archivo) return { ok: true };

    if (archivo.size > MAX_BYTES_IMAGEN) {
        return { ok: false, mensaje: "La imagen supera el tamaño máximo permitido de 5 MB." };
    }

    const extensionValida = EXT_IMAGEN_PERMITIDAS.test(archivo.name || "");
    const mimeValido = !archivo.type || MIME_IMAGEN_PERMITIDOS.includes(archivo.type.toLowerCase());

    if (!extensionValida || !mimeValido) {
        return { ok: false, mensaje: "Archivo no válido. Solo se permiten imágenes JPG, PNG, WEBP o GIF." };
    }

    return { ok: true };
}

async function cargarCategoriasSelect() {
    const select = document.getElementById("ndCategoria");
    if (!select) return;

    try {
        const res = await fetch(`${CONFIG.API_URL_BASE}/Destino/categorias`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.isSuccess && Array.isArray(data.objeto) && data.objeto.length > 0) {
            select.innerHTML = `<option value="" disabled selected>Selecciona...</option>`;
            data.objeto.forEach(cat => {
                const opt = document.createElement("option");
                opt.value = cat.idCategoria ?? cat.IdCategoria;
                opt.textContent = cat.nombre ?? cat.Nombre;
                select.appendChild(opt);
            });
        } else {
            select.innerHTML = `<option value="1">General</option>`;
        }
    } catch (e) {
        console.error("Error cargando categorías:", e);
        select.innerHTML = `<option value="1">General</option>`;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const usuarioGuardado = localStorage.getItem('usuarioTuriStar');
    if (!usuarioGuardado) {
        window.location.replace("login.html");
        return;
    }

    // Interceptar archivos inválidos antes de que se dispare la vista previa
    document.addEventListener("change", (e) => {
        const inputFotoEl = e.target;
        if (!inputFotoEl || inputFotoEl.id !== "ndUrlFoto") return;

        const archivo = inputFotoEl.files?.[0];
        if (!archivo) return;

        const validacion = validarArchivoImagenLocal(archivo);
        if (!validacion.ok) {
            e.stopPropagation();
            e.stopImmediatePropagation();
            inputFotoEl.value = "";

            const previewBox = document.getElementById("ndPreviewBox");
            const previewImg = document.getElementById("ndPreviewImg");
            if (previewBox) previewBox.classList.remove("active");
            if (previewImg) previewImg.removeAttribute("src");

            mostrarAlerta(validacion.mensaje, false);
        } else {
            document.getElementById("alertaDestino")?.classList.add("d-none");
        }
    }, true);

    // 1. Primero llenamos las categorías para poder seleccionar la actual si estamos editando
    await cargarCategoriasSelect();

    // 2. Revisar si la URL trae ?editId=...
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('editId');

    // Configurar botón de Cancelar según si estamos creando o editando
    const btnCancelar = document.getElementById('btnCancelarDestino');
    if (btnCancelar) {
        btnCancelar.href = editId ? `detalle.html?id=${encodeURIComponent(editId)}` : 'explorar.html';
        if (editId) {
            btnCancelar.innerHTML = '<i class="bi bi-x-circle me-1"></i> Cancelar edición';
        }
    }

    if (editId) {
        const btn = document.getElementById('btnGuardarDestino');
        const titulo = document.querySelector('h1');
        if (titulo) titulo.textContent = "Editar Destino";

        // Bloquear botón con indicador de carga mientras llegan los datos actuales
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Cargando datos...';
        }

        // Al editar la foto es opcional (si no elige nueva, se mantiene la actual)
        document.getElementById('ndUrlFoto')?.removeAttribute('required');

        try {
            const res = await fetch(`${CONFIG.API_URL_BASE}/Destino/${encodeURIComponent(editId)}`);

            if (res.status === 404) {
                mostrarAlerta(`El destino que intentas editar (ID ${editId}) no existe o fue eliminado.`, false);
                if (btn) btn.innerHTML = '<i class="bi bi-exclamation-circle me-1"></i> Registro no disponible';
                if (btnCancelar) {
                    btnCancelar.href = 'explorar.html';
                    btnCancelar.innerHTML = '<i class="bi bi-arrow-left me-1"></i> Volver a Explorar';
                }
                return;
            }

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();

            if (data.isSuccess && data.objeto) {
                const d = data.objeto;
                document.getElementById('ndNombre').value = d.nombre || "";
                document.getElementById('ndMunicipio').value = d.municipio || "";
                document.getElementById('ndDescripcion').value = d.descripcion || "";
                document.getElementById('ndPrecioEntrada').value = d.precioEntrada ?? 0;
                document.getElementById('ndPrecioEstacionamiento').value = d.precioEstacionamiento ?? 0;
                document.getElementById('ndComoLlegar').value = d.comoLlegar || "";
                if (d.idCategoria) document.getElementById('ndCategoria').value = d.idCategoria;
                if (d.latitud) document.getElementById('ndLatitud').value = d.latitud;
                if (d.longitud) document.getElementById('ndLongitud').value = d.longitud;

                document.getElementById('hLu').value = d.horarioLunes || "";
                document.getElementById('hMa').value = d.horarioMartes || "";
                document.getElementById('hMi').value = d.horarioMiercoles || "";
                document.getElementById('hJu').value = d.horarioJueves || "";
                document.getElementById('hVi').value = d.horarioViernes || "";
                document.getElementById('hSa').value = d.horarioSabado || "";
                document.getElementById('hDo').value = d.horarioDomingo || "";

                // Mostrar vista previa de la foto actual
                if (d.urlFoto) {
                    const previewBox = document.getElementById("ndPreviewBox");
                    const previewImg = document.getElementById("ndPreviewImg");
                    const previewName = document.getElementById("ndPreviewName");
                    if (previewBox && previewImg) {
                        previewImg.src = d.urlFoto;
                        if (previewName) previewName.textContent = "Fotografía actual";
                        previewBox.classList.add("active");
                    }
                }

                // Habilitar el botón una vez cargados los datos
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="bi bi-check2-circle me-1"></i> Actualizar Lugar';
                }
            } else {
                mostrarAlerta(data.respuesta || "No se encontró el destino solicitado.", false);
                if (btn) btn.innerHTML = '<i class="bi bi-exclamation-circle me-1"></i> Registro no disponible';
            }
        } catch (e) {
            console.error("Error cargando destino para edición:", e);
            mostrarAlerta("No se pudo conectar con la API para cargar el destino. Verifica tu conexión e intenta de nuevo.", false);
            if (btn) btn.innerHTML = '<i class="bi bi-wifi-off me-1"></i> Sin conexión con la API';
        }
    }
});

document.getElementById("formNuevoDestino").addEventListener("submit", async (e) => {
    e.preventDefault();

    if (enviandoDestino) return;

    const nombre = document.getElementById("ndNombre").value.trim();
    const municipio = document.getElementById("ndMunicipio").value.trim();
    const descripcion = document.getElementById("ndDescripcion").value.trim();

    if (!nombre || !municipio || !descripcion) {
        mostrarAlerta("Por favor completa el nombre, municipio y descripción del lugar.", false);
        return;
    }

    enviandoDestino = true;

    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('editId');
    const btn = document.getElementById("btnGuardarDestino");
    const htmlOriginalBtn = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando imagen y datos...';

    const inputArchivo = document.getElementById("ndUrlFoto");

    const latInput = parseFloat(document.getElementById("ndLatitud").value);
    const lngInput = parseFloat(document.getElementById("ndLongitud").value);
    let lat = !isNaN(latInput) ? latInput : 20.1010;
    let lng = !isNaN(lngInput) ? lngInput : -98.7591;
    let rutaImagenLocal = "";
    let guardadoExitoso = false;

    try {
        // PASO 1: VALIDAR Y SUBIR FOTO SI SE SELECCIONÓ UNA NUEVA
        if (inputArchivo.files.length > 0) {
            const archivoSeleccionado = inputArchivo.files[0];
            const validacionLocal = validarArchivoImagenLocal(archivoSeleccionado);
            if (!validacionLocal.ok) {
                mostrarAlerta(validacionLocal.mensaje, false);
                return;
            }

            const formData = new FormData();
            formData.append("archivo", archivoSeleccionado);

            const resUpload = await fetch(`${CONFIG.API_URL_BASE}/Upload/imagen`, {
                method: "POST",
                body: formData
            });

            const dataUpload = await resUpload.json().catch(() => null);

            if (resUpload.ok && dataUpload?.isSuccess) {
                rutaImagenLocal = dataUpload.url;
            } else {
                const msgServidor = dataUpload?.respuesta || dataUpload?.mensaje;
                if (msgServidor) {
                    mostrarAlerta(msgServidor, false);
                } else if (resUpload.status === 413) {
                    mostrarAlerta("La imagen supera el tamaño máximo permitido de 5 MB.", false);
                } else {
                    mostrarAlerta(`Archivo no válido o rechazado por el servidor (HTTP ${resUpload.status}).`, false);
                }
                return;
            }
        }

        // PASO 2: SOLO BUSCAR COORDENADAS SI EL USUARIO NO LAS ESCRIBIÓ
        if (isNaN(latInput) || isNaN(lngInput)) {
            const busqueda = `${nombre}, ${municipio}, Hidalgo, México`;
            try {
                const resGeo = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(busqueda)}`);
                const dataGeo = await resGeo.json();
                if (dataGeo && dataGeo.length > 0) {
                    lat = parseFloat(dataGeo[0].lat);
                    lng = parseFloat(dataGeo[0].lon);
                }
            } catch (err) {
                console.warn("Usando coordenadas por defecto.");
            }
        }

        // PASO 3: GUARDAR O ACTUALIZAR EN BASE DE DATOS
        const precioEntrada = parseFloat(document.getElementById("ndPrecioEntrada").value);
        const precioEst = parseFloat(document.getElementById("ndPrecioEstacionamiento").value);
        const idCategoria = parseInt(document.getElementById("ndCategoria").value, 10);

        const datos = {
            idDestino: editId ? parseInt(editId, 10) : 0,
            nombre: nombre,
            municipio: municipio,
            descripcion: descripcion,
            urlFoto: rutaImagenLocal,
            latitud: lat,
            longitud: lng,
            precioEntrada: !isNaN(precioEntrada) && precioEntrada >= 0 ? precioEntrada : 0,
            precioEstacionamiento: !isNaN(precioEst) && precioEst >= 0 ? precioEst : 0,
            comoLlegar: document.getElementById("ndComoLlegar").value.trim(),
            idCategoria: !isNaN(idCategoria) ? idCategoria : 0,
            horarioLunes: document.getElementById("hLu").value.trim(),
            horarioMartes: document.getElementById("hMa").value.trim(),
            horarioMiercoles: document.getElementById("hMi").value.trim(),
            horarioJueves: document.getElementById("hJu").value.trim(),
            horarioViernes: document.getElementById("hVi").value.trim(),
            horarioSabado: document.getElementById("hSa").value.trim(),
            horarioDomingo: document.getElementById("hDo").value.trim()
        };

        const rutaEndpoint = editId ? `${CONFIG.API_URL_BASE}/Destino/actualizar` : `${CONFIG.API_URL_BASE}/Destino/registrar`;
        const metodoHttp = editId ? "PUT" : "POST";

        const respuesta = await fetch(rutaEndpoint, {
            method: metodoHttp,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.isSuccess) {
            guardadoExitoso = true;
            btn.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> ¡Guardado! Redirigiendo...';
            mostrarAlerta(editId ? "Lugar actualizado. Redirigiendo..." : "Lugar agregado. Redirigiendo...", true);

            const idDestinoFinal = editId ? editId : (resultado.idDestino || resultado.IdDestino);
            setTimeout(() => {
                window.location.replace(`detalle.html?id=${idDestinoFinal}`);
            }, 1200);
        } else {
            mostrarAlerta(resultado.respuesta || resultado.mensaje || "Error al guardar el lugar.", false);
        }
    } catch (error) {
        console.error(error);
        mostrarAlerta("Error de conexión con la API. Verifica que el servidor esté disponible.", false);
    } finally {
        if (!guardadoExitoso) {
            enviandoDestino = false;
            btn.disabled = false;
            btn.innerHTML = htmlOriginalBtn;
        }
    }
});