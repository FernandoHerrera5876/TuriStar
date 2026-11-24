// js/login.js
const API_BASE_URL = "/api/Auth";

// Expresión regular estricta: usuario@dominio.extension (sin espacios ni puntos consecutivos)
const EMAIL_REGEX = /^(?!.*\.\.)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

let enviandoLogin = false;
let enviandoRegistro = false;

function switchTab(tab) {
    const tabLogin = document.getElementById('tabLogin');
    const tabRegistro = document.getElementById('tabRegistro');
    const formLogin = document.getElementById('formLogin');
    const formRegistro = document.getElementById('formRegistro');
    const alerta = document.getElementById('mensajeAlerta');
    const formVerificar = document.getElementById('formVerificarCodigo');
    if (formVerificar) formVerificar.classList.remove('active');

    if (alerta) alerta.classList.add('d-none');

    if (tab === 'login') {
        if (tabLogin) tabLogin.className = 'w-50 tab-active';
        if (tabRegistro) tabRegistro.className = 'w-50 tab-inactive';
        if (formLogin) formLogin.classList.add('active');
        if (formRegistro) formRegistro.classList.remove('active');
    } else {
        if (tabRegistro) tabRegistro.className = 'w-50 tab-active';
        if (tabLogin) tabLogin.className = 'w-50 tab-inactive';
        if (formRegistro) formRegistro.classList.add('active');
        if (formLogin) formLogin.classList.remove('active');
    }
}

function mostrarAlerta(mensaje, esExito) {
    const alerta = document.getElementById('mensajeAlerta');
    if (!alerta) return;
    alerta.textContent = mensaje;
    alerta.className = `alert ${esExito ? 'alert-success' : 'alert-danger'} py-2 px-3 small rounded-3`;
    alerta.classList.remove('d-none');
}

/* ==========================================================
   VALIDACIÓN ESTRICTA DE CORREO ELECTRÓNICO
   ========================================================== */
function esCorreoValido(correo) {
    const limpio = (correo || "").trim();
    if (!limpio || limpio.length > 254) return false;
    return EMAIL_REGEX.test(limpio);
}

function validarInputCorreo(inputEl, feedbackEl, mostrarSiVacio = false) {
    if (!inputEl || !feedbackEl) return false;

    const valor = inputEl.value.trim();

    if (!valor) {
        inputEl.classList.remove('campo-valido', 'campo-invalido');
        if (mostrarSiVacio) {
            inputEl.classList.add('campo-invalido');
            feedbackEl.innerHTML = '<i class="bi bi-exclamation-circle-fill"></i> Ingresa tu correo electrónico.';
            feedbackEl.className = 'field-feedback show invalid';
        } else {
            feedbackEl.className = 'field-feedback';
            feedbackEl.innerHTML = '';
        }
        return false;
    }

    if (esCorreoValido(valor)) {
        inputEl.classList.remove('campo-invalido');
        inputEl.classList.add('campo-valido');
        feedbackEl.innerHTML = '<i class="bi bi-check-circle-fill"></i> Correo electrónico válido.';
        feedbackEl.className = 'field-feedback show valid';
        return true;
    } else {
        inputEl.classList.remove('campo-valido');
        inputEl.classList.add('campo-invalido');
        feedbackEl.innerHTML = '<i class="bi bi-x-circle-fill"></i> Ingresa un correo válido (ej. usuario@dominio.com).';
        feedbackEl.className = 'field-feedback show invalid';
        return false;
    }
}

/* ==========================================================
   VALIDACIÓN EN VIVO DE CONTRASEÑA SEGURA (REGISTRO)
   ========================================================== */
function evaluarPassword(password) {
    const valor = password || "";
    const checks = {
        length: valor.length >= 8,
        upper: /[A-ZÁÉÍÓÚÑ]/.test(valor),
        number: /[0-9]/.test(valor),
        special: /[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9\s]/.test(valor)
    };

    const faltantes = [];
    if (!checks.length) faltantes.push("mínimo 8 caracteres");
    if (!checks.upper) faltantes.push("una mayúscula");
    if (!checks.number) faltantes.push("un número");
    if (!checks.special) faltantes.push("un carácter especial");

    const cumplidos = Object.values(checks).filter(Boolean).length;

    return {
        checks,
        faltantes,
        cumplidos,
        esSegura: faltantes.length === 0
    };
}

