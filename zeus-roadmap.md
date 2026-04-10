# ZEUS — ROADMAP EJECUTIVO V1

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




09 abr 2026
🔥 ZEUS — ROADMAP EJECUTIVO V2
ESTADO ACTUAL
Shopify (UsaDrop): ✅ LEGACY PROTECTED
Woo (LTM-MX): ✅ FUNCIONAL (OPTIMIZE FLOW)
Core Engine: ✅ OPERATIVO
Token Engine: ✅ ESTABLE
DB (stores): ✅ MULTI-STORE READY
🧱 ARQUITECTURA ACTUAL
server.js → orchestrator (legacy intacto)
Core engines → activos
Woo connector → activo
DB → activo
processProduct → parcialmente usado
worker → NO activo en flujo real
📦 FASES ACTUALIZADAS
🔵 FASE 1 — CORE ENGINE (CERRADA ✅)
 AI engine
 title engine
 description engine
 token engine
 DB integration
 multi-store context
🟡 FASE 2 — POLICY LAYER (PRIORIDAD ALTA)

Objetivo:

AI → engines → policy → output
Requerimientos:
 crear policy.engine.js
 crear policy.woo.ltm.js
 inyectar policy en flujo Woo
 soportar:
pricing rules
inventory rules
lenguaje
restricciones
reglas por cliente
🟡 FASE 3 — CATEGORY BRAIN

Objetivo:

AI → engines → Category Brain → mapping → Woo
Requerimientos:
 activar category engine
 mapear a taxonomía Woo
 guardar en DB (zeus_categories)
 permitir override por policy
🟡 FASE 4 — ONBOARDING REAL WOO (CRÍTICO)

Objetivo:

Eliminar:

headers + fallback

Implementar:

registro real en stores + credenciales persistentes
Requerimientos:
 endpoint onboarding Woo
 guardar:
shop
consumer_key
consumer_secret
 validar conexión Woo API
 activar store automáticamente
🟡 FASE 5 — WORKER + PIPELINE REAL

Objetivo:

Woo → webhook → queue → worker → processProduct
Requerimientos:
 activar zeus-worker
 conectar zeus_jobs
 ejecutar processProduct
 logging estructurado
🟡 FASE 6 — WRITEBACK (SYNC REAL)

Objetivo:

ZEUS → Woo (update producto real)
Requerimientos:
 implementar woo.writer.js
 evitar loops
 write seguro (diff only)
🟢 FASE 7 — LANDING + LEAD ENGINE (NUEVO)

👉 Esto es lo que pediste (muy estratégico)

🎯 OBJETIVO

Captar leads mostrando valor inmediato de ZEUS

🧩 FLUJO
Usuario → pega URL producto
→ ingresa email
→ ZEUS scrapea producto
→ ejecuta AI + engines
→ muestra resultado
→ envía resultado por email
🔧 COMPONENTES
1. Frontend (Landing)
 input URL producto
 input email obligatorio
 botón "Optimizar producto"
2. Backend endpoint
POST /lead/optimize-preview
 scrape URL
 extraer title + description
 ejecutar engines (sin token real o con pool especial)
 devolver preview
3. Lead capture
 guardar en tabla leads
 campos:
email
url
timestamp
store_detected (opcional)
4. Email automation
 enviar resultado optimizado
 incluir CTA:
conectar tienda
instalar ZEUS
🧠 5. PRIORIDAD REAL (ORDEN EJECUTIVO)
POLICY LAYER
ONBOARDING WOO
CATEGORY BRAIN
WORKER
WRITEBACK
LANDING (growth)
🎯 6. CONCLUSIÓN

👉 Lo que hiciste en este chat fue:

pasar de arquitectura a sistema funcional real

👉 Lo que sigue es:

convertir ZEUS en producto escalable (SaaS + infra)


Reglas:
- No usar server.js
- No romper nada existente
- No mezclar legacy con nuevo
- Mantener arquitectura ZEUS limpia
