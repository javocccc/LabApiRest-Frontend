# Plan de commits de Matías y Fabián para el Laboratorio 8

Este archivo propone trabajo **pendiente**. No atribuye a los compañeros commits que aún no han hecho. Cada integrante debe usar su identidad Git y subir cambios propios en una rama.

## Estado verificado el 27 de noviembre de 2026

- Javier ya subió a [LabApiRest-Frontend](https://github.com/javocccc/LabApiRest-Frontend) la rama `lab8-javier-react-testing` y el [PR borrador 1](https://github.com/javocccc/LabApiRest-Frontend/pull/1).
- Sus commits anteriores a este plan son `fe0e1ce` (React y API configurable), `12045c9` (Jest y React Testing Library) y `ab337b3` (guía y Vercel).
- `npm test`: 4 pruebas aprobadas. `npm run build`: correcto. Libros y canciones cargaron 3 registros reales cada uno en local.
- En `LabApiRest/main`, `python manage.py test` aprobó 3 pruebas. El backend aún usa `DEBUG=True`, no configura CORS ni variables de producción. El informe antiguo dice 4 pruebas y CORS habilitado; esos datos no corresponden al estado de este repositorio.
- El historial anterior de Matías en el backend pertenece al trabajo de canciones de laboratorios previos. No se presenta aquí como aporte nuevo del Lab 8.

## Matías Olivares Robledo: backend y producción

Trabajar en una rama propia de [LabApiRest](https://github.com/javocccc/LabApiRest).

1. **`Configuro CORS para los orígenes local y público del frontend`**  
   Archivos: `labapi/requirements.txt`, `labapi/labapi/settings.py`. Instalar `django-cors-headers`, registrar la app y el middleware, y leer `CORS_ALLOWED_ORIGINS` desde el entorno. Incluir `http://127.0.0.1:5173`, `http://localhost:5173` y el dominio real de Vercel según corresponda. No habilitar todos los orígenes.

2. **`Pruebo CORS y respuestas del listado de libros y canciones`**  
   Archivo: `labapi/catalogo/tests.py`. Agregar una prueba con `Origin` permitido que compruebe `Access-Control-Allow-Origin` y otra para un origen no permitido. Mantener las 3 pruebas actuales pasando. Capturar la salida real de `python manage.py test` para el informe.

3. **`Preparo Django para Render con variables de entorno`**  
   Archivos: `labapi/labapi/settings.py`, `labapi/requirements.txt`, `render.yaml` o configuración equivalente. Mover `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS` y `DATABASE_URL` al entorno; configurar PostgreSQL, estáticos y comando de migración. Ejecutar `python manage.py check --deploy` con variables de producción y verificar que la API pública entregue datos tras el despliegue. No subir secretos ni `db.sqlite3`.

## Fabián Silva: pruebas de interfaz y evidencia de integración

Trabajar en una rama propia de [LabApiRest-Frontend](https://github.com/javocccc/LabApiRest-Frontend), basada en la rama React de Javier o en `main` después de integrarla.

1. **`Amplío las pruebas React de edición y eliminación`**  
   Archivo: `src/App.test.jsx`. Mockear `fetch` y comprobar `PUT` y `DELETE`, recarga del listado y errores. Ejecutar `npm test` y guardar una captura de la salida aprobada.

2. **`Agrego colección Postman para verificar la API`**  
   Archivo sugerido: `postman/Lab8.postman_collection.json`. Incluir GET de libros y canciones y una petición de creación en un entorno local o de pruebas. Usar una variable `baseUrl` para no fijar la URL pública. Guardar captura de Postman con GET `/api/libros/`, estado 200 y registros visibles; no modificar datos de producción para la captura.

3. **`Documento despliegue Vercel y evidencia del Lab 8`**  
   Archivos: `README.md` y documento de evidencia. Configurar `VITE_API_URL=https://labapirest.onrender.com/api` en Vercel para Production, desplegar después de que Matías configure CORS, comprobar que el frontend público lista los mismos datos que la API pública y capturar la pantalla. Registrar las URLs finales y una reflexión de 3 o 4 líneas acordada por los tres.

## Cierre antes de entregar

- Integrar los PR de los tres integrantes tras revisar pruebas y build. No atribuir commits de un integrante a otro.
- Comprobar localmente `python manage.py test`, `npm test`, `npm run build`, GET en Postman y el frontend con datos de Django.
- Comprobar Render y Vercel después de los merges. Las capturas del informe deben mostrar el estado **final**, no un despliegue anterior.
- Completar el Word `Evidencia_Laboratorio8_AdvanceICI.docx` con títulos y capturas: frontend local, frontend público, pruebas Django, Jest y Postman; añadir URLs y reflexión grupal.

