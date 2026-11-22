import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Pantalla from '../components/Pantalla.js';
import Boton from '../components/Boton.js';
import Cargando from '../components/Cargando.js';
import ErrorMensaje from '../components/ErrorMensaje.js';
import EstadoVacio from '../components/EstadoVacio.js';
import EventoCard from '../components/EventoCard.js';
import { useSession } from '../context/SessionContext.js';
import { listarEventos as apiListarEventos } from '../api/eventos.js';
import theme from '../theme.js';

function EventoOrganizadorCard({ evento, onVerCompras, onVerDetalle }) {
  return (
    <View style={styles.card}>
      <EventoCard
        evento={evento}
        onPress={() => onVerDetalle(evento.id)}
      />
      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.verComprasButton}
          onPress={() => onVerCompras(evento.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.verComprasText}>Ver compras</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MisEventosScreen({ navigation }) {
  const { usuario, token } = useSession();

  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const cargarEventos = useCallback(() => {
    if (!token || !usuario) return;
    setLoading(true);
    setError(null);

    // Filtramos localmente los eventos del organizador. Esta es la única
    // excepción a la regla "el front no filtra", ya que el endpoint GET /eventos
    // no soporta filtrar por organizador.
    apiListarEventos({}, token)
      .then((lista) => {
        const misEventos = (lista || []).filter(
          (e) => e.organizador && e.organizador.id === usuario.id
        );
        setEventos(misEventos);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [token, usuario]);

  useFocusEffect(
    useCallback(() => {
      cargarEventos();
    }, [cargarEventos])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    cargarEventos();
  }, [cargarEventos]);

  const handleVerCompras = useCallback((eventoId) => {
    navigation.navigate('ComprasDelEvento', { eventoId });
  }, [navigation]);

  const handleVerDetalle = useCallback((eventoId) => {
    navigation.navigate('Detalle', { eventoId });
  }, [navigation]);

  const handleCrearEvento = useCallback(() => {
    navigation.navigate('CrearEvento');
  }, [navigation]);

  if (loading) {
    return (
      <Pantalla>
        <Cargando mensaje="Cargando tus eventos..." />
      </Pantalla>
    );
  }

  if (error && eventos.length === 0) {
    return (
      <Pantalla>
        <ErrorMensaje message={error} onPress={handleRefresh} />
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      {error && (
        <ErrorMensaje message={error} onPress={handleRefresh} />
      )}
      {eventos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EstadoVacio message="Todavía no creaste eventos" />
          <View style={styles.crearButton}>
            <Boton
              title="Crear evento"
              onPress={handleCrearEvento}
              variant="primary"
            />
          </View>
        </View>
      ) : (
        <>
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>Mis eventos</Text>
            <Boton
              title="Crear evento"
              onPress={handleCrearEvento}
              variant="primary"
            />
          </View>
          <FlatList
            data={eventos}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <EventoOrganizadorCard
                evento={item}
                onVerCompras={handleVerCompras}
                onVerDetalle={handleVerDetalle}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.colors.primario}
              />
            }
          />
        </>
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.espaciados.md,
    paddingVertical: theme.espaciados.sm,
  },
  headerTitle: {
    ...theme.texto.large,
    fontWeight: '700',
    color: theme.colors.texto,
  },
  listContent: {
    padding: theme.espaciados.md,
    gap: theme.espaciados.md,
  },
  card: {
    backgroundColor: theme.colors.fondo,
    borderRadius: theme.botones.radio,
    borderWidth: 1,
    borderColor: theme.colors.borde,
    overflow: 'hidden',
  },
  cardFooter: {
    padding: theme.espaciados.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borde,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.espaciados.xl,
  },
  crearButton: {
    marginTop: theme.espaciados.lg,
    width: '100%',
  },
  verComprasButton: {
    paddingVertical: theme.espaciados.sm,
    paddingHorizontal: theme.espaciados.md,
    borderRadius: theme.botones.radio,
    borderWidth: 1,
    borderColor: theme.colors.primario,
    alignSelf: 'center',
  },
  verComprasText: {
    ...theme.texto.medium,
    fontWeight: '600',
    color: theme.colors.primario,
  },
});

export default MisEventosScreen;
