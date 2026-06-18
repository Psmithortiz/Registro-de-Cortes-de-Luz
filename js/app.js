import {Corte} from "./corte.js";
import {guardarCortes, cargarCortes, guardarConfig, cargarConfig} from "./persistencia.js";


let cortes = cargarCortes();
let idCorteExpandido = null;
let screenshotPendiente = null;

window.Corte = Corte;
window.guardarCortes = guardarCortes;
window.cargarCortes = cargarCortes;
window.guardarConfig = guardarConfig;
window.cargarConfig = cargarConfig;

console.log("app.js cargado. Cortes en memoria:", cortes);


const boton = document.getElementById("btnRegistrar");
const btnGuardarConfig = document.getElementById("btnGuardarConfig");
const zonaHistorial = document.getElementById("listaCortes");
const btnReporte = document.getElementById("btnReporte");

renderizar();
cargarConfigEnFormulario();


boton.addEventListener("click", function () {
    const activo = obtenerCorteActivo();
    if (!activo) {
        const corteNuevo = Corte.crear()
        cortes.push(corteNuevo);
        guardarCortes(cortes);
    } else {
        activo.registrarFin()
        guardarCortes(cortes)
    }
    renderizar();
});

btnGuardarConfig.addEventListener("click", function () {
    const titular = document.getElementById("inputTitular").value;
    const rut = document.getElementById("inputRut").value;
    const direccion = document.getElementById("inputDireccion").value;
    const distribuidora = document.getElementById("inputDistribuidora").value;
    const numeroCliente = document.getElementById("inputNumeroCliente").value;
    const config = {
        titular,
        rut,
        direccion,
        distribuidora,
        numeroCliente
    };
    guardarConfig(config);
    alert("Configuración guardada");
});

zonaHistorial.addEventListener("change", function(event) {
    if (event.target.tagName !== "INPUT") return;
    if (event.target.dataset.campo !== "screenshot") return;

    const file = event.target.files[0];
    if (!file) return;

    comprimirImagen(file, function(dataURL) {
        screenshotPendiente = dataURL;
        // mostrar preview
        const preview = document.querySelector(`img[data-id="${event.target.dataset.id}"][data-rol="preview"]`);
        if (preview) {
            preview.src = dataURL;
            preview.style.display = "block";
        }
    });
});


zonaHistorial.addEventListener("click", function(event) {
    if (event.target.tagName !== "BUTTON") return;

    const id = Number(event.target.dataset.id);
    const accion = event.target.dataset.accion;

    if (accion === "eliminar") {
        eliminarCorte(id);
    } else if (accion === "editar") {
        editarCorte(id);
    } else if (accion === "cancelar") {
        cancelarEdicion();
    } else if (accion === "guardar") {
        guardarCambios(id);
    }
});


btnReporte.addEventListener("click", generarReporte);


