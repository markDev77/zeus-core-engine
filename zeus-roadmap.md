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

# ZEUS — ROADMAP EJECUTIVO V2

## ESTADO ACTUAL

- Shopify (UsaDrop): LEGACY PROTECTED
- Woo (LTM-MX): FUNCIONAL (OPTIMIZE FLOW)
- Core Engine: OPERATIVO
- Token Engine: ESTABLE
- DB (stores): MULTI-STORE READY

---

## ARQUITECTURA ACTUAL

- server.js → orchestrator (legacy intacto)
- zeus.app.js → entrypoint nuevo (en evolución)
- Core engines → activos
- Woo connector → activo
- DB → activo
- processProduct → parcialmente integrado
- worker → existente (NO en flujo real aún)

---

## FASES

### FASE 1 — CORE ENGINE (CERRADA)

- [x] AI engine
- [x] title engine
- [x] description engine
- [x] token engine
- [x] DB integration (stores)
- [x] multi-store context
- [x] flujo Woo optimize estable (sin pipeline completo)

---

### FASE 2 — POLICY LAYER (PRIORIDAD ALTA)

**Objetivo:**

AI → engines → policy → output

**Requerimientos:**

- [ ] Crear `policy.engine.js`
- [ ] Crear `policy.woo.ltm.js`
- [ ] Inyectar policy en flujo Woo (sin romper endpoint actual)
- [ ] Soportar:
  - pricing rules
  - inventory rules
  - lenguaje dinámico
  - restricciones de contenido
  - reglas por cliente (LTM vs tienda estándar)

**Regla clave:**
- No meter lógica de negocio en engines
- Policy layer controla comportamiento comercial

---

### FASE 3 — CATEGORY BRAIN

**Objetivo:**

AI → engines → Category Brain → mapping → Woo

**Requerimientos:**

- [ ] Activar category engine
- [ ] Mapear a taxonomía Woo
- [ ] Guardar en DB (`zeus_categories`)
- [ ] Permitir override desde policy

---

### FASE 4 — ONBOARDING REAL WOO (CRÍTICO)

**Objetivo:**

Eliminar:
- headers + fallback

Implementar:
- registro real en DB (`stores`)
- autenticación persistente

**Requerimientos:**

- [ ] Endpoint onboarding Woo
- [ ] Guardar:
  - shop
  - consumer_key
  - consumer_secret
- [ ] Validar conexión Woo API
- [ ] Activar store automáticamente

---

### FASE 5 — WORKER + PIPELINE REAL

**Objetivo:**

Woo → webhook → queue → worker → processProduct

**Requerimientos:**

- [ ] Activar `zeus-worker.js`
- [ ] Conectar `zeus_jobs`
- [ ] Ejecutar `processProduct`
- [ ] Logging estructurado
- [ ] Eliminar SAFE MODE

**Importante:**
- Sin writeback aún
- No tocar server.js

---

### FASE 6 — WRITEBACK (SYNC REAL)

**Objetivo:**

ZEUS → Woo (update producto real)

**Requerimientos:**

- [ ] Implementar `woo.writer.js`
- [ ] Evitar loops (webhook recursion)
- [ ] Update solo por diff (no overwrite completo)

---

### FASE 7 — LANDING + LEAD ENGINE (GROWTH)

**Objetivo:**

Captar leads mostrando valor inmediato de ZEUS

**Flujo:**

Usuario → pega URL producto  
→ ingresa email  
→ ZEUS scrapea producto  
→ ejecuta AI + engines  
→ muestra preview  
→ envía resultado por email  

**Requerimientos:**

#### Frontend
- [ ] Input URL producto
- [ ] Input email obligatorio
- [ ] Botón "Optimizar producto"

#### Backend
- [ ] Endpoint `/lead/optimize-preview`
- [ ] Scraping de producto
- [ ] Ejecución engines (modo preview)
- [ ] Respuesta optimizada

#### Lead capture
- [ ] Tabla `leads`
- [ ] Guardar:
  - email
  - url
  - timestamp
  - store_detected (opcional)

#### Email automation
- [ ] Enviar resultado optimizado
- [ ] CTA:
  - conectar tienda
  - instalar ZEUS

---

## REGLAS NO NEGOCIABLES

- No tocar Shopify legacy
- No meter lógica en server.js
- No duplicar pipelines
- No mezclar legacy con nuevo
- Policy ≠ Core
- Connectors ≠ inteligencia

---

## ESTADO REAL ZEUS

ZEUS hoy:

Core + Woo Connector + Token Engine + DB

ZEUS objetivo:

Core + Policy + Category Brain + Worker + Onboarding + Multi-channel

---

## SIGUIENTE PASO

FASE 2 — POLICY LAYER

Objetivo inmediato:
Separar lógica comercial del core y preparar ZEUS para multi-cliente real.