function actualizarIndicadorPassword(forzarError = false) {
    const inputPass = document.getElementById('regPassword');
    const box = document.getElementById('passwordRulesBox');
    const fill = document.getElementById('passwordStrengthFill');
    const summary = document.getElementById('passwordMissingSummary');

    const elLength = document.getElementById('ruleLength');
    const elUpper = document.getElementById('ruleUpper');
    const elNumber = document.getElementById('ruleNumber');
    const elSpecial = document.getElementById('ruleSpecial');

    if (!inputPass || !box) return { esSegura: false, faltantes: [] };

    const valor = inputPass.value;
    const resultado = evaluarPassword(valor);
    const tieneTexto = valor.length > 0 || forzarError;

    const pintarRegla = (el, cumplida, texto) => {
        if (!el) return;
        if (!tieneTexto) {
            el.className = '';
            el.innerHTML = `<i class="bi bi-circle"></i> ${texto}`;
        } else if (cumplida) {
            el.className = 'ok';
            el.innerHTML = `<i class="bi bi-check-circle-fill"></i> ${texto}`;
        } else {
            el.className = 'missing';
            el.innerHTML = `<i class="bi bi-x-circle-fill"></i> ${texto}`;
        }
    };

    pintarRegla(elLength, resultado.checks.length, "Mínimo 8 caracteres");
    pintarRegla(elUpper, resultado.checks.upper, "Al menos una letra mayúscula (A-Z)");
    pintarRegla(elNumber, resultado.checks.number, "Al menos un número (0-9)");
    pintarRegla(elSpecial, resultado.checks.special, "Al menos un carácter especial (!@#$%^&*...)");

    // Barra de fortaleza
    const porcentaje = (resultado.cumplidos / 4) * 100;
    if (fill) {
        fill.style.width = `${valor.length === 0 ? 0 : porcentaje}%`;
        if (resultado.cumplidos <= 1) {
            fill.style.backgroundColor = '#ef4444';
        } else if (resultado.cumplidos <= 3) {
            fill.style.backgroundColor = '#f59e0b';
        } else {
            fill.style.backgroundColor = '#4ade80';
        }
    }

    // Texto dinámico con exactamente lo que falta
    if (summary) {
        if (!tieneTexto) {
            summary.style.color = '#cbd5e1';
            summary.textContent = "Tu contraseña debe cumplir con:";
        } else if (resultado.esSegura) {
            summary.style.color = '#4ade80';
            summary.innerHTML = '<i class="bi bi-shield-fill-check me-1"></i> ¡Contraseña segura!';
        } else {
            summary.style.color = '#fca5a5';
            summary.innerHTML = `<i class="bi bi-shield-exclamation me-1"></i> Te falta: ${resultado.faltantes.join(", ")}.`;
        }
    }

    box.classList.toggle('all-valid', resultado.esSegura);

    if (!tieneTexto) {
        inputPass.classList.remove('campo-valido', 'campo-invalido');
    } else if (resultado.esSegura) {
        inputPass.classList.remove('campo-invalido');
        inputPass.classList.add('campo-valido');
    } else {
        inputPass.classList.remove('campo-valido');
        inputPass.classList.add('campo-invalido');
    }

    return resultado;
}

/* ==========================================================
   EVENTOS EN VIVO AL ESCRIBIR + BOTONES DE MOSTRAR CONTRASEÑA
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // Recuperación de sesión: si ya inició sesión, entra directo al sistema
    try {
        const sesionActiva = JSON.parse(localStorage.getItem('usuarioTuriStar') || 'null');
        const idActivo = parseInt(sesionActiva?.idUsuario ?? sesionActiva?.IdUsuario, 10);
        if (sesionActiva && !isNaN(idActivo) && idActivo > 0) {
            const esAdmin = Boolean(sesionActiva.esAdmin ?? sesionActiva.EsAdmin);
            window.location.replace(esAdmin ? "dashboard.html" : "index.html");
            return;
        }
    } catch {
        localStorage.removeItem('usuarioTuriStar');
    }
    // Limitar fecha de nacimiento al día de hoy
    const regFechaNac = document.getElementById('regFechaNac');
    if (regFechaNac) {
        regFechaNac.max = new Date().toISOString().split('T')[0];
    }

    // Validación en vivo de correos
    const loginCorreo = document.getElementById('loginCorreo');
    const feedbackLoginCorreo = document.getElementById('feedbackLoginCorreo');
    if (loginCorreo && feedbackLoginCorreo) {
        loginCorreo.addEventListener('input', () => validarInputCorreo(loginCorreo, feedbackLoginCorreo, false));
        loginCorreo.addEventListener('blur', () => validarInputCorreo(loginCorreo, feedbackLoginCorreo, true));
    }

    const regCorreo = document.getElementById('regCorreo');
    const feedbackRegCorreo = document.getElementById('feedbackRegCorreo');
    if (regCorreo && feedbackRegCorreo) {
        regCorreo.addEventListener('input', () => validarInputCorreo(regCorreo, feedbackRegCorreo, false));
        regCorreo.addEventListener('blur', () => validarInputCorreo(regCorreo, feedbackRegCorreo, true));
    }

    // Validación en vivo de contraseña al registrarse
    const regPassword = document.getElementById('regPassword');
    if (regPassword) {
        regPassword.addEventListener('input', () => actualizarIndicadorPassword(false));
    }

    // Mostrar / ocultar contraseña
    document.querySelectorAll('.btn-toggle-pass').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = document.getElementById(btn.dataset.target);
            if (!target) return;
            const esPass = target.type === 'password';
            target.type = esPass ? 'text' : 'password';
            btn.innerHTML = esPass ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
        });
    });
});

/* ==========================================================
   ENVÍO DEL LOGIN
   ========================================================== */
