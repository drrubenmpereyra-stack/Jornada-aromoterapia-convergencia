import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// Credenciales oficiales de su proyecto Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAVFOWLQtNdaa_pDW8qvFjajmYY08jn9hY",
    authDomain: "aromoterapia-convergenci.firebaseapp.com",
    projectId: "aromoterapia-convergenci",
    storageBucket: "aromoterapia-convergenci.firebasestorage.app",
    messagingSenderId: "164268096827",
    appId: "1:164268096827:web:a9ab4a1bdeb7a3ea9b4b1e"
};

let db = null;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (err) {
    console.error("Error al conectar con Firebase:", err);
}

let estadoApp = {
    pantalla: "login",
    usuarioActual: null,
    seccionActiva: "Jornadas",
    modoFormularioJornada: false, // Controla si se muestra el formulario de carga
    jornadasLista: [] // Almacena las jornadas obtenidas de Firestore
};

function render() {
    const appContainer = document.getElementById("app");
    if (!appContainer) return;
    appContainer.innerHTML = "";

    if (estadoApp.pantalla === "login") {
        appContainer.innerHTML = renderLogin();
        configurarEventosLogin();
    } else if (estadoApp.pantalla === "intro") {
        appContainer.innerHTML = renderIntro();
        configurarEventosIntro();
    } else if (estadoApp.pantalla === "dashboard") {
        appContainer.innerHTML = renderDashboard();
        configurarEventosDashboard();
    }
}

function renderLogin() {
    return `
        <div class="login-screen">
            <div class="login-card">
                <img src="Logotipo.jpg" alt="Logotipo" class="login-logo">
                <h2>Seminario de Aromaterapia</h2>
                <form id="loginForm">
                    <div class="form-group">
                        <label for="usuario">Usuario</label>
                        <input type="text" id="usuario" required placeholder="Ingrese su usuario">
                    </div>
                    <div class="form-group">
                        <label for="password">Contraseña</label>
                        <input type="password" id="password" required placeholder="Ingrese su contraseña">
                    </div>
                    <button type="submit" class="btn-custom btn-submit">Ingresar</button>
                    <div id="errorMsg" class="error-msg"></div>
                </form>
            </div>
        </div>
    `;
}

function configurarEventosLogin() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const uInput = document.getElementById("usuario").value.trim().toUpperCase();
        const pInput = document.getElementById("password").value.trim();
        const errorDiv = document.getElementById("errorMsg");
        
        errorDiv.innerText = "Verificando en base de datos...";

        let usuarioEncontrado = null;

        try {
            if (!db) throw new Error("Base de datos no inicializada");
            
            const querySnapshot = await getDocs(collection(db, "usuarios"));
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.user && data.user.toUpperCase() === uInput && data.pass === pInput) {
                    usuarioEncontrado = data;
                }
            });
        } catch (error) {
            console.error("Error consultando Firestore:", error);
        }

        // Respaldo local de seguridad
        if (!usuarioEncontrado) {
            const usuariosLocales = [
                { user: "DRPEREYRA", pass: "235689", role: "admin", nombre: "Dr. y Mgter Rubén M. Pereyra (Administrador)" },
                { user: "P1", pass: "XX", role: "participant", nombre: "Participante 1" },
                { user: "P2", pass: "YY", role: "participant", nombre: "Participante 2" },
                { user: "P3", pass: "ZZ", role: "participant", nombre: "Participante 3" }
            ];
            usuarioEncontrado = usuariosLocales.find(u => u.user === uInput && u.pass === pInput);
        }

        if (usuarioEncontrado) {
            estadoApp.usuarioActual = usuarioEncontrado;
            estadoApp.pantalla = "intro";
            if (usuarioEncontrado.role !== "admin" && estadoApp.seccionActiva === "Jornadas") {
                estadoApp.seccionActiva = "Mis jornadas";
            }
            render();
            reproducirAudioIntro();
        } else {
            errorDiv.innerText = "Usuario o contraseña incorrectos.";
        }
    });
}

function renderIntro() {
    return `
        <div class="intro-screen">
            <div class="intro-content">
                <img src="Logotipo.jpg" alt="Logotipo" class="intro-logo">
                <h1 class="animated-title">Bienvenidos Seminario Aromaterapia Clínica de la Convergencia 2026</h1>
                <div class="video-wrapper">
                    <video id="introVideo" autoplay muted playsinline>
                        <source src="https://github.com/drrubenmpereyra-stack/intro-aromoterapia/raw/refs/heads/main/Videointro.mp4" type="video/mp4">
                        Tu navegador no soporta videos.
                    </video>
                </div>
                <button id="skipBtn" class="btn-custom">Entrar al Aula Virtual</button>
            </div>
        </div>
    `;
}

