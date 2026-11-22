import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import Pantalla from '../components/Pantalla.js';
import CampoTexto from '../components/CampoTexto.js';
import Cargando from '../components/Cargando.js';
import ErrorMensaje from '../components/ErrorMensaje.js';
import EstadoVacio from '../components/EstadoVacio.js';
import EventoCard from '../components/EventoCard.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useSession } from '../context/SessionContext.js';
import { listarEventos as apiListarEventos } from '../api/eventos.js';
import { listarCategorias as apiListarCategorias } from '../api/eventos.js';
import theme from '../theme.js';

const OPCIONES_ORDEN = [
  { label: 'Fecha', value: 'fecha' },
  { label: 'Precio', value: 'precio' },
  { label: 'Puntaje', value: 'puntaje' },
];

function ExplorarScreen({ navigation }) {
  const { token } = useSession();

  const [busqueda, setBusqueda] = useState('');
  const busquedaDebounce = useDebounce(busqueda, 400);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [orden, setOrden] = useState('fecha');
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const requestIdRef = useRef(0);

  // Cargar categorías al montar
  useEffect(() => {
    if (!token) return;
    apiListarCategorias(token)
      .then((lista) => setCategorias(lista || []))
      .catch(() => setCategorias([]));
  }, [token]);

  // Cargar eventos cuando cambian los filtros
  useEffect(() => {
    if (!token) return;

    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    const filtros = { orden };
    if (busquedaDebounce && busquedaDebounce.trim() !== '') {
      filtros.q = busquedaDebounce.trim();
    }
    if (categoriaSeleccionada) {
      filtros.categoria = categoriaSeleccionada;
    }

    setLoading(true);
    setError(null);

    apiListarEventos(filtros, token)
      .then((resultado) => {
        if (currentRequestId === requestIdRef.current) {
          setEventos(resultado || []);
        }
      })
      .catch((err) => {
        if (currentRequestId === requestIdRef.current) {
          setError(err.message);
          setEventos([]);
        }
      })
      .finally(() => {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      });
  }, [token, busquedaDebounce, categoriaSeleccionada, orden]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    const filtros = { orden };
    if (busqueda && busqueda.trim() !== '') {
      filtros.q = busqueda.trim();
    }
    if (categoriaSeleccionada) {
      filtros.categoria = categoriaSeleccionada;
    }

    try {
      const resultado = await apiListarEventos(filtros, token);
      if (currentRequestId === requestIdRef.current) {
        setEventos(resultado || []);
        setError(null);
      }
    } catch (err) {
      if (currentRequestId === requestIdRef.current) {
        setError(err.message);
        setEventos([]);
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setRefreshing(false);
      }
    }
  }, [token, busqueda, categoriaSeleccionada, orden]);

  const handleEventoPress = (evento) => {
    navigation.navigate('Detalle', { eventoId: evento.id });
  };

  const renderItem = ({ item }) => (
    <EventoCard evento={item} onPress={() => handleEventoPress(item)} />
  );

  if (loading) {
    return (
      <Pantalla>
        <Cargando mensaje="Buscando eventos..." />
      </Pantalla>
    );
  }

  if (error) {
    return (
      <Pantalla>
        <ErrorMensaje message={error} onPress={handleRefresh} />
      </Pantalla>
    );
  }

  return (
    <Pantalla style={{ padding: 0 }}>
      <View style={styles.filtersContainer}>
        <CampoTexto
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar eventos..."
          autoCapitalize="sentences"
          autoCorrect
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriasScroll}>
          <TouchableOpacity
            style={[
              styles.chip,
              !categoriaSeleccionada && styles.chipActive,
            ]}
            onPress={() => setCategoriaSeleccionada(null)}
          >
            <Text style={[
              styles.chipText,
              !categoriaSeleccionada && styles.chipTextActive,
            ]}>Todas</Text>
          </TouchableOpacity>
          {categorias.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.chip,
                categoriaSeleccionada === cat.id && styles.chipActive,
              ]}
              onPress={() => setCategoriaSeleccionada(cat.id)}
            >
              <Text style={[
                styles.chipText,
                categoriaSeleccionada === cat.id && styles.chipTextActive,
              ]}>{cat.nombre}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.ordenRow}>
          <Text style={styles.ordenLabel}>Ordenar:</Text>
          {OPCIONES_ORDEN.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.ordenChip,
                orden === opt.value && styles.ordenChipActive,
              ]}
              onPress={() => setOrden(opt.value)}
            >
              <Text style={[
                styles.ordenChipText,
                orden === opt.value && styles.ordenChipTextActive,
              ]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {eventos.length === 0 && !loading ? (
        <EstadoVacio
          icon="search-outline"
          message="No encontramos eventos con esa búsqueda"
        />
      ) : (
        <FlatList
          data={eventos}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  filtersContainer: {
    padding: theme.espaciados.md,
    paddingBottom: theme.espaciados.sm,
  },
  categoriasScroll: {
    marginTop: theme.espaciados.xs,
    marginBottom: theme.espaciados.sm,
  },
  chip: {
    paddingHorizontal: theme.espaciados.md,
    paddingVertical: theme.espaciados.sm,
    borderRadius: 20,
    backgroundColor: theme.colors.fondoSecundario,
    marginRight: theme.espaciados.sm,
  },
  chipActive: {
    backgroundColor: theme.colors.primario,
  },
  chipText: {
    ...theme.texto.small,
    color: theme.colors.texto,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  ordenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.espaciados.sm,
  },
  ordenLabel: {
    ...theme.texto.small,
    color: theme.colors.textoSecundario,
    fontWeight: '500',
  },
  ordenChip: {
    paddingHorizontal: theme.espaciados.sm,
    paddingVertical: theme.espaciados.xs,
    borderRadius: theme.botones.radio,
    backgroundColor: theme.colors.fondoSecundario,
  },
  ordenChipActive: {
    backgroundColor: theme.colors.primario,
  },
  ordenChipText: {
    ...theme.texto.small,
    color: theme.colors.texto,
    fontWeight: '500',
  },
  ordenChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: theme.espaciados.md,
  },
});

export default ExplorarScreen;
