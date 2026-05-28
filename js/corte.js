console.log("app.js cargado");


class Corte {
    constructor(id, inicio, fin, notas, reclamo) {
        this.id = id;
        this.inicio = inicio;
        this.fin = fin;
        this.notas = notas;
        this.reclamo = reclamo;
    }

    static crear(notas = "") {
        const ahora = Date.now();
        return new Corte(ahora, ahora, null, notas, null);
    }

    static desdeDatos(datos) {
        return new Corte(datos.id, datos.inicio, datos.fin, datos.notas, datos.reclamo);
    }


    registrarFin() {
        this.fin = Date.now();
    }

    calcularDuracion() {
        if (this.fin === null) {
            return Date.now() - this.inicio;
        } else {
            return this.fin - this.inicio;
        }
    }
}


function guardarCortes(cortes) {
    const datosSerializados = JSON.stringify(cortes);
    localStorage.setItem("cortes", datosSerializados);
}

function cargarCortes() {
    const datosGuardados = localStorage.getItem("cortes");

    if (!datosGuardados) {
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


