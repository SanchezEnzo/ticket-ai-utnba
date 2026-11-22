import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import Pantalla from '../components/Pantalla.js';
import Boton from '../components/Boton.js';
import CampoTexto from '../components/CampoTexto.js';
import { useSession } from '../context/SessionContext.js';
import theme from '../theme.js';

function LoginScreen() {
  const { login, avisoSesion } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Completá el email y la contraseña.');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <Pantalla>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.title}>AI Ticket It</Text>
          <Text style={styles.subtitle}>Iniciá sesión para continuar</Text>
        </View>

        {avisoSesion && (
          <View style={styles.avisoContainer}>
            <Text style={styles.avisoText}>{avisoSesion}</Text>
          </View>
        )}

        <CampoTexto
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@email.com"
        />

        <CampoTexto
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          showPasswordToggle
        />

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Boton
            title="Ingresar"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: theme.espaciados.xl,
    marginTop: theme.espaciados.xl,
  },
  title: {
    ...theme.texto.xlarge,
    fontWeight: 'bold',
    color: theme.colors.primario,
    marginBottom: theme.espaciados.xs,
  },
  subtitle: {
    ...theme.texto.medium,
    color: theme.colors.textoSecundario,
  },
  avisoContainer: {
    padding: theme.espaciados.md,
    backgroundColor: theme.colors.avisoFondo,
    borderRadius: theme.botones.radio,
    marginBottom: theme.espaciados.md,
    borderWidth: 1,
    borderColor: theme.colors.avisoTexto + '40',
  },
  avisoText: {
    color: theme.colors.avisoTexto,
    ...theme.texto.medium,
  },
  errorContainer: {
    marginBottom: theme.espaciados.md,
  },
  errorText: {
    color: theme.colors.error,
    ...theme.texto.medium,
  },
  buttonContainer: {
    marginTop: theme.espaciados.lg,
  },
});

export default LoginScreen;
