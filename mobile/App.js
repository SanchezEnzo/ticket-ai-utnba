import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { isConfigured } from './src/config.js';
import { SessionProvider } from './src/context/SessionContext.js';
import AppNavigator from './src/navigation/AppNavigator.js';
import useNavigationWithAuth from './src/hooks/useNavigationWithAuth.js';
import theme from './src/theme.js';

function ConfigErrorScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuración incompleta</Text>
      <Text style={styles.message}>
        No se encontró la variable de entorno {'\n'}
        <Text style={styles.code}>EXPO_PUBLIC_API_URL</Text>.
        {'\n\n'}
        Copiá el archivo .env.example a .env y configurá la IP de tu backend.
        {'\n\n'}
        Reiniciá Expo después de cambiar el archivo.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.espaciados.lg,
    backgroundColor: theme.colors.fondo,
  },
  title: {
    ...theme.texto.xlarge,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginBottom: theme.espaciados.md,
  },
  message: {
    ...theme.texto.medium,
    color: theme.colors.texto,
    textAlign: 'center',
    lineHeight: 24,
  },
  code: {
    fontFamily: 'monospace',
    fontWeight: '600',
  },
});

function AppContent() {
  useNavigationWithAuth();

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  if (!isConfigured()) {
    return <ConfigErrorScreen />;
  }

  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
}
