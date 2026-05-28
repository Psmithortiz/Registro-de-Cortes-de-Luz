import {Corte} from "./Corte.js";
import {guardarCortes, cargarCortes} from "./Persistencia.js";


let cortes = cargarCortes();

window.Corte = Corte;
window.guardarCortes = guardarCortes;
window.cargarCortes = cargarCortes;


console.log("app.js cargado. Cortes en memoria:", cortes);