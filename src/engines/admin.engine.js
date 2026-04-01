// engines/admin.engine.js

function registerAdminRoutes(app, pool) {
  
  /* ==========================
     SUMMARY
  ========================== */
  app.get("/api/admin/summary", async (req, res) => {
    try {
      const stores = await pool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'active') AS active,
          COUNT(*) FILTER (WHERE status = 'auth_error') AS auth_error,
          COALESCE(SUM(tokens - tokens_used), 0) AS tokens_balance
        FROM stores
      `);

      const jobs = await pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'queued') AS queued
        FROM zeus_jobs
      `);

      res.json({
        ok: true,
        stores: stores.rows[0],
        jobs: jobs.rows[0]
      });

    } catch (err) {
      console.error("admin summary error:", err.message);
      res.status(500).json({ ok: false });
    }
  });

  /* ==========================
     STORES
  ========================== */
  app.get("/api/admin/stores", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          shop,
          plan,
          status,
          tokens,
          tokens_used,
          (tokens - tokens_used) AS tokens_balance
        FROM stores
        ORDER BY shop ASC
        LIMIT 100
      `);

      res.json({ ok: true, stores: result.rows });

    } catch (err) {
      console.error("admin stores error:", err.message);
      res.status(500).json({ ok: false });
    }
  });

  /* ==========================
     JOBS
  ========================== */
  app.get("/api/admin/jobs", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT id, shop, status, created_at
        FROM zeus_jobs
        ORDER BY created_at DESC
        LIMIT 100
      `);

      res.json({ ok: true, jobs: result.rows });

    } catch (err) {
      console.error("admin jobs error:", err.message);
      res.status(500).json({ ok: false });
    }
  });

  /* ==========================
     UI
  ========================== */
  app.get("/admin", (req, res) => {
    res.send(`
      <html>
      <head>
        <title>ZEUS Admin</title>
      </head>
      <body style="background:#0b1020;color:white;font-family:sans-serif;">
        <h1>ZEUS Admin</h1>
        <div id="data"></div>

        <script>
          async function load() {
            const s = await fetch('/api/admin/summary').then(r=>r.json());
            document.getElementById('data').innerHTML =
              '<pre>'+JSON.stringify(s,null,2)+'</pre>';
          }
          load();
          setInterval(load, 5000);
        </script>
      </body>
      </html>
    `);
  });

}

module.exports = { registerAdminRoutes };
