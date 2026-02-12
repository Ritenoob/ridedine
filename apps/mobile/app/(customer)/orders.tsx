import { View, Text, StyleSheet } from 'react-native';

export default function Orders() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Orders</Text>
      <Text>Order history will appear here</Text>
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
