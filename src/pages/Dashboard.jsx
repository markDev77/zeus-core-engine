import { useEffect, useState } from "react";
import { fetchStoreData } from "../services/api";

export default function Dashboard() {
  const [shop, setShop] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shopParam = params.get("shop");

    if (!shopParam) {
      setError("Falta parámetro ?shop=");
      setLoading(false);
      return;
    }

    setShop(shopParam);

    fetchStoreData(shopParam)
      .then(setData)
      .catch(err => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => setLoading(false));

  }, []);

  const goImport = () => {
    window.location.href = `/dashboard/import?shop=${shop}`;
  };

  const goBilling = () => {
    window.location.href = `/dashboard/billing?shop=${shop}`;
  };

  return (
    <div style={styles.container}>
      
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.logo}>ZEUS</div>
        <div style={styles.shop}>{shop || "..."}</div>
      </div>

      {/* LOADING */}
      {loading && <div>Cargando...</div>}

      {/* ERROR */}
      {error && <div style={styles.error}>{error}</div>}

      {/* CONTENT */}
      {!loading && !error && data && (
        <>
          {/* STATUS */}
          <div style={styles.grid}>

            <Card title="Tokens disponibles" value={data.availableTokens} />
            <Card title="Tokens usados" value={data.usedTokens} />
            <Card title="Plan" value={data.plan} />

          </div>

          {/* CTA */}
          <div style={styles.ctaContainer}>
            <button style={styles.primaryBtn} onClick={goImport}>
              Importar desde USAdrop
            </button>

            <button style={styles.secondaryBtn} onClick={goBilling}>
              Comprar tokens
            </button>
          </div>

          {/* HOW IT WORKS */}
          <div style={styles.section}>
            <h2>Cómo funciona</h2>

            <ol>
              <li>Importa productos desde USAdrop</li>
              <li>ZEUS optimiza automáticamente</li>
              <li>Publica y vende</li>
            </ol>
          </div>

          {/* VIDEO */}
          <div style={styles.video}>
            Video demo aquí
          </div>

        </>
      )}
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>{title}</div>
      <div style={styles.cardValue}>{value}</div>
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
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px"
  },
  card: {
    padding: "20px",
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #eee"
  },
  cardTitle: {
    fontSize: "14px",
    color: "#666"
  },
  cardValue: {
    fontSize: "28px",
    fontWeight: "bold"
  },
  ctaContainer: {
    marginTop: "24px",
    display: "flex",
    gap: "12px"
  },
  primaryBtn: {
    padding: "12px 18px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  },
  secondaryBtn: {
    padding: "12px 18px",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "8px",
    cursor: "pointer"
  },
  section: {
    marginTop: "32px"
  },
  video: {
    marginTop: "20px",
    height: "200px",
    background: "#eee",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  error: {
    color: "red"
  }
};
