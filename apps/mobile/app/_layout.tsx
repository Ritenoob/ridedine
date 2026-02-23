import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CartProvider } from '@/lib/context/CartContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <CartProvider>
        <Slot />
      </CartProvider>
    </SafeAreaProvider>
  );
}
