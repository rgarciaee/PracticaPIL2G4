import { eventos } from "../models/mockData.js";

function cargarEventos() {
    return eventos;
}



async function cargarEventos() {

    const res = await fetch("/data/eventos.json");
    const eventos = await res.json();

    return eventos;
}
notifications
