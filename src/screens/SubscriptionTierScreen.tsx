// src/screens/SubscriptionTierScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useUser } from '../context/UserContext';
import { BASE_URL } from "../config/api";

type FeatureConfig = {
  featureConfigId: number;
  userType: string;
  feature: string;
  description: string;
  usageLimit?: number | null;
  status: string;
  displayOrder: number;
};

export default function SubscriptionTierScreen() {
  const { user } = useUser();
  const [freeFeatures, setFreeFeatures] = useState<FeatureConfig[]>([]);
  const [premiumFeatures, setPremiumFeatures] = useState<FeatureConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const currentPlan = user?.premium === 'P' ? 'PREMIUM' : 'FREE';

  useEffect(() => {
    if (!user) return;

    const fetchFeatures = async () => {
      try {
        // Fetch FREE plan features
        const freeRes = await fetch(`${BASE_URL}/api/features?userType=FREE`);
        const freeData: FeatureConfig[] = await freeRes.json();
        setFreeFeatures(freeData);

        // Fetch PREMIUM plan features
        const premiumRes = await fetch(`${BASE_URL}/api/features?userType=PREMIUM`);
        const premiumData: FeatureConfig[] = await premiumRes.json();
        setPremiumFeatures(premiumData);
      } catch (error) {
        console.error("Error fetching features:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, [user]);

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>No user detected. Please log in again.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Subscription Tier</Text>
      <Text style={styles.subtitle}>
        Your Current Plan:{' '}
        <Text style={styles.highlight}>
          {currentPlan === 'PREMIUM' ? 'Premium' : 'Free'}
        </Text>
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0B1F34" />
      ) : (
        <View style={styles.cardContainer}>
          {/* Free Plan Card */}
          <View
            style={[
              styles.card,
              currentPlan === 'FREE' && styles.activeCard,
            ]}
          >
            <Text style={styles.cardTitle}>FREE</Text>
            <Text style={styles.cardDesc}>Basic features at no cost.</Text>
            {freeFeatures.map(f => (
              <Text key={f.featureConfigId} style={styles.cardBenefit}>
                ✔ {f.description}
                {f.usageLimit ? ` (Limit: ${f.usageLimit})` : ''}
              </Text>
            ))}
          </View>

          {/* Premium Plan Card */}
          <View
            style={[
              styles.card,
              currentPlan === 'PREMIUM' && styles.activeCard,
            ]}
          >
            <Text style={styles.cardTitle}>PREMIUM</Text>
            <Text style={styles.cardDesc}>Unlock all advanced features.</Text>
            {premiumFeatures.map(f => (
              <Text key={f.featureConfigId} style={styles.cardBenefit}>
                ✔ {f.description}
                {f.usageLimit ? ` (Limit: ${f.usageLimit})` : ''}
              </Text>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#0B1F34',
  },
  cardContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 16,
    backgroundColor: '#fafafa',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  activeCard: {
    borderColor: '#0B1F34',
    backgroundColor: '#e6f0ff',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 14,
    marginBottom: 8,
  },
  cardBenefit: {
    fontSize: 14,
    marginVertical: 2,
  },
  error: {
    color: 'red',
    fontSize: 16,
  },
});
