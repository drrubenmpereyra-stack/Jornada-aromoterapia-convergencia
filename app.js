import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

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
    seccionActiva: "Jornadas"
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
        
        errorDiv.innerText = "Consultando base de datos...";

        let usuarioEncontrado = null;

        try {
            if (!db) throw new Error("Base de datos no inicializada");
            
            // Obtenemos todos los documentos de la colección 'usuarios' en Firestore
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

        // Respaldo de seguridad local estricto en caso de que la colección aún esté vacía en la nube
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
            render();
            reproducirAudioIntro();
        } else {
            errorDiv.innerText = "Usuario o contraseña incorrectos, o verifique la colección 'usuarios' en Firestore.";
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

function renderDashboard() {
    const esAdmin = estadoApp.usuarioActual.role === "admin";
    
    let botonesHTML = `
        <button class="btn-custom" data-seccion="Jornadas">Jornadas</button>
        <button class="btn-custom" data-seccion="Materiales">Materiales</button>
    `;

    if (esAdmin) {
        botonesHTML += `
            <button class="btn-custom" data-seccion="Asistencia">Asistencia</button>
            <button class="btn-custom" data-seccion="Pagos">Pagos</button>
            <button class="btn-custom" data-seccion="Calificaciones">Calificaciones</button>
            <button class="btn-custom" data-seccion="Diplomas">Diplomas</button>
        `;
    } else {
        botonesHTML += `
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
                <div class="welcome-box">
                    <h2>Sección Actual: ${estadoApp.seccionActiva}</h2>
                    <p>Panel conectado a Cloud Firestore. Dirigido por el Dr. y Mgter Rubén M. Pereyra.</p>
                </div>
            </main>
        </div>
    `;
}

function configurarEventosDashboard() {
    const botones = document.querySelectorAll(".nav-menu .btn-custom");
    botones.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const seccion = e.target.getAttribute("data-seccion");
            if (seccion === "Salir") {
                estadoApp.usuarioActual = null;
                estadoApp.pantalla = "login";
                render();
            } else {
                estadoApp.seccionActiva = seccion;
                render();
            }
        });
    });
}

window.addEventListener("DOMContentLoaded", render);
