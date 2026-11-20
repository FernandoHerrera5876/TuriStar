const SESSION_KEY = "usuarioTuriStar";

async function cargarFooter() {
    if (document.getElementById("footer-turistar")) return;

    let placeholder = document.getElementById("footer-placeholder");
    if (!placeholder) {
        placeholder = document.createElement("div");
        placeholder.id = "footer-placeholder";
        document.body.appendChild(placeholder);
    }

    try {
        const resp = await fetch("components/footer.html?v=" + new Date().getTime());
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        placeholder.innerHTML = await resp.text();
    } catch (err) {
        console.error("Error cargando footer.html:", err);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    cargarFooter();

    fetch('components/navbar.html?v=' + new Date().getTime())
        .then(response => response.text())
        .then(data => {
            const placeholder = document.getElementById('navbar-placeholder');
            if (!placeholder) return;
            placeholder.innerHTML = data;

            // Asegurar que el elemento nav dentro tenga el ID para el scroll
            const navElement = placeholder.querySelector('nav');
            if (navElement && !navElement.id) {
                navElement.id = 'mainNavbar';
            }

            // Marcar enlace activo según la URL
            const currentLocation = location.href;
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                if (link.href === currentLocation) {
                    link.classList.add('active');
                }
            });

            // Verificar sesión y alternar botones correctamente
            const valorSesion = localStorage.getItem(SESSION_KEY);
            const spanUsuario = document.getElementById('userGreeting');
            const btnCerrar = document.getElementById('btnCerrarSesion');
            const loginLink = document.getElementById('loginLink');

            if (valorSesion) {
                try {
                    const usuario = JSON.parse(valorSesion);
                    const nombreReal = usuario.nombre || usuario.nombres || usuario.Nombre || 'Usuario';

                    if (spanUsuario) {
                        spanUsuario.textContent = `Hola, ${nombreReal}`;
                        spanUsuario.classList.remove('d-none');
                        spanUsuario.style.display = 'inline-block';
                    }
                    if (btnCerrar) {
                        btnCerrar.classList.remove('d-none');
                        btnCerrar.style.setProperty('display', 'inline-flex', 'important');
                    }
                    if (loginLink) {
                        loginLink.classList.add('d-none');
                        loginLink.style.display = 'none';
                    }
                } catch (e) {
                    localStorage.removeItem(SESSION_KEY);
                }
            } else {
                if (spanUsuario) {
                    spanUsuario.classList.add('d-none');
                    spanUsuario.style.display = 'none';
                }
                if (btnCerrar) {
                    btnCerrar.classList.add('d-none');
                    btnCerrar.style.setProperty('display', 'none', 'important');
                }
                if (loginLink) {
                    loginLink.classList.remove('d-none');
                    loginLink.style.display = 'inline-block';
                }
            }

            // Efecto dinámico de cristal al hacer scroll (Optimizado con GPU)
            const navbar = document.getElementById('mainNavbar') || document.querySelector('.navbar-turistar');
            if (navbar) {
                let ticking = false;
                const handleScroll = () => {
                    if (!ticking) {
                        window.requestAnimationFrame(() => {
                            if (window.scrollY > 20) {
                                navbar.classList.add('navbar-scrolled');
                            } else {
                                navbar.classList.remove('navbar-scrolled');
                            }
                            ticking = false;
                        });
                        ticking = true;
                    }
                };
                window.addEventListener('scroll', handleScroll, { passive: true });
                handleScroll();
            }
        });
});

function cerrarSesion() {
    localStorage.removeItem(SESSION_KEY);
    window.location.replace('login.html');
}

// Búsqueda con Enter
document.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const elementoActivo = e.target;
        if (elementoActivo.tagName === "INPUT" && elementoActivo.closest("#navbar-placeholder, nav, header")) {
            e.preventDefault();
            const termino = elementoActivo.value.trim();
            if (termino !== "") {
                window.location.href = `explorar.html?q=${encodeURIComponent(termino)}`;
            }
        }
    }
});

// Búsqueda con clic en la lupa
document.addEventListener("click", (e) => {
    const iconoLupa = e.target.closest(".bi-search, .input-group-text");
    if (iconoLupa && iconoLupa.closest("#navbar-placeholder, nav, header")) {
        const inputAsociado = iconoLupa.closest(".input-group").querySelector("input");
        if (inputAsociado && inputAsociado.value.trim() !== "") {
            window.location.href = `explorar.html?q=${encodeURIComponent(inputAsociado.value.trim())}`;
        }
    }
});

/* ==========================================================
   CONTROLADOR DE DESENFOQUE DINÁMICO POR SCROLL (CARRUSEL)
   ========================================================== */
window.addEventListener('scroll', function () {
    const marquee = document.querySelector('.marquee-container');
    if (!marquee) return;

    const scrollPos = window.scrollY;
    let blurAmount = Math.max(0, 18 - (scrollPos * 0.08));
    let opacityAmount = Math.min(1, 0.2 + (scrollPos * 0.005));
    let translateYAmount = Math.max(0, 40 - (scrollPos * 0.15));

    marquee.style.filter = `blur(${blurAmount}px)`;
    marquee.style.opacity = opacityAmount;
    marquee.style.transform = `translateY(${translateYAmount}px)`;
    marquee.style.transition = 'filter 0.1s ease-out, opacity 0.1s ease-out, transform 0.1s ease-out';
}, { passive: true });