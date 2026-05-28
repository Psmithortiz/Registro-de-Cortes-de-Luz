

export class Corte {
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



