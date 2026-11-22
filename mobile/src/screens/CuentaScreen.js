import { View, Text, StyleSheet } from 'react-native';
import Pantalla from '../components/Pantalla.js';
import Boton from '../components/Boton.js';
import { useSession } from '../context/SessionContext.js';
import theme from '../theme.js';

function CuentaScreen() {
  const { usuario, logout } = useSession();

  if (!usuario) {
    return null;
  }

  return (
    <Pantalla>
      <View style={styles.container}>
        <Text style={styles.title}>Mi Cuenta</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Nombre</Text>
          <Text style={styles.value}>{usuario.nombre} {usuario.apellido}</Text>

          <View style={styles.divider} />

          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{usuario.email}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Boton
            title="Cerrar sesión"
            onPress={logout}
            variant="secondary"
          />
        </View>
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    ...theme.texto.xlarge,
    fontWeight: 'bold',
    color: theme.colors.texto,
    marginBottom: theme.espaciados.lg,
  },
  card: {
    backgroundColor: theme.colors.fondoSecundario,
    borderRadius: theme.botones.radio,
    padding: theme.espaciados.md,
    marginBottom: theme.espaciados.xl,
  },
  label: {
    ...theme.texto.small,
    color: theme.colors.textoSecundario,
    marginTop: theme.espaciados.sm,
  },
  value: {
    ...theme.texto.medium,
    color: theme.colors.texto,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borde,
    marginVertical: theme.espaciados.sm,
  },
  buttonContainer: {
    marginTop: 'auto',
    marginBottom: theme.espaciados.md,
  },
});

export default CuentaScreen;
