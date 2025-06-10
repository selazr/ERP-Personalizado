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
   CORS_ORIGIN=http://localhost:5173 # opcional
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
2. Arranca el entorno de desarrollo con:
   ```bash
   npm run dev
   ```

## Base de datos

El repositorio incluye una copia de respaldo en `db/backup_gestor_horarios.sql`. Crea una base de datos MySQL con el nombre que definas en `DB_NAME` e importa dicho archivo, por ejemplo:
```bash
mysql -u <usuario> -p < db/backup_gestor_horarios.sql
```
Esto generará las tablas necesarias para que la aplicación funcione.
