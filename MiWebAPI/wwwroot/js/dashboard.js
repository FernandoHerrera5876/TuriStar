document.addEventListener("DOMContentLoaded", async () => {
    // 1. Validar que tenga sesión y que sea admin
    const usrGuardado = localStorage.getItem('usuarioTuriStar');
    if (!usrGuardado) {
        window.location.replace("login.html");
        return;
    }

    const usr = JSON.parse(usrGuardado);
    const esAdministrador = usr.esAdmin || usr.EsAdmin;

    if (!esAdministrador) {
        // Si es un usuario normal de curioso, lo regresamos al inicio
        window.location.replace("explorar.html");
        return;
    }

    // 2. Si pasó la validación de seguridad, dibujamos las gráficas
    await cargarGraficas();
});

async function cargarGraficas() {
    try {
        const respuesta = await fetch(`${CONFIG.API_URL_BASE}/Dashboard/estadisticas`);
        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.isSuccess) {
            const datos = resultado.objeto;

            // Extraemos los datos en arreglos para Chart.js
            const nombres = datos.map(d => d.nombre);
            const visitas = datos.map(d => d.totalVisitas);
            const puntuaciones = datos.map(d => d.calificacion);

            // Dibujar Gráfica 1: Lugares más visitados (Gráfico de Dona)
            const ctxVisitas = document.getElementById('graficoVisitas').getContext('2d');
            new Chart(ctxVisitas, {
                type: 'doughnut',
                data: {
                    labels: nombres,
                    datasets: [{
                        label: 'Interacciones',
                        data: visitas,
                        backgroundColor: ['#528233', '#85b85a', '#f1c40f', '#e67e22', '#3498db']
                    }]
                }
            });

            // Dibujar Gráfica 2: Puntuaciones (Gráfico de Barras)
            const ctxPuntuaciones = document.getElementById('graficoPuntuaciones').getContext('2d');
            new Chart(ctxPuntuaciones, {
                type: 'bar',
                data: {
                    labels: nombres,
                    datasets: [{
                        label: 'Calificación (Estrellas)',
                        data: puntuaciones,
                        backgroundColor: '#f1c40f',
                        borderRadius: 5
                    }]
                },
                options: {
                    scales: {
                        y: { beginAtZero: true, max: 5 } // Las estrellas van del 0 al 5
                    }
                }
            });
        }
    } catch (error) {
        console.error("Error al cargar estadísticas:", error);
    }
}