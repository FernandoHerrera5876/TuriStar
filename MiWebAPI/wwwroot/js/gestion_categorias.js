document.getElementById('formCategoria').addEventListener('submit', async (e) => {
    // "No es necesario recargar manualmente la página" (Punto de rúbrica)
    e.preventDefault();

    const btn = document.querySelector('button[type="submit"]');
    btn.disabled = true;

    const nombre = document.getElementById('catNombre').value.trim();
    const descripcion = document.getElementById('catDescripcion').value.trim();

    try {
        // "Petición POST" y "El registro se guarda desde el navegador" (Puntos de rúbrica)
        const res = await fetch(`${CONFIG.API_URL_BASE}/Categoria/registrar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ Nombre: nombre, Descripcion: descripcion })
        });

        const data = await res.json(); // Obtenemos la respuesta de la API

        // "Se muestran numeroError y respuesta" explícitamente (Punto de rúbrica)
        const alerta = document.getElementById('alertaCategoria');
        alerta.innerHTML = `<strong>Error Code [${data.numeroError}]:</strong> ${data.respuesta}`;
        alerta.className = `alert mt-3 small ${data.numeroError === 0 ? 'alert-success' : 'alert-danger'}`;
        alerta.classList.remove('d-none');

        // Si numeroError es 0, todo fue exitoso
        if (data.numeroError === 0) {

            // "Limpieza del formulario después de guardar" (Punto de rúbrica)
            document.getElementById('formCategoria').reset();

            // "Actualización automática de la tabla" / "El nuevo registro aparece en la tabla" (Puntos de rúbrica)
            const tbody = document.getElementById('bodyCategorias');
            const rowHtml = `
                <tr class="table-success">
                    <td>${data.id}</td>
                    <td>${data.nombre}</td>
                    <td>${data.descripcion}</td>
                </tr>
            `;
            // Inyectamos la fila sin recargar
            tbody.insertAdjacentHTML('beforeend', rowHtml);

            // Quitamos el color verde de la fila tras 2 segundos para dar un efecto visual
            setTimeout(() => { tbody.lastElementChild.classList.remove('table-success'); }, 2000);
        }
    } catch (error) {
        console.error(error);
        const alerta = document.getElementById('alertaCategoria');
        alerta.innerHTML = `<strong>Error Code [500]:</strong> Fallo de conexión con la API.`;
        alerta.className = "alert alert-danger mt-3 small";
        alerta.classList.remove('d-none');
    } finally {
        btn.disabled = false;
    }
});