const formLogin = document.getElementById('formLogin');
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (enviandoLogin) return;

        const inputCorreo = document.getElementById('loginCorreo');
        const feedbackCorreo = document.getElementById('feedbackLoginCorreo');
        const inputPassword = document.getElementById('loginPassword');

        const correoOk = validarInputCorreo(inputCorreo, feedbackCorreo, true);
        if (!correoOk) {
            mostrarAlerta("Ingresa un correo electrónico válido para iniciar sesión.", false);
            inputCorreo.focus();
            return;
        }

        if (!inputPassword.value) {
            mostrarAlerta("Ingresa tu contraseña.", false);
            inputPassword.focus();
            return;
        }

        enviandoLogin = true;
        let loginExitoso = false;
        const btn = document.getElementById('btnLogin');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Verificando...';
        }

        try {
            const respuesta = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    correo: inputCorreo.value.trim(),
                    password: inputPassword.value
                })
            });

            const resultado = await respuesta.json();

            if (respuesta.ok && resultado.isSuccess) {
                loginExitoso = true;
                localStorage.setItem('usuarioTuriStar', JSON.stringify(resultado.objeto));

                const esAdministrador = resultado.objeto.esAdmin || resultado.objeto.EsAdmin;
                if (esAdministrador) {
                    window.location.replace("dashboard.html");
                } else {
                    window.location.replace("explorar.html");
                }
            } else {
                mostrarAlerta(resultado.respuesta || resultado.mensaje || "Credenciales incorrectas.", false);
            }
        } catch (error) {
            console.error("Error en la petición:", error);
            mostrarAlerta("Error al conectar con el servidor. Revisa que el backend esté ejecutándose.", false);
        } finally {
            if (!loginExitoso) {
                enviandoLogin = false;
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = "Iniciar Sesión";
                }
            }
        }
    });
}

/* ==========================================================
   ENVÍO DEL REGISTRO (PASO 1: ENVIAR CÓDIGO AL CORREO)
   ========================================================== */
let datosRegistroPendiente = null;
let verificandoCodigo = false;
let timerReenvio = null;

function mostrarPasoVerificacion(correo) {
    document.getElementById('formLogin')?.classList.remove('active');
    document.getElementById('formRegistro')?.classList.remove('active');
    document.getElementById('formVerificarCodigo')?.classList.add('active');

    const elCorreo = document.getElementById('correoVerificacionTexto');
    if (elCorreo) elCorreo.textContent = correo;

    const inputCodigo = document.getElementById('inputCodigoVerificacion');
    if (inputCodigo) {
        inputCodigo.value = '';
        inputCodigo.focus();
    }
}

function iniciarCooldownReenvio(segundos = 60) {
    const btnReenviar = document.getElementById('btnReenviarCodigo');
    if (!btnReenviar) return;

    if (timerReenvio) clearInterval(timerReenvio);
    let restantes = segundos;
    btnReenviar.disabled = true;
    btnReenviar.textContent = `Reenviar código (${restantes}s)`;

    timerReenvio = setInterval(() => {
        restantes--;
        if (restantes <= 0) {
            clearInterval(timerReenvio);
            timerReenvio = null;
            btnReenviar.disabled = false;
            btnReenviar.textContent = "Reenviar código";
        } else {
            btnReenviar.textContent = `Reenviar código (${restantes}s)`;
        }
    }, 1000);
}

