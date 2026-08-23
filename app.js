const usuarios = [
    { user: "DRPEREYRA", pass: "235689", role: "admin", nombre: "Dr. y Mgter Rubén M. Pereyra (Administrador)" },
    { user: "P1", pass: "XX", role: "participant", nombre: "Participante 1" },
    { user: "P2", pass: "YY", role: "participant", nombre: "Participante 2" },
    { user: "P3", pass: "ZZ", role: "participant", nombre: "Participante 3" }
];

let estadoApp = {
    pantalla: "login",
    usuarioActual: null,
    seccionActiva: "Jornadas"
};

function render() {
    const appContainer = document.getElementById("app");
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
    document.getElementById("loginForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const uInput = document.getElementById("usuario").value.trim();
        const pInput = document.getElementById("password").value.trim();

        const encontrado = usuarios.find(u => u.user === uInput && u.pass === pInput);

        if (encontrado) {
            estadoApp.usuarioActual = encontrado;
            estadoApp.pantalla = "intro";
            render();
            reproducirAudioIntro();
        } else {
            document.getElementById("errorMsg").innerText = "Usuario o contraseña incorrectos.";
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

    document.getElementById("skipBtn").addEventListener("click", irAlDashboard);
    const video = document.getElementById("introVideo");
    video.addEventListener("ended", irAlDashboard);
}

function renderDashboard() {
    const esAdmin = estadoApp.usuarioActual.role === "admin";
    
    // Botones para todas las categorías
    let botonesHTML = `
        <button class="btn-custom" data-seccion="Jornadas">Jornadas</button>
        <button class="btn-custom" data-seccion="Materiales">Materiales</button>
    `;

    // Botones exclusivos de Administrador
    if (esAdmin) {
        botonesHTML += `
            <button class="btn-custom" data-seccion="Asistencia">Asistencia</button>
            <button class="btn-custom" data-seccion="Pagos">Pagos</button>
            <button class="btn-custom" data-seccion="Calificaciones">Calificaciones</button>
            <button class="btn-custom" data-seccion="Diplomas">Diplomas</button>
        `;
    } else {
        // Botones exclusivos de Participantes
        botonesHTML += `
            <button class="btn-custom" data-seccion="Mi asistencia">Mi asistencia</button>
            <button class="btn-custom" data-seccion="Mis pagos">Mis pagos</button>
            <button class="btn-custom" data-seccion="Mis calificaciones">Mis calificaciones</button>
            <button class="btn-custom" data-seccion="Mi diploma">Mi diploma</button>
            <button class="btn-custom" data-seccion="Test de autoevaluación">Test de autoevaluación</button>
            <button class="btn-custom" data-seccion="Talleres">Talleres</button>
        `;
    }

    // Botón Salir común al final
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
                    <p>Panel de gestión del seminario dirigido por el Dr. y Mgter Rubén M. Pereyra.</p>
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