function renderizar() {
    const activo = obtenerCorteActivo();
    const zonaEnCurso = document.getElementById("corteEnCurso");
    if (activo) {
        zonaEnCurso.innerHTML = `<p>Corte en curso desde: ${formatearFecha(activo.inicio)}</p>`;
        boton.textContent = "Terminar corte";
    } else {
        zonaEnCurso.innerHTML = `<p>Sin corte activo</p>`;
        boton.textContent = "Registrar corte";
    }

    const cerrados = cortes.filter(c => c.fin !== null);

    // Usamos una variable local idéntica para asegurarnos de que la función sea independiente
    const contenedorHistorial = document.getElementById("listaCortes");

    const htmlCerrados = cerrados.map(c => {
        if (c.id === idCorteExpandido) {
            return `
            <div class="corte-item expandido" style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
                <p>Inicio: ${formatearFecha(c.inicio)} | Fin: ${formatearFecha(c.fin)} | Duración: ${formatearDuracion(c.calcularDuracion())}</p>
                <div>
                    <label>Notas: <input type="text" data-id="${c.id}" data-campo="notas" value="${c.notas || ''}"></label>
                </div>
                <div>
                    <label>Folio reclamo: <input type="text" data-id="${c.id}" data-campo="folio" value="${c.reclamo ? c.reclamo.folio : ''}"></label>
                </div>
                <div>
                    <label>Screenshot: <input type="file" data-id="${c.id}" data-campo="screenshot" accept="image/*"></label>
                    <br>
                    <img data-id="${c.id}" data-rol="preview" 
                         src="${c.reclamo?.screenshot || ''}" 
                         style="max-width: 300px; display: ${c.reclamo?.screenshot ? 'block' : 'none'}; margin-top: 10px;">
                </div>
                <br>
                <button data-id="${c.id}" data-accion="guardar">Guardar</button>
                <button data-id="${c.id}" data-accion="cancelar">Cancelar</button>
            </div>`;
        } else {
            return `
            <div class="corte-item" style="margin: 5px 0;">
                <span>Inicio: ${formatearFecha(c.inicio)} | Duración: ${formatearDuracion(c.calcularDuracion())}</span>
                <button data-id="${c.id}" data-accion="editar">Editar</button>
                <button data-id="${c.id}" data-accion="eliminar">Eliminar</button>
            </div>`;
        }
    }).join("");

    contenedorHistorial.innerHTML = htmlCerrados;
}

