import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import Pantalla from '../components/Pantalla.js';
import Boton from '../components/Boton.js';
import Cargando from '../components/Cargando.js';
import ErrorMensaje from '../components/ErrorMensaje.js';
import { useSession } from '../context/SessionContext.js';
import { crearResenia as apiCrearResenia } from '../api/eventos.js';
import theme from '../theme.js';

const PUNTAJE_MIN = 1;
const PUNTAJE_MAX = 5;
const PUNTAJE_PASO = 0.5;
const MAX_CARACTERES = 1000;

function ResenaScreen({ navigation }) {
  const route = useRoute();
  const { eventoId, titulo } = route.params;
  const { token } = useSession();

  const [puntaje, setPuntaje] = useState(3);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const handlePuntajeMas = useCallback(() => {
    setPuntaje((prev) => {
      const next = prev + PUNTAJE_PASO;
      return next <= PUNTAJE_MAX ? next : prev;
    });
  }, []);

  const handlePuntajeMenos = useCallback(() => {
    setPuntaje((prev) => {
      const next = prev - PUNTAJE_PASO;
      return next >= PUNTAJE_MIN ? next : prev;
    });
  }, []);

  const handleEnviar = useCallback(() => {
    if (!comentario.trim()) return;

    setEnviando(true);
    setError(null);

    apiCrearResenia(eventoId, { puntaje, comentario: comentario.trim() }, token)
      .then(() => {
        Alert.alert('¡Gracias!', 'Tu reseña se envió correctamente.', [
          {
            text: 'Aceptar',
            onPress: () => navigation.goBack(),
          },
        ]);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setEnviando(false);
      });
  }, [eventoId, puntaje, comentario, token, navigation]);

  if (enviando) {
    return (
      <Pantalla>
        <Cargando mensaje="Enviando reseña..." />
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={0}
      >
        <Text style={styles.tituloEvento}>{titulo}</Text>

        {/* Selector de puntaje */}
        <Text style={styles.label}>Puntaje</Text>
        <View style={styles.puntajeRow}>
          <TouchableOpacity
            style={[styles.puntajeBoton, puntaje <= PUNTAJE_MIN && styles.puntajeBotonDeshabilitado]}
            onPress={handlePuntajeMenos}
            disabled={puntaje <= PUNTAJE_MIN}
            activeOpacity={0.7}
            accessibilityLabel="Reducir puntaje"
          >
            <Text style={styles.puntajeBotonText}>−</Text>
          </TouchableOpacity>

          <Text style={styles.puntajeValor}>★ {puntaje.toFixed(1)}</Text>

          <TouchableOpacity
            style={[styles.puntajeBoton, puntaje >= PUNTAJE_MAX && styles.puntajeBotonDeshabilitado]}
            onPress={handlePuntajeMas}
            disabled={puntaje >= PUNTAJE_MAX}
            activeOpacity={0.7}
            accessibilityLabel="Aumentar puntaje"
          >
            <Text style={styles.puntajeBotonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Comentario */}
        <Text style={styles.label}>Comentario</Text>
        <TextInput
          style={styles.input}
          placeholder="Contá tu experiencia..."
          value={comentario}
          onChangeText={setComentario}
          multiline
          numberOfLines={5}
          maxLength={MAX_CARACTERES}
          placeholderTextColor={theme.colors.textoSecundario}
        />
        <View style={styles.inputMeta}>
          <Text style={styles.contador}>{comentario.length}/{MAX_CARACTERES}</Text>
        </View>

        {/* Error */}
        {error && (
          <ErrorMensaje message={error} onPress={() => setError(null)} />
        )}

        {/* Botón enviar */}
        <Boton
          title="Enviar"
          onPress={handleEnviar}
          variant="primary"
          disabled={!comentario.trim() || enviando}
          loading={enviando}
        />
      </KeyboardAvoidingView>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  tituloEvento: {
    ...theme.texto.large,
    fontWeight: '700',
    color: theme.colors.texto,
    marginBottom: theme.espaciados.md,
  },
  label: {
    ...theme.texto.medium,
    fontWeight: '600',
    color: theme.colors.texto,
    marginBottom: theme.espaciados.xs,
  },
  puntajeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.espaciados.md,
    marginBottom: theme.espaciados.md,
  },
  puntajeBoton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puntajeBotonDeshabilitado: {
    opacity: 0.4,
  },
  puntajeBotonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  puntajeValor: {
    ...theme.texto.large,
    fontWeight: '700',
    color: theme.colors.primario,
    minWidth: 60,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borde,
    borderRadius: theme.botones.radio,
    padding: theme.espaciados.sm,
    ...theme.texto.medium,
    color: theme.colors.texto,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: theme.espaciados.xs,
  },
  inputMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: theme.espaciados.md,
  },
  contador: {
    ...theme.texto.small,
    color: theme.colors.textoSecundario,
  },
});

export default ResenaScreen;
