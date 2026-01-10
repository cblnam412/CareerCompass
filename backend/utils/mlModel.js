
class TreeNode {
    constructor(feature = null, threshold = null, left = null, right = null, value = null, samples = 0) {
        this.feature = feature;
        this.threshold = threshold;
        this.left = left;
        this.right = right;
        this.value = value; 
        this.samples = samples;
    }
    
    isLeaf() {
        return this.value !== null;
    }
}


export class DecisionTreeClassifier {
    constructor(maxDepth = 15, minSamplesSplit = 2, minSamplesLeaf = 1, randomState = 42) {
        this.maxDepth = maxDepth;
        this.minSamplesSplit = minSamplesSplit;
        this.minSamplesLeaf = minSamplesLeaf;
        this.randomState = randomState;
        this.tree = null;
        this.nFeatures = null;
        this.classes = null;
        this.featureImportance = null;
    }

    _gini(y) {
        const counts = {};
        y.forEach(label => {
            counts[label] = (counts[label] || 0) + 1;
        });
        
        let gini = 1.0;
        const n = y.length;
        Object.values(counts).forEach(count => {
            const p = count / n;
            gini -= p * p;
        });
        return gini;
    }

    _bestSplit(X, y, featureIndices) {
        let bestGain = -1;
        let bestFeature = null;
        let bestThreshold = null;
        let bestLeftIndices = null;
        let bestRightIndices = null;
        
        const parentGini = this._gini(y.map((_, i) => y[i]));
        const n = X.length;
        
        for (let feature of featureIndices) {
            const values = X.map(sample => sample[feature]).sort((a, b) => a - b);
            const uniqueValues = [...new Set(values)];
            
            for (let threshold of uniqueValues) {
                const leftIndices = [];
                const rightIndices = [];
                
                X.forEach((sample, i) => {
                    if (sample[feature] <= threshold) {
                        leftIndices.push(i);
                    } else {
                        rightIndices.push(i);
                    }
                });
                
                if (leftIndices.length < this.minSamplesLeaf || 
                    rightIndices.length < this.minSamplesLeaf) {
                    continue;
                }
                
                const leftY = leftIndices.map(i => y[i]);
                const rightY = rightIndices.map(i => y[i]);
                
                const giniLeft = this._gini(leftY);
                const giniRight = this._gini(rightY);
                
                const childGini = (leftIndices.length / n) * giniLeft + 
                                  (rightIndices.length / n) * giniRight;
                
                const gain = parentGini - childGini;
                
                if (gain > bestGain) {
                    bestGain = gain;
                    bestFeature = feature;
                    bestThreshold = threshold;
                    bestLeftIndices = leftIndices;
                    bestRightIndices = rightIndices;
                }
            }
        }
        
        return {
            feature: bestFeature,
            threshold: bestThreshold,
            gain: bestGain,
            leftIndices: bestLeftIndices,
            rightIndices: bestRightIndices
        };
    }

    _mostCommon(y) {
        const counts = {};
        y.forEach(label => {
            counts[label] = (counts[label] || 0) + 1;
        });
        
        return Object.keys(counts).reduce((a, b) => 
            counts[a] > counts[b] ? a : b
        );
    }

