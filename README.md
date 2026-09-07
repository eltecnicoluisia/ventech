# ⚡ VENTECH ERP - Enterprise Resource Planning & Modern POS Platform

[![Live Demo](https://img.shields.io/badge/Demo_en_Vivo-GitHub_Pages-22c55e?style=for-the-badge&logo=github&logoColor=white)](https://eltecnicoluisia.github.io/ventech/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.0-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)](https://turbo.build/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

Plataforma empresarial de planificación de recursos (**ERP**), facturación y punto de venta (**POS**) de alto rendimiento. Diseñada bajo arquitectura **Monorepo (Turborepo)** con soporte multialmacén, sincronización automática de tasas oficiales del Banco Central de Venezuela (**BCV**), cálculo inteligente de **IGTF/IVA**, control de inventario y aplicación de escritorio vía **Electron**.

---

## 🌐 Demostración Interactiva en Vivo (24/7)

Explora el panel administrativo y los módulos comerciales directamente en la web:

👉 **[https://eltecnicoluisia.github.io/ventech/](https://eltecnicoluisia.github.io/ventech/)**

---

## ✨ Módulos Integrados

### 🛒 1. Punto de Venta (POS)
- Terminal de facturación de alta velocidad diseñado para retail, supermercados y distribuidores.
- Operatividad offline-first con sincronización automática de transacciones.
- Compatibilidad con impresoras fiscales y térmicas (tickets de caja).

### 📦 2. Control de Inventario Multialmacén
- Trazabilidad de existencias por lotes, números de serie y depósitos.
- Alertas predictivas de reposición y stock crítico.
- Valoración monetaria bimonetaria instantánea (Dólares USD y Bolívares VES).

### 💵 3. Multimoneda y Gestión Fiscal (BCV & IGTF)
- Extracción autónoma de la tasa de cambio oficial diaria del Banco Central de Venezuela.
- Cálculo automático de base imponible, IVA (16%) y retención IGTF (3%).
- Facturación bimonetaria transparente para el cliente final.

### 👥 4. CRM y Gestión de Clientes
- Registro de clientes, límites de crédito, cuentas por cobrar y cobranzas.
- Estados de cuenta detallados e historial de compras.

### 🛡️ 5. Auditoría y Control de Acceso RBAC
- Control granular de roles: *Superadministrador*, *Gerente*, *Cajero*, *Almacenista* y *Auditor*.
- Registro inmutable de auditoría para trazabilidad de cada factura, anulación y ajuste de caja.

---

## 🏗️ Estructura del Monorepo

```
VENTECH/
├── erp-platform/              # Monorepo central gestionado con Turborepo
│   ├── apps/
│   │   ├── web/               # Aplicación web Next.js 16 (Dashboard administrativo y POS)
│   │   ├── api/               # Servidor backend Express + Prisma ORM
│   │   └── desktop/           # Aplicación nativa de escritorio empaquetada con Electron
│   ├── packages/              # Librerías y paquetes compartidos (tipos, utilidades)
│   ├── docker-compose.yml     # Orquestación de servicios PostgreSQL, Redis, API y Web
│   └── turbo.json             # Pipeline de compilación Turborepo
├── bcv.js                     # Script autónomo de consulta de tasa oficial del BCV
├── ventech.conf               # Configuración de proxy inverso Nginx
└── README.md                  # Documentación oficial del proyecto
```

---

## 🚀 Despliegue con Docker Compose

```bash
# 1. Clonar el repositorio
git clone https://github.com/eltecnicoluisia/ventech.git
cd ventech/erp-platform

# 2. Iniciar contenedores en segundo plano
docker compose up -d --build

# 3. Acceder al sistema
# Abre en tu navegador: http://localhost:3000
```

---

## 👨‍💻 Autor y Contacto

Desarrollado y mantenido por:

**Luis Uzcategui**  
Director, InformaticaVES  
- **Portafolio Interactivo:** [https://tecnicouzcategui.github.io/curriculum/](https://tecnicouzcategui.github.io/curriculum/)  
- **Sitio Web:** [https://tecnicouzcategui.github.io/informaticaves/index.html](https://tecnicouzcategui.github.io/informaticaves/index.html)  
- **Teléfono / WhatsApp:** 0424-2964339  
- **Correo Electrónico:** tecnicouzcategui@gmail.com / eltecnicoluisia@gmail.com  
- **GitHub:** [@eltecnicoluisia](https://github.com/eltecnicoluisia)
