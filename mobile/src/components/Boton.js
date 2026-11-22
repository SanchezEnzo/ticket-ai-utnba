import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import theme from '../theme.js';

function Boton({ title, onPress, loading, disabled, variant = 'primary', compact }) {
  const isDisabled = disabled || loading;

  let colorFondo;
  if (variant === 'primary') {
    colorFondo = theme.colors.primario;
  } else if (variant === 'secondary') {
    colorFondo = theme.colors.textoSecundario;
  } else {
    colorFondo = theme.colors.error;
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        compact && styles.compact,
        { backgroundColor: colorFondo },
        isDisabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: theme.botones.alturaMinima,
    borderRadius: theme.botones.radio,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  compact: {
    width: 'auto',
    paddingHorizontal: theme.espaciados.md,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#FFFFFF',
    ...theme.texto.medium,
    fontWeight: '600',
  },
});

export default Boton;
