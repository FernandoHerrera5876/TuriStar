document.addEventListener("DOMContentLoaded", async () => {
    const usuarioGuardado = localStorage.getItem('usuarioTuriStar');
    if (!usuarioGuardado) window.location.replace("login.html");

    // Revisar si la URL trae un ?editId=...
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('editId');

    if (editId) {
        document.getElementById('btnGuardarDestino').textContent = "Actualizar Lugar";
        document.querySelector('h1').textContent = "Editar Destino";

        // Bloqueamos la foto para evitar sobreescribirla accidentalmente al editar textos
        document.getElementById('ndUrlFoto').removeAttribute('required');

        // Cargar los datos actuales del lugar en los campos
        try {
            const res = await fetch(`${CONFIG.API_URL_BASE}/Destino/${editId}`);
            const data = await res.json();
            if (data.isSuccess) {
                document.getElementById('ndNombre').value = data.objeto.nombre;
                document.getElementById('ndMunicipio').value = data.objeto.municipio;
                document.getElementById('ndDescripcion').value = data.objeto.descripcion;
                document.getElementById('hLu').value = data.objeto.horarioLunes;
                document.getElementById('hMa').value = data.objeto.horarioMartes;
                document.getElementById('hMi').value = data.objeto.horarioMiercoles;
                document.getElementById('hJu').value = data.objeto.horarioJueves;
                document.getElementById('hVi').value = data.objeto.horarioViernes;
                document.getElementById('hSa').value = data.objeto.horarioSabado;
                document.getElementById('hDo').value = data.objeto.horarioDomingo;
            }
        } catch (e) { console.error(e); }
    }
});

document.getElementById("formNuevoDestino").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btnGuardarDestino");
    btn.disabled = true;
    btn.textContent = "Procesando imagen y datos...";

    const nombre = document.getElementById("ndNombre").value.trim();
    const municipio = document.getElementById("ndMunicipio").value.trim();
    const inputArchivo = document.getElementById("ndUrlFoto");

    let lat = 20.1010;
    let lng = -98.7591;
    let rutaImagenLocal = "";

    try {
        // PASO 1: SUBIR LA IMAGEN FÍSICA AL SERVIDOR
        if (inputArchivo.files.length > 0) {
            const formData = new FormData();
            formData.append("archivo", inputArchivo.files[0]);

            const resUpload = await fetch(`${CONFIG.API_URL_BASE}/Upload/imagen`, {
                method: "POST",
                body: formData // OJO: Con FormData NO se pone Content-Type en los headers, el navegador lo pone solo
            });

            const dataUpload = await resUpload.json();
            if (dataUpload.isSuccess) {
                rutaImagenLocal = dataUpload.url; // Obtenemos el "/img/nombre.jpg"
            } else {
                mostrarAlerta("Error al subir la fotografía.", false);
                btn.disabled = false;
                btn.textContent = "Guardar y Crear Reseña";
                return; // Detenemos todo si la foto falló
            }
        }

        // PASO 2: OBTENER COORDENADAS
        const busqueda = `${nombre}, ${municipio}, Hidalgo, México`;
        try {
            const resGeo = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(busqueda)}`);
            const dataGeo = await resGeo.json();
            if (dataGeo && dataGeo.length > 0) {
                lat = parseFloat(dataGeo[0].lat);
                lng = parseFloat(dataGeo[0].lon);
            }
        } catch (err) { console.warn("Usando coordenadas por defecto."); }

        // PASO 3: GUARDAR DESTINO EN BASE DE DATOS
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('editId');

        const datos = {
            idDestino: editId ? parseInt(editId) : 0, // Si editamos mandamos el ID, sino 0
            nombre: nombre,
            municipio: municipio,
            descripcion: document.getElementById("ndDescripcion").value.trim(),
            urlFoto: rutaImagenLocal,
            latitud: lat,
            longitud: lng,
            horarioLunes: document.getElementById("hLu").value.trim(),
            horarioMartes: document.getElementById("hMa").value.trim(),
            horarioMiercoles: document.getElementById("hMi").value.trim(),
            horarioJueves: document.getElementById("hJu").value.trim(),
            horarioViernes: document.getElementById("hVi").value.trim(),
            horarioSabado: document.getElementById("hSa").value.trim(),
            horarioDomingo: document.getElementById("hDo").value.trim()
        };

        // Decidimos si registramos o actualizamos
        const rutaEndpoint = editId ? `${CONFIG.API_URL_BASE}/Destino/actualizar` : `${CONFIG.API_URL_BASE}/Destino/registrar`;
        const metodoHttp = editId ? "PUT" : "POST";

        const respuesta = await fetch(rutaEndpoint, {
            method: metodoHttp,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.isSuccess) {
            mostrarAlerta(editId ? "Lugar actualizado. Redirigiendo..." : "Lugar agregado. Redirigiendo...", true);
            setTimeout(() => { window.location.href = `detalle.html?id=${editId ? editId : resultado.idDestino}`; }, 1500);
        } else {
            mostrarAlerta(resultado.respuesta || "Error al guardar el lugar.", false);
        }
    } catch (error) {
        console.error(error);
        mostrarAlerta("Error de conexión al servidor.", false);
    } finally {
        btn.disabled = false;
        btn.textContent = "Guardar y Crear Reseña";
    }
});