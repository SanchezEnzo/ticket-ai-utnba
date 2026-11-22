import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import Pantalla from '../components/Pantalla.js';
import Cargando from '../components/Cargando.js';
import ErrorMensaje from '../components/ErrorMensaje.js';
import EstadoVacio from '../components/EstadoVacio.js';
import { useSession } from '../context/SessionContext.js';
import { listarMensajes as apiListarMensajes, enviarMensaje as apiEnviarMensaje } from '../api/mensajes.js';
import { usePolling } from '../hooks/usePolling.js';
import { formatearFechaHora } from '../utils/formato.js';
import theme from '../theme.js';

const MAX_CARACTERES = 1000;

function BurbujaMensaje({ mensaje, esPropio }) {
  const autorNombre = mensaje.autor?.nombre || '';
  const hora = formatearFechaHora(mensaje.fechaHora);

  return (
    <View style={[styles.burbujaContainer, esPropio && styles.burbujaPropia]}>
      <View style={[styles.burbuja, esPropio ? styles.burbujaPropiaBg : styles.burbujaOtroBg]}>
        <Text style={[styles.autorNombre, esPropio && styles.autorNombrePropio]}>
          {autorNombre}
        </Text>
        <Text style={[styles.mensajeTexto, esPropio && styles.mensajeTextoPropio]}>
          {mensaje.texto}
        </Text>
        <Text style={[styles.hora, esPropio && styles.horaPropio]}>
          {hora}
        </Text>
      </View>
    </View>
  );
}

