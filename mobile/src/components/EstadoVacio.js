import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme.js';

function EstadoVacio({ icon = 'document-outline', message = 'No hay resultados' }) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color={theme.colors.textoSecundario} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.espaciados.xl,
  },
  text: {
    marginTop: theme.espaciados.md,
    color: theme.colors.textoSecundario,
    ...theme.texto.medium,
    textAlign: 'center',
  },
});

export default EstadoVacio;
