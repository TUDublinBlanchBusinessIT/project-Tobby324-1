import { View, Text, StyleSheet } from 'react-native';

export default function AddItemScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Add Item Screen</Text>
      <Text style={styles.subtext}>This page will be built next</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
  },
});
