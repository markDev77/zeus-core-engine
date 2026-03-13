const express = require("express");

const app = express();

app.use(express.json());

/*
ROOT CHECK
*/
app.get("/", (req, res) => {
  res.json({
    system: "ZEUS CORE ENGINE",
    status: "running"
  });
});

/*
ZEUS PRODUCT OPTIMIZATION ENDPOINT
*/
app.post("/optimize/product", (req, res) => {

  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({
      error: "Product title required"
    });
  }

  // Simple optimization logic (base layer)
  const optimizedTitle = title
    .replace(/1\s*(piece|pcs|set)/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const tags = optimizedTitle
    .toLowerCase()
    .split(" ")
    .slice(0,5);

  res.json({
    originalTitle: title,
    optimizedTitle,
    suggestedTags: tags,
    engine: "ZEUS"
  });

});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("ZEUS CORE ENGINE RUNNING ON", PORT);
});
