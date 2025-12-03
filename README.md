<div align="center">

# 🧠 DrWin

**Orquestador inteligente de agentes especializados para subvenciones y proyectos de financiación**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

---

## 📖 Sobre DrWin

**DrWin** es un asistente inteligente que actúa como orquestador de agentes especializados llamados **MiniWins**. Cada MiniWin está diseñado para ayudar en diferentes aspectos del proceso de búsqueda, creación, validación y adaptación de propuestas para subvenciones y proyectos de financiación.

DrWin coordina y se comunica con estos agentes especializados para guiarte a través de workflows completos, desde la búsqueda de oportunidades hasta la creación y validación de propuestas profesionales.

---

## ✨ Características Principales

- 🤖 **Orquestación Inteligente**: Coordina múltiples agentes especializados para workflows complejos
- 🌍 **Multilingüe**: Responde automáticamente en el idioma del usuario
- 🔄 **Workflows Integrados**: Combina diferentes MiniWins en secuencias optimizadas
- 📊 **Análisis Profundo**: Validación y evaluación de compatibilidad de proyectos
- 📝 **Generación Inteligente**: Creación automática de propuestas y documentos
- 🎯 **Búsqueda Avanzada**: Encuentra las mejores oportunidades de financiación
- 🔧 **Adaptación Automática**: Adapta propuestas existentes a nuevas convocatorias

---

## 🎯 MiniWins - Agentes Especializados

DrWin coordina un equipo de **8 MiniWins**, cada uno especializado en un módulo específico:

### 🔍 **Explora** (Find)
Búsqueda y análisis inteligente de oportunidades de financiación. Encuentra las mejores convocatorias que se ajustan a tu proyecto.

### 💡 **Inventa** (Create)
Generación y redacción profesional de propuestas. Crea conceptos, notas conceptuales y documentos completos.

### ⚖️ **Ponder** (Validate)
Validación y evaluación de compatibilidad entre proyectos y convocatorias. Analiza puntuaciones y alineación estratégica.

### 📋 **Transcripto** (Readapt)
Adaptación inteligente de propuestas existentes a nuevas oportunidades. Analiza observaciones y mejora propuestas rechazadas.

### 🔗 **Connectus** (Match)
Emparejamiento y conexión de proyectos con socios y oportunidades adecuadas.

### ✍️ **Scriba** (Write)
Redacción avanzada de documentos técnicos y administrativos.

### 📊 **Manevo** (Manage)
Gestión integral de proyectos y tareas relacionadas con subvenciones.

### 📈 **Evaluo** (Evaluate)
Evaluación profunda y detallada de propuestas y convocatorias.

---

## 🚀 Instalación

### Prerrequisitos

- **Node.js** (versión 18 o superior)
- **npm** o **yarn**

### Pasos de Instalación

1. **Clona el repositorio** (o navega al directorio del proyecto):
   ```bash
   cd DrWin
   ```

2. **Instala las dependencias**:
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**:
   
   Crea un archivo `.env.local` en la raíz del proyecto y agrega tu clave de API de Gemini:
   ```env
   GEMINI_API_KEY=tu_clave_api_aqui
   ```

4. **Inicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

5. **Abre tu navegador** en `http://localhost:5173` (o el puerto que Vite asigne)

---

## 💻 Uso

### Inicio Rápido

1. **Inicia una conversación** con DrWin en la interfaz principal
2. **Describe tu necesidad**: Por ejemplo, "Busca oportunidades de financiación para un proyecto de energía renovable"
3. **DrWin orquestará los MiniWins necesarios**: Automáticamente se comunicará con Explora, Ponder, Inventa u otros según sea necesario
4. **Recibe resultados estructurados**: DrWin te presentará la información de forma clara y organizada

### Workflows Comunes

#### 🔍 Búsqueda y Validación
```
Usuario → DrWin → Explora (buscar) → Ponder (validar) → Resultados
```

#### 📝 Creación Completa
```
Usuario → DrWin → Inventa (crear) → Ponder (validar) → Documentos finales
```

#### 🔄 Adaptación de Propuestas
```
Usuario → DrWin → Transcripto (adaptar) → Ponder (validar) → Propuesta adaptada
```

### Ejemplos de Comandos

- *"Busca subvenciones para proyectos de inteligencia artificial"*
- *"Valida si mi proyecto es compatible con esta convocatoria"*
- *"Crea una propuesta para un proyecto de sostenibilidad"*
- *"Adapta mi propuesta rechazada a esta nueva convocatoria"*

---

## 🛠️ Tecnologías

- **React 18.3** - Framework de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Google Gemini API** - Motor de IA
- **Framer Motion** - Animaciones
- **Sonner** - Notificaciones toast
- **React Markdown** - Renderizado de markdown

---

## 🎨 Características de la Interfaz

- **Tema claro/oscuro**: Soporte completo para modo claro y oscuro
- **Multilingüe**: Interfaz disponible en múltiples idiomas
- **Diseño responsivo**: Optimizado para diferentes tamaños de pantalla
- **Animaciones fluidas**: Transiciones suaves y experiencia de usuario mejorada
- **Onboarding interactivo**: Tour guiado para nuevos usuarios

---

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia el servidor de desarrollo

# Producción
npm run build        # Construye la aplicación para producción
npm run preview      # Previsualiza la build de producción
```

---

## 📝 Licencia

Este proyecto es privado y de uso interno.

---

## 🤝 Contribución

Este es un proyecto interno. Para contribuciones, contacta al equipo de desarrollo.

---

## 📧 Contacto

Para más información o soporte, contacta al equipo de desarrollo.

---

<div align="center">

**Desarrollado con ❤️ para simplificar el proceso de subvenciones**

</div>
