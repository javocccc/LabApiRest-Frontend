# LabApiRest Frontend

Interfaz web en español para el backend [LabApiRest](https://github.com/javocccc/LabApiRest). Permite consultar, buscar, crear, editar y eliminar libros y canciones.

## Requisitos

- Node.js 18 o superior.
- El backend de Django en ejecución. No se necesitan paquetes npm.

## Inicio local

En una terminal, inicia el backend:

```bash
cd labapi
python -m venv .venv
# Activa el entorno virtual según tu sistema operativo.
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

En otra terminal, desde este repositorio:

```bash
npm start
```

Abre <http://localhost:5173>. El servidor del frontend entrega los archivos estáticos y reenvía las solicitudes a `/api/` hacia `http://127.0.0.1:8000`. Si Django usa otra dirección, establece `BACKEND_URL` antes de ejecutar `npm start` (por ejemplo, `BACKEND_URL=http://127.0.0.1:8080`). Para cambiar el puerto del frontend, establece `PORT`.

En PowerShell:

```powershell
$env:BACKEND_URL = 'http://127.0.0.1:8000'
npm start
```

## API utilizada

| Recurso | Lista y creación | Detalle, edición y eliminación | Campos |
| --- | --- | --- | --- |
| Libros | `/api/libros/` | `/api/libros/{id}/` | `titulo`, `autor`, `anio` |
| Canciones | `/api/canciones/` | `/api/canciones/{id}/` | `titulo`, `artista`, `anio`, `genero` |

El frontend usa el mismo origen para evitar problemas de CORS. En un despliegue, configura el servidor web o proxy para reenviar `/api/` al backend, o ejecuta `server.js` como servidor de la aplicación. El backend actual es un proyecto de desarrollo con `DEBUG=True`; revísalo antes de publicarlo.

## Comprobación

```bash
npm test
```

