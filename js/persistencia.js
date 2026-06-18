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

export function guardarConfig(config) {
    try {
        localStorage.setItem("configuracion", JSON.stringify(config));
    } catch (error) {
        console.error("Error al guardar la configuración:", error);
    }
}

export function cargarConfig() {
    try {
        const datos = localStorage.getItem("configuracion");
        if (datos === null) {
            return { titular: "", rut: "", direccion: "", distribuidora: "", numeroCliente: "" };
        }
        return JSON.parse(datos);
    } catch (error) {
        console.error("Error al cargar la configuración, restaurando valores por defecto:", error);
        return { titular: "", rut: "", direccion: "", distribuidora: "", numeroCliente: "" };
    }
}

