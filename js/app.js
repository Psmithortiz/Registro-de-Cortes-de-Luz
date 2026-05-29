import {Corte} from "./corte.js";
import {guardarCortes, cargarCortes, guardarConfig, cargarConfig} from "./persistencia.js";


let cortes = cargarCortes();
let idCorteExpandido = null;

window.Corte = Corte;
window.guardarCortes = guardarCortes;
window.cargarCortes = cargarCortes;
window.guardarConfig = guardarConfig;
window.cargarConfig = cargarConfig;

console.log("app.js cargado. Cortes en memoria:", cortes);


const boton = document.getElementById("btnRegistrar");
const btnGuardarConfig = document.getElementById("btnGuardarConfig");
const zonaHistorial = document.getElementById("listaCortes");


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
    const direccion = document.getElementById("inputDireccion").value;
    const distribuidora = document.getElementById("inputDistribuidora").value;
    const numeroCliente = document.getElementById("inputNumeroCliente").value;
    const config = {
        titular,
        direccion,
        distribuidora,
        numeroCliente
    };
    guardarConfig(config);
    alert("Configuración guardada");
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

function cargarConfigEnFormulario() {
    const config = cargarConfig();
    document.getElementById("inputTitular").value = config.titular;
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

    if (valorFolio.trim() !== "") {
        corte.reclamo = {
            folio: valorFolio.trim(),
            screenshot: null
        };
    } else {
        corte.reclamo = null;
    }

    guardarCortes(cortes);

    idCorteExpandido = null;

    renderizar();
}