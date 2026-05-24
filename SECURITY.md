# Seguridad

## Alcance

Este repositorio mantiene una aplicación OSINT para uso ético, defensivo y educativo. Las pruebas de seguridad deben realizarse sobre entornos propios o autorizados.

## Reporte de vulnerabilidades

Para reportar una vulnerabilidad, abrí un issue privado si el canal está disponible en GitHub o contactá al mantenedor por email:

- osintargy@gmail.com

Incluí una descripción clara, impacto, pasos de reproducción y versión/commit afectado. No publiques secretos, datos personales ni pruebas destructivas.

## Buenas prácticas del proyecto

- No versionar `.env`, logs, builds, bases locales ni carpetas MCP.
- Mantener `npm audit` sin vulnerabilidades antes de publicar cambios.
- Usar secretos fuertes para `JWT_SECRET`, `MONGODB_URI`, `MONGO_PASSWORD` y credenciales de servicios externos.
- Restringir `FRONTEND_URL` a orígenes confiables en producción.
- Validar entradas externas antes de disparar requests de red, búsquedas o parsing de archivos.
