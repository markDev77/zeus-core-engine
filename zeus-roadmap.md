# ZEUS — ROADMAP EJECUTIVO

## ESTADO ACTUAL

- Shopify (UsaDrop): LEGACY PROTECTED
- Woo → LTM: EN CONSTRUCCIÓN
- Pipeline ZEUS: INICIADO

---

## ARQUITECTURA DEFINIDA

- server.js → legacy (no tocar)
- zeus.app.js → nuevo entrypoint
- processProduct → core pipeline
- worker → ejecución
- connectors → transporte
- policy → reglas

---

## FASES

### FASE 1 — CORE PIPELINE
- [ ] Crear processProduct.js
- [ ] Validar engines desacoplados
- [ ] Normalización input/output

### FASE 2 — WORKER REAL
- [ ] Activar worker sin safe mode
- [ ] Conectar DB queue → processProduct

### FASE 3 — CONNECTOR WOO → LTM
- [ ] Input Woo
- [ ] Transform ZEUS
- [ ] Write LTM

### FASE 4 — POLICY LTM
- [ ] Definir reglas negocio LTM

---

## REGLAS NO NEGOCIABLES

- No tocar Shopify legacy
- No meter lógica en server.js
- No duplicar pipelines
- No mezclar legacy con nuevo

---

## ÚLTIMO AVANCE

- Se definió estrategia oficial:
  - Shopify (UsaDrop) = LEGACY PROTECTED (no tocar)
  - ZEUS nuevo se construye en paralelo
  - Canal inicial: Woo → LTM MX

- Se estableció arquitectura objetivo ZEUS:
  - Core desacoplado (processProduct)
  - Policy layer separada
  - Connectors independientes
  - Worker + DB queue como ejecución

- Se creó primer componente del Core:
  - src/pipeline/processProduct.js

- processProduct:
  - ya ejecuta title.engine
  - ya ejecuta description.engine
  - ya ejecuta seo.engine
  - ya integra policy layer
  - NO escribe en plataforma
  - NO depende de Shopify
  - NO depende de Woo

Estado actual:
ZEUS Core iniciado pero aún no ejecutado en pipeline real

---

## SIGUIENTE PASO

FASE 2 — ACTIVAR WORKER REAL

Objetivo:
Conectar DB queue (zeus_jobs) → worker → processProduct

Requerimientos:

1. Tomar worker existente:
   src/infra/worker/zeus-worker.js

2. Quitar SAFE MODE:
   - Eliminar simulación
   - Ejecutar processProduct real

3. Worker debe:
   - leer jobs de zeus_jobs
   - marcar status = processing
   - ejecutar processProduct
   - devolver resultado
   - (sin escribir aún en Woo/LTM)

4. Output del worker:
   - log estructurado del resultado ZEUS
   - validar que pipeline corre end-to-end

IMPORTANTE:
- No tocar server.js
- No tocar Shopify
- No conectar aún a Woo/LTM write
- Solo validar ejecución del pipeline

---
## PROMPT SIGUIENTE CHAT

Estamos construyendo ZEUS bajo arquitectura desacoplada.

Contexto:
- Shopify (UsaDrop) está en producción y NO se toca
- ZEUS nuevo se está construyendo en paralelo
- Ya existe processProduct.js como core pipeline

Objetivo:
Activar worker real conectado a DB queue (zeus_jobs) y ejecutar processProduct.

Necesito:
- Código completo actualizado de zeus-worker.js
- Eliminando SAFE MODE
- Conectado a processProduct
- Sin writeback a plataforma aún
- Con logs claros del resultado

Reglas:
- No usar server.js
- No romper nada existente
- No mezclar legacy con nuevo
- Mantener arquitectura ZEUS limpia
