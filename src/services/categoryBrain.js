const { Pool } = require("pg");

let pool = null;
let initPromise = null;
let seedPromise = null;

const CATEGORY_DEFINITIONS = {
  electronics: {
    display_name: "Electronics",
    google_taxonomy_path: "Electronics",
    external_category: "electronics",
    external_path: "Electronics",
    keywords: [
      "electronics",
      "electronic",
      "gadget",
      "device",
      "usb",
      "bluetooth",
      "wireless",
      "charger",
      "adapter",
      "cable"
    ],
    strongSignals: [
      "usb charger",
      "charging cable",
      "power bank",
      "bluetooth speaker",
      "smart watch",
      "wireless mouse"
    ],
    negativeKeywords: ["dog", "cat", "shirt", "dress", "folder", "document", "bag"]
  },

  mobile_accessories: {
    display_name: "Mobile Accessories",
    google_taxonomy_path: "Electronics > Communications > Telephony > Mobile Phone Accessories",
    external_category: "mobile_accessories",
    external_path: "Electronics > Communications > Telephony > Mobile Phone Accessories",
    keywords: [
      "phone case",
      "phone holder",
      "phone stand",
      "charger",
      "charging cable",
      "usb cable",
      "lightning cable",
      "type c cable",
      "screen protector",
      "magnetic charger",
      "wireless charger"
    ],
    strongSignals: [
      "phone case",
      "screen protector",
      "wireless charger",
      "phone holder"
    ],
    negativeKeywords: ["dog", "cat", "shirt", "dress", "folder", "document"]
  },

  audio: {
    display_name: "Audio",
    google_taxonomy_path: "Electronics > Audio",
    external_category: "audio",
    external_path: "Electronics > Audio",
    keywords: [
      "earbuds",
      "headphones",
      "speaker",
      "audio",
      "microphone",
      "soundbar",
      "headset"
    ],
    strongSignals: ["earbuds", "headphones", "bluetooth speaker", "headset"],
    negativeKeywords: ["dog", "cat", "shirt", "dress", "folder"]
  },

  computer_accessories: {
    display_name: "Computer Accessories",
    google_taxonomy_path: "Electronics > Computers > Computer Components",
    external_category: "computer_accessories",
    external_path: "Electronics > Computers > Computer Components",
    keywords: [
      "keyboard",
      "mouse",
      "mouse pad",
      "webcam",
      "laptop stand",
      "usb hub",
      "computer accessory"
    ],
    strongSignals: ["wireless mouse", "keyboard", "usb hub", "webcam"],
    negativeKeywords: ["dog", "cat", "shirt", "dress", "folder", "document"]
  },

  pet_supplies: {
    display_name: "Pet Supplies",
    google_taxonomy_path: "Animals & Pet Supplies > Pet Supplies",
    external_category: "pet_supplies",
    external_path: "Animals & Pet Supplies > Pet Supplies",
    keywords: [
      "pet",
      "dog",
      "cat",
      "puppy",
      "kitten",
      "leash",
      "collar",
      "pet toy",
      "pet bowl",
      "pet bed",
      "harness"
    ],
    strongSignals: [
      "dog toy",
      "cat toy",
      "pet collar",
      "pet leash",
      "dog harness",
      "pet feeder"
    ],
    negativeKeywords: ["shirt", "dress", "document", "folder", "file bag"]
  },

  home_kitchen: {
    display_name: "Home & Kitchen",
    google_taxonomy_path: "Home & Garden > Kitchen & Dining",
    external_category: "home_kitchen",
    external_path: "Home & Garden > Kitchen & Dining",
    keywords: [
      "kitchen",
      "home",
      "cook",
      "pan",
      "knife",
      "dish",
      "storage",
      "container",
      "organizer",
      "rack",
      "tray"
    ],
    strongSignals: [
      "kitchen organizer",
      "food container",
      "knife set",
      "pan set",
      "dish rack"
    ],
    negativeKeywords: ["dog", "cat", "shirt", "dress", "document", "file bag", "folder"]
  },

  storage_organization: {
    display_name: "Storage & Organization",
    google_taxonomy_path: "Home & Garden > Household Supplies > Storage & Organization",
    external_category: "storage_organization",
    external_path: "Home & Garden > Household Supplies > Storage & Organization",
    keywords: [
      "storage box",
      "storage bag",
      "organizer",
      "drawer organizer",
      "closet organizer",
      "shelf organizer",
      "under bed storage",
      "storage basket"
    ],
    strongSignals: [
      "storage box",
      "drawer organizer",
      "closet organizer",
      "storage basket"
    ],
    negativeKeywords: ["dog", "cat", "shirt", "dress", "document folder", "file bag"]
  },

  office_supplies: {
    display_name: "Office Supplies",
    google_taxonomy_path: "Office Supplies",
    external_category: "office_supplies",
    external_path: "Office Supplies",
    keywords: [
      "office",
      "stationery",
      "paper storage",
      "document",
      "file",
      "folder",
      "pouch",
      "zipper bag",
      "a4",
      "a5",
      "receipt bag",
      "bill bag",
      "document organizer"
    ],
    strongSignals: [
      "office supplies",
      "stationery bag",
      "document organizer",
      "paper storage"
    ],
    negativeKeywords: ["dog", "cat", "shirt", "dress", "kitchen", "charger", "earbuds"]
  },

  document_bags: {
    display_name: "Document Bags",
    google_taxonomy_path: "Office Supplies > Filing & Organization > Document Bags",
    external_category: "office_supplies",
    external_path: "Office Supplies > Filing & Organization > Document Bags",
    keywords: [
      "document bag",
      "file bag",
      "zipper bag",
      "zip file bag",
      "paper storage file bag",
      "stationery bag",
      "a4 transparent grid bag",
      "waterproof file bag",
      "document pouch",
      "mesh zipper pouch",
      "receipt bag",
      "bill bag",
      "file pouch",
      "office file bag"
    ],
    strongSignals: [
      "document bag",
      "file bag",
      "zipper file bag",
      "waterproof file bag",
      "mesh zipper pouch",
      "document pouch"
    ],
    negativeKeywords: ["dog", "cat", "shirt", "dress", "hat", "beanie", "charger", "earbuds"]
  },

  file_folders: {
    display_name: "File Folders",
    google_taxonomy_path: "Office Supplies > Filing & Organization > File Folders",
    external_category: "office_supplies",
    external_path: "Office Supplies > Filing & Organization > File Folders",
    keywords: [
      "file folder",
      "folder",
      "paper folder",
      "document folder",
      "a4 folder",
      "expanding folder",
      "accordion folder",
      "folder organizer"
    ],
    strongSignals: [
      "file folder",
      "document folder",
      "accordion folder",
      "expanding folder"
    ],
    negativeKeywords: ["dog", "cat", "shirt", "dress", "hat", "beanie", "charger"]
  },

  bags_luggage: {
    display_name: "Bags & Luggage",
    google_taxonomy_path: "Apparel & Accessories > Handbags, Wallets & Cases",
    external_category: "bags_luggage",
    external_path: "Apparel & Accessories > Handbags, Wallets & Cases",
    keywords: [
      "bag",
      "backpack",
      "travel bag",
      "shoulder bag",
      "luggage",
      "crossbody bag",
      "handbag",
      "wallet"
    ],
    strongSignals: [
      "backpack",
      "travel bag",
      "shoulder bag",
      "crossbody bag",
      "handbag"
    ],
    negativeKeywords: ["document bag", "file bag", "zipper file bag", "paper storage"]
  },

  fashion: {
    display_name: "Fashion",
    google_taxonomy_path: "Apparel & Accessories",
    external_category: "fashion",
    external_path: "Apparel & Accessories",
    keywords: [
      "shirt",
      "hoodie",
      "jacket",
      "coat",
      "dress",
      "pants",
      "jeans",
      "sneakers",
      "clothing",
      "fashion",
      "apparel"
    ],
    strongSignals: ["shirt", "hoodie", "jacket", "dress", "jeans", "sneakers"],
    negativeKeywords: ["dog", "cat", "document", "folder", "charger", "earbuds"]
  },

  hats_caps: {
    display_name: "Hats & Caps",
    google_taxonomy_path: "Apparel & Accessories > Clothing Accessories > Hats",
    external_category: "fashion",
    external_path: "Apparel & Accessories > Clothing Accessories > Hats",
    keywords: [
      "hat",
      "cap",
      "beanie",
      "winter beanie",
      "knit hat",
      "knitted hat",
      "winter hat",
      "gorro",
      "gorro de invierno",
      "gorro tejido",
      "cachucha",
      "wool hat",
      "skull cap"
    ],
    strongSignals: [
      "beanie",
      "winter beanie",
      "knit hat",
      "gorro",
      "gorro de invierno",
      "cachucha"
    ],
    negativeKeywords: ["dog", "cat", "document", "file bag", "charger", "earbuds"]
  },

  beauty: {
    display_name: "Beauty",
    google_taxonomy_path: "Health & Beauty > Personal Care",
    external_category: "beauty",
    external_path: "Health & Beauty > Personal Care",
    keywords: [
      "beauty",
      "makeup",
      "cosmetic",
      "skincare",
      "cream",
      "serum",
      "lipstick",
      "nail polish",
      "face wash"
    ],
    strongSignals: ["makeup brush", "face cream", "serum", "lipstick"],
    negativeKeywords: ["dog", "cat", "shirt", "dress", "document", "folder"]
  },

  sports: {
    display_name: "Sports",
    google_taxonomy_path: "Sporting Goods",
    external_category: "sports",
    external_path: "Sporting Goods",
    keywords: [
      "fitness",
      "sport",
      "gym",
      "exercise",
      "training",
      "yoga",
      "resistance band",
      "yoga mat",
      "gym gloves"
    ],
    strongSignals: ["resistance band", "yoga mat", "gym gloves", "fitness tracker"],
    negativeKeywords: ["dog", "cat", "shirt", "dress", "document", "folder"]
  },

  automotive: {
    display_name: "Automotive",
    google_taxonomy_path: "Vehicles & Parts",
    external_category: "automotive",
    external_path: "Vehicles & Parts",
    keywords: [
      "car",
      "automotive",
      "vehicle",
      "tire",
      "engine",
      "dash cam",
      "seat cover",
      "car charger",
      "steering wheel cover"
    ],
    strongSignals: ["car charger", "seat cover", "dash cam", "car vacuum"],
    negativeKeywords: ["shirt", "dress", "document", "folder", "hat", "beanie"]
  },

  toys: {
    display_name: "Toys",
    google_taxonomy_path: "Toys & Games",
    external_category: "toys",
    external_path: "Toys & Games",
    keywords: [
      "toy",
      "kids",
      "game",
      "children",
      "plush toy",
      "building blocks",
      "board game",
      "baby toy"
    ],
    strongSignals: ["building blocks", "board game", "plush toy", "baby toy"],
    negativeKeywords: ["shirt", "dress", "document", "folder", "charger"]
  },

  tools: {
    display_name: "Tools",
    google_taxonomy_path: "Hardware > Tools",
    external_category: "tools",
    external_path: "Hardware > Tools",
    keywords: [
      "tool",
      "drill",
      "screwdriver",
      "hardware",
      "wrench",
      "tool kit",
      "socket set"
    ],
    strongSignals: ["tool kit", "screwdriver set", "drill bit", "socket set"],
    negativeKeywords: ["shirt", "dress", "document", "folder", "hat", "beanie"]
  },

  general: {
    display_name: "General",
    google_taxonomy_path: "General",
    external_category: "general",
    external_path: "General",
    keywords: [],
    strongSignals: [],
    negativeKeywords: []
  }
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
      : { rejectUnauthorized: false }
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

function tokenize(text = "") {
  return normalize(text).split(" ").filter(Boolean);
}

function getWeightedSegments(product = {}) {
  return {
    title: normalize(product.title),
    description: normalize(product.description),
    tags: normalizeTags(product.tags)
  };
}

function scoreKeywordPresence(text, keywords = [], weight = 1) {
  let score = 0;
  const matchedTerms = [];

  for (const word of keywords) {
    const normalizedWord = normalize(word);
    if (!normalizedWord) continue;

    if (text.includes(normalizedWord)) {
      score += weight;
      matchedTerms.push(normalizedWord);
    }
  }

  return {
    score,
    matchedTerms
  };
}

function cosineKeywordSimilarity(text, keywords = []) {
  const textTokens = tokenize(text);
  const keywordTokens = tokenize((keywords || []).join(" "));
  if (!textTokens.length || !keywordTokens.length) {
    return 0;
  }

  const textMap = {};
  const keywordMap = {};

  for (const token of textTokens) {
    textMap[token] = (textMap[token] || 0) + 1;
  }

  for (const token of keywordTokens) {
    keywordMap[token] = (keywordMap[token] || 0) + 1;
  }

  const allKeys = Array.from(
    new Set([...Object.keys(textMap), ...Object.keys(keywordMap)])
  );

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const key of allKeys) {
    const a = textMap[key] || 0;
    const b = keywordMap[key] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }

  if (!magA || !magB) {
    return 0;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function detectStrongSignal(combinedText) {
  let best = null;

  for (const [category, def] of Object.entries(CATEGORY_DEFINITIONS)) {
    for (const word of def.strongSignals || []) {
      const normalizedWord = normalize(word);
      if (normalizedWord && combinedText.includes(normalizedWord)) {
        if (!best || normalizedWord.length > best.matchedTerm.length) {
          best = {
            category,
            matchedTerm: normalizedWord
          };
        }
      }
    }
  }

  return best;
}

function computeTaxonomyClassification(product = {}) {
  const segments = getWeightedSegments(product);
  const combinedText =
    `${segments.title} ${segments.description} ${segments.tags}`.trim();

  const strongSignal = detectStrongSignal(combinedText);

  if (strongSignal) {
    const mapped =
      CATEGORY_DEFINITIONS[strongSignal.category] ||
      CATEGORY_DEFINITIONS.general;

    return {
      category: strongSignal.category,
      confidence: 0.95,
      decision: "strong_signal",
      matchedTerms: [strongSignal.matchedTerm],
      googleTaxonomyPath: mapped.google_taxonomy_path,
      displayName: mapped.display_name,
      platformCategory: mapped.external_category,
      platformPath: mapped.external_path
    };
  }

  let bestCategory = "general";
  let bestScore = 0;
  let bestMatchedTerms = [];

  for (const [category, def] of Object.entries(CATEGORY_DEFINITIONS)) {
    if (category === "general") {
      continue;
    }

    const titleResult = scoreKeywordPresence(segments.title, def.keywords, 3.5);
    const tagsResult = scoreKeywordPresence(segments.tags, def.keywords, 2.5);
    const descriptionResult = scoreKeywordPresence(segments.description, def.keywords, 1.25);

    const negativeHits = scoreKeywordPresence(
      combinedText,
      def.negativeKeywords || [],
      2.5
    );

    const similarityScore = cosineKeywordSimilarity(
      combinedText,
      def.keywords || []
    ) * 8;

    const totalScore =
      titleResult.score +
      tagsResult.score +
      descriptionResult.score +
      similarityScore -
      negativeHits.score;

    const matchedTerms = Array.from(
      new Set([
        ...titleResult.matchedTerms,
        ...tagsResult.matchedTerms,
        ...descriptionResult.matchedTerms
      ])
    );

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestCategory = category;
      bestMatchedTerms = matchedTerms;
    }
  }

  const finalCategory = bestScore > 0 ? bestCategory : "general";
  const mapped =
    CATEGORY_DEFINITIONS[finalCategory] ||
    CATEGORY_DEFINITIONS.general;

  return {
    category: finalCategory,
    confidence: bestScore > 0
      ? Math.min(0.58 + bestScore * 0.03, 0.96)
      : 0.32,
    decision: bestScore > 0
      ? "taxonomy_keyword_vector_match"
      : "fallback_general",
    matchedTerms: bestMatchedTerms,
    googleTaxonomyPath: mapped.google_taxonomy_path,
    displayName: mapped.display_name,
    platformCategory: mapped.external_category,
    platformPath: mapped.external_path
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

  for (const [zeusKey, config] of Object.entries(CATEGORY_DEFINITIONS)) {
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

  for (const [zeusKey, config] of Object.entries(CATEGORY_DEFINITIONS)) {
    await upsertPlatformMapping({
      platform: "shopify",
      externalCategory: config.external_category,
      externalPath: config.external_path,
      zeusKey,
      confidence: zeusKey === "general" ? 0.5 : 0.92
    });
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
      CATEGORY_DEFINITIONS[learnedCategory] ||
      CATEGORY_DEFINITIONS.general;

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
      platformCategory: platformMapping?.external_category || mapping.external_category,
      platformPath: platformMapping?.external_path || mapping.external_path,
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
    platformCategory: platformMapping?.external_category || classification.platformCategory,
    platformPath: platformMapping?.external_path || classification.platformPath,
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
