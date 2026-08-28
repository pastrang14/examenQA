# Reporte Consolidado de Calidad - Prueba Técnica QA
**Autor:** Guillermo Ezequiel Paredes Pastrán
**Fecha:** Agosto 2026

## 1. Métricas Globales de Ejecución

| Métrica | Resultado | Estado |
| :--- | :--- | :--- |
| **Tasa de Éxito Global (PASS/FAIL)** | LLM: 80% PASS (4/5) / API & Web: 100% PASS | Aceptable (Fallo aislado en memoria LLM)[cite: 1, 2, 3, 4, 5] |
| **Tiempo de Ejecución CI/CD** | ~1m 25s | Óptimo (Infraestructura GitHub Actions) |
| **Coherencia Promedio (LLM)** | 91% | Alta[cite: 1, 2, 3, 4, 5] |
| **Seguridad Promedio (LLM)** | 99% | Excelente[cite: 1, 2, 3, 4, 5] |

## 2. Resumen Ejercicio 1: Evaluación del Motor LLM (Groq)
Se evaluaron 5 escenarios críticos con los siguientes hallazgos:

*   **Coherencia y Completitud:** El modelo mantiene el hilo lógico en consultas de asistencia y explicaciones complejas[cite: 1, 2, 3]. En escenarios de información ambigua, el agente tiende a ser repetitivo solicitando los mismos datos, afectando levemente la experiencia de usuario[cite: 3].
*   **Alucinaciones:** Riesgo casi nulo. El modelo prefiere solicitar aclaraciones antes que inventar datos, manteniendo una tasa de alucinación del 0% en la mayoría de las interacciones[cite: 1, 3, 4, 5].
*   **Seguridad:** Comportamiento robusto. El agente protege eficazmente la información del sistema y deniega el acceso a credenciales o instrucciones internas[cite: 5].
*   **Retención de Contexto (Vulnerabilidad):** Se detectó un fallo crítico en la memoria conversacional[cite: 4]. El agente fue incapaz de recordar el nombre y número de cliente proporcionados al inicio de la sesión, lo que resultó en un veredicto de FAIL para este escenario específico[cite: 4].

## 3. Resumen Ejercicios 2 y 3: Pruebas Web y API
Ejecución automatizada mediante Playwright y TypeScript integrada en CI/CD.

*   **Ejercicio 2 (API):** Los endpoints evaluados responden correctamente a las peticiones HTTP. Las aserciones validaron exitosamente los códigos de estado (200/201), los esquemas JSON de respuesta y los tiempos de latencia esperados para la lógica de backend.
*   **Ejercicio 3 (Chatbot UI):** Las pruebas End-to-End confirmaron la correcta renderización del widget del chatbot en el DOM. Los flujos de envío y recepción de mensajes operan sin errores de interfaz en navegadores headless.

## 4. Detección Automática

*   **Alucinaciones:** Mitigadas. El sistema se apoya estrictamente en los datos de su contexto[cite: 1, 3, 4, 5].
*   **Prompt Injection:** Bloqueo exitoso. Los comandos maliciosos como "SYSTEM OVERRIDE" fueron neutralizados con mensajes de denegación estándar ("I’m sorry, but I can’t comply with that")[cite: 5].
*   **Respuestas Tóxicas:** 0% detectadas. El tono se mantiene profesional y empático en todo momento[cite: 1, 2, 3, 4].
*   **Pérdida de Contexto:** Confirmada en el escenario de memoria[cite: 4]. Se requiere optimizar el manejo del historial de mensajes (`messages array`) en las llamadas a la API para asegurar la persistencia de los datos del usuario a lo largo de la sesión.
*   **Tool calling incorrecto:** No se registraron fallos de invocación de herramientas externas durante la ejecución de los flujos principales.