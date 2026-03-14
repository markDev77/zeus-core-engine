const zeusTaxonomy = {
  electronics: {
    keywords: [
      "earbuds",
      "headphones",
      "bluetooth",
      "speaker",
      "audio",
      "charger",
      "usb",
      "cable",
      "adapter",
      "electronics"
    ],
    children: {
      audio: {
        keywords: [
          "earbuds",
          "headphones",
          "speaker",
          "audio"
        ]
      }
    }
  },

  pet_supplies: {
    keywords: [
      "dog",
      "cat",
      "pet",
      "collar",
      "leash",
      "training",
      "pet toy"
    ],
    children: {
      dog: {
        keywords: [
          "dog",
          "collar",
          "training"
        ]
      }
    }
  },

  home_kitchen: {
    keywords: [
      "kitchen",
      "home",
      "cook",
      "pan",
      "knife",
      "storage",
      "container"
    ]
  },

  fashion: {
    keywords: [
      "shirt",
      "dress",
      "pants",
      "fashion",
      "clothing",
      "shoes"
    ]
  },

  beauty: {
    keywords: [
      "beauty",
      "makeup",
      "cosmetic",
      "skincare",
      "cream"
    ]
  },

  sports: {
    keywords: [
      "fitness",
      "sport",
      "gym",
      "exercise",
      "training"
    ]
  },

  automotive: {
    keywords: [
      "car",
      "automotive",
      "vehicle",
      "tire",
      "engine"
    ]
  },

  toys: {
    keywords: [
      "toy",
      "kids",
      "game",
      "children"
    ]
  },

  tools: {
    keywords: [
      "tool",
      "drill",
      "screwdriver",
      "hardware"
    ]
  }
};

module.exports = zeusTaxonomy;
