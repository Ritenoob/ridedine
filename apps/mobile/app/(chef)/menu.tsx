import { View, Text, StyleSheet } from 'react-native';

export default function ChefMenu() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu Management</Text>
      <Text>Create and manage your menu items here</Text>
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
