import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../theme.js';

function Pantalla({ children, style, contentContainerStyle }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={[styles.content, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.fondo,
  },
  content: {
    flex: 1,
    padding: theme.espaciados.md,
  },
});

export default Pantalla;
