let enviandoCategoria = false;

document.getElementById('formCategoria').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (enviandoCategoria) return;

    const form = e.currentTarget;
    const btn = form.querySelector('button[type="submit"]');
    const alerta = document.getElementById('alertaCategoria');

    const nombre = document.getElementById('catNombre').value.trim();
    const descripcion = document.getElementById('catDescripcion').value.trim();

    if (!nombre) {
        alerta.innerHTML = `<strong>Error Code [400]:</strong> El nombre de la categoría no puede ir vacío.`;
        alerta.className = "alert alert-danger mt-3 small rounded-3";
        alerta.classList.remove('d-none');
        return;
    }

    enviandoCategoria = true;
    const htmlOriginal = btn ? btn.innerHTML : "";
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
    }

    try {
        const res = await fetch(`${CONFIG.API_URL_BASE}/Categoria/registrar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ Nombre: nombre, Descripcion: descripcion })
        });

        const data = await res.json();

        alerta.innerHTML = `<strong>Error Code [${data.numeroError}]:</strong> ${data.respuesta}`;
        alerta.className = `alert mt-3 small rounded-3 ${data.numeroError === 0 ? 'alert-success' : 'alert-danger'}`;
        alerta.classList.remove('d-none');

        if (data.numeroError === 0) {
            form.reset();

            const tbody = document.getElementById('bodyCategorias');
            const rowHtml = `
                <tr class="table-success">
                    <td>${data.id}</td>
                    <td>${data.nombre}</td>
                    <td>${data.descripcion}</td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', rowHtml);

            const nuevaFila = tbody.lastElementChild;
            setTimeout(() => {
                if (nuevaFila) nuevaFila.classList.remove('table-success');
            }, 2000);
        }
    } catch (error) {
        console.error(error);
        alerta.innerHTML = `<strong>Error Code [500]:</strong> Fallo de conexión con la API.`;
        alerta.className = "alert alert-danger mt-3 small rounded-3";
        alerta.classList.remove('d-none');
    } finally {
        enviandoCategoria = false;
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = htmlOriginal;
        }
    }
});