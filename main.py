# main.py
from fastapi import FastAPI
from controller.controller import app  # Importar app (que ahora es APIRouter)

# Crear la aplicación principal
main_app = FastAPI()

# Incluir todas las rutas del controller
main_app.include_router(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(main_app, host="127.0.0.1", port=8000, reload=True)