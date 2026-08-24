import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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
    console.error("Error crítico al inicializar Firebase:", err);
}

let estadoApp = {
    pantalla: "login",
    usuarioActual: null,
    seccionActiva: "Mis jornadas",
    modoFormularioJornada: false,
    jornadaEditandoId: null,
    modoFormularioMaterial: false,
    materialEditandoId: null,
    modoFormularioParticipante: false,
    jornadasLista: [],
    materialesLista: [],
    participantesLista: [],
    asistenciaLista: [],
    pagosLista: [],
    diplomasLista: [],
    resultadosTestsLista: []
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
                        <input type="text" id="usuario" required placeholder="Ingrese su usuario (ej: P1)">
                    </div>
                    <div class="form-group">
                        <label for="password">Contraseña</label>
                        <input type="password" id="password" required placeholder="Ingrese su contraseña (ej: XX)">
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
        const uInput = document.getElementById("usuario").value.trim();
        const pInput = document.getElementById("password").value.trim();
        const errorDiv = document.getElementById("errorMsg");
        
        errorDiv.innerText = "Verificando en base de datos...";

        let usuarioEncontrado = null;
        let accesoRestringido = false;

        if (uInput === "P1" && pInput === "XX") {
            usuarioEncontrado = { 
                id: "test-user-id", 
                user: "P1", 
                role: "participant", 
                nombre: "Participante de Prueba (P1)", 
                foto: "https://via.placeholder.com/80" 
            };
        } else if (uInput === "DRPEREYRA" && pInput === "235689") {
            usuarioEncontrado = { user: "DRPEREYRA", role: "admin", nombre: "Dr. y Mgter Rubén M. Pereyra (Administrador)" };
        } else {
            try {
                if (db) {
                    const querySnapshot = await getDocs(collection(db, "usuarios"));
                    querySnapshot.forEach((docSnap) => {
                        const data = docSnap.data();
                        if (data.usuarioAsignado && data.usuarioAsignado.trim() === uInput) {
                            if (data.passAsignada && data.passAsignada.trim() === pInput) {
                                if (data.restringido === true) {
                                    accesoRestringido = true;
                                } else {
                                    usuarioEncontrado = {
                                        id: docSnap.id,
                                        user: data.usuarioAsignado,
                                        role: "participant",
                                        nombre: data.apellidoNombres,
                                        foto: data.foto
                                    };
                                }
                            }
                        }
                    });
                }
            } catch (error) {
                console.error("Error consultando usuarios en Firestore:", error);
            }
        }

        if (accesoRestringido) {
            errorDiv.innerText = "Comuníquese con administración.";
        } else if (usuarioEncontrado) {
            estadoApp.usuarioActual = usuarioEncontrado;
            estadoApp.pantalla = "intro";
            if (usuarioEncontrado.role !== "admin") {
                estadoApp.seccionActiva = "Mis jornadas";
            } else {
                estadoApp.seccionActiva = "Jornadas";
            }
            
            localStorage.setItem("participanteAromaterapia", usuarioEncontrado.nombre);

            await cargarDatosDesdeDB();
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
    const irAlDashboard = async () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        await cargarDatosDesdeDB();
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

async function cargarDatosDesdeDB() {
    try {
        if (!db) return;
        
        const [snapJornadas, snapMateriales, snapParticipantes, snapAsistencia, snapPagos, snapDiplomas, snapTests] = await Promise.all([
            getDocs(collection(db, "jornadas")),
            getDocs(collection(db, "materiales")),
            getDocs(collection(db, "usuarios")),
            getDocs(collection(db, "asistencia")),
            getDocs(collection(db, "pagos")),
            getDocs(collection(db, "diplomas")),
            getDocs(collection(db, "resultados_tests"))
        ]);

        let listaJ = [];
        snapJornadas.forEach((doc) => { listaJ.push({ id: doc.id, ...doc.data() }); });
        estadoApp.jornadasLista = listaJ;

        let listaM = [];
        snapMateriales.forEach((doc) => { listaM.push({ id: doc.id, ...doc.data() }); });
        estadoApp.materialesLista = listaM;

        let listaP = [];
        snapParticipantes.forEach((doc) => {
            const data = doc.data();
            if (data.usuarioAsignado !== "DRPEREYRA") {
                listaP.push({ id: doc.id, ...data });
            }
        });
        estadoApp.participantesLista = listaP;

        let listaA = [];
        snapAsistencia.forEach((doc) => { listaA.push({ id: doc.id, ...doc.data() }); });
        estadoApp.asistenciaLista = listaA;

        let listaPag = [];
        snapPagos.forEach((doc) => { listaPag.push({ id: doc.id, ...doc.data() }); });
        estadoApp.pagosLista = listaPag;

        let listaDip = [];
        snapDiplomas.forEach((doc) => { listaDip.push({ id: doc.id, ...doc.data() }); });
        estadoApp.diplomasLista = listaDip;

        let listaTests = [];
        snapTests.forEach((doc) => { listaTests.push({ id: doc.id, ...doc.data() }); });
        estadoApp.resultadosTestsLista = listaTests;

    } catch (e) {
        console.error("Error al obtener datos en paralelo:", e);
    }
}

function obtenerContenidoSeccion() {
    const esAdmin = estadoApp.usuarioActual.role === "admin";

    if (esAdmin && estadoApp.seccionActiva === "Jornadas") {
        if (estadoApp.modoFormularioJornada) {
            let jornadaAEditar = null;
            if (estadoApp.jornadaEditandoId) {
                jornadaAEditar = estadoApp.jornadasLista.find(j => j.id === estadoApp.jornadaEditandoId);
            }

            return `
                <div style="background: var(--white); padding: 2rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-width: 600px; margin: 0 auto; border: 2px solid var(--blue-border);">
                    <h2 style="color: var(--blue-border); margin-bottom: 1.5rem; text-align: center;">${jornadaAEditar ? 'Editar Jornada Académica' : 'Cargar Nueva Jornada'}</h2>
                    <form id="formCargarJornada" style="display: flex; flex-direction: column; gap: 1rem;">
                        <div class="form-group" style="text-align: left;">
                            <label>Nombre de la Jornada</label>
                            <input type="text" id="jNombre" required value="${jornadaAEditar ? jornadaAEditar.nombre : ''}" placeholder="Ej: Jornada 1..." style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                        </div>
                        <div class="form-group" style="text-align: left;">
                            <label>Imagen de la Jornada</label>
                            <input type="text" id="jImagen" required value="${jornadaAEditar ? jornadaAEditar.imagen : ''}" placeholder="Ej: Jornada1.jpg" style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                        </div>
                        <div class="form-group" style="text-align: left;">
                            <label>Fecha de la Jornada</label>
                            <input type="date" id="jFecha" required value="${jornadaAEditar ? jornadaAEditar.fecha : ''}" style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                        </div>
                        <div class="form-group" style="text-align: left;">
                            <label>Link del MEET</label>
                            <input type="url" id="jMeet" required value="${jornadaAEditar ? jornadaAEditar.meet : ''}" placeholder="https://meet.google.com/..." style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                        </div>
                        <div class="form-group" style="text-align: left;">
                            <label>Link de la clase grabada</label>
                            <input type="url" id="jGrabacion" required value="${jornadaAEditar ? jornadaAEditar.grabacion : ''}" placeholder="https://drive.google.com/..." style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                        </div>
                        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                            <button type="submit" class="btn-custom" style="flex: 1; padding: 0.75rem;">Guardar datos</button>
                            <button type="button" id="btnCancelarJornada" class="btn-custom" style="flex: 1; padding: 0.75rem; background-color: #6c757d !important;">Cancelar</button>
                        </div>
                    </form>
                </div>
            `;
        } else {
            let htmlJ = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h2 style="color: var(--blue-border); margin-bottom: 0.3rem; font-size: 1.6rem;">Gestión de Jornadas Académicas</h2>
                        <p style="color: #555;">Panel de administración general.</p>
                    </div>
                    <button id="btnAbrirFormJornada" class="btn-custom">➕ Cargar Jornada</button>
                </div>
                <div style="display: grid; gap: 1.5rem;">
            `;
            if (estadoApp.jornadasLista.length === 0) {
                htmlJ += `<p style="color: #666; background: var(--white); padding: 1.5rem; border-radius: 6px;">No hay jornadas cargadas.</p>`;
            } else {
                estadoApp.jornadasLista.forEach(j => {
                    htmlJ += `
                        <div style="background: var(--white); padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-left: 5px solid var(--lavender); display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
                            <img src="${j.imagen}" alt="${j.nombre}" style="width: 120px; height: 80px; object-fit: cover; border-radius: 6px; border: 2px solid var(--blue-border);">
                            <div style="flex: 1;">
                                <span style="font-size: 0.85rem; background: #e9ecef; padding: 0.2rem 0.5rem; border-radius: 4px; color: var(--blue-border); font-weight: bold;">📅 ${j.fecha}</span>
                                <h3 style="color: var(--blue-border); margin-top: 0.4rem; margin-bottom: 0.5rem; font-size: 1.15rem;">${j.nombre}</h3>
                                <div style="display: flex; gap: 1rem; font-size: 0.9rem;">
                                    <a href="${j.meet}" target="_blank" style="color: #1d3557; font-weight: bold;">🔗 MEET</a>
                                    <a href="${j.grabacion}" target="_blank" style="color: #1d3557; font-weight: bold;">🎥 Grabación</a>
                                </div>
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn-custom btn-editar-jornada" data-id="${j.id}" style="background-color: #457b9d !important; padding: 0.4rem 0.8rem; font-size: 0.85rem;">✏️ Editar</button>
                                <button class="btn-custom btn-eliminar-jornada" data-id="${j.id}" style="background-color: #d90429 !important; padding: 0.4rem 0.8rem; font-size: 0.85rem;">🗑️ Eliminar</button>
                            </div>
                        </div>
                    `;
                });
            }
            htmlJ += `</div>`;
            return htmlJ;
        }
    } 

    else if (esAdmin && estadoApp.seccionActiva === "Materiales") {
        if (estadoApp.modoFormularioMaterial) {
            let materialAEditar = null;
            if (estadoApp.materialEditandoId) {
                materialAEditar = estadoApp.materialesLista.find(m => m.id === estadoApp.materialEditandoId);
            }

            return `
                <div style="background: var(--white); padding: 2rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-width: 600px; margin: 0 auto; border: 2px solid var(--blue-border);">
                    <h2 style="color: var(--blue-border); margin-bottom: 1.5rem; text-align: center;">${materialAEditar ? 'Editar Material Académico' : 'Cargar Nuevo Material'}</h2>
                    <form id="formCargarMaterial" style="display: flex; flex-direction: column; gap: 1rem;">
                        <div class="form-group" style="text-align: left;">
                            <label>Nombre del material</label>
                            <input type="text" id="mNombre" required value="${materialAEditar ? materialAEditar.nombre : ''}" placeholder="Ej: Guía clínica..." style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                        </div>
                        <div class="form-group" style="text-align: left;">
                            <label>Link de la imagen</label>
                            <input type="url" id="mImagen" required value="${materialAEditar ? materialAEditar.imagen : ''}" placeholder="https://..." style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                        </div>
                        <div class="form-group" style="text-align: left;">
                            <label>Link del PDF en Google Drive</label>
                            <input type="url" id="mPdf" required value="${materialAEditar ? materialAEditar.pdf : ''}" placeholder="https://drive.google.com/..." style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                        </div>
                        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                            <button type="submit" class="btn-custom" style="flex: 1; padding: 0.75rem;">Guardar datos</button>
                            <button type="button" id="btnCancelarMaterial" class="btn-custom" style="flex: 1; padding: 0.75rem; background-color: #6c757d !important;">Cancelar</button>
                        </div>
                    </form>
                </div>
            `;
        } else {
            let htmlM = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h2 style="color: var(--blue-border); margin-bottom: 0.3rem; font-size: 1.6rem;">Gestión de Materiales Académicos</h2>
                        <p style="color: #555;">Repositorio bibliográfico.</p>
                    </div>
                    <button id="btnAbrirFormMaterial" class="btn-custom">➕ Cargar Material</button>
                </div>
                <div style="display: grid; gap: 1.5rem;">
            `;
            if (estadoApp.materialesLista.length === 0) {
                htmlM += `<p style="color: #666; background: var(--white); padding: 1.5rem; border-radius: 6px;">No hay materiales cargados.</p>`;
            } else {
                estadoApp.materialesLista.forEach(m => {
                    htmlM += `
                        <div style="background: var(--white); padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-left: 5px solid var(--lavender); display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
                            <img src="${m.imagen}" alt="${m.nombre}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 6px; border: 2px solid var(--blue-border);">
                            <div style="flex: 1;">
                                <h3 style="color: var(--blue-border); margin-bottom: 0.5rem; font-size: 1.15rem;">${m.nombre}</h3>
                                <a href="${m.pdf}" target="_blank" style="color: #1d3557; font-weight: bold; font-size: 0.9rem;">📄 Ver PDF en Google Drive</a>
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn-custom btn-editar-material" data-id="${m.id}" style="background-color: #457b9d !important; padding: 0.4rem 0.8rem; font-size: 0.85rem;">✏️ Editar</button>
                                <button class="btn-custom btn-eliminar-material" data-id="${m.id}" style="background-color: #d90429 !important; padding: 0.4rem 0.8rem; font-size: 0.85rem;">🗑️ Eliminar</button>
                            </div>
                        </div>
                    `;
                });
            }
            htmlM += `</div>`;
            return htmlM;
        }
    }

    else if (esAdmin && estadoApp.seccionActiva === "Participantes") {
        if (estadoApp.modoFormularioParticipante) {
            return `
                <div style="background: var(--white); padding: 2rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-width: 600px; margin: 0 auto; border: 2px solid var(--blue-border);">
                    <h2 style="color: var(--blue-border); margin-bottom: 1.5rem; text-align: center;">Cargar Nuevo Participante</h2>
                    <form id="formCargarParticipante" style="display: flex; flex-direction: column; gap: 1rem;">
                        <div class="form-group" style="text-align: left;">
                            <label>Apellido y Nombres</label>
                            <input type="text" id="pNombre" required placeholder="Ej: Pérez, Juan..." style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                        </div>
                        <div class="form-group" style="text-align: left;">
                            <label>Usuario Asignado</label>
                            <input type="text" id="pUsuario" required placeholder="Ej: P2" style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                        </div>
                        <div class="form-group" style="text-align: left;">
                            <label>Contraseña Asignada</label>
                            <input type="text" id="pPass" required placeholder="Ej: AB12" style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                        </div>
                        <div class="form-group" style="text-align: left;">
                            <label>Link de Foto de Perfil</label>
                            <input type="url" id="pFoto" placeholder="https://..." style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                        </div>
                        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                            <button type="submit" class="btn-custom" style="flex: 1; padding: 0.75rem;">Guardar Participante</button>
                            <button type="button" id="btnCancelarParticipante" class="btn-custom" style="flex: 1; padding: 0.75rem; background-color: #6c757d !important;">Cancelar</button>
                        </div>
                    </form>
                </div>
            `;
        } else {
            let htmlP = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h2 style="color: var(--blue-border); margin-bottom: 0.3rem; font-size: 1.6rem;">Gestión de Participantes</h2>
                        <p style="color: #555;">Control de alumnos inscriptos y credenciales de acceso.</p>
                    </div>
                    <button id="btnAbrirFormParticipante" class="btn-custom">➕ Cargar Participante</button>
                </div>
                <div style="background: var(--white); padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            `;
            if (estadoApp.participantesLista.length === 0) {
                htmlP += `<p style="color: #666;">No hay participantes cargados en el sistema.</p>`;
            } else {
                htmlP += `
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="border-bottom: 2px solid var(--blue-border); color: var(--blue-border);">
                                <th style="padding: 0.75rem;">Apellido y Nombres</th>
                                <th style="padding: 0.75rem;">Usuario</th>
                                <th style="padding: 0.75rem;">Contraseña</th>
                                <th style="padding: 0.75rem; text-align: center;">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                estadoApp.participantesLista.forEach(item => {
                    htmlP += `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 0.75rem; font-weight: 600;">${item.apellidoNombres}</td>
                            <td style="padding: 0.75rem;">${item.usuarioAsignado}</td>
                            <td style="padding: 0.75rem; font-family: monospace;">${item.passAsignada}</td>
                            <td style="padding: 0.75rem; text-align: center;">
                                <button class="btn-custom btn-eliminar-participante" data-id="${item.id}" style="background-color: #d90429 !important; padding: 0.4rem 0.8rem; font-size: 0.85rem;">Eliminar</button>
                            </td>
                        </tr>
                    `;
                });
                htmlP += `</tbody></table>`;
            }
            htmlP += `</div>`;
            return htmlP;
        }
    }

    else if (esAdmin && estadoApp.seccionActiva === "Asistencia") {
        let optionsSelect = `<option value="">Seleccione un participante</option>`;
        estadoApp.participantesLista.forEach(p => {
            optionsSelect += `<option value="${p.apellidoNombres}">${p.apellidoNombres}</option>`;
        });

        let htmlAsistenciaAdmin = `
            <div style="background: var(--white); padding: 2rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 2rem; border: 2px solid var(--blue-border);">
                <h2 style="color: var(--blue-border); margin-bottom: 1.5rem; text-align: center;">Carga de Asistencia</h2>
                <form id="formCargarAsistencia" style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); align-items: end;">
                    <div class="form-group" style="text-align: left; margin:0;">
                        <label>Apellido y Nombres</label>
                        <select id="aParticipante" required style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                            ${optionsSelect}
                        </select>
                    </div>
                    <div class="form-group" style="text-align: left; margin:0;">
                        <label>Jornada</label>
                        <input type="text" id="aJornada" required placeholder="Ej: Jornada 1" style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                    </div>
                    <div class="form-group" style="text-align: left; margin:0;">
                        <label>Selector de fecha</label>
                        <input type="date" id="aFecha" required style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                    </div>
                    <div class="form-group" style="text-align: left; margin:0;">
                        <label>Estado</label>
                        <select id="aEstado" required style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                            <option value="Presente">Presente</option>
                            <option value="Ausente">Ausente</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-custom" style="padding: 0.75rem; height: 44px;">Cargar</button>
                </form>
            </div>

            <h2 style="color: var(--blue-border); margin-bottom: 1rem; font-size: 1.4rem;">Registro General de Asistencia</h2>
            <div style="background: var(--white); padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        `;

        if (estadoApp.asistenciaLista.length === 0) {
            htmlAsistenciaAdmin += `<p style="color: #666;">No hay registros de asistencia cargados.</p>`;
        } else {
            htmlAsistenciaAdmin += `
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--blue-border); color: var(--blue-border);">
                            <th style="padding: 0.75rem;">Participante</th>
                            <th style="padding: 0.75rem;">Jornada</th>
                            <th style="padding: 0.75rem;">Fecha</th>
                            <th style="padding: 0.75rem;">Estado</th>
                            <th style="padding: 0.75rem; text-align: center;">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            estadoApp.asistenciaLista.forEach(item => {
                const esPresente = item.estado === "Presente";
                htmlAsistenciaAdmin += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 0.75rem; font-weight: 600;">${item.participante}</td>
                        <td style="padding: 0.75rem;">${item.jornada}</td>
                        <td style="padding: 0.75rem;">${item.fecha}</td>
                        <td style="padding: 0.75rem; color: ${esPresente ? '#2b9348' : '#d90429'}; font-weight: bold;">${item.estado}</td>
                        <td style="padding: 0.75rem; text-align: center;">
                            <button class="btn-custom btn-eliminar-asistencia" data-id="${item.id}" style="background-color: #d90429 !important; padding: 0.4rem 0.8rem; font-size: 0.85rem;">Eliminar</button>
                        </td>
                    </tr>
                `;
            });
            htmlAsistenciaAdmin += `</tbody></table>`;
        }
        htmlAsistenciaAdmin += `</div>`;
        return htmlAsistenciaAdmin;
    }

    else if (esAdmin && estadoApp.seccionActiva === "Pagos") {
        let optionsSelectP = `<option value="">Seleccione un participante</option>`;
        estadoApp.participantesLista.forEach(p => {
            optionsSelectP += `<option value="${p.apellidoNombres}">${p.apellidoNombres}</option>`;
        });

        let htmlPagosAdmin = `
            <div style="background: var(--white); padding: 2rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 2rem; border: 2px solid var(--blue-border);">
                <h2 style="color: var(--blue-border); margin-bottom: 1.5rem; text-align: center;">Carga de Pagos</h2>
                <form id="formCargarPago" style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); align-items: end;">
                    <div class="form-group" style="text-align: left; margin:0;">
                        <label>Apellido y Nombres</label>
                        <select id="pagParticipante" required style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                            ${optionsSelectP}
                        </select>
                    </div>
                    <div class="form-group" style="text-align: left; margin:0;">
                        <label>Jornada (1 o 2)</label>
                        <input type="text" id="pagJornada" required placeholder="Ej: 1" style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                    </div>
                    <div class="form-group" style="text-align: left; margin:0;">
                        <label>Selector de fecha</label>
                        <input type="date" id="pagFecha" required style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                    </div>
                    <div class="form-group" style="text-align: left; margin:0;">
                        <label>Importe en $</label>
                        <input type="number" id="pagImporte" required placeholder="0.00" style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                    </div>
                    <div class="form-group" style="text-align: left; margin:0;">
                        <label>Medio</label>
                        <select id="pagMedio" required style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                            <option value="Efectivo">Efectivo</option>
                            <option value="Transferencia">Transferencia</option>
                        </select>
                    </div>
                    <div class="form-group" style="text-align: left; margin:0;">
                        <label>Estado</label>
                        <select id="pagEstado" required style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                            <option value="Pagado">Pagado</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Becado">Becado</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-custom" style="padding: 0.75rem; height: 44px; grid-column: 1 / -1;">Cargar</button>
                </form>
            </div>

            <h2 style="color: var(--blue-border); margin-bottom: 1rem; font-size: 1.4rem;">Registro General de Pagos</h2>
            <div style="background: var(--white); padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        `;

        if (estadoApp.pagosLista.length === 0) {
            htmlPagosAdmin += `<p style="color: #666;">No hay registros de pagos cargados.</p>`;
        } else {
            htmlPagosAdmin += `
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--blue-border); color: var(--blue-border);">
                            <th style="padding: 0.75rem;">Participante</th>
                            <th style="padding: 0.75rem;">Jornada</th>
                            <th style="padding: 0.75rem;">Fecha</th>
                            <th style="padding: 0.75rem;">Importe</th>
                            <th style="padding: 0.75rem;">Medio</th>
                            <th style="padding: 0.75rem;">Estado</th>
                            <th style="padding: 0.75rem; text-align: center;">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            estadoApp.pagosLista.forEach(item => {
                htmlPagosAdmin += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 0.75rem; font-weight: 600;">${item.participante}</td>
                        <td style="padding: 0.75rem;">Jornada ${item.jornada}</td>
                        <td style="padding: 0.75rem;">${item.fecha}</td>
                        <td style="padding: 0.75rem;">$ ${item.importe}</td>
                        <td style="padding: 0.75rem;">${item.medio}</td>
                        <td style="padding: 0.75rem; font-weight: bold; color: ${item.estado === 'Pagado' ? '#2b9348' : (item.estado === 'Becado' ? '#4a90e2' : '#e0a96d')};">${item.estado}</td>
                        <td style="padding: 0.75rem; text-align: center;">
                            <button class="btn-custom btn-eliminar-pago" data-id="${item.id}" style="background-color: #d90429 !important; padding: 0.4rem 0.8rem; font-size: 0.85rem;">Eliminar</button>
                        </td>
                    </tr>
                `;
            });
            htmlPagosAdmin += `</tbody></table>`;
        }
        htmlPagosAdmin += `</div>`;
        return htmlPagosAdmin;
    }

    else if (esAdmin && estadoApp.seccionActiva === "Auditoría Evaluativa") {
        let htmlAudit = `
            <div style="margin-bottom: 2rem;">
                <h2 style="color: var(--blue-border); margin-bottom: 0.5rem; font-size: 1.6rem;">Auditoría Evaluativa de Test y Talleres</h2>
                <p style="color: #555;">Supervisión, marcado, habilitación de calificaciones y gestión de protocolos.</p>
            </div>
            <div style="background: var(--white); padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        `;

        if (estadoApp.resultadosTestsLista.length === 0) {
            htmlAudit += `<p style="color: #666;">No hay protocolos de test o talleres enviados por los participantes.</p>`;
        } else {
            htmlAudit += `
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--blue-border); color: var(--blue-border);">
                            <th style="padding: 0.75rem;">Participante / Usuario</th>
                            <th style="padding: 0.75rem;">Evaluación / Protocolo</th>
                            <th style="padding: 0.75rem;">Puntaje</th>
                            <th style="padding: 0.75rem; text-align: center;">Tilde Auditoría</th>
                            <th style="padding: 0.75rem; text-align: center;">Estado Administrador</th>
                            <th style="padding: 0.75rem; text-align: center;">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            estadoApp.resultadosTestsLista.forEach(item => {
                const corregido = item.corregido === true;
                htmlAudit += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 0.75rem; font-weight: 600;">${item.participante || 'Participante Aula'}</td>
                        <td style="padding: 0.75rem;">${item.test}</td>
                        <td style="padding: 0.75rem; font-weight: bold; color: var(--blue-border);">${item.score} / 100 pts</td>
                        <td style="padding: 0.75rem; text-align: center;">
                            <input type="checkbox" class="check-auditoria" data-id="${item.id}" ${corregido ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer;">
                        </td>
                        <td style="padding: 0.75rem; text-align: center;">
                            <span style="background: ${corregido ? '#d8f3dc' : '#ffe5d9'}; color: ${corregido ? '#2b9348' : '#d90429'}; padding: 0.3rem 0.8rem; border-radius: 4px; font-weight: bold; font-size: 0.85rem;">
                                ${corregido ? 'Corregido' : 'Pendiente de Auditoría'}
                            </span>
                        </td>
                        <td style="padding: 0.75rem; text-align: center;">
                            <button class="btn-custom btn-eliminar-resultado" data-id="${item.id}" style="background-color: #d90429 !important; padding: 0.4rem 0.8rem; font-size: 0.85rem;">🗑️ Eliminar</button>
                        </td>
                    </tr>
                `;
            });
            htmlAudit += `</tbody></table>`;
        }
        htmlAudit += `</div>`;
        return htmlAudit;
    }

    else if (esAdmin && estadoApp.seccionActiva === "Diplomas") {
        let optionsSelectDip = `<option value="">Seleccione un participante</option>`;
        estadoApp.participantesLista.forEach(p => {
            optionsSelectDip += `<option value="${p.apellidoNombres}">${p.apellidoNombres}</option>`;
        });

        let htmlDiplomasAdmin = `
            <div style="background: var(--white); padding: 2rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 2rem; border: 2px solid var(--blue-border);">
                <h2 style="color: var(--blue-border); margin-bottom: 1.5rem; text-align: center;">Emisión de Diplomas</h2>
                <form id="formCargarDiploma" style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); align-items: end;">
                    <div class="form-group" style="text-align: left; margin:0;">
                        <label>Apellido y Nombres</label>
                        <select id="dipParticipante" required style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                            ${optionsSelectDip}
                        </select>
                    </div>
                    <div class="form-group" style="text-align: left; margin:0;">
                        <label>Fecha de Emisión</label>
                        <input type="date" id="dipFecha" required style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                    </div>
                    <div class="form-group" style="text-align: left; margin:0;">
                        <label>Horas Cátedra / Condición</label>
                        <input type="text" id="dipHoras" required placeholder="Ej: 40 Horas - Aprobado" style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                    </div>
                    <div class="form-group" style="text-align: left; margin:0;">
                        <label>Código de Validación / Folio</label>
                        <input type="text" id="dipCodigo" required placeholder="Ej: FOLIO-2026-001" style="width:100%; padding:0.75rem; border:1px solid #ccc; border-radius:6px;">
                    </div>
                    <button type="submit" class="btn-custom" style="padding: 0.75rem; height: 44px; grid-column: 1 / -1;">Emitir Diploma</button>
                </form>
            </div>

            <h2 style="color: var(--blue-border); margin-bottom: 1rem; font-size: 1.4rem;">Diplomas Emitidos</h2>
            <div style="background: var(--white); padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        `;

        if (estadoApp.diplomasLista.length === 0) {
            htmlDiplomasAdmin += `<p style="color: #666;">No hay diplomas emitidos en el sistema.</p>`;
        } else {
            htmlDiplomasAdmin += `
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--blue-border); color: var(--blue-border);">
                            <th style="padding: 0.75rem;">Participante</th>
                            <th style="padding: 0.75rem;">Fecha</th>
                            <th style="padding: 0.75rem;">Detalle / Horas</th>
                            <th style="padding: 0.75rem;">Código</th>
                            <th style="padding: 0.75rem; text-align: center;">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            estadoApp.diplomasLista.forEach(item => {
                htmlDiplomasAdmin += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 0.75rem; font-weight: 600;">${item.participante}</td>
                        <td style="padding: 0.75rem;">${item.fecha}</td>
                        <td style="padding: 0.75rem;">${item.horas}</td>
                        <td style="padding: 0.75rem; font-family: monospace; font-weight: bold;">${item.codigo}</td>
                        <td style="padding: 0.75rem; text-align: center;">
                            <button class="btn-custom btn-eliminar-diploma" data-id="${item.id}" style="background-color: #d90429 !important; padding: 0.4rem 0.8rem; font-size: 0.85rem;">Eliminar</button>
                        </td>
                    </tr>
                `;
            });
            htmlDiplomasAdmin += `</tbody></table>`;
        }
        htmlDiplomasAdmin += `</div>`;
        return htmlDiplomasAdmin;
    }

    else if (!esAdmin && estadoApp.seccionActiva === "Mis jornadas") {
        let htmlMisJ = `
            <div style="margin-bottom: 2rem;">
                <h2 style="color: var(--blue-border); margin-bottom: 0.5rem; font-size: 1.6rem;">Mis Jornadas Académicas</h2>
                <p style="color: #555;">Acceda a las transmisiones y grabaciones oficiales.</p>
            </div>
            <div style="display: grid; gap: 1.5rem;">
        `;
        if (estadoApp.jornadasLista.length === 0) {
            htmlMisJ += `<p style="color: #666; background: var(--white); padding: 1.5rem; border-radius: 6px;">Próximamente se habilitarán las jornadas.</p>`;
        } else {
            estadoApp.jornadasLista.forEach(j => {
                htmlMisJ += `
                    <div style="background: var(--white); padding: 1.8rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-left: 5px solid var(--lavender); display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1rem;">
                        <img src="${j.imagen}" alt="${j.nombre}" style="width: 100%; max-width: 450px; height: auto; border-radius: 8px; border: 3px solid var(--blue-border);">
                        <span style="font-size: 0.85rem; background: #e9ecef; padding: 0.3rem 0.6rem; border-radius: 4px; color: var(--blue-border); font-weight: bold;">📅 ${j.fecha}</span>
                        <h3 style="color: var(--blue-border); font-size: 1.2rem;">${j.nombre}</h3>
                        <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; margin-top: 0.5rem;">
                            <a href="${j.meet}" target="_blank" class="btn-custom" style="text-decoration: none;">🟢 Unirse a MEET</a>
                            <a href="${j.grabacion}" target="_blank" class="btn-custom" style="background-color: var(--blue-border) !important; text-decoration: none;">🎥 Ver Clase Grabada</a>
                        </div>
                    </div>
                `;
            });
        }
        htmlMisJ += `</div>`;
        return htmlMisJ;
    } 

    else if (!esAdmin && estadoApp.seccionActiva === "Mis materiales") {
        let htmlMisM = `
            <div style="margin-bottom: 2rem;">
                <h2 style="color: var(--blue-border); margin-bottom: 0.5rem; font-size: 1.6rem;">Mis Materiales Académicos</h2>
                <p style="color: #555;">Repositorio bibliográfico.</p>
            </div>
            <div style="display: grid; gap: 1.5rem;">
        `;
        if (estadoApp.materialesLista.length === 0) {
            htmlMisM += `<p style="color: #666; background: var(--white); padding: 1.5rem; border-radius: 6px;">Próximamente se habilitarán los materiales.</p>`;
        } else {
            estadoApp.materialesLista.forEach(m => {
                htmlMisM += `
                    <div style="background: var(--white); padding: 1.8rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-left: 5px solid var(--lavender); display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
                        <img src="${m.imagen}" alt="${m.nombre}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; border: 2px solid var(--blue-border);">
                        <div style="flex: 1;">
                            <h3 style="color: var(--blue-border); margin-bottom: 0.8rem; font-size: 1.2rem;">${m.nombre}</h3>
                            <a href="${m.pdf}" target="_blank" class="btn-custom" style="text-decoration: none; display: inline-block;">📥 Descargar PDF</a>
                        </div>
                    </div>
                `;
            });
        }
        htmlMisM += `</div>`;
        return htmlMisM;
    }

    else if (!esAdmin && estadoApp.seccionActiva === "Mi asistencia") {
        const nombreParticipante = estadoApp.usuarioActual.nombre;
        const misAsistencias = estadoApp.asistenciaLista.filter(a => a.participante === nombreParticipante);

        let htmlMiAsis = `
            <div style="margin-bottom: 2rem;">
                <h2 style="color: var(--blue-border); margin-bottom: 0.5rem; font-size: 1.6rem;">Mi Registro de Asistencia</h2>
                <p style="color: #555;">Historial de presencias en las jornadas del seminario.</p>
            </div>
            <div style="background: var(--white); padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        `;

        if (misAsistencias.length === 0) {
            htmlMiAsis += `<p style="color: #666;">Aún no registra asistencias cargadas en el sistema.</p>`;
        } else {
            htmlMiAsis += `
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--blue-border); color: var(--blue-border);">
                            <th style="padding: 0.75rem;">Jornada</th>
                            <th style="padding: 0.75rem;">Fecha</th>
                            <th style="padding: 0.75rem;">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            misAsistencias.forEach(item => {
                const esP = item.estado === "Presente";
                htmlMiAsis += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 0.75rem; font-weight: 600;">${item.jornada}</td>
                        <td style="padding: 0.75rem;">${item.fecha}</td>
                        <td style="padding: 0.75rem; color: ${esP ? '#2b9348' : '#d90429'}; font-weight: bold;">${item.estado}</td>
                    </tr>
                `;
            });
            htmlMiAsis += `</tbody></table>`;
        }
        htmlMiAsis += `</div>`;
        return htmlMiAsis;
    }

    else if (!esAdmin && estadoApp.seccionActiva === "Mis pagos") {
        const nombreParticipante = estadoApp.usuarioActual.nombre;
        const misPagos = estadoApp.pagosLista.filter(p => p.participante === nombreParticipante);

        let htmlMiPago = `
            <div style="margin-bottom: 2rem;">
                <h2 style="color: var(--blue-border); margin-bottom: 0.5rem; font-size: 1.6rem;">Mis Pagos y Aranceles</h2>
                <p style="color: #555;">Estado de cuenta y comprobantes registrados.</p>
            </div>
            <div style="background: var(--white); padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        `;

        if (misPagos.length === 0) {
            htmlMiPago += `<p style="color: #666;">Aún no registra pagos o aranceles cargados en el sistema.</p>`;
        } else {
            htmlMiPago += `
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--blue-border); color: var(--blue-border);">
                            <th style="padding: 0.75rem;">Jornada</th>
                            <th style="padding: 0.75rem;">Fecha</th>
                            <th style="padding: 0.75rem;">Importe</th>
                            <th style="padding: 0.75rem;">Medio</th>
                            <th style="padding: 0.75rem;">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            misPagos.forEach(item => {
                htmlMiPago += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 0.75rem; font-weight: 600;">Jornada ${item.jornada}</td>
                        <td style="padding: 0.75rem;">${item.fecha}</td>
                        <td style="padding: 0.75rem;">$ ${item.importe}</td>
                        <td style="padding: 0.75rem;">${item.medio}</td>
                        <td style="padding: 0.75rem; font-weight: bold; color: ${item.estado === 'Pagado' ? '#2b9348' : (item.estado === 'Becado' ? '#4a90e2' : '#e0a96d')};">${item.estado}</td>
                    </tr>
                `;
            });
            htmlMiPago += `</tbody></table>`;
        }
        htmlMiPago += `</div>`;
        return htmlMiPago;
    }

    else if (!esAdmin && estadoApp.seccionActiva === "Test de autoevaluación") {
        return `
            <div style="margin-bottom: 2rem;">
                <h2 style="color: var(--blue-border); margin-bottom: 0.5rem; font-size: 1.6rem;">Tests de Autoevaluación Académica</h2>
                <p style="color: #555;">Acceso a los protocolos evaluativos oficiales del seminario.</p>
            </div>
            <div style="display: grid; gap: 2rem; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));">
                <div style="background: var(--white); padding: 2rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: center; border: 2px solid var(--blue-border); display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                    <img src="Jornada1.jpg" alt="Jornada 1" style="width: 100%; max-width: 320px; height: 180px; object-fit: cover; border-radius: 6px; border: 2px solid var(--blue-border);">
                    <h3 style="color: var(--blue-border); font-size: 1.2rem;">Test de Autoevaluación - Jornada 1</h3>
                    <p style="font-size: 0.95rem; color: #333;">Haga clic en el siguiente botón para abrir el Test oficial en una pestaña independiente:</p>
                    <a href="https://drrubenmpereyra-stack.github.io/Test1-aromoterapia/" target="_blank" class="btn-custom" style="padding: 0.75rem 1.5rem; font-size: 1rem; text-decoration: none; display: inline-block; margin-top: auto;">Abrir Test 1 en nueva ventana ➔</a>
                </div>
                <div style="background: var(--white); padding: 2rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: center; border: 2px solid var(--blue-border); display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                    <img src="Jornada2.jpg" alt="Jornada 2" style="width: 100%; max-width: 320px; height: 180px; object-fit: cover; border-radius: 6px; border: 2px solid var(--blue-border);" onerror="this.src='https://via.placeholder.com/320x180?text=Jornada+2'">
                    <h3 style="color: var(--blue-border); font-size: 1.2rem;">Test de Autoevaluación - Jornada 2</h3>
                    <p style="font-size: 0.95rem; color: #333;">Haga clic en el siguiente botón para abrir el Test oficial en una pestaña independiente:</p>
                    <a href="https://drrubenmpereyra-stack.github.io/Test-2-aromoterapia/" target="_blank" class="btn-custom" style="padding: 0.75rem 1.5rem; font-size: 1rem; text-decoration: none; display: inline-block; margin-top: auto;">Abrir Test 2 en nueva ventana ➔</a>
                </div>
            </div>
        `;
    }

    else if (!esAdmin && estadoApp.seccionActiva === "Mis talleres") {
        return `
            <div style="margin-bottom: 2rem;">
                <h2 style="color: var(--blue-border); margin-bottom: 0.5rem; font-size: 1.6rem;">Talleres Prácticos de Análisis Clínico</h2>
                <p style="color: #555;">Acceso a los cuestionarios de resolución de casos clínicos y aplicación didáctica.</p>
            </div>
            <div style="display: grid; gap: 2rem; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));">
                <div style="background: var(--white); padding: 2rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: center; border: 2px solid var(--blue-border); display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                    <img src="Taller1.jpg" alt="Taller 1" style="width: 100%; max-width: 320px; height: 180px; object-fit: cover; border-radius: 6px; border: 2px solid var(--blue-border);" onerror="this.src='https://via.placeholder.com/320x180?text=Taller+1'">
                    <h3 style="color: var(--blue-border); font-size: 1.2rem;">Taller Práctico 1</h3>
                    <p style="font-size: 0.95rem; color: #333;">Análisis de caso clínico: "El bloqueo de la tormenta" y neurobiología del olfato.</p>
                    <a href="https://drrubenmpereyra-stack.github.io/Taller1-aromoterapia/" target="_blank" class="btn-custom" style="padding: 0.75rem 1.5rem; font-size: 1rem; text-decoration: none; display: inline-block; margin-top: auto;">Acceder al Taller 1 ➔</a>
                </div>
                <div style="background: var(--white); padding: 2rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: center; border: 2px solid var(--blue-border); display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                    <img src="Taller2.jpg" alt="Taller 2" style="width: 100%; max-width: 320px; height: 180px; object-fit: cover; border-radius: 6px; border: 2px solid var(--blue-border);" onerror="this.src='https://via.placeholder.com/320x180?text=Taller+2'">
                    <h3 style="color: var(--blue-border); font-size: 1.2rem;">Taller Práctico 2</h3>
                    <p style="font-size: 0.95rem; color: #333;">Análisis de caso clínico: "El discurso escindido y el vacío" y protocolos de vaporización.</p>
                    <a href="https://drrubenmpereyra-stack.github.io/Taller-2-aromoerapia/" target="_blank" class="btn-custom" style="padding: 0.75rem 1.5rem; font-size: 1rem; text-decoration: none; display: inline-block; margin-top: auto;">Acceder al Taller 2 ➔</a>
                </div>
            </div>
        `;
    }

    else if (!esAdmin && estadoApp.seccionActiva === "Mis calificaciones") {
        const nombreParticipante = estadoApp.usuarioActual.nombre;
        const misResultados = estadoApp.resultadosTestsLista.filter(r => 
            (r.participante || '').trim() === nombreParticipante.trim() && r.corregido === true
        );

        let htmlMisCalif = `
            <div style="margin-bottom: 2rem;">
                <h2 style="color: var(--blue-border); margin-bottom: 0.5rem; font-size: 1.6rem;">Mis Calificaciones y Protocolos</h2>
                <p style="color: #555;">Evaluaciones auditadas y aprobadas por la dirección.</p>
            </div>
            <div style="background: var(--white); padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        `;

        if (misResultados.length === 0) {
            htmlMisCalif += `<p style="color: #666;">Aún no registra calificaciones habilitadas por administración.</p>`;
        } else {
            htmlMisCalif += `
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--blue-border); color: var(--blue-border);">
                            <th style="padding: 0.75rem;">Evaluación</th>
                            <th style="padding: 0.75rem;">Puntaje Obtenido</th>
                            <th style="padding: 0.75rem;">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            misResultados.forEach(item => {
                htmlMisCalif += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 0.75rem; font-weight: 600;">${item.test}</td>
                        <td style="padding: 0.75rem; font-weight: bold; color: var(--blue-border);">${item.score} / 100 pts</td>
                        <td style="padding: 0.75rem; font-weight: bold; color: #2b9348;">
                            🟢 Aprobado / Corregido
                        </td>
                    </tr>
                `;
            });
            htmlMisCalif += `</tbody></table>`;
        }
        htmlMisCalif += `</div>`;
        return htmlMisCalif;
    }

    else if (!esAdmin && estadoApp.seccionActiva === "Mi diploma") {
        const nombreParticipante = estadoApp.usuarioActual.nombre;
        const miDiploma = estadoApp.diplomasLista.find(d => d.participante === nombreParticipante);

        let htmlMiDip = `
            <div style="margin-bottom: 2rem;">
                <h2 style="color: var(--blue-border); margin-bottom: 0.5rem; font-size: 1.6rem;">Mi Certificado / Diploma</h2>
                <p style="color: #555;">Certificación oficial emitida por la dirección del seminario.</p>
            </div>
        `;

        if (!miDiploma) {
            htmlMiDip += `
                <div style="background: var(--white); padding: 2rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: center;">
                    <p style="color: #666; font-size: 1.1rem;">Su diploma aún no ha sido emitido o está pendiente de validación final por administración.</p>
                </div>
            `;
        } else {
            htmlMiDip += `
                <div style="background: var(--white); padding: 3rem; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.12); border: 8px double var(--blue-border); text-align: center; max-width: 800px; margin: 0 auto; position: relative;">
                    <img src="Logotipo.jpg" alt="Logo" style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%; margin-bottom: 1rem; border: 2px solid var(--blue-border);">
                    <h3 style="color: var(--blue-border); font-size: 1.4rem; font-family: serif; letter-spacing: 1px; margin-bottom: 0.5rem;">SEMINARIO DE AROMATERAPIA EN PSICOTERAPIA FOCALIZADA Y NEUROCIENCIAS</h3>
                    <p style="font-size: 0.95rem; color: #555; margin-bottom: 2rem;">Otorgado a:</p>
                    <h1 style="font-size: 2rem; color: var(--blue-border); border-bottom: 2px solid var(--lavender); display: inline-block; padding-bottom: 0.5rem; margin-bottom: 2rem; font-family: serif;">${miDiploma.participante}</h1>
                    <p style="font-size: 1.1rem; line-height: 1.6; color: #333; margin-bottom: 2.5rem; max-width: 650px; margin-left: auto; margin-right: auto;">
                        Por haber completado satisfactoriamente los requisitos académicos del seminario con una exigencia de <b>${miDiploma.horas}</b>, llevado a cabo en el ciclo lectivo 2026.
                    </p>
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 3rem; padding: 0 2rem; flex-wrap: wrap; gap: 2rem;">
                        <div style="text-align: left;">
                            <p style="font-size: 0.85rem; color: #666; margin: 0;">Fecha de Emisión: <b>${miDiploma.fecha}</b></p>
                            <p style="font-size: 0.85rem; color: #666; margin: 0;">Folio / Código: <b>${miDiploma.codigo}</b></p>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-family: serif; font-size: 1.2rem; font-style: italic; color: #1d3557; margin-bottom: 0.3rem;">Dr. Rubén M. Pereyra</div>
                            <div style="border-top: 1px solid #333; width: 180px; padding-top: 0.3rem; font-size: 0.85rem; font-weight: bold; color: #555;">Director y Mgter</div>
                        </div>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 2rem;">
                    <button onclick="window.print()" class="btn-custom" style="padding: 0.75rem 2rem; font-size: 1rem;">🖨️ Imprimir / Guardar como PDF</button>
                </div>
            `;
        }
        return htmlMiDip;
    }

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
            <button class="btn-custom" data-seccion="Participantes">Participantes</button>
            <button class="btn-custom" data-seccion="Asistencia">Asistencia</button>
            <button class="btn-custom" data-seccion="Pagos">Pagos</button>
            <button class="btn-custom" data-seccion="Auditoría Evaluativa">Auditoría Evaluativa</button>
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
            <button class="btn-custom" data-seccion="Mis talleres">Mis talleres</button>
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

