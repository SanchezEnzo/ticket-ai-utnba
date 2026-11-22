import { View, TextInput, Text, StyleSheet } from 'react-native';
import theme from '../theme.js';

function CampoTexto({ label, value, onChangeText, placeholder, secureTextEntry, autoCapitalize = 'none', autoCorrect = false }) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        placeholderTextColor={theme.colors.textoSecundario}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.espaciados.md,
  },
  label: {
    marginBottom: theme.espaciados.xs,
    color: theme.colors.texto,
    ...theme.texto.medium,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borde,
    borderRadius: theme.botones.radio,
    padding: theme.espaciados.sm,
    color: theme.colors.texto,
    ...theme.texto.medium,
    minHeight: theme.botones.alturaMinima,
  },
});

export default CampoTexto;
