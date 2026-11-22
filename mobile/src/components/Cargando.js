import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import theme from '../theme.js';

function Cargando({ message = 'Cargando...' }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primario} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.espaciados.lg,
  },
  text: {
    marginTop: theme.espaciados.md,
    color: theme.colors.textoSecundario,
    ...theme.texto.medium,
  },
});

export default Cargando;
