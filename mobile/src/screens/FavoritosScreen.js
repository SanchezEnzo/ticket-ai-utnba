import { Text, StyleSheet } from 'react-native';
import Pantalla from '../components/Pantalla.js';
import theme from '../theme.js';

function FavoritosScreen() {
  return (
    <Pantalla>
      <Text style={styles.text}>Próximamente</Text>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  text: {
    ...theme.texto.large,
    color: theme.colors.textoSecundario,
    textAlign: 'center',
    marginTop: '40%',
  },
});

export default FavoritosScreen;
