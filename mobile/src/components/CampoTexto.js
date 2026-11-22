import { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import theme from '../theme.js';

function CampoTexto({ label, value, onChangeText, placeholder, secureTextEntry, showPasswordToggle, autoCapitalize = 'none', autoCorrect = false }) {
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry && !showPassword}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          placeholderTextColor={theme.colors.textoSecundario}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            onPress={handleTogglePassword}
            style={styles.eyeIcon}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        )}
      </View>
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borde,
    borderRadius: theme.botones.radio,
    minHeight: theme.botones.alturaMinima,
  },
  input: {
    flex: 1,
    padding: theme.espaciados.sm,
    color: theme.colors.texto,
    ...theme.texto.medium,
  },
  eyeIcon: {
    padding: theme.espaciados.sm,
    marginRight: theme.espaciados.xs,
  },
  eyeText: {
    fontSize: 20,
  },
});

export default CampoTexto;
