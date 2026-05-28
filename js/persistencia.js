import { Corte } from "./corte.js";



export function guardarCortes(cortes) {
    const datosSerializados = JSON.stringify(cortes);
    localStorage.setItem("cortes", datosSerializados);
}

export function cargarCortes() {
    const datosGuardados = localStorage.getItem("cortes");

    if (!datosGuardados || datosGuardados === "undefined") {
        return [];
    }

    try {
        const objetosPlanos = JSON.parse(datosGuardados);
        return objetosPlanos.map(objeto => Corte.desdeDatos(objeto));

    } catch (error) {
        console.error("Error al parsear los cortes de localStorage:", error);
        return [];
    }
}

