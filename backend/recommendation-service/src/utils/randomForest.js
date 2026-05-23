const mean = (items) => items.reduce((sum, item) => sum + item.label, 0) / Math.max(1, items.length);

const variance = (items) => {
  if (items.length === 0) return 0;
  const avg = mean(items);
  return items.reduce((sum, item) => sum + (item.label - avg) ** 2, 0) / items.length;
};

const createRng = (seed = 42) => {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

const sampleWithReplacement = (items, rng) => {
  const sampled = [];
  for (let i = 0; i < items.length; i += 1) {
    sampled.push(items[Math.floor(rng() * items.length)]);
  }
  return sampled;
};

const pickFeatureIndexes = (featureCount, rng) => {
  const target = Math.max(1, Math.round(Math.sqrt(featureCount)));
  const indexes = new Set();
  while (indexes.size < target) indexes.add(Math.floor(rng() * featureCount));
  return [...indexes];
};

const quantileThresholds = (items, featureIndex) => {
  const values = [...new Set(items.map((item) => item.features[featureIndex]).filter(Number.isFinite))]
    .sort((a, b) => a - b);
  if (values.length <= 1) return values;

  const points = [0.25, 0.5, 0.75].map((q) => values[Math.floor((values.length - 1) * q)]);
  return [...new Set(points)];
};

const bestSplit = (items, featureCount, rng) => {
  const features = pickFeatureIndexes(featureCount, rng);
  let best = null;

  features.forEach((featureIndex) => {
    quantileThresholds(items, featureIndex).forEach((threshold) => {
      const left = items.filter((item) => item.features[featureIndex] <= threshold);
      const right = items.filter((item) => item.features[featureIndex] > threshold);
      if (left.length < 2 || right.length < 2) return;

      const loss = (variance(left) * left.length + variance(right) * right.length) / items.length;
      if (!best || loss < best.loss) {
        best = { featureIndex, threshold, left, right, loss };
      }
    });
  });

  return best;
};

const buildTree = (items, featureCount, depth, maxDepth, minSamples, rng) => {
  const value = mean(items);
  if (depth >= maxDepth || items.length <= minSamples || variance(items) < 1) {
    return { value };
  }

  const split = bestSplit(items, featureCount, rng);
  if (!split) return { value };

  return {
    value,
    featureIndex: split.featureIndex,
    threshold: split.threshold,
    left: buildTree(split.left, featureCount, depth + 1, maxDepth, minSamples, rng),
    right: buildTree(split.right, featureCount, depth + 1, maxDepth, minSamples, rng),
  };
};

const predictTree = (tree, features) => {
  if (!tree.left || !tree.right || tree.featureIndex === undefined) return tree.value;
  return features[tree.featureIndex] <= tree.threshold
    ? predictTree(tree.left, features)
    : predictTree(tree.right, features);
};

export class RandomForestRegressor {
  constructor({ trees = 21, maxDepth = 6, minSamples = 4, seed = 42 } = {}) {
    this.trees = trees;
    this.maxDepth = maxDepth;
    this.minSamples = minSamples;
    this.seed = seed;
    this.forest = [];
  }

  fit(samples = []) {
    const clean = samples.filter((sample) => Array.isArray(sample.features) && Number.isFinite(sample.label));
    if (clean.length === 0) {
      this.forest = [];
      return this;
    }

    const featureCount = clean[0].features.length;
    const rng = createRng(this.seed);
    this.forest = Array.from({ length: this.trees }, () => {
      const sampled = sampleWithReplacement(clean, rng);
      return buildTree(sampled, featureCount, 0, this.maxDepth, this.minSamples, rng);
    });
    return this;
  }

  predict(features = []) {
    if (!this.forest.length) return 50;
    const score = this.forest.reduce((sum, tree) => sum + predictTree(tree, features), 0) / this.forest.length;
    return Math.max(0, Math.min(100, score));
  }
}
