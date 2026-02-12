import { View, Text, StyleSheet } from 'react-native';

export default function ChefOrders() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Incoming Orders</Text>
      <Text>Orders will appear here</Text>
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
