import { useEffect, useState } from "react";

export default function Import() {
  const [shop, setShop] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shopParam = params.get("shop");

    if (shopParam) setShop(shopParam);
  }, []);

  const goToUSAdrop = () => {
    // 🔥 IMPORTANTE:
    // salir del iframe correctamente
    window.top.location.href = "https://www.usadrop.com/";
  };

  const backToDashboard = () => {
    window.location.href = `/dashboard?shop=${shop}`;
  };

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.logo}>ZEUS</div>
        <div style={styles.shop}>{shop}</div>
      </div>

      {/* HERO */}
      <div style={styles.hero}>
        <h1 style={styles.title}>
          Importa productos desde USAdrop
        </h1>

        <p style={styles.subtitle}>
          Selecciona productos en USAdrop. ZEUS detectará automáticamente
          los nuevos productos y los optimizará en tu tienda.
        </p>

        <div style={styles.box}>
          <div style={styles.step}>
            <strong>1.</strong> Entra a USAdrop
          </div>
          <div style={styles.step}>
            <strong>2.</strong> Importa productos a tu tienda
          </div>
          <div style={styles.step}>
            <strong>3.</strong> ZEUS optimiza automáticamente
          </div>
        </div>

        {/* CTA */}
        <button style={styles.primaryBtn} onClick={goToUSAdrop}>
          Ir a USAdrop
        </button>

        <button style={styles.secondaryBtn} onClick={backToDashboard}>
          Volver al dashboard
        </button>
      </div>

      {/* INFO */}
      <div style={styles.info}>
        <p>
          Cada producto optimizado consume <strong>1 token</strong>.
        </p>

        <p>
          No necesitas hacer nada adicional: ZEUS trabaja automáticamente
          cuando detecta nuevos productos.
        </p>
      </div>

    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    fontFamily: "Inter, sans-serif"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px"
  },
  logo: {
    fontWeight: "bold",
    fontSize: "20px"
  },
  shop: {
    color: "#666"
  },
  hero: {
    maxWidth: "600px"
  },
  title: {
    fontSize: "28px",
    marginBottom: "10px"
  },
  subtitle: {
    color: "#666",
    marginBottom: "20px"
  },
  box: {
    background: "#f5f5f5",
    padding: "16px",
    borderRadius: "10px",
    marginBottom: "20px"
  },
  step: {
    marginBottom: "10px"
  },
  primaryBtn: {
    padding: "12px 18px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginRight: "10px"
  },
  secondaryBtn: {
    padding: "12px 18px",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "8px",
    cursor: "pointer"
  },
  info: {
    marginTop: "30px",
    color: "#666"
  }
};