function generarReporte() {
    const config = cargarConfig();
    const cerrados = cortes.filter(c => c.fin !== null);

    // validaciones
    if (cerrados.length === 0) {
        alert("No hay cortes cerrados para reportar.");
        return;
    }
    if (!config.titular || config.titular.trim() === "") {
        alert("Configura tus datos (titular, dirección, etc.) antes de generar el reporte.");
        return;
    }

    // total de horas
    const totalMs = cerrados.reduce((acum, c) => acum + c.calcularDuracion(), 0);
    const totalFormateado = formatearDuracion(totalMs);
    const cerradosOrdenados = [...cerrados].sort((a, b) => a.inicio - b.inicio);

    const primerCorte = cerradosOrdenados[0];
    const ultimoCorte = cerradosOrdenados[cerradosOrdenados.length - 1];
    const fechaInicio = new Date(primerCorte.inicio).toLocaleDateString("es-CL");
    const fechaFin = new Date(ultimoCorte.fin).toLocaleDateString("es-CL");

    const resumen = `Durante el período comprendido entre el ${fechaInicio} y el ${fechaFin} se registraron ${cerrados.length} interrupciones de suministro eléctrico, acumulando ${totalFormateado} sin servicio.`;
    // ordenar cortes por fecha de inicio ascendente


    // filas de la tabla
    const filasTabla = cerradosOrdenados.map((c, i) => `
    <tr>
        <td>${i + 1}</td>
        <td>${formatearFecha(c.inicio)}</td>
        <td>${formatearFecha(c.fin)}</td>
        <td>${formatearDuracion(c.calcularDuracion())}</td>
        <td>${c.reclamo?.folio || "—"}</td>
        <td>${c.notas || "—"}</td>
    </tr>
`).join("");

    // fecha del reporte
    const fechaReporte = new Date().toLocaleDateString("es-CL");

    // HTML completo
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Cortes - ${config.titular}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #000; }
        h1 { font-size: 18pt; margin-bottom: 5px; }
        h2 { font-size: 14pt; margin-top: 30px; }
        .meta { margin-bottom: 20px; font-size: 11pt; }
        .meta div { margin: 3px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10pt; }
        th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; vertical-align: top; }
        th { background: #eee; }
        .totales { margin-top: 20px; font-size: 11pt; }
        .totales strong { display: inline-block; min-width: 200px; }
        .footer { margin-top: 40px; font-size: 9pt; color: #666; }
        @media print {
            body { margin: 20px; }
            button { display: none; }
        }
    </style>
</head>
<body>
    <h1>Reporte de cortes de suministro eléctrico</h1>
    <div class="meta">
        <div><strong>Titular:</strong> ${config.titular}</div>
        <div><strong>RUT:</strong> ${config.rut || "—"}</div>
        <div><strong>Dirección:</strong> ${config.direccion}</div>
        <div><strong>Empresa distribuidora:</strong> ${config.distribuidora}</div>
        <div><strong>N° de cliente:</strong> ${config.numeroCliente}</div>
        <div><strong>Fecha del reporte:</strong> ${fechaReporte}</div>
    </div>
<h2>Resumen</h2>
<p>${resumen}</p>
    <h2>Detalle de cortes</h2>
    <table>
        <thead>
    <tr>
        <th>N°</th>
        <th>Inicio</th>
        <th>Fin</th>
        <th>Duración</th>
        <th>Folio reclamo</th>
        <th>Notas</th>
    </tr>
</thead>
        <tbody>
            ${filasTabla}
        </tbody>
    </table>

    <div class="totales">
        <div><strong>Total de cortes:</strong> ${cerrados.length}</div>
        <div><strong>Tiempo total sin servicio:</strong> ${totalFormateado}</div>
    </div>

    <div class="footer">
        Documento generado automáticamente como evidencia de respaldo para
        reclamo formal ante la SEC (Superintendencia de Electricidad y
        Combustibles).
    </div>

    <button onclick="window.print()" style="margin-top: 30px; padding: 8px 16px;">Imprimir / Guardar como PDF</button>
</body>
</html>`;

    // abrir nueva ventana y escribir el HTML
    const ventana = window.open("", "_blank");
    ventana.document.write(html);
    ventana.document.close();
}


function cargarConfigEnFormulario() {
    const config = cargarConfig();
    document.getElementById("inputTitular").value = config.titular;
    document.getElementById("inputRut").value = config.rut || "";
    document.getElementById("inputDireccion").value = config.direccion;
    document.getElementById("inputDistribuidora").value = config.distribuidora;
    document.getElementById("inputNumeroCliente").value = config.numeroCliente;
}

function obtenerCorteActivo() {
    return cortes.find(c => c.fin === null);
}

function editarCorte(id) {
    idCorteExpandido = id;
    renderizar();
}

function cancelarEdicion() {
    idCorteExpandido = null;
    screenshotPendiente = null;
    renderizar();
}

function formatearDuracion(ms) {
    const minutosTotales = Math.floor(ms / 1000 / 60);
    const horas = Math.floor(minutosTotales / 60);
    const minutos = minutosTotales % 60;
    return `${horas}h ${minutos}min`;
}

function formatearFecha(timestamp) {
    return new Date(timestamp).toLocaleString("es-CL");
}

function eliminarCorte(id) {
    cortes = cortes.filter(c => c.id !== id);
    guardarCortes(cortes);
    renderizar();
}

function guardarCambios(id) {

    const corte = cortes.find(c => c.id === id);

    if (!corte) {
        console.error("No se encontró el corte con ID:", id);
        return;
    }


    const inputNotas = document.querySelector(`input[data-id="${id}"][data-campo="notas"]`);
    const inputFolio = document.querySelector(`input[data-id="${id}"][data-campo="folio"]`);

    const valorNotas = inputNotas.value;
    const valorFolio = inputFolio.value;

    corte.notas = valorNotas;

    const screenshotFinal = screenshotPendiente !== null
        ? screenshotPendiente
        : (corte.reclamo?.screenshot || null);

    if (valorFolio.trim() !== "" || screenshotFinal) {
        corte.reclamo = {
            folio: valorFolio.trim(),
            screenshot: screenshotFinal
        };
    } else {
        corte.reclamo = null;
    }

    screenshotPendiente = null;

    guardarCortes(cortes);

    idCorteExpandido = null;

    renderizar();
}

function comprimirImagen(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 800;
            const escala = Math.min(1, MAX_WIDTH / img.width);
            canvas.width = img.width * escala;
            canvas.height = img.height * escala;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataURL = canvas.toDataURL("image/jpeg", 0.7);
            callback(dataURL);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}