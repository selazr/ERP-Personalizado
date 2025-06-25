# ERP Personalizado

Este proyecto es un ERP sencillo para gestionar trabajadores y programar sus horarios. Consta de un backend en Node.js y un frontend en React.

## Configuración del backend

1. Desde la carpeta `gestor-backend` instala las dependencias:
   ```bash
   npm install
   ```
2. Crea un archivo `.env` en `gestor-backend` definiendo las siguientes variables:
   ```env
   DB_HOST=localhost
   DB_USER=tu_usuario
   DB_PASSWORD=tu_contraseña
   DB_NAME=gestor_horarios
   PORT=3001 # opcional
   CORS_ORIGIN=http://localhost:5173,http://localhost:3000 # opcional
   ```
3. Inicia el servidor ejecutando:
   ```bash
   node index.js
   ```

## Configuración del frontend

1. En la carpeta `gestor-frontend` instala las dependencias:
   ```bash
   npm install
   ```
2. Crea un archivo `.env` dentro de `gestor-frontend` indicando la URL base del
   backend. Un valor habitual en desarrollo es:
   ```bash
   VITE_API_URL=http://localhost:3001/api
   ```
3. Arranca el entorno de desarrollo con:
   ```bash
   npm run dev
   ```

## Base de datos

El repositorio incluye una copia de respaldo en `db/backup_gestor_horarios.sql`. Crea una base de datos MySQL con el nombre que definas en `DB_NAME` e importa dicho archivo, por ejemplo:
```bash
mysql -u <usuario> -p < db/backup_gestor_horarios.sql
```
Esto generará las tablas necesarias para que la aplicación funcione.

## Seguridad

Las contraseñas de la tabla `usuarios` deben almacenarse con hashing bcrypt. Cuando crees un usuario nuevo inserta la contraseña generada con:

```bash
node -e "console.log(require('bcrypt').hashSync('tu_clave', 10))"
```

Las rutas de trabajadores y horarios ahora requieren un token JWT válido en la cabecera `Authorization` con el formato `Bearer <token>`. Obtén el token mediante `/api/auth/login`.

## API de estadísticas

El backend expone un endpoint para obtener estadísticas y proyecciones basadas en los salarios de los trabajadores.

```
GET /api/trabajadores/estadisticas
```

La respuesta incluye el número total de trabajadores, cuántos están activos o inactivos y el coste salarial tanto mensual como anual.

## Documentación ISO 27001

En `docs/iso27001` se incluyen documentos básicos relacionados con la gestión de la seguridad de la información:

- `security-policy.md`
- `risk-assessment-methodology.md`
- `asset-inventory.md`
- `incident-response-procedure.md`
- `access-control-policy.md`

## Plantillas de ejemplo

En `docs/templates` encontrarás archivos CSV con el formato de las plantillas de horarios y de fichas de trabajador. Puedes modificarlos a tu gusto para generar tus propios modelos:

- `plantilla_horarios.csv`
- `plantilla_trabajador.csv`

`plantilla_horarios.csv` incluye columnas para hasta dos intervalos de trabajo:
`hora_entrada_1`, `hora_salida_1`, `hora_entrada_2` y `hora_salida_2`.
Si el segundo intervalo no se usa, se deben rellenar sus columnas con `00:00`.
