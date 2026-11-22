import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import theme from '../theme.js';

function ErrorMensaje({ message, onPress }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
      {onPress && (
        <TouchableOpacity style={styles.button} onPress={onPress}>
          <Text style={styles.buttonText}>Reintentar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.espaciados.md,
    backgroundColor: theme.colors.error + '15',
    borderRadius: theme.botones.radio,
    borderWidth: 1,
    borderColor: theme.colors.error + '40',
  },
  text: {
    color: theme.colors.error,
    ...theme.texto.medium,
    marginBottom: theme.espaciados.sm,
  },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.espaciados.md,
    paddingVertical: theme.espaciados.sm,
    backgroundColor: theme.colors.error,
    borderRadius: theme.botones.radio,
  },
  buttonText: {
    color: '#FFFFFF',
    ...theme.texto.medium,
    fontWeight: '600',
  },
});

export default ErrorMensaje;
