import { useEffect, useState } from "react";

export default function Billing() {
  const [shop, setShop] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shopParam = params.get("shop");

    if (!shopParam) return;
    setShop(shopParam);
  }, []);

  const plans = [
    {
      name: "Starter",
      tokens: 50,
      price: "$9 USD",
      popular: false
    },
    {
      name: "Growth",
      tokens: 200,
      price: "$29 USD",
      popular: true
    },
    {
      name: "Scale",
      tokens: 500,
      price: "$59 USD",
      popular: false
    }
  ];

  const handleBuy = (plan) => {
    console.log("Comprar:", plan);

    // FUTURO: Stripe redirect
    window.location.href = `/dashboard/checkout?shop=${shop}&plan=${plan.name}`;
  };

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.logo}>ZEUS</div>
        <div style={styles.shop}>{shop}</div>
      </div>

      {/* TITLE */}
      <h1 style={styles.title}>Compra más tokens</h1>
      <p style={styles.subtitle}>
        Escala la optimización de tu tienda sin límites.
      </p>

      {/* PLANS */}
      <div style={styles.grid}>
        {plans.map((plan) => (
          <div
            key={plan.name}
            style={{
              ...styles.card,
              border: plan.popular ? "2px solid #2563eb" : "1px solid #eee"
            }}
          >
            {plan.popular && (
              <div style={styles.badge}>Más popular</div>
            )}

            <h3>{plan.name}</h3>

            <div style={styles.tokens}>
              {plan.tokens} tokens
            </div>

            <div style={styles.price}>
              {plan.price}
            </div>

            <button
              style={styles.button}
              onClick={() => handleBuy(plan)}
            >
              Comprar
            </button>
          </div>
        ))}
      </div>

      {/* NOTE */}
      <div style={styles.note}>
        1 token = 1 optimización de producto
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
  title: {
    fontSize: "28px",
    marginBottom: "8px"
  },
  subtitle: {
    color: "#666",
    marginBottom: "24px"
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
    position: "relative"
  },
  badge: {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "#2563eb",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px"
  },
  tokens: {
    fontSize: "22px",
    fontWeight: "bold",
    margin: "12px 0"
  },
  price: {
    fontSize: "18px",
    marginBottom: "16px"
  },
  button: {
    padding: "10px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },
  note: {
    marginTop: "24px",
    color: "#666"
  }
};