function reproducirAudioIntro() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const texto = "Bienvenidos Seminario Aromaterapia Clínica de la Convergencia 2026";
        const mensaje = new SpeechSynthesisUtterance(texto);
        mensaje.lang = 'es-ES';
        mensaje.rate = 0.90;
        
        const voces = window.speechSynthesis.getVoices();
        const vozFemenina = voces.find(v => v.lang.startsWith('es') && (v.name.includes('Female') || v.name.includes('Helena') || v.name.includes('Laura') || v.name.includes('Sofia') || v.name.includes('Monica') || v.name.includes('Paulina')));
        if (vozFemenina) {
            mensaje.voice = vozFemenina;
        }

        window.speechSynthesis.speak(mensaje);
    }
}

function configurarEventosIntro() {
    const irAlDashboard = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        estadoApp.pantalla = "dashboard";
        render();
    };

    const skipBtn = document.getElementById("skipBtn");
    if (skipBtn) skipBtn.addEventListener("click", irAlDashboard);

    const video = document.getElementById("introVideo");
    if (video) {
        video.addEventListener("ended", irAlDashboard);
        video.play().catch(err => console.log("Autoplay bloqueado:", err));
    }
}

// Función para obtener las jornadas desde Firestore
async function cargarJornadasDesdeDB() {
    try {
        if (!db) return;
        const querySnapshot = await getDocs(collection(db, "jornadas"));
        let lista = [];
        querySnapshot.forEach((doc) => {
            lista.push({ id: doc.id, ...doc.data() });
        });
        estadoApp.jornadasLista = lista;
    } catch (e) {
        console.error("Error al obtener jornadas:", e);
    }
}

