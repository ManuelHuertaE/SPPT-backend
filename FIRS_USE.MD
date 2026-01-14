# Backend – Sistema de Puntos para Tiendas

Este proyecto es el backend de un **sistema de puntos de lealtad** para tiendas, construido con **Node.js**, **Prisma**, **PostgreSQL** y **Docker**.

El objetivo de este README es explicar **cómo levantar el proyecto**, **cómo funciona la base de datos**, y **cómo trabajar correctamente con Prisma**, evitando los errores comunes al mezclar Docker y entorno local.

---

## 🧱 Tecnologías

* Node.js
* Prisma ORM
* PostgreSQL 17
* Docker & Docker Compose
* DBeaver (opcional, para inspección de la DB)

---

## 📁 Estructura básica

```
sppt-backend/
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ docker-compose.yml
├─ .env              # entorno LOCAL (NO se sube a Git)
├─ .env.docker       # entorno DOCKER (NO se sube a Git)
├─ .env.example      # ejemplo para el repo
├─ package.json
└─ README.md
```

---

## 🔐 Variables de entorno

Este proyecto usa **dos archivos de entorno distintos**, lo cual es intencional.

### `.env` → entorno LOCAL

Usado por:

* Prisma CLI (`migrate`, `studio`)
* Prisma Studio
* DBeaver

```env
EXAMPLE:
DATABASE_URL="postgresql://postgres:PASS@localhost:5433/postgres"
```

📌 **Importante**: aquí siempre se usa `localhost`, nunca `postgres`.

---

### `.env.docker` → entorno DOCKER

Usado únicamente por los contenedores.

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=PASS

DATABASE_URL="postgresql://postgres:PASS@postgres:5432/postgres"
```

📌 Dentro de Docker, el host **sí es** `postgres`.

---

## 🐳 Docker

### Levantar el entorno

```bash
npm run docker:up
```

Esto:

* Levanta PostgreSQL en Docker
* Expone el puerto **5433** hacia tu máquina

---

### Resetear la base de datos (DEV)

⚠️ **Esto borra todos los datos**

```bash
npm run docker:reset
```

---

## 🗄 Base de datos

### Puerto

* PostgreSQL del contenedor → `localhost:5433`
* PostgreSQL local (si existe) → `5432`

Esto evita conflictos.

---

### Conexión con DBeaver (opcional)

| Campo    | Valor              |
| -------- | ------------------ |
| Host     | `localhost`        |
| Port     | `5433`             |
| Database | `postgres`         |
| User     | `postgres`         |
| Password | definido en `.env` |

---

## 🔄 Prisma y migraciones

### Primera migración

Con la base de datos corriendo:

```bash
npx prisma migrate dev --name init
```

Esto:

* Crea la carpeta `prisma/migrations`
* Genera el SQL de la migración
* Aplica el esquema a la base

---

### Cambios posteriores al schema

Cada vez que se modifique `schema.prisma`:

```bash
npx prisma migrate dev --name descripcion-del-cambio
```

Ejemplo:

```bash
npx prisma migrate dev --name add-user-name
```

---

### Producción / Docker

Dentro del contenedor se ejecuta automáticamente:

```bash
npx prisma migrate deploy
```

---

## 🧪 Prisma Studio

📌 **Prisma Studio se ejecuta SIEMPRE en local**, no dentro de Docker.

```bash
npx prisma studio
```

Esto abre una interfaz web para:

* Ver tablas
* Crear / editar registros
* Ver relaciones

👉 Prisma Studio usa el archivo `.env` local.

## 🧠 Flujo recomendado de trabajo

1. Levantar Docker
2. Crear / modificar modelos Prisma
3. Ejecutar migraciones en local
4. Verificar con Prisma Studio
5. Inspeccionar con DBeaver si es necesario


## ✍️ Notas finales

Este setup está diseñado para:

* Evitar conflictos de puertos
* Separar responsabilidades (Docker vs local)
* Facilitar el desarrollo y escalado futuro

