const { Pool } = require("pg");
const zeusTaxonomy = require("../data/zeusTaxonomy");

let pool = null;
let initPromise = null;
let seedPromise = null;

const GOOGLE_TAXONOMY_BY_ZEUS_KEY = {
  electronics: {
    display_name: "Electronics",
    google_taxonomy_path: "Electronics"
  },
  pet_supplies: {
    display_name: "Pet Supplies",
    google_taxonomy_path: "Animals & Pet Supplies > Pet Supplies"
  },
  home_kitchen: {
    display_name: "Home & Kitchen",
    google_taxonomy_path: "Home & Garden > Kitchen & Dining"
  },
  fashion: {
    display_name: "Fashion",
    google_taxonomy_path: "Apparel & Accessories"
  },
  beauty: {
    display_name: "Beauty",
    google_taxonomy_path: "Health & Beauty > Personal Care"
  },
  sports: {
    display_name: "Sports",
    google_taxonomy_path: "Sporting Goods"
  },
  automotive: {
    display_name: "Automotive",
    google_taxonomy_path: "Vehicles & Parts"
  },
  toys: {
    display_name: "Toys",
    google_taxonomy_path: "Toys & Games"
  },
  tools: {
    display_name: "Tools",
    google_taxonomy_path: "Hardware > Tools"
  },
  general: {
    display_name: "General",
    google_taxonomy_path: "General"
  }
};

const PLATFORM_CATEGORY_TRANSLATIONS = {
  shopify: {
    electronics: {
      external_category: "electronics",
      external_path: "Electronics"
    },
    pet_supplies: {
      external_category: "pet_supplies",
      external_path: "Animals & Pet Supplies > Pet Supplies"
    },
    home_kitchen: {
      external_category: "home_kitchen",
      external_path: "Home & Garden > Kitchen & Dining"
    },
    fashion: {
      external_category: "fashion",
      external_path: "Apparel & Accessories"
    },
    beauty: {
      external_category: "beauty",
      external_path: "Health & Beauty > Personal Care"
    },
    sports: {
      external_category: "sports",
      external_path: "Sporting Goods"
    },
    automotive: {
      external_category: "automotive",
      external_path: "Vehicles & Parts"
    },
    toys: {
      external_category: "toys",
      external_path: "Toys & Games"
    },
    tools: {
      external_category: "tools",
      external_path: "Hardware > Tools"
    },
    general: {
      external_category: "general",
      external_path: "General"
    }
  }
};

const categorySynonyms = {
  electronics: [
    "earbuds",
    "headphones",
    "bluetooth speaker",
    "usb charger",
    "power bank",
    "charging cable",
    "smart watch",
    "wireless mouse"
  ],
  pet_supplies: [
    "dog toy",
    "cat toy",
    "pet feeder",
    "pet bowl",
    "pet collar",
    "pet leash",
    "dog harness",
    "pet bed"
  ],
  home_kitchen: [
    "kitchen organizer",
    "storage box",
    "food container",
    "knife set",
    "pan set",
    "dish rack",
    "humidifier",
    "home decor"
  ],
  fashion: [
    "shirt",
    "hoodie",
    "jacket",
    "coat",
    "dress",
    "pants",
    "jeans",
    "sneakers"
  ],
  beauty: [
    "makeup brush",
    "face cream",
    "skin care",
    "serum",
    "lipstick",
    "nail polish"
  ],
  sports: [
    "resistance band",
    "yoga mat",
    "gym gloves",
    "fitness tracker",
    "exercise bike"
  ],
  automotive: [
    "car charger",
    "seat cover",
    "car vacuum",
    "steering wheel cover",
    "dash cam"
  ],
  toys: [
    "building blocks",
    "board game",
    "kids toy",
    "baby toy",
    "plush toy"
  ],
  tools: [
    "drill bit",
    "screwdriver set",
    "tool kit",
    "wrench set",
    "socket set"
  ]
};

function createPool() {
  if (pool) {
    return pool;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const isLocalDatabase =
    process.env.DATABASE_URL.includes("localhost") ||
    process.env.DATABASE_URL.includes("127.0.0.1");

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocalDatabase
      ? false
      : {
          rejectUnauthorized: false
        }
  });

  pool.on("error", (error) => {
    console.error("CATEGORY BRAIN POOL ERROR:", error.message);
  });

  return pool;
}