function obtenerContenidoSeccion() {
    const esAdmin = estadoApp.usuarioActual.role === "admin";

    // Módulo de Administrador: "Jornadas"
    if (esAdmin && estadoApp.seccionActiva === "Jornadas") {
        if (estadoApp.modoFormularioJornada) {
            return `
                <div style="background: var(--white); padding: 2rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-width: 600px; margin: 0 auto; border: 2px solid var(--blue-border);">
                    <h2 style="color: var(--blue-border); margin-bottom: 1.5rem; text-align: center;">Cargar Nueva Jornada</h2>
                    <form id="formCargarJornada" style="display: flex; flex-direction: column; gap: 1rem;">
                        <div class="form-group" style="text-align: left;">
                            <label>Nombre de la Jornada</label>
                            <input type="text" id="jNombre" required placeholder="Ej: Jornada 1: Bases neurocientíficas..." style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                        </div>
                        <div class="form-group" style="text-align: left;">
                            <label>Imagen de la Jornada (Nombre de archivo en repo)</label>
                            <input type="text" id="jImagen" required placeholder="Ej: Jornada1.jpg" style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                        </div>
                        <div class="form-group" style="text-align: left;">
                            <label>Fecha de la Jornada</label>
                            <input type="date" id="jFecha" required style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                        </div>
                        <div class="form-group" style="text-align: left;">
                            <label>Link del MEET (Enlace de transmisión)</label>
                            <input type="url" id="jMeet" required placeholder="https://meet.google.com/..." style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                        </div>
                        <div class="form-group" style="text-align: left;">
                            <label>Link de la clase grabada (Google Drive u otro)</label>
                            <input type="url" id="jGrabacion" required placeholder="https://drive.google.com/..." style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                        </div>
                        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                            <button type="submit" class="btn-custom" style="flex: 1; padding: 0.75rem;">Guardar datos</button>
                            <button type="button" id="btnCancelarJornada" class="btn-custom" style="flex: 1; padding: 0.75rem; background-color: #6c757d !important; border-color: #495057 !important;">Cancelar</button>
                        </div>
                    </form>
                </div>
            `;
        } else {
            let htmlJornadasAdmin = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h2 style="color: var(--blue-border); margin-bottom: 0.3rem; font-size: 1.6rem;">Gestión de Jornadas Académicas</h2>
                        <p style="color: #555;">Panel de administración general del Dr. y Mgter Rubén M. Pereyra.</p>
                    </div>
                    <button id="btnAbrirFormJornada" class="btn-custom">➕ Cargar Jornada</button>
                </div>
                <div style="display: grid; gap: 1.5rem;">
            `;

            if (estadoApp.jornadasLista.length === 0) {
                htmlJornadasAdmin += `<p style="color: #666; background: var(--white); padding: 1.5rem; border-radius: 6px;">No hay jornadas cargadas actualmente en la base de datos.</p>`;
            } else {
                estadoApp.jornadasLista.forEach(j => {
                    htmlJornadasAdmin += `
                        <div style="background: var(--white); padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-left: 5px solid var(--lavender); display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
                            <img src="${j.imagen}" alt="${j.nombre}" style="width: 120px; height: 80px; object-fit: cover; border-radius: 6px; border: 2px solid var(--blue-border);">
                            <div style="flex: 1;">
                                <span style="font-size: 0.85rem; background: #e9ecef; padding: 0.2rem 0.5rem; border-radius: 4px; color: var(--blue-border); font-weight: bold;">📅 ${j.fecha}</span>
                                <h3 style="color: var(--blue-border); margin-top: 0.4rem; margin-bottom: 0.5rem; font-size: 1.15rem;">${j.nombre}</h3>
                                <div style="display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.9rem;">
                                    <a href="${j.meet}" target="_blank" style="color: #1d3557; font-weight: bold;">🔗 Enlace MEET</a>
                                    <a href="${j.grabacion}" target="_blank" style="color: #1d3557; font-weight: bold;">🎥 Clase Grabada</a>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }
            htmlJornadasAdmin += `</div>`;
            return htmlJornadasAdmin;
        }
    } 
    
    // Módulo de Participante: "Mis jornadas"
    else if (!esAdmin && estadoApp.seccionActiva === "Mis jornadas") {
        let htmlMisJornadas = `
            <div style="margin-bottom: 2rem;">
                <h2 style="color: var(--blue-border); margin-bottom: 0.5rem; font-size: 1.6rem;">Mis Jornadas Académicas</h2>
                <p style="color: #555;">Acceda a las transmisiones en vivo y grabaciones oficiales del seminario.</p>
            </div>
            <div style="display: grid; gap: 1.5rem;">
        `;

        if (estadoApp.jornadasLista.length === 0) {
            htmlMisJornadas += `<p style="color: #666; background: var(--white); padding: 1.5rem; border-radius: 6px;">Próximamente se habilitarán las jornadas del seminario.</p>`;
        } else {
            estadoApp.jornadasLista.forEach(j => {
                htmlMisJornadas += `
                    <div style="background: var(--white); padding: 1.8rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-left: 5px solid var(--lavender); display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1rem;">
                        <img src="${j.imagen}" alt="${j.nombre}" style="width: 100%; max-width: 450px; height: auto; border-radius: 8px; border: 3px solid var(--blue-border);">
                        <span style="font-size: 0.85rem; background: #e9ecef; padding: 0.3rem 0.6rem; border-radius: 4px; color: var(--blue-border); font-weight: bold;">📅 ${j.fecha}</span>
                        <h3 style="color: var(--blue-border); font-size: 1.2rem;">${j.nombre}</h3>
                        <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; margin-top: 0.5rem;">
                            <a href="${j.meet}" target="_blank" class="btn-custom" style="text-decoration: none;">🟢 Unirse a MEET</a>
                            <a href="${j.grabacion}" target="_blank" class="btn-custom" style="background-color: var(--blue-border) !important; border-color: var(--lavender) !important; text-decoration: none;">🎥 Ver Clase Grabada</a>
                        </div>
                    </div>
                `;
            });
        }
        htmlMisJornadas += `</div>`;
        return htmlMisJornadas;
    } 
    
    // Demás secciones genéricas
    else {
        return `
            <div class="welcome-box">
                <h2>Sección Actual: ${estadoApp.seccionActiva}</h2>
                <p>Panel del seminario dirigido por el Dr. y Mgter Rubén M. Pereyra.</p>
            </div>
        `;
    }
}

