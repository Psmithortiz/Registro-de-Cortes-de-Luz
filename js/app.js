import {Corte} from "./corte.js";
import {guardarCortes, cargarCortes} from "./persistencia.js";


let cortes = cargarCortes();


window.Corte = Corte;
window.guardarCortes = guardarCortes;
window.cargarCortes = cargarCortes;


console.log("app.js cargado. Cortes en memoria:", cortes);


const boton = document.getElementById("btnRegistrar");

renderizar();

function renderizar() {
    // PARTE 1: zona corte en curso
    const activo = obtenerCorteActivo();
    const zonaEnCurso = document.getElementById("corteEnCurso");
    // si hay activo → mostrar info; si no → vaciar
    if (activo) {
        zonaEnCurso.innerHTML = `<p>Corte en curso desde: ${formatearFecha(activo.inicio)}</p>`;
        boton.textContent = "Terminar corte";
    } else {
        zonaEnCurso.innerHTML = `<p>Sin corte activo</p>`;
        boton.textContent = "Registrar corte";
    }

    // PARTE 2: historial de cerrados
    const cerrados = cortes.filter(c => c.fin !== null);
    const zonaHistorial = document.getElementById("listaCortes");
    const htmlCerrados = cerrados.map(c => {
        return `<div>Inicio: ${formatearFecha(c.inicio)} | Fin: ${formatearFecha(c.fin)} | Duración: ${formatearDuracion(c.calcularDuracion())}</div>`;
    }).join("");
    zonaHistorial.innerHTML = htmlCerrados;
}
boton.addEventListener("click", function () {
    const activo = obtenerCorteActivo();

    if (!activo) {
        // RAMA 1: iniciar corte nuevo
        // 1. crear
        const corteNuevo = Corte.crear()
        // 2. push al array
        cortes.push(corteNuevo);
        // 3. guardar
        guardarCortes(cortes);


    } else {
        // RAMA 2: cerrar el corte activo
        // 1. marcar fin (sobre la variable 'activo')
        activo.registrarFin()
        // 2. guardar
        guardarCortes(cortes)
    }
    renderizar();
});


function obtenerCorteActivo() {
    return cortes.find(c => c.fin === null);
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
