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

(esto se actualiza cada sesión)

Ejemplo:
- Se creó processProduct.js
- Pendiente: worker real

---

## SIGUIENTE PASO

(esto se usa como prompt siguiente)

Ejemplo:
"Construir worker conectado a processProduct usando zeus_jobs"
