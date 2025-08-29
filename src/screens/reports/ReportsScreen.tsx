import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const ReportCard = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <TouchableOpacity style={styles.reportCard}>
    <Text style={styles.reportTitle}>{title}</Text>
    <Text style={styles.reportDescription}>{description}</Text>
  </TouchableOpacity>
);

const ReportsScreen = () => {
  const reportTypes = [
    {
      title: 'Inventory Summary',
      description: 'Overview of total items, stock levels, and valuation',
    },
    {
      title: 'Low Stock Report',
      description: 'Items that need to be restocked',
    },
    {
      title: 'Top Selling Items',
      description: 'Most frequently moved inventory items',
    },
    {
      title: 'Stock Movement History',
      description: 'Detailed transaction history and stock changes',
    },
    {
      title: 'Supplier Performance',
      description: 'Analysis of supplier reliability and pricing',
    },
    {
      title: 'Cost Analysis',
      description: 'Profit margins and cost breakdowns',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports & Analytics</Text>
        <Text style={styles.subtitle}>
          Generate insights from your inventory data
        </Text>
      </View>

      <View style={styles.content}>
        {reportTypes.map((report, index) => (
          <ReportCard
            key={index}
            title={report.title}
            description={report.description}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    padding: 16,
  },
  reportCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  reportDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default ReportsScreen;
