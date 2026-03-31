-- =============================================
-- SUBSONIC FESTIVAL - ESQUEMA DE BASE DE DATOS
-- =============================================

-- Tabla USUARIO BASE (para todos los roles)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    dni VARCHAR(20) UNIQUE,
    nombre_apellidos VARCHAR(200) NOT NULL,
    fecha_nacimiento DATE,
    num_tarjeta VARCHAR(20),
    direccion VARCHAR(200),
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(200), -- Para usuarios con login local
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('visitante', 'cliente', 'proveedor', 'admin')),
    firebase_uid VARCHAR(100), -- Para autenticación con Firebase/Google
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla EVENTO
CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    imagen TEXT,
    fecha_ini TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    descripcion TEXT,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'finalizado', 'cancelado'))
);

-- Tabla ARTISTA
CREATE TABLE artistas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    genero VARCHAR(50),
    imagen TEXT,
    spotify_id VARCHAR(100), -- ID para integración con Spotify API
    preview_url TEXT -- URL de preview de Spotify
);

-- Tabla ZONA (Sectores del festival)
CREATE TABLE zonas (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER REFERENCES eventos(id) ON DELETE CASCADE,
    nombre VARCHAR(50) NOT NULL,
    aforo_maximo INTEGER NOT NULL,
    precio NUMERIC(10,2) NOT NULL
);

-- Tabla ESPACIO/PUESTO (para proveedores)
CREATE TABLE espacios (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER REFERENCES eventos(id) ON DELETE CASCADE,
    zona_id INTEGER REFERENCES zonas(id),
    precio_alquiler NUMERIC(10,2) NOT NULL,
    dimension_m2 NUMERIC(8,2),
    horario VARCHAR(100),
    estado VARCHAR(20) DEFAULT 'disponible' CHECK (estado IN ('disponible', 'reservado', 'ocupado'))
);

-- Tabla ENTRADA (Billete)
CREATE TABLE entradas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    evento_id INTEGER REFERENCES eventos(id),
    zona_id INTEGER REFERENCES zonas(id),
    localizador_qr VARCHAR(100) UNIQUE NOT NULL,
    fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'cancelada', 'usada')),
    precio_pagado NUMERIC(10,2) NOT NULL
);

-- Tabla RESERVA_ESPACIO (para proveedores)
CREATE TABLE reservas_espacios (
    id SERIAL PRIMARY KEY,
    espacio_id INTEGER REFERENCES espacios(id),
    proveedor_id INTEGER REFERENCES usuarios(id),
    fecha_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'cancelada'))
);

-- Tabla EVENTO_ARTISTA (relación muchos a muchos)
CREATE TABLE evento_artista (
    evento_id INTEGER REFERENCES eventos(id) ON DELETE CASCADE,
    artista_id INTEGER REFERENCES artistas(id) ON DELETE CASCADE,
    horario_presentacion TIMESTAMP,
    PRIMARY KEY (evento_id, artista_id)
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_eventos_fecha ON eventos(fecha_ini);
CREATE INDEX idx_entradas_usuario ON entradas(usuario_id);
CREATE INDEX idx_entradas_evento ON entradas(evento_id);
CREATE INDEX idx_reservas_proveedor ON reservas_espacios(proveedor_id);