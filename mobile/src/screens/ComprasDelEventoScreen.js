import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import Pantalla from '../components/Pantalla.js';
import Boton from '../components/Boton.js';
import Cargando from '../components/Cargando.js';
import ErrorMensaje from '../components/ErrorMensaje.js';
import EstadoVacio from '../components/EstadoVacio.js';
import EstadoBadge from '../components/EstadoBadge.js';
import { useSession } from '../context/SessionContext.js';
import { listarComprasDelEvento as apiListarComprasDelEvento } from '../api/eventos.js';
import { marcarUtilizada as apiMarcarUtilizada } from '../api/compras.js';
import { formatearPrecio, formatearFechaHora } from '../utils/formato.js';
import theme from '../theme.js';

function EntradaDisponibleCard({ tipo }) {
  const porcentaje = tipo.cupo > 0 ? (tipo.cupoDisponible / tipo.cupo) * 100 : 0;

  return (
    <View style={styles.entradaCard}>
      <View style={styles.entradaHeader}>
        <Text style={styles.entradaNombre}>{tipo.nombre}</Text>
        <Text style={styles.entradaCupo}>
          {tipo.cupoDisponible} de {tipo.cupo} disponibles
        </Text>
      </View>
      <View style={styles.barraFondo}>
        <View style={[styles.barraProgreso, { width: `${porcentaje}%` }]} />
      </View>
    </View>
  );
}

function CompraCard({ compra, onMarcarUtilizada }) {
  return (
    <View style={styles.compraCard}>
      <View style={styles.compraHeader}>
        <View style={styles.compraInfo}>
          <Text style={styles.compradorNombre}>
            {compra.comprador?.nombre} {compra.comprador?.apellido || ''}
          </Text>
          <Text style={styles.compraDetalle}>
            {compra.tipoEntrada?.nombre} x {compra.cantidad}
          </Text>
        </View>
        <Text style={styles.compraTotal}>{formatearPrecio(compra.total)}</Text>
      </View>

      <View style={styles.compraMeta}>
        <EstadoBadge estado={compra.estado} />
        <Text style={styles.compraFecha}>{formatearFechaHora(compra.fecha)}</Text>
      </View>

      {compra.estado === 'CONFIRMADA' && (
        <View style={styles.marcarContainer}>
          <Boton
            title="Marcar como utilizada"
            onPress={() => onMarcarUtilizada(compra)}
            variant="secondary"
          />
        </View>
      )}
    </View>
  );
}

function ComprasDelEventoScreen({ navigation }) {
  const route = useRoute();
  const { eventoId } = route.params;
  const { token } = useSession();

  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [marcandoId, setMarcandoId] = useState(null);

  const cargarDatos = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);

    apiListarComprasDelEvento(eventoId, token)
      .then((resultado) => {
        setDatos(resultado);
      })
      .catch((err) => {
        // Si el organizador no tiene permiso, volver atrás
        if (err.status === 403) {
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
        setRefreshing(false);
      });
  }, [token, eventoId, navigation]);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [cargarDatos])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    cargarDatos();
  }, [cargarDatos]);

  const handleMarcarUtilizada = useCallback(
    (compra) => {
      Alert.alert(
        'Marcar entrada como utilizada',
        'Simula escanear la entrada. Esta acción no se puede deshacer.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            onPress: () => {
              setMarcandoId(compra.id);
              apiMarcarUtilizada(compra.id, token)
                .then(() => {
                  cargarDatos();
                })
                .catch((err) => {
                  setError(err.message);
                })
                .finally(() => {
                  setMarcandoId(null);
                });
            },
          },
        ]
      );
    },
    [token, cargarDatos]
  );

  if (loading) {
    return (
      <Pantalla>
        <Cargando mensaje="Cargando compras..." />
      </Pantalla>
    );
  }

  if (error && !datos) {
    return (
      <Pantalla>
        <ErrorMensaje message={error} onPress={handleRefresh} />
      </Pantalla>
    );
  }

  const { evento, entradasDisponibles, compras } = datos || {};

  return (
    <Pantalla>
      {error && (
        <ErrorMensaje message={error} onPress={handleRefresh} />
      )}
      <FlatList
        data={compras || []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            {/* Encabezado del evento */}
            <View style={styles.eventoHeader}>
              <Text style={styles.eventoNombre}>{evento?.nombre}</Text>
              <Text style={styles.eventoFecha}>
                {formatearFechaHora(evento?.fecha)}
              </Text>
            </View>

            {/* Entradas disponibles */}
            {entradasDisponibles && entradasDisponibles.length > 0 && (
              <View style={styles.seccion}>
                <Text style={styles.seccionTitulo}>Entradas disponibles</Text>
                {entradasDisponibles.map((tipo) => (
                  <EntradaDisponibleCard key={tipo.id} tipo={tipo} />
                ))}
              </View>
            )}

            {/* Título de compras */}
            <Text style={styles.seccionTitulo}>Compras</Text>
          </View>
        }
        ListEmptyComponent={
          <EstadoVacio message="Todavía no hay compras en este evento." />
        }
        renderItem={({ item }) => (
          <CompraCard
            compra={item}
            onMarcarUtilizada={handleMarcarUtilizada}
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
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: theme.espaciados.md,
    gap: theme.espaciados.sm,
  },
  eventoHeader: {
    marginBottom: theme.espaciados.md,
  },
  eventoNombre: {
    ...theme.texto.large,
    fontWeight: '700',
    color: theme.colors.texto,
  },
  eventoFecha: {
    ...theme.texto.small,
    color: theme.colors.textoSecundario,
    marginTop: 2,
  },
  seccion: {
    marginBottom: theme.espaciados.md,
  },
  seccionTitulo: {
    ...theme.texto.large,
    fontWeight: '700',
    color: theme.colors.texto,
    marginBottom: theme.espaciados.sm,
    marginTop: theme.espaciados.sm,
  },
  entradaCard: {
    backgroundColor: theme.colors.fondoSecundario,
    borderRadius: theme.botones.radio,
    padding: theme.espaciados.md,
    marginBottom: theme.espaciados.sm,
  },
  entradaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.espaciados.sm,
  },
  entradaNombre: {
    ...theme.texto.medium,
    fontWeight: '600',
    color: theme.colors.texto,
  },
  entradaCupo: {
    ...theme.texto.small,
    color: theme.colors.textoSecundario,
  },
  barraFondo: {
    height: 6,
    backgroundColor: theme.colors.borde,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barraProgreso: {
    height: 6,
    backgroundColor: theme.colors.primario,
    borderRadius: 3,
  },
  compraCard: {
    backgroundColor: theme.colors.fondo,
    borderRadius: theme.botones.radio,
    padding: theme.espaciados.md,
    borderWidth: 1,
    borderColor: theme.colors.borde,
  },
  compraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.espaciados.sm,
  },
  compraInfo: {
    flex: 1,
  },
  compradorNombre: {
    ...theme.texto.medium,
    fontWeight: '600',
    color: theme.colors.texto,
  },
  compraDetalle: {
    ...theme.texto.small,
    color: theme.colors.textoSecundario,
    marginTop: 2,
  },
  compraTotal: {
    ...theme.texto.medium,
    fontWeight: '700',
    color: theme.colors.primario,
  },
  compraMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.espaciados.sm,
    marginBottom: theme.espaciados.sm,
  },
  compraFecha: {
    ...theme.texto.small,
    color: theme.colors.textoSecundario,
  },
  marcarContainer: {
    marginTop: theme.espaciados.sm,
  },
});

export default ComprasDelEventoScreen;