function renderDashboard() {
    const esAdmin = estadoApp.usuarioActual.role === "admin";
    
    let botonesHTML = "";

    if (esAdmin) {
        botonesHTML += `
            <button class="btn-custom" data-seccion="Jornadas">Jornadas</button>
            <button class="btn-custom" data-seccion="Materiales">Materiales</button>
            <button class="btn-custom" data-seccion="Asistencia">Asistencia</button>
            <button class="btn-custom" data-seccion="Pagos">Pagos</button>
            <button class="btn-custom" data-seccion="Calificaciones">Calificaciones</button>
            <button class="btn-custom" data-seccion="Diplomas">Diplomas</button>
        `;
    } else {
        botonesHTML += `
            <button class="btn-custom" data-seccion="Mis jornadas">Mis jornadas</button>
            <button class="btn-custom" data-seccion="Mis materiales">Mis materiales</button>
            <button class="btn-custom" data-seccion="Mi asistencia">Mi asistencia</button>
            <button class="btn-custom" data-seccion="Mis pagos">Mis pagos</button>
            <button class="btn-custom" data-seccion="Test de autoevaluación">Test de autoevaluación</button>
            <button class="btn-custom" data-seccion="Mis calificaciones">Mis calificaciones</button>
            <button class="btn-custom" data-seccion="Mi diploma">Mi diploma</button>
            <button class="btn-custom" data-seccion="Talleres">Talleres</button>
        `;
    }

    botonesHTML += `<button class="btn-custom" data-seccion="Salir" style="background-color: #d90429 !important; border-color: #8d0801 !important; margin-left: auto;">Salir</button>`;

    return `
        <div class="dashboard-container">
            <header class="dashboard-header">
                <div class="header-brand">
                    <img src="Logotipo.jpg" alt="Logo" class="header-logo">
                    <h1>Seminario de Aromaterapia en Psicoterapia Focalizada y Neurociencias</h1>
                </div>
                <div class="user-info">
                    👤 ${estadoApp.usuarioActual.nombre}
                </div>
            </header>

            <nav class="nav-menu">
                ${botonesHTML}
            </nav>

            <main class="dashboard-content">
                ${obtenerContenidoSeccion()}
            </main>
        </div>
    `;
}

async function configurarEventosDashboard() {
    // Cargar jornadas desde Firestore antes de configurar eventos para tener la data lista
    await cargarJornadasDesdeDB();
    // Re-renderizar contenido principal con las jornadas ya cargadas
    const contentMain = document.querySelector(".dashboard-content");
    if (contentMain) {
        contentMain.innerHTML = obtenerContenidoSeccion();
    }

    // Botones de navegación del menú
    const botones = document.querySelectorAll(".nav-menu .btn-custom");
    botones.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const seccion = e.target.getAttribute("data-seccion");
            if (seccion === "Salir") {
                estadoApp.usuarioActual = null;
                estadoApp.pantalla = "login";
                estadoApp.seccionActiva = "Jornadas";
                estadoApp.modoFormularioJornada = false;
                render();
            } else {
                estadoApp.seccionActiva = seccion;
                estadoApp.modoFormularioJornada = false;
                render();
            }
        });
    });

    // Eventos específicos para el Administrador en la sección Jornadas
    const btnAbrirForm = document.getElementById("btnAbrirFormJornada");
    if (btnAbrirForm) {
        btnAbrirForm.addEventListener("click", () => {
            estadoApp.modoFormularioJornada = true;
            render();
        });
    }

    const btnCancelar = document.getElementById("btnCancelarJornada");
    if (btnCancelar) {
        btnCancelar.addEventListener("click", () => {
            estadoApp.modoFormularioJornada = false;
            render();
        });
    }

    const formCargar = document.getElementById("formCargarJornada");
    if (formCargar) {
        formCargar.addEventListener("submit", async (e) => {
            e.preventDefault();
            const nuevaJornada = {
                nombre: document.getElementById("jNombre").value.trim(),
                imagen: document.getElementById("jImagen").value.trim(),
                fecha: document.getElementById("jFecha").value,
                meet: document.getElementById("jMeet").value.trim(),
                grabacion: document.getElementById("jGrabacion").value.trim()
            };

            try {
                if (db) {
                    await addDoc(collection(db, "jornadas"), nuevaJornada);
                }
                estadoApp.modoFormularioJornada = false;
                await cargarJornadasDesdeDB();
                render();
            } catch (error) {
                console.error("Error al guardar la jornada en Firestore:", error);
                alert("Hubo un error al guardar la jornada en la base de datos.");
            }
        });
    }
}

window.addEventListener("DOMContentLoaded", render);