function normalize(text) {
  if (!text) return "";

  return String(text)
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTags(tags) {
  if (!tags) return "";
  if (Array.isArray(tags)) {
    return normalize(tags.join(" "));
  }
  return normalize(tags);
}

function getWeightedSegments(product = {}) {
  return {
    title: normalize(product.title),
    description: normalize(product.description),
    tags: normalizeTags(product.tags)
  };
}

function scoreCategory(text, keywords, weight = 1) {
  let score = 0;
  const matchedTerms = [];

  for (const word of keywords || []) {
    const normalizedWord = normalize(word);

    if (normalizedWord && text.includes(normalizedWord)) {
      score += weight;
      matchedTerms.push(normalizedWord);
    }
  }

  return {
    score,
    matchedTerms
  };
}

function detectStrongSignal(text) {
  for (const [category, words] of Object.entries(categorySynonyms)) {
    for (const word of words) {
      const normalizedWord = normalize(word);

      if (normalizedWord && text.includes(normalizedWord)) {
        return {
          category,
          matchedTerm: normalizedWord
        };
      }
    }
  }

  return null;
}

function applyBlacklist(category, combinedText) {
  const blacklist = {
    electronics: ["shirt", "dress", "dog", "cat", "wipe", "disinfect"],
    tools: ["shirt", "dress", "dog toy"]
  };

  if (!blacklist[category]) return category;

  for (const word of blacklist[category]) {
    if (combinedText.includes(normalize(word))) {
      return "general";
    }
  }

  return category;
}

function computeTaxonomyClassification(product = {}) {
  const segments = getWeightedSegments(product);
  const combinedText =
    `${segments.title} ${segments.description} ${segments.tags}`.trim();

  const strongSignal = detectStrongSignal(combinedText);

  if (strongSignal) {
    const mapped =
      GOOGLE_TAXONOMY_BY_ZEUS_KEY[strongSignal.category] ||
      GOOGLE_TAXONOMY_BY_ZEUS_KEY.general;

    return {
      category: strongSignal.category,
      confidence: 0.93,
      decision: "strong_signal",
      matchedTerms: [strongSignal.matchedTerm],
      googleTaxonomyPath: mapped.google_taxonomy_path,
      displayName: mapped.display_name
    };
  }

  let bestCategory = "general";
  let bestScore = 0;
  let matchedTerms = [];

  for (const [category, data] of Object.entries(zeusTaxonomy)) {
    const titleResult = scoreCategory(segments.title, data.keywords, 3);
    const tagsResult = scoreCategory(segments.tags, data.keywords, 2);
    const descriptionResult = scoreCategory(segments.description, data.keywords, 1);

    const totalScore =
      titleResult.score +
      tagsResult.score +
      descriptionResult.score;

    const allMatchedTerms = Array.from(
      new Set([
        ...titleResult.matchedTerms,
        ...tagsResult.matchedTerms,
        ...descriptionResult.matchedTerms
      ])
    );

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestCategory = category;
      matchedTerms = allMatchedTerms;
    }
  }

  bestCategory = applyBlacklist(bestCategory, combinedText);

  const finalCategory = bestScore > 0 ? bestCategory : "general";
  const mapped =
    GOOGLE_TAXONOMY_BY_ZEUS_KEY[finalCategory] ||
    GOOGLE_TAXONOMY_BY_ZEUS_KEY.general;

  return {
    category: finalCategory,
    confidence: bestScore > 0 ? Math.min(0.56 + bestScore * 0.05, 0.95) : 0.32,
    decision: bestScore > 0 ? "google_taxonomy_keyword_match" : "fallback_general",
    matchedTerms,
    googleTaxonomyPath: mapped.google_taxonomy_path,
    displayName: mapped.display_name
  };
}

async function ensureTables() {
  const db = createPool();

  await db.query(`
    CREATE TABLE IF NOT EXISTS zeus_categories (
      id BIGSERIAL PRIMARY KEY,
      zeus_key TEXT NOT NULL UNIQUE,
      google_taxonomy_path TEXT NOT NULL,
      display_name TEXT NOT NULL,
      parent_key TEXT,
      level INTEGER NOT NULL DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS zeus_category_mappings (
      id BIGSERIAL PRIMARY KEY,
      platform TEXT NOT NULL,
      external_category TEXT,
      external_path TEXT,
      zeus_key TEXT NOT NULL,
      confidence NUMERIC(5,4) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_zeus_category_mappings_unique
    ON zeus_category_mappings (
      platform,
      zeus_key,
      COALESCE(external_category, ''),
      COALESCE(external_path, '')
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS zeus_category_learning (
      id BIGSERIAL PRIMARY KEY,
      platform TEXT NOT NULL,
      store_domain TEXT,
      input_title TEXT,
      input_tags TEXT,
      input_description TEXT,
      predicted_zeus_key TEXT NOT NULL,
      corrected_zeus_key TEXT,
      correction_source TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_zeus_category_learning_lookup
    ON zeus_category_learning (platform, store_domain, predicted_zeus_key, corrected_zeus_key)
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_zeus_category_learning_title
    ON zeus_category_learning (platform, store_domain, md5(lower(coalesce(input_title, ''))))
  `);
}

