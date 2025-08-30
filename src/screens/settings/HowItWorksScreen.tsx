import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const HowItWorksScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>How Inventory Works</Text>
          <Text style={styles.headerSubtitle}>
            Master your inventory management with these simple steps
          </Text>
        </View>

        {/* Quick Overview */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>📋 Overview</Text>
          <Text style={styles.overviewText}>
            This inventory management system helps you track products, monitor
            stock levels, record sales, and maintain optimal inventory levels.
            Everything is stored securely in the cloud and syncs across devices.
          </Text>
        </View>

        {/* Core Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>🚀 Key Features</Text>

          <View style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Text style={styles.featureIcon}>📦</Text>
              <View style={styles.featureTitle}>
                <Text style={styles.featureTitleText}>Add Products</Text>
                <Text style={styles.featureDescription}>
                  Create detailed product entries with images
                </Text>
              </View>
            </View>
            <Text style={styles.featureSteps}>
              • Tap "+ Add Item" button{'\n'}• Fill in product details and
              pricing{'\n'}• Upload product image{'\n'}• Set stock levels and
              save
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Text style={styles.featureIcon}>📊</Text>
              <View style={styles.featureTitle}>
                <Text style={styles.featureTitleText}>Monitor Stock</Text>
                <Text style={styles.featureDescription}>
                  Track inventory with visual indicators
                </Text>
              </View>
            </View>
            <Text style={styles.featureSteps}>
              • View all products with color-coded status{'\n'}• Green = In
              Stock, Yellow = Low Stock, Red = Out{'\n'}• Use filters and search
              to find items{'\n'}• Sort by name, price, or stock quantity
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Text style={styles.featureIcon}>💰</Text>
              <View style={styles.featureTitle}>
                <Text style={styles.featureTitleText}>Record Sales</Text>
                <Text style={styles.featureDescription}>
                  Track sales and update inventory automatically
                </Text>
              </View>
            </View>
            <Text style={styles.featureSteps}>
              • Tap on any product to view details{'\n'}• Click "Record Sale"
              button{'\n'}• Enter quantity sold{'\n'}• Stock levels update
              automatically
            </Text>
          </View>
        </View>

        {/* Best Practices */}
        <View style={styles.bestPracticesSection}>
          <Text style={styles.sectionTitle}>✨ Best Practices</Text>

          <View style={styles.tipContainer}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              Set realistic minimum stock levels to avoid stockouts
            </Text>
          </View>

          <View style={styles.tipContainer}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              Use clear, descriptive product names and consistent SKU formats
            </Text>
          </View>

          <View style={styles.tipContainer}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              Upload high-quality product images for better identification
            </Text>
          </View>

          <View style={styles.tipContainer}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              Regularly review and update your inventory for accuracy
            </Text>
          </View>
        </View>

        {/* Stock Level Guidelines */}
        <View style={styles.guidelinesSection}>
          <Text style={styles.sectionTitle}>📏 Stock Status Guide</Text>

          <View style={styles.guidelineCard}>
            <View style={styles.guidelineHeader}>
              <View style={[styles.statusDot, styles.inStockDot]} />
              <Text style={styles.guidelineTitle}>In Stock</Text>
            </View>
            <Text style={styles.guidelineText}>
              Stock quantity is above minimum level. Products are readily
              available for sale.
            </Text>
          </View>

          <View style={styles.guidelineCard}>
            <View style={styles.guidelineHeader}>
              <View style={[styles.statusDot, styles.lowStockDot]} />
              <Text style={styles.guidelineTitle}>Low Stock</Text>
            </View>
            <Text style={styles.guidelineText}>
              Stock quantity has reached minimum level. Consider reordering
              soon.
            </Text>
          </View>

          <View style={styles.guidelineCard}>
            <View style={styles.guidelineHeader}>
              <View style={[styles.statusDot, styles.outOfStockDot]} />
              <Text style={styles.guidelineTitle}>Out of Stock</Text>
            </View>
            <Text style={styles.guidelineText}>
              No stock available. Product cannot be sold until restocked.
            </Text>
          </View>
        </View>

        {/* Getting Started */}
        <View style={styles.gettingStartedSection}>
          <Text style={styles.sectionTitle}>🎯 Getting Started</Text>
          <View style={styles.startStepsContainer}>
            <Text style={styles.startStep}>
              1. Add your first product using the "Add Item" button
            </Text>
            <Text style={styles.startStep}>
              2. Set up categories that match your business needs
            </Text>
            <Text style={styles.startStep}>
              3. Configure minimum stock levels for automated alerts
            </Text>
            <Text style={styles.startStep}>
              4. Start recording sales and monitoring inventory growth
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('Inventory')}
          >
            <Text style={styles.startButtonText}>Start Managing Inventory</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
  },
  overviewSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  overviewText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  featuresSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureTitle: {
    flex: 1,
  },
  featureTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  featureSteps: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginTop: 8,
  },
  bestPracticesSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  guidelinesSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  guidelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  guidelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  inStockDot: {
    backgroundColor: '#10B981',
  },
  lowStockDot: {
    backgroundColor: '#F59E0B',
  },
  outOfStockDot: {
    backgroundColor: '#EF4444',
  },
  guidelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  guidelineText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  gettingStartedSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  startStepsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  startStep: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 12,
  },
  actionSection: {
    marginHorizontal: 16,
    marginBottom: 32,
  },
  startButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default HowItWorksScreen;
