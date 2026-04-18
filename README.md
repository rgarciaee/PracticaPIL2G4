# 🎵 Subsonic Festival

Plataforma web completa para la gestión y venta de entradas del festival Subsonic. Los usuarios pueden explorar eventos, comprar entradas, gestionar su perfil y consultar su historial de compras.

## 🚀 Tecnologías

- **Backend**: FastAPI (Python)
- **Base de datos**: Firebase Firestore
- **Autenticación**: Firebase Auth (email/password + Google)
- **Frontend**: HTML5, CSS3, JavaScript (SPA)
- **Estilos**: CSS personalizado con modo oscuro/claro

## ✨ Funcionalidades

- 🔐 Autenticación de usuarios (email/contraseña y Google)
- 📅 Listado y detalles de eventos
- 🎟️ Compra de entradas con diferentes zonas
- 🛒 Carrito de compra persistente
- 📜 Historial de compras con filtros
- 👤 Perfil de usuario personalizable
- 🏪 Gestión de zonas para proveedores
- 🌓 Modo oscuro/claro

## 🛠️ Instalación

```bash
# Clonar repositorio
git clone https://github.com/tuusuario/subsonic-festival.git
cd subsonic-festival

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar Firebase (añadir credentials.json en model/dao/firebase/)

# Ejecutar
python main.py