function ChatScreen({ navigation }) {
  const route = useRoute();
  const { compraId, titulo } = route.params;
  const { token, usuario } = useSession();

  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [ultimoFechaHora, setUltimoFechaHora] = useState(null);
  const [pollingError, setPollingError] = useState(null);

  const flatListRef = useRef(null);
  const [listReady, setListReady] = useState(false);

  // Cargar mensajes iniciales
  const cargarMensajes = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);

    apiListarMensajes(compraId, {}, token)
      .then((lista) => {
        setMensajes(lista || []);
        if (lista && lista.length > 0) {
          setUltimoFechaHora(lista[lista.length - 1].fechaHora);
        }
      })
      .catch((err) => {
        if (err.status === 403 || err.status === 404) {
          setError(err.message);
          setTimeout(() => {
            navigation.goBack();
          }, 2000);
        } else {
          setError(err.message);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, compraId, navigation]);

  // Controlar polling con foco
  useFocusEffect(
    useCallback(() => {
      cargarMensajes();
    }, [cargarMensajes])
  );

  // Polling cada 60 segundos
  const pollMensajes = useCallback(async () => {
    if (!token || !ultimoFechaHora) return;
    try {
      const nuevos = await apiListarMensajes(compraId, { desde: ultimoFechaHora }, token);
      if (nuevos && nuevos.length > 0) {
        setMensajes((prev) => {
          const idsExistentes = new Set(prev.map((m) => m.id));
          const deduplicados = nuevos.filter((m) => !idsExistentes.has(m.id));
          if (deduplicados.length === 0) return prev;
          const combinados = [...prev, ...deduplicados];
          setUltimoFechaHora(combinados[combinados.length - 1].fechaHora);
          return combinados;
        });
        setPollingError(null);
      }
    } catch {
      setPollingError('No se pudo actualizar');
    }
  }, [token, compraId, ultimoFechaHora]);

  usePolling(pollMensajes, 60000, { activo: true });

  // Scroll al final cuando la lista está lista o cuando cambian los mensajes
  useEffect(() => {
    if (listReady && mensajes.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [mensajes.length, listReady]);

  const handleEnviar = useCallback(() => {
    const textoTrim = texto.trim();
    if (!textoTrim || enviando) return;

    setEnviando(true);
    apiEnviarMensaje(compraId, textoTrim, token)
      .then((mensajeEnviado) => {
        // Agregar el mensaje enviado de inmediato
        setMensajes((prev) => [...prev, mensajeEnviado]);
        setUltimoFechaHora(mensajeEnviado.fechaHora);
        setTexto('');
      })
      .catch((err) => {
        // Conservar el texto si falla
        setError(err.message);
      })
      .finally(() => {
        setEnviando(false);
      });
  }, [texto, enviando, compraId, token]);

  const handleReintentar = useCallback(() => {
    cargarMensajes();
  }, [cargarMensajes]);

  const keyExtractor = (item) => item.id;

  const renderItem = ({ item }) => {
    const esPropio = item.autor?.id === usuario?.id;
    return <BurbujaMensaje mensaje={item} esPropio={esPropio} />;
  };

  if (loading) {
    return (
      <Pantalla>
        <Cargando mensaje="Cargando mensajes..." />
      </Pantalla>
    );
  }

  if (error && mensajes.length === 0) {
    return (
      <Pantalla>
        <ErrorMensaje message={error} onPress={handleReintentar} />
      </Pantalla>
    );
  }

  return (
    <Pantalla style={styles.pantallaSinPadding}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 140}
      >
        {error && mensajes.length > 0 && (
          <ErrorMensaje message={error} onPress={handleReintentar} />
        )}

        {pollingError && (
          <View style={styles.pollingErrorContainer}>
            <Text style={styles.pollingErrorText}>{pollingError}</Text>
          </View>
        )}

        {mensajes.length === 0 ? (
          <EstadoVacio
            icon="chatbubble-outline"
            message="No hay mensajes todavía. ¡Envía el primero!"
          />
        ) : (
          <FlatList
            ref={flatListRef}
            data={mensajes}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            onLayout={() => setListReady(true)}
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escribí un mensaje..."
            value={texto}
            onChangeText={setTexto}
            multiline
            numberOfLines={1}
            maxLength={MAX_CARACTERES}
            placeholderTextColor={theme.colors.textoSecundario}
          />
          <View style={styles.inputMeta}>
            <Text style={styles.contador}>{texto.length}/{MAX_CARACTERES}</Text>
            <TouchableOpacity
              style={[styles.enviarBoton, (!texto.trim() || enviando) && styles.enviarBotonDeshabilitado]}
              onPress={handleEnviar}
              disabled={!texto.trim() || enviando}
              activeOpacity={0.7}
              accessibilityLabel="Enviar mensaje"
            >
              <Ionicons
                name="send"
                size={20}
                color={(!texto.trim() || enviando) ? theme.colors.borde : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  pantallaSinPadding: {
    padding: 0,
  },
  keyboardContainer: {
    flex: 1,
  },
  listContent: {
    padding: theme.espaciados.md,
    gap: theme.espaciados.sm,
  },
  burbujaContainer: {
    maxWidth: '80%',
  },
  burbujaPropia: {
    alignSelf: 'flex-end',
  },
  burbuja: {
    padding: theme.espaciados.sm,
    borderRadius: theme.botones.radio,
  },
  burbujaPropiaBg: {
    backgroundColor: theme.colors.primario,
    borderBottomRightRadius: 2,
  },
  burbujaOtroBg: {
    backgroundColor: theme.colors.fondoSecundario,
    borderBottomLeftRadius: 2,
  },
  autorNombre: {
    ...theme.texto.small,
    fontWeight: '600',
    color: theme.colors.texto,
    marginBottom: 2,
  },
  autorNombrePropio: {
    color: '#FFFFFF',
  },
  mensajeTexto: {
    ...theme.texto.medium,
    color: theme.colors.texto,
  },
  mensajeTextoPropio: {
    color: '#FFFFFF',
  },
  hora: {
    ...theme.texto.small,
    color: theme.colors.textoSecundario,
    marginTop: 4,
    textAlign: 'right',
  },
  horaPropio: {
    color: '#FFFFFFCC',
  },
  inputContainer: {
    padding: theme.espaciados.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borde,
    backgroundColor: theme.colors.fondo,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borde,
    borderRadius: theme.botones.radio,
    padding: theme.espaciados.sm,
    ...theme.texto.medium,
    color: theme.colors.texto,
    maxHeight: 100,
  },
  inputMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.espaciados.xs,
  },
  contador: {
    ...theme.texto.small,
    color: theme.colors.textoSecundario,
  },
  enviarBoton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primario,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enviarBotonDeshabilitado: {
    backgroundColor: theme.colors.borde,
  },
  pollingErrorContainer: {
    paddingVertical: theme.espaciados.xs,
    paddingHorizontal: theme.espaciados.md,
    backgroundColor: theme.colors.avisoFondo,
    alignItems: 'center',
  },
  pollingErrorText: {
    ...theme.texto.small,
    color: theme.colors.avisoTexto,
  },
});

export default ChatScreen;