    _buildTree(X, y, depth = 0) {
        const n = y.length;
        const nClasses = new Set(y).size;
        
        if (depth >= this.maxDepth || 
            n < this.minSamplesSplit || 
            nClasses === 1) {
            return new TreeNode(null, null, null, null, this._mostCommon(y), n);
        }
        
        const featureIndices = Array.from({length: this.nFeatures}, (_, i) => i);
        const split = this._bestSplit(X, y, featureIndices);
        
        if (split.feature === null) {
            return new TreeNode(null, null, null, null, this._mostCommon(y), n);
        }
        
        const leftX = split.leftIndices.map(i => X[i]);
        const rightX = split.rightIndices.map(i => X[i]);
        const leftY = split.leftIndices.map(i => y[i]);
        const rightY = split.rightIndices.map(i => y[i]);
        
        const left = this._buildTree(leftX, leftY, depth + 1);
        const right = this._buildTree(rightX, rightY, depth + 1);
        
        return new TreeNode(split.feature, split.threshold, left, right, null, n);
    }
    
  
    fit(X, y) {
        this.nFeatures = X[0].length;
        this.classes = [...new Set(y)];
        this.tree = this._buildTree(X, y);
        
        this._calculateFeatureImportance(X, y);
        
        return this;
    }
    
 
    _calculateFeatureImportance(X, y) {
        this.featureImportance = Array(this.nFeatures).fill(0);
        
        const traverse = (node, depth = 0) => {
            if (node.isLeaf() || node.feature === null) {
                return;
            }
            
            const weight = 1 / (2 ** depth);
            this.featureImportance[node.feature] += weight;
            
            if (node.left) traverse(node.left, depth + 1);
            if (node.right) traverse(node.right, depth + 1);
        };
        
        traverse(this.tree);
        
        const total = this.featureImportance.reduce((a, b) => a + b, 0);
        if (total > 0) {
            this.featureImportance = this.featureImportance.map(v => v / total);
        }
    }

    _predictSample(sample) {
        let node = this.tree;
        
        while (!node.isLeaf()) {
            if (sample[node.feature] <= node.threshold) {
                node = node.left;
            } else {
                node = node.right;
            }
        }
        
        return node.value;
    }

    predict(X) {
        return X.map(sample => this._predictSample(sample));
    }

    score(X, y) {
        const predictions = this.predict(X);
        const correct = predictions.filter((pred, i) => pred === y[i]).length;
        return correct / y.length;
    }
}


export class RandomForestClassifier {
    constructor(nEstimators = 20, maxDepth = 15, minSamplesSplit = 2, minSamplesLeaf = 1, randomState = 42) {
        this.nEstimators = nEstimators;
        this.maxDepth = maxDepth;
        this.minSamplesSplit = minSamplesSplit;
        this.minSamplesLeaf = minSamplesLeaf;
        this.randomState = randomState;
        this.trees = [];
        this.classes = null;
        this.featureImportance = null;
        this.nFeatures = null;
    }
    

    _bootstrap(X, y) {
        const n = X.length;
        const indices = [];
        
        for (let i = 0; i < n; i++) {
            const idx = Math.floor(Math.random() * n);
            indices.push(idx);
        }
        
        return {
            X: indices.map(i => X[i]),
            y: indices.map(i => y[i])
        };
    }

    fit(X, y) {
        this.nFeatures = X[0].length;
        this.classes = [...new Set(y)];
        this.trees = [];
        this.featureImportance = Array(this.nFeatures).fill(0);
        
        for (let i = 0; i < this.nEstimators; i++) {
            const { X: bootX, y: bootY } = this._bootstrap(X, y);
            
            const tree = new DecisionTreeClassifier(
                this.maxDepth,
                this.minSamplesSplit,
                this.minSamplesLeaf,
                this.randomState + i
            );
            
            tree.fit(bootX, bootY);
            this.trees.push(tree);
            
            if (tree.featureImportance) {
                tree.featureImportance.forEach((imp, idx) => {
                    this.featureImportance[idx] += imp;
                });
            }
        }
        
        const total = this.featureImportance.reduce((a, b) => a + b, 0);
        if (total > 0) {
            this.featureImportance = this.featureImportance.map(v => v / total);
        }
        
        return this;
    }

    predict(X) {
        const predictions = this.trees.map(tree => tree.predict(X));
        
        return X.map((_, sampleIdx) => {
            const votes = {};
            
            predictions.forEach(treePreds => {
                const pred = treePreds[sampleIdx];
                votes[pred] = (votes[pred] || 0) + 1;
            });
            
            return Object.keys(votes).reduce((a, b) => 
                votes[a] > votes[b] ? a : b
            );
        });
    }

    predictProba(X) {
        const predictions = this.trees.map(tree => tree.predict(X));
        
        return X.map((_, sampleIdx) => {
            const votes = {};
            this.classes.forEach(cls => votes[cls] = 0);
            
            predictions.forEach(treePreds => {
                votes[treePreds[sampleIdx]]++;
            });
            
            const proba = {};
            this.classes.forEach(cls => {
                proba[cls] = votes[cls] / this.trees.length;
            });
            
            return proba;
        });
    }

