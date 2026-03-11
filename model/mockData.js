export const eventos = [
{
    id: 1,
    nombre: "Subsonic Festival 2026",
    imagen: "img/evento1.jpg",
    fecha_inicio: "2026-07-10",
    fecha_fin: "2026-07-12",
    descripcion: "Festival de música electrónica",
    artistas: [1,2],
    zonas: [1,2]
}
];

export const artistas = [
{
    id: 1,
    nombre: "DJ Nova",
    descripcion: "Productor de techno underground",
    genero: "Techno",
    imagen: "img/djnova.jpg",
    eventos: [1]
},
{
    id: 2,
    nombre: "Luna Beats",
    descripcion: "DJ internacional de house",
    genero: "House",
    imagen: "img/lunabeats.jpg",
    eventos: [1]
}
];

export const zonas = [
{
    id: 1,
    evento_id: 1,
    nombre: "Zona General",
    aforo_maximo: 5000,
    precio: 60
},
{
    id: 2,
    evento_id: 1,
    nombre: "Zona VIP",
    aforo_maximo: 500,
    precio: 150
}
];

export const usuarios = [
{
    id: 1,
    dni: "12345678A",
    nombre_apellidos: "Carlos Perez",
    fecha_nacimiento: "1995-03-10",
    num_tarjeta: "1234-5678-9999",
    direccion: "Madrid",
    email: "carlos@email.com",
    rol: "cliente",
    premium: true
}
];

export const entradas = [
{
    id: 1,
    usuario_id: 1,
    zona_id: 1,
    localizador_qr: "QR123456",
    fecha_compra: "2026-03-01",
    estado: "activa"
}
];

export const puestos = [
{
    id: 1,
    evento_id: 1,
    zona_id: 1,
    precio_alquiler: 500,
    dimension_m2: 20,
    horario: "10:00-03:00",
    proveedor_id: null
}
];