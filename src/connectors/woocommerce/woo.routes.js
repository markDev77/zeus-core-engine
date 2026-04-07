/* ========================================
   FIX: eliminar cualquier llamada a optimize-inline
======================================== */

// 🔴 BUSCA cualquier uso de:
// /woocommerce/optimize-inline

// ❌ EJEMPLOS A ELIMINAR:
// axios.post("/woocommerce/optimize-inline", ...)
// fetch("/woocommerce/optimize-inline", ...)
// cualquier forward interno hacia ese endpoint

// ==========================
// SI EXISTE HANDLER COMO ESTE:
// ==========================

// ❌ ELIMINAR COMPLETO
router.post("/woocommerce/optimize-inline", ...);

// ==========================
// SI EXISTE LLAMADA INTERNA:
// ==========================

// ❌ ELIMINAR COMPLETO
await axios.post(`${BASE_URL}/woocommerce/optimize-inline`, payload);

// ==========================
// NO REEMPLAZAR POR NADA
// ==========================

// ✔️ El flujo correcto YA es:
// webhook → processProductJob → pipeline → writer