const formRegistro = document.getElementById('formRegistro');
if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (enviandoRegistro) return;

        const nombres = document.getElementById('regNombres').value.trim();
        const apellidos = document.getElementById('regApellidos').value.trim();
        const fechaNacimiento = document.getElementById('regFechaNac').value;
        const inputCorreo = document.getElementById('regCorreo');
        const feedbackCorreo = document.getElementById('feedbackRegCorreo');
        const inputPassword = document.getElementById('regPassword');

        if (!nombres || !apellidos || !fechaNacimiento) {
            mostrarAlerta("Completa tu nombre, apellidos y fecha de nacimiento.", false);
            return;
        }

        const correoOk = validarInputCorreo(inputCorreo, feedbackCorreo, true);
        if (!correoOk) {
            mostrarAlerta("El correo electrónico no tiene un formato válido.", false);
            inputCorreo.focus();
            return;
        }

        const estadoPass = actualizarIndicadorPassword(true);
        if (!estadoPass.esSegura) {
            mostrarAlerta(`La contraseña no es segura. Te falta: ${estadoPass.faltantes.join(", ")}.`, false);
            inputPassword.focus();
            return;
        }

        enviandoRegistro = true;
        const btn = document.getElementById('btnRegistro');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando código...';
        }

        const payload = {
            nombres,
            apellidos,
            fechaNacimiento,
            correo: inputCorreo.value.trim(),
            contrasena: inputPassword.value
        };

        try {
            const respuesta = await fetch(`${API_BASE_URL}/solicitar-codigo`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const resultado = await respuesta.json();

            if (respuesta.ok && resultado.isSuccess) {
                datosRegistroPendiente = payload;
                mostrarPasoVerificacion(payload.correo);
                iniciarCooldownReenvio(60);
                mostrarAlerta(resultado.respuesta || "Código enviado. Revisa tu bandeja de entrada o Spam.", true);
            } else {
                mostrarAlerta(resultado.respuesta || resultado.mensaje || "No se pudo enviar el código.", false);
            }
        } catch (error) {
            console.error("Error al solicitar código:", error);
            mostrarAlerta("Error al conectar con el servidor.", false);
        } finally {
            enviandoRegistro = false;
            if (btn) {
                btn.disabled = false;
                btn.textContent = "Crear cuenta";
            }
        }
    });
}

/* ==========================================================
   PASO 2: CONFIRMAR CÓDIGO DE 6 DÍGITOS
   ========================================================== */
const inputCodigoEl = document.getElementById('inputCodigoVerificacion');
if (inputCodigoEl) {
    // Permitir únicamente números
    inputCodigoEl.addEventListener('input', () => {
        inputCodigoEl.value = inputCodigoEl.value.replace(/\D/g, '').slice(0, 6);
    });
}

const formVerificarCodigo = document.getElementById('formVerificarCodigo');
if (formVerificarCodigo) {
    formVerificarCodigo.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (verificandoCodigo || !datosRegistroPendiente) return;

        const codigo = (document.getElementById('inputCodigoVerificacion')?.value || '').trim();
        if (!/^\d{6}$/.test(codigo)) {
            mostrarAlerta("Ingresa los 6 dígitos numéricos que llegaron a tu correo.", false);
            return;
        }

        verificandoCodigo = true;
        const btn = document.getElementById('btnConfirmarCodigo');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Verificando código...';
        }

        try {
            const respuesta = await fetch(`${API_BASE_URL}/confirmar-registro`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    correo: datosRegistroPendiente.correo,
                    codigo: codigo
                })
            });

            const resultado = await respuesta.json();

            if (respuesta.ok && resultado.isSuccess) {
                const correoConfirmado = datosRegistroPendiente.correo;
                datosRegistroPendiente = null;
                if (timerReenvio) clearInterval(timerReenvio);

                formRegistro?.reset();
                formVerificarCodigo.reset();
                validarInputCorreo(document.getElementById('regCorreo'), document.getElementById('feedbackRegCorreo'), false);
                actualizarIndicadorPassword(false);

                switchTab('login');
                const loginCorreo = document.getElementById('loginCorreo');
                if (loginCorreo) loginCorreo.value = correoConfirmado;

                mostrarAlerta("¡Correo verificado y cuenta creada! Ya puedes iniciar sesión.", true);
            } else {
                mostrarAlerta(resultado.respuesta || resultado.mensaje || "Código incorrecto o expirado.", false);
            }
        } catch (error) {
            console.error("Error confirmando código:", error);
            mostrarAlerta("Error al conectar con el servidor.", false);
        } finally {
            verificandoCodigo = false;
            if (btn) {
                btn.disabled = false;
                btn.textContent = "Verificar y crear cuenta";
            }
        }
    });
}

document.getElementById('btnReenviarCodigo')?.addEventListener('click', async () => {
    if (!datosRegistroPendiente) return;
    const btnReenviar = document.getElementById('btnReenviarCodigo');
    btnReenviar.disabled = true;
    btnReenviar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Reenviando...';

    try {
        const respuesta = await fetch(`${API_BASE_URL}/solicitar-codigo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datosRegistroPendiente)
        });
        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.isSuccess) {
            iniciarCooldownReenvio(60);
            mostrarAlerta("Te enviamos un nuevo código a tu correo.", true);
        } else {
            btnReenviar.disabled = false;
            btnReenviar.textContent = "Reenviar código";
            mostrarAlerta(resultado.respuesta || "No se pudo reenviar el código.", false);
        }
    } catch {
        btnReenviar.disabled = false;
        btnReenviar.textContent = "Reenviar código";
        mostrarAlerta("Error de conexión al reenviar el código.", false);
    }
});

document.getElementById('btnVolverRegistro')?.addEventListener('click', () => {
    switchTab('registro');
});