async function upsertPlatformMapping({
  platform,
  externalCategory,
  externalPath,
  zeusKey,
  confidence
}) {
  const db = createPool();

  const updateResult = await db.query(
    `
      UPDATE zeus_category_mappings
      SET confidence = $5,
          updated_at = NOW()
      WHERE platform = $1
        AND zeus_key = $4
        AND COALESCE(external_category, '') = COALESCE($2, '')
        AND COALESCE(external_path, '') = COALESCE($3, '')
    `,
    [platform, externalCategory, externalPath, zeusKey, confidence]
  );

  if (updateResult.rowCount > 0) {
    return;
  }

  await db.query(
    `
      INSERT INTO zeus_category_mappings (
        platform,
        external_category,
        external_path,
        zeus_key,
        confidence,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `,
    [platform, externalCategory, externalPath, zeusKey, confidence]
  );
}

async function seedBaseTaxonomy() {
  const db = createPool();

  for (const [zeusKey, config] of Object.entries(GOOGLE_TAXONOMY_BY_ZEUS_KEY)) {
    await db.query(
      `
        INSERT INTO zeus_categories (
          zeus_key,
          google_taxonomy_path,
          display_name,
          parent_key,
          level,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, TRUE)
        ON CONFLICT (zeus_key)
        DO UPDATE SET
          google_taxonomy_path = EXCLUDED.google_taxonomy_path,
          display_name = EXCLUDED.display_name,
          parent_key = EXCLUDED.parent_key,
          level = EXCLUDED.level,
          is_active = TRUE
      `,
      [
        zeusKey,
        config.google_taxonomy_path,
        config.display_name,
        null,
        1
      ]
    );
  }

  for (const [platform, mappings] of Object.entries(PLATFORM_CATEGORY_TRANSLATIONS)) {
    for (const [zeusKey, mapping] of Object.entries(mappings)) {
      await upsertPlatformMapping({
        platform,
        externalCategory: mapping.external_category,
        externalPath: mapping.external_path,
        zeusKey,
        confidence: 0.9
      });
    }
  }
}

async function initCategoryBrain() {
  if (!initPromise) {
    initPromise = (async () => {
      await ensureTables();
      return true;
    })().catch((error) => {
      initPromise = null;
      console.error("CATEGORY BRAIN INIT ERROR:", error.message);
      throw error;
    });
  }

  await initPromise;

  if (!seedPromise) {
    seedPromise = seedBaseTaxonomy().catch((error) => {
      seedPromise = null;
      console.error("CATEGORY BRAIN SEED ERROR:", error.message);
      throw error;
    });
  }

  await seedPromise;

  return true;
}

async function findLearningMatch({
  platform = "shopify",
  storeDomain = null,
  title = "",
  tags = "",
  description = ""
}) {
  const db = createPool();

  const normalizedTitle = normalize(title);
  const normalizedTags = normalize(tags);
  const normalizedDescription = normalize(description);

  const params = [platform, normalizedTitle, normalizedTags, normalizedDescription];
  const storeCondition = storeDomain
    ? `(store_domain = $5 OR store_domain IS NULL OR store_domain = '')`
    : `(store_domain IS NULL OR store_domain = '')`;

  if (storeDomain) {
    params.push(storeDomain);
  }

  const result = await db.query(
    `
      SELECT
        predicted_zeus_key,
        corrected_zeus_key,
        correction_source,
        created_at
      FROM zeus_category_learning
      WHERE platform = $1
        AND md5(lower(coalesce(input_title, ''))) = md5($2)
        AND md5(lower(coalesce(input_tags, ''))) = md5($3)
        AND md5(lower(coalesce(input_description, ''))) = md5($4)
        AND ${storeCondition}
      ORDER BY
        CASE WHEN corrected_zeus_key IS NOT NULL THEN 0 ELSE 1 END,
        CASE WHEN correction_source IN ('human', 'manual', 'admin') THEN 0 ELSE 1 END,
        created_at DESC
      LIMIT 1
    `,
    params
  );

  return result.rows[0] || null;
}

