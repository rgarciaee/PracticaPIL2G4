export const Evento = {
    id: null,
    nombre: "",
    imagen: "",
    fecha_inicio: "",
    fecha_fin: "",
    descripcion: "",
    artistas: [],
    zonas: []
};

export const Artista = {
    id: null,
    nombre: "",
    descripcion: "",
    genero: "",
    imagen: "",
    eventos: []
};

export const Zona = {
    id: null,
    evento_id: null,
    nombre: "",
    aforo_maximo: 0,
    precio: 0
};

export const Puesto = {
    id: null,
    evento_id: null,
    zona_id: null,
    precio_alquiler: 0,
    dimension_m2: 0,
    horario: "",
    proveedor_id: null
};

export const Usuario = {
    id: null,
    dni: "",
    nombre_apellidos: "",
    fecha_nacimiento: "",
    num_tarjeta: "",
    direccion: "",
    email: "",
    rol: "",
    premium: false
};

export const Entrada = {
    id: null,
    usuario_id: null,
    zona_id: null,
    localizador_qr: "",
    fecha_compra: "",
    estado: ""
};