    score(X, y) {
        const predictions = this.predict(X);
        const correct = predictions.filter((pred, i) => pred === y[i]).length;
        return correct / y.length;
    }
}

export class MajorRecommendationModel {
    constructor() {
        this.model = null;
        this.classes = null;
        this.featureNames = null;
    }

    train(X, y, featureNames = []) {
        try {
            this.model = new RandomForestClassifier(
                20,  // nEstimators
                15,  // maxDepth
                2,   // minSamplesSplit
                1    // minSamplesLeaf
            );
            
            this.model.fit(X, y);
            this.classes = this.model.classes;
            this.featureNames = featureNames;
            
            return {
                success: true,
                accuracy: this.model.score(X, y),
                featureImportance: this.model.featureImportance,
                nEstimators: this.model.nEstimators,
                nFeatures: this.model.nFeatures,
                nClasses: this.classes.length
            };
        } catch (error) {
            console.error('Error training model:', error);
            return { success: false, error: error.message };
        }
    }

    predict(features) {
        if (!this.model) throw new Error('Model not trained');
        return this.model.predict([features])[0];
    }

    predictProba(features) {
        if (!this.model) throw new Error('Model not trained');
        return this.model.predictProba([features])[0];
    }

    predictTopK(features, k = 3) {
        const proba = this.predictProba(features);
        
        const sorted = Object.entries(proba)
            .sort((a, b) => b[1] - a[1])
            .slice(0, k);
        
        return sorted.map(([majorId, probability]) => ({
            majorId,
            probability: parseFloat((probability * 100).toFixed(2))
        }));
    }

    getFeatureImportance() {
        if (!this.model || !this.featureNames) {
            return [];
        }
        
        return this.featureNames.map((name, idx) => ({
            feature: name,
            importance: parseFloat((this.model.featureImportance[idx] * 100).toFixed(2))
        })).sort((a, b) => b.importance - a.importance);
    }

    toJSON() {
        if (!this.model) {
            throw new Error('Model not trained');
        }
        
        const serializeTree = (node) => {
            if (!node) return null;
            
            if (node.isLeaf()) {
                return { 
                    isLeaf: true, 
                    value: node.value,
                    samples: node.samples
                };
            }
            
            return {
                isLeaf: false,
                feature: node.feature,
                threshold: node.threshold,
                samples: node.samples,
                left: serializeTree(node.left),
                right: serializeTree(node.right)
            };
        };
        
        return {
            modelType: 'RandomForest',
            version: 1,
            classes: this.classes,
            featureNames: this.featureNames,
            nEstimators: this.model.nEstimators,
            maxDepth: this.model.maxDepth,
            featureImportance: this.model.featureImportance,
            trees: this.model.trees.map(tree => ({
                nFeatures: tree.nFeatures,
                classes: tree.classes,
                tree: serializeTree(tree.tree)
            }))
        };
    }

    static fromJSON(data) {
        const instance = new MajorRecommendationModel();
        instance.classes = data.classes;
        instance.featureNames = data.featureNames;
        
        const deserializeTree = (nodeData) => {
            if (!nodeData) return null;
            
            if (nodeData.isLeaf) {
                return new TreeNode(null, null, null, null, nodeData.value, nodeData.samples);
            }
            
            const left = deserializeTree(nodeData.left);
            const right = deserializeTree(nodeData.right);
            return new TreeNode(nodeData.feature, nodeData.threshold, left, right, null, nodeData.samples);
        };
        
        instance.model = new RandomForestClassifier(data.nEstimators, data.maxDepth);
        instance.model.classes = data.classes;
        instance.model.featureImportance = data.featureImportance;
        instance.model.nFeatures = data.featureNames.length;
        
        instance.model.trees = data.trees.map(treeData => {
            const tree = new DecisionTreeClassifier();
            tree.nFeatures = treeData.nFeatures;
            tree.classes = treeData.classes;
            tree.tree = deserializeTree(treeData.tree);
            return tree;
        });
        
        return instance;
    }
}
