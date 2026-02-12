import { View, Text, StyleSheet } from 'react-native';

export default function DriverJobs() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Jobs</Text>
      <Text>Delivery jobs will appear here (Phase 2)</Text>
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