function configurarEventosDashboard() {
    const botones = document.querySelectorAll(".nav-menu .btn-custom");
    botones.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const seccion = e.target.getAttribute("data-seccion");
            if (seccion === "Salir") {
                estadoApp.usuarioActual = null;
                estadoApp.pantalla = "login";
                estadoApp.seccionActiva = "Jornadas";
                estadoApp.modoFormularioJornada = false;
                estadoApp.jornadaEditandoId = null;
                estadoApp.modoFormularioMaterial = false;
                estadoApp.materialEditandoId = null;
                estadoApp.modoFormularioParticipante = false;
                render();
            } else {
                estadoApp.seccionActiva = seccion;
                estadoApp.modoFormularioJornada = false;
                estadoApp.jornadaEditandoId = null;
                estadoApp.modoFormularioMaterial = false;
                estadoApp.materialEditandoId = null;
                estadoApp.modoFormularioParticipante = false;
                render();
            }
        });
    });

    const btnAbrirFormP = document.getElementById("btnAbrirFormParticipante");
    if (btnAbrirFormP) btnAbrirFormP.addEventListener("click", () => { estadoApp.modoFormularioParticipante = true; render(); });
    
    const btnCancelarP = document.getElementById("btnCancelarParticipante");
    if (btnCancelarP) btnCancelarP.addEventListener("click", () => { estadoApp.modoFormularioParticipante = false; render(); });
    
    const formCargarP = document.getElementById("formCargarParticipante");
    if (formCargarP) {
        formCargarP.addEventListener("submit", async (e) => {
            e.preventDefault();
            const nuevoParticipante = {
                apellidoNombres: document.getElementById("pNombre").value.trim(),
                usuarioAsignado: document.getElementById("pUsuario").value.trim(),
                passAsignada: document.getElementById("pPass").value.trim(),
                foto: document.getElementById("pFoto").value.trim() || "https://via.placeholder.com/80",
                restringido: false
            };
            try {
                if (db) await addDoc(collection(db, "usuarios"), nuevoParticipante);
                estadoApp.modoFormularioParticipante = false;
                await cargarDatosDesdeDB();
                render();
            } catch (error) { 
                console.error(error); 
                alert("Error al guardar participante."); 
            }
        });
    }

    document.querySelectorAll(".btn-eliminar-participante").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const idDoc = e.target.getAttribute("data-id");
            try { 
                await deleteDoc(doc(db, "usuarios", idDoc)); 
                await cargarDatosDesdeDB(); 
                render(); 
            } catch (err) { 
                console.error(err); 
            }
        });
    });

    // EVENTOS JORNADAS
    const btnAbrirFormJ = document.getElementById("btnAbrirFormJornada");
    if (btnAbrirFormJ) {
        btnAbrirFormJ.addEventListener("click", () => { 
            estadoApp.modoFormularioJornada = true; 
            estadoApp.jornadaEditandoId = null; 
            render(); 
        });
    }

    const btnCancelarJ = document.getElementById("btnCancelarJornada");
    if (btnCancelarJ) {
        btnCancelarJ.addEventListener("click", () => { 
            estadoApp.modoFormularioJornada = false; 
            estadoApp.jornadaEditandoId = null; 
            render(); 
        });
    }

    document.querySelectorAll(".btn-editar-jornada").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const idDoc = e.target.getAttribute("data-id");
            estadoApp.modoFormularioJornada = true;
            estadoApp.jornadaEditandoId = idDoc;
            render();
        });
    });

    document.querySelectorAll(".btn-eliminar-jornada").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const idDoc = e.target.getAttribute("data-id");
            if (confirm("¿Está seguro de que desea eliminar esta jornada?")) {
                try {
                    await deleteDoc(doc(db, "jornadas", idDoc));
                    await cargarDatosDesdeDB();
                    render();
                } catch (err) {
                    console.error("Error al eliminar jornada:", err);
                }
            }
        });
    });

    const formCargarJ = document.getElementById("formCargarJornada");
    if (formCargarJ) {
        formCargarJ.addEventListener("submit", async (e) => {
            e.preventDefault();
            const datosJornada = {
                nombre: document.getElementById("jNombre").value.trim(),
                imagen: document.getElementById("jImagen").value.trim(),
                fecha: document.getElementById("jFecha").value,
                meet: document.getElementById("jMeet").value.trim(),
                grabacion: document.getElementById("jGrabacion").value.trim()
            };
            try {
                if (db) {
                    if (estadoApp.jornadaEditandoId) {
                        await updateDoc(doc(db, "jornadas", estadoApp.jornadaEditandoId), datosJornada);
                    } else {
                        await addDoc(collection(db, "jornadas"), datosJornada);
                    }
                }
                estadoApp.modoFormularioJornada = false;
                estadoApp.jornadaEditandoId = null;
                await cargarDatosDesdeDB();
                render();
            } catch (error) { 
                console.error(error); 
                alert("Error al guardar jornada."); 
            }
        });
    }

    // EVENTOS MATERIALES
    const btnAbrirFormM = document.getElementById("btnAbrirFormMaterial");
    if (btnAbrirFormM) {
        btnAbrirFormM.addEventListener("click", () => { 
            estadoApp.modoFormularioMaterial = true; 
            estadoApp.materialEditandoId = null; 
            render(); 
        });
    }

    const btnCancelarM = document.getElementById("btnCancelarMaterial");
    if (btnCancelarM) {
        btnCancelarM.addEventListener("click", () => { 
            estadoApp.modoFormularioMaterial = false; 
            estadoApp.materialEditandoId = null; 
            render(); 
        });
    }

    document.querySelectorAll(".btn-editar-material").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const idDoc = e.target.getAttribute("data-id");
            estadoApp.modoFormularioMaterial = true;
            estadoApp.materialEditandoId = idDoc;
            render();
        });
    });

    document.querySelectorAll(".btn-eliminar-material").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const idDoc = e.target.getAttribute("data-id");
            if (confirm("¿Está seguro de que desea eliminar este material?")) {
                try {
                    await deleteDoc(doc(db, "materiales", idDoc));
                    await cargarDatosDesdeDB();
                    render();
                } catch (err) {
                    console.error("Error al eliminar material:", err);
                }
            }
        });
    });

    const formCargarM = document.getElementById("formCargarMaterial");
    if (formCargarM) {
        formCargarM.addEventListener("submit", async (e) => {
            e.preventDefault();
            const datosMaterial = {
                nombre: document.getElementById("mNombre").value.trim(),
                imagen: document.getElementById("mImagen").value.trim(),
                pdf: document.getElementById("mPdf").value.trim()
            };
            try {
                if (db) {
                    if (estadoApp.materialEditandoId) {
                        await updateDoc(doc(db, "materiales", estadoApp.materialEditandoId), datosMaterial);
                    } else {
                        await addDoc(collection(db, "materiales"), datosMaterial);
                    }
                }
                estadoApp.modoFormularioMaterial = false;
                estadoApp.materialEditandoId = null;
                await cargarDatosDesdeDB();
                render();
            } catch (error) { 
                console.error(error); 
                alert("Error al guardar material."); 
            }
        });
    }

    const formCargarAsis = document.getElementById("formCargarAsistencia");
    if (formCargarAsis) {
        formCargarAsis.addEventListener("submit", async (e) => {
            e.preventDefault();
            const nuevaAsis = {
                participante: document.getElementById("aParticipante").value,
                jornada: document.getElementById("aJornada").value.trim(),
                fecha: document.getElementById("aFecha").value,
                estado: document.getElementById("aEstado").value
            };
            try {
                if (db) await addDoc(collection(db, "asistencia"), nuevaAsis);
                await cargarDatosDesdeDB();
                render();
            } catch (error) { console.error(error); alert("Error al guardar asistencia."); }
        });
    }

    document.querySelectorAll(".btn-eliminar-asistencia").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const idDoc = e.target.getAttribute("data-id");
            try { await deleteDoc(doc(db, "asistencia", idDoc)); await cargarDatosDesdeDB(); render(); } catch (err) { console.error(err); }
        });
    });

    const formCargarPago = document.getElementById("formCargarPago");
    if (formCargarPago) {
        formCargarPago.addEventListener("submit", async (e) => {
            e.preventDefault();
            const nuevoPago = {
                participante: document.getElementById("pagParticipante").value,
                jornada: document.getElementById("pagJornada").value.trim(),
                fecha: document.getElementById("pagFecha").value,
                importe: document.getElementById("pagImporte").value.trim(),
                medio: document.getElementById("pagMedio").value,
                estado: document.getElementById("pagEstado").value
            };
            try {
                if (db) await addDoc(collection(db, "pagos"), nuevoPago);
                await cargarDatosDesdeDB();
                render();
            } catch (error) { console.error(error); alert("Error al guardar pago."); }
        });
    }

    document.querySelectorAll(".btn-eliminar-pago").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const idDoc = e.target.getAttribute("data-id");
            try { await deleteDoc(doc(db, "pagos", idDoc)); await cargarDatosDesdeDB(); render(); } catch (err) { console.error(err); }
        });
    });

    document.querySelectorAll(".check-auditoria").forEach(chk => {
        chk.addEventListener("change", async (e) => {
            const idDoc = e.target.getAttribute("data-id");
            const nuevoEstado = e.target.checked;
            try {
                if (db) {
                    await updateDoc(doc(db, "resultados_tests", idDoc), { corregido: nuevoEstado });
                    await cargarDatosDesdeDB();
                    render();
                }
            } catch (err) {
                console.error("Error al actualizar estado de auditoría:", err);
            }
        });
    });

    // EVENTO ELIMINAR RESULTADO DE AUDITORÍA (TEST O TALLER)
    document.querySelectorAll(".btn-eliminar-resultado").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const idDoc = e.target.getAttribute("data-id");
            if (confirm("¿Está seguro de que desea eliminar este protocolo de evaluación?")) {
                try {
                    await deleteDoc(doc(db, "resultados_tests", idDoc));
                    await cargarDatosDesdeDB();
                    render();
                } catch (err) {
                    console.error("Error al eliminar el resultado evaluativo:", err);
                    alert("No se pudo eliminar el registro.");
                }
            }
        });
    });

    const formCargarDiploma = document.getElementById("formCargarDiploma");
    if (formCargarDiploma) {
        formCargarDiploma.addEventListener("submit", async (e) => {
            e.preventDefault();
            const nuevoDiploma = {
                participante: document.getElementById("dipParticipante").value,
                fecha: document.getElementById("dipFecha").value,
                horas: document.getElementById("dipHoras").value.trim(),
                codigo: document.getElementById("dipCodigo").value.trim()
            };
            try {
                if (db) await addDoc(collection(db, "diplomas"), nuevoDiploma);
                await cargarDatosDesdeDB();
                render();
            } catch (error) { console.error(error); alert("Error al emitir diploma."); }
        });
    }

    document.querySelectorAll(".btn-eliminar-diploma").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const idDoc = e.target.getAttribute("data-id");
            try { await deleteDoc(doc(db, "diplomas", idDoc)); await cargarDatosDesdeDB(); render(); } catch (err) { console.error(err); }
        });
    });
}

window.addEventListener("DOMContentLoaded", render);
