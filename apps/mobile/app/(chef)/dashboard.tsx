import { View, Text, StyleSheet } from 'react-native';

export default function ChefDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chef Dashboard</Text>
      <Text>Order stats and analytics will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
