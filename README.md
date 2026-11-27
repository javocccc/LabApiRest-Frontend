# LabApiRest Frontend

Interfaz React para consultar y administrar libros y canciones del repositorio [LabApiRest](https://github.com/javocccc/LabApiRest).

## Desarrollo local

Requiere Node.js 20.19 o posterior y el backend Django en `http://127.0.0.1:8000`.

```powershell
Copy-Item .env.example .env
npm ci
npm run dev
```

Abre `http://127.0.0.1:5173`. Vite reenvía `/api/` a Django durante el desarrollo. El valor local de `VITE_API_URL` es `/api`; puedes cambiarlo en `.env`. Este archivo está excluido de Git.

## Pruebas

```powershell
npm test
npm run build
```

Las pruebas de Jest y React Testing Library verifican la carga con `fetch`, la búsqueda, el cambio de colección, los errores de API y la creación de un libro.

## Despliegue

En Vercel, usa este repositorio con framework Vite. Configura `VITE_API_URL` con la URL pública del backend terminada en `/api`, por ejemplo `https://labapirest.onrender.com/api`, y vuelve a desplegar después de cambiarla. El backend debe permitir el origen exacto del frontend en `CORS_ALLOWED_ORIGINS`.

La pantalla pública debe listar registros servidos por Django. Compruébalo editando un registro en Django Admin y recargando el frontend.

