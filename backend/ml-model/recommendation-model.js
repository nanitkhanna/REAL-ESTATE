const tf = require('@tensorflow/tfjs-node');
const DATABASE = require('../database');

class RecommendationModel {
    constructor() {
        this.model = null;
    }

    // Initialize and train the model
    async initializeModel() {
        // Fetch training data
        const properties = await DATABASE.getAllProperties();
        const userData = await DATABASE.getAllUserPreferences();

        // Prepare training data
        const features = this.prepareFeatures(properties, userData);
        const labels = this.prepareLabels(properties, userData);

        // Create and compile model
        this.model = tf.sequential();
        this.model.add(tf.layers.dense({
            inputShape: [features[0].length],
            units: 64,
            activation: 'relu'
        }));
        this.model.add(tf.layers.dense({
            units: 32,
            activation: 'relu'
        }));
        this.model.add(tf.layers.dense({
            units: 1,
            activation: 'sigmoid'
        }));

        this.model.compile({
            optimizer: 'adam',
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });

        // Train the model
        const xs = tf.tensor2d(features);
        const ys = tf.tensor2d(labels);
        
        await this.model.fit(xs, ys, {
            epochs: 50,
            batchSize: 32
        });
    }

    // Generate recommendations for a user
    async getRecommendations(user) {
        // If model not initialized, initialize it
        if (!this.model) {
            await this.initializeModel();
        }

        // Fetch all properties
        const properties = await DATABASE.getAllProperties();

        // Predict match scores for properties
        const recommendations = properties.map(property => {
            const features = this.extractFeatures(user, property);
            const featuredTensor = tf.tensor2d([features]);
            const matchScore = this.model.predict(featuredTensor).dataSync()[0];

            return {
                ...property,
                matchScore
            };
        });

        // Sort by match score and return top 5
        return recommendations
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 5);
    }

    // Extract features for prediction
    extractFeatures(user, property) {
        return [
            // User preferences
            user.preferences.budget / 1000000,
            user.preferences.bedrooms,
            user.preferences.bathrooms,
            
            // Property characteristics
            property.price / 1000000,
            property.bedrooms,
            property.bathrooms,
            
            // Location matching
            this.calculateLocationSimilarity(user.preferences.location, property.location)
        ];
    }

    // Calculate location similarity
    calculateLocationSimilarity(userLocation, propertyLocation) {
        return userLocation === propertyLocation ? 1 : 0;
    }
}

module.exports = new RecommendationModel();