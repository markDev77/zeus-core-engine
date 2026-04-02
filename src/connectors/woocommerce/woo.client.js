async function getProduct(productId) {
  const url = buildUrl(`/products/${productId}`);
  const res = await axios.get(url);

  const data = res.data;

  // 🔥 NORMALIZACIÓN (CLAVE)
  if (Array.isArray(data)) return data[0];
  if (data?.product) return data.product;

  return data;
}