async function persistPrediction({
  platform = "shopify",
  storeDomain = null,
  title = "",
  tags = "",
  description = "",
  predictedZeusKey = "general",
  correctionSource = "prediction"
}) {
  const db = createPool();

  await db.query(
    `
      INSERT INTO zeus_category_learning (
        platform,
        store_domain,
        input_title,
        input_tags,
        input_description,
        predicted_zeus_key,
        corrected_zeus_key,
        correction_source
      )
      VALUES ($1, $2, $3, $4, $5, $6, NULL, $7)
    `,
    [
      platform,
      storeDomain,
      normalize(title),
      normalize(tags),
      normalize(description),
      predictedZeusKey,
      correctionSource
    ]
  );
}

async function recordCategoryCorrection({
  platform = "shopify",
  storeDomain = null,
  title = "",
  tags = [],
  description = "",
  predictedZeusKey = "general",
  correctedZeusKey,
  correctionSource = "human"
}) {
  if (!correctedZeusKey) {
    throw new Error("correctedZeusKey is required");
  }

  await initCategoryBrain();

  const db = createPool();

  await db.query(
    `
      INSERT INTO zeus_category_learning (
        platform,
        store_domain,
        input_title,
        input_tags,
        input_description,
        predicted_zeus_key,
        corrected_zeus_key,
        correction_source
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      platform,
      storeDomain,
      normalize(title),
      normalizeTags(tags),
      normalize(description),
      predictedZeusKey,
      correctedZeusKey,
      correctionSource
    ]
  );

  return {
    status: "learned",
    platform,
    storeDomain,
    predictedZeusKey,
    correctedZeusKey,
    correctionSource
  };
}

async function resolvePlatformMapping({
  platform = "shopify",
  zeusKey = "general"
}) {
  const db = createPool();

  const result = await db.query(
    `
      SELECT external_category, external_path, confidence
      FROM zeus_category_mappings
      WHERE platform = $1
        AND zeus_key = $2
      ORDER BY confidence DESC, updated_at DESC
      LIMIT 1
    `,
    [platform, zeusKey]
  );

  return result.rows[0] || null;
}

async function suggestCategory(product = {}) {
  await initCategoryBrain();

  const platform = String(product.platform || "shopify").toLowerCase();
  const storeDomain =
    product.storeDomain ||
    product.shopDomain ||
    product.store?.shopDomain ||
    null;

  const title = product.title || "";
  const description = product.description || "";
  const tagsArray = Array.isArray(product.tags)
    ? product.tags
    : typeof product.tags === "string" && product.tags.length > 0
      ? [product.tags]
      : [];

  const tagString = tagsArray.join(" ");

  const learningMatch = await findLearningMatch({
    platform,
    storeDomain,
    title,
    tags: tagString,
    description
  });

  if (learningMatch) {
    const learnedCategory =
      learningMatch.corrected_zeus_key ||
      learningMatch.predicted_zeus_key ||
      "general";

    const mapping =
      GOOGLE_TAXONOMY_BY_ZEUS_KEY[learnedCategory] ||
      GOOGLE_TAXONOMY_BY_ZEUS_KEY.general;

    const platformMapping = await resolvePlatformMapping({
      platform,
      zeusKey: learnedCategory
    });

    return {
      category: learnedCategory,
      confidence: learningMatch.corrected_zeus_key ? 0.99 : 0.96,
      decision: learningMatch.corrected_zeus_key
        ? "learning_override_human"
        : "learning_override_prediction",
      matchedTerms: [],
      googleTaxonomyPath: mapping.google_taxonomy_path,
      displayName: mapping.display_name,
      platformCategory: platformMapping?.external_category || learnedCategory,
      platformPath: platformMapping?.external_path || mapping.google_taxonomy_path,
      learned: true,
      learningSource: learningMatch.correction_source || "prediction"
    };
  }

  const classification = computeTaxonomyClassification({
    title,
    description,
    tags: tagsArray
  });

  await persistPrediction({
    platform,
    storeDomain,
    title,
    tags: tagString,
    description,
    predictedZeusKey: classification.category,
    correctionSource: "prediction"
  });

  const platformMapping = await resolvePlatformMapping({
    platform,
    zeusKey: classification.category
  });

  return {
    category: classification.category,
    confidence: classification.confidence,
    decision: classification.decision,
    matchedTerms: classification.matchedTerms,
    googleTaxonomyPath: classification.googleTaxonomyPath,
    displayName: classification.displayName,
    platformCategory: platformMapping?.external_category || classification.category,
    platformPath: platformMapping?.external_path || classification.googleTaxonomyPath,
    learned: false,
    learningSource: null
  };
}

module.exports = {
  initCategoryBrain,
  suggestCategory,
  recordCategoryCorrection,
  normalize
};
