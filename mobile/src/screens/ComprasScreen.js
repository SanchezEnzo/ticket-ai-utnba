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
import EstadoBadge from '../components/EstadoBadge.js';
import { useSession } from '../context/SessionContext.js';
import { listarMisCompras as apiListarMisCompras } from '../api/compras.js';
import { pagarCompra as apiPagarCompra } from '../api/compras.js';
import { formatearPrecio, formatearFechaHora, textoDias } from '../utils/formato.js';
import theme from '../theme.js';

function CompraCard({ compra, onPagar }) {
  const [historialVisible, setHistorialVisible] = useState(false);

  return (
    <View style={styles.card}>
      {/* Header: evento y fecha */}
      <Text style={styles.eventoNombre}>{compra.evento?.nombre}</Text>
      <Text style={styles.eventoFecha}>
        {formatearFechaHora(compra.evento?.fecha)}
      </Text>

      {/* Tipo y cantidad */}
      <View style={styles.row}>
        <Text style={styles.detalleText}>
          {compra.tipoEntrada?.nombre} x {compra.cantidad}
        </Text>
        <Text style={styles.totalText}>{formatearPrecio(compra.total)}</Text>
      </View>

      {/* Estado */}
      <View style={styles.estadoRow}>
        <EstadoBadge estado={compra.estado} />
        {compra.estado === 'CONFIRMADA' && compra.diasParaEvento !== null && (
          <Text style={styles.diasText}>
            {textoDias(compra.diasParaEvento)}
          </Text>
        )}
      </View>

      {/* Botón Pagar para PENDIENTE */}
      {compra.estado === 'PENDIENTE' && (
        <View style={styles.pagarContainer}>
          <Boton title="Pagar" onPress={() => onPagar(compra)} variant="primary" />
        </View>
      )}

      {/* Historial expandible */}
      {compra.historial && compra.historial.length > 0 && (
        <View style={styles.historialContainer}>
          <TouchableOpacity
            style={styles.historialToggle}
            onPress={() => setHistorialVisible((v) => !v)}
          >
            <Text style={styles.historialToggleText}>
              {historialVisible ? 'Ocultar historial' : 'Ver historial'}
            </Text>
          </TouchableOpacity>

          {historialVisible && (
            <View style={styles.historialLista}>
              {compra.historial.map((entry, index) => {
                const autorNombre = entry.quien
                  ? `${entry.quien.nombre} ${entry.quien.apellido || ''}`.trim()
                  : 'Sistema';
                const esSistema = entry.quien?.id === 'sistema' || !entry.quien;

                return (
                  <View key={index} style={styles.historialItem}>
                    <EstadoBadge estado={entry.estado} />
                    <View style={styles.historialInfo}>
                      <Text style={styles.historialAutor}>
                        {esSistema ? 'Sistema' : autorNombre}
                      </Text>
                      <Text style={styles.historialFecha}>
                        {formatearFechaHora(entry.fechaHora)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function ComprasScreen({ navigation }) {
  const { token } = useSession();

  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pagandoId, setPagandoId] = useState(null);

  const cargarCompras = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);

    apiListarMisCompras(token)
      .then((lista) => {
        setCompras(lista || []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      cargarCompras();
    }, [cargarCompras])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    cargarCompras();
  }, [cargarCompras]);

  const handlePagar = useCallback(
    (compra) => {
      setPagandoId(compra.id);
      apiPagarCompra(compra.id, token)
        .then(() => {
          // Recargar la lista para ver el estado actualizado
          cargarCompras();
        })
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => {
          setPagandoId(null);
        });
    },
    [token, cargarCompras]
  );

  if (loading) {
    return (
      <Pantalla>
        <Cargando mensaje="Cargando compras..." />
      </Pantalla>
    );
  }

  if (error && compras.length === 0) {
    return (
      <Pantalla>
        <ErrorMensaje message={error} onPress={handleRefresh} />
      </Pantalla>
    );
  }

  if (compras.length === 0) {
    return (
      <Pantalla>
        <EstadoVacio message="Todavía no hiciste compras" />
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      {error && (
        <ErrorMensaje message={error} onPress={handleRefresh} />
      )}
      <FlatList
        data={compras}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CompraCard
            compra={item}
            onPagar={handlePagar}
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
    gap: theme.espaciados.md,
  },
  card: {
    backgroundColor: theme.colors.fondo,
    borderRadius: theme.botones.radio,
    padding: theme.espaciados.md,
    borderWidth: 1,
    borderColor: theme.colors.borde,
  },
  eventoNombre: {
    ...theme.texto.large,
    fontWeight: '700',
    color: theme.colors.texto,
    marginBottom: 4,
  },
  eventoFecha: {
    ...theme.texto.small,
    color: theme.colors.textoSecundario,
    marginBottom: theme.espaciados.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.espaciados.sm,
  },
  detalleText: {
    ...theme.texto.medium,
    color: theme.colors.texto,
  },
  totalText: {
    ...theme.texto.medium,
    fontWeight: '700',
    color: theme.colors.primario,
  },
  estadoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.espaciados.sm,
    marginBottom: theme.espaciados.sm,
  },
  diasText: {
    ...theme.texto.small,
    color: theme.colors.textoSecundario,
    fontStyle: 'italic',
  },
  pagarContainer: {
    marginTop: theme.espaciados.sm,
  },
  historialContainer: {
    marginTop: theme.espaciados.sm,
    paddingTop: theme.espaciados.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borde,
  },
  historialToggle: {
    paddingVertical: theme.espaciados.xs,
  },
  historialToggleText: {
    ...theme.texto.small,
    color: theme.colors.primario,
    fontWeight: '600',
  },
  historialLista: {
    marginTop: theme.espaciados.sm,
    gap: theme.espaciados.sm,
  },
  historialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.espaciados.sm,
  },
  historialInfo: {
    flex: 1,
  },
  historialAutor: {
    ...theme.texto.small,
    color: theme.colors.texto,
    fontWeight: '500',
  },
  historialFecha: {
    ...theme.texto.small,
    color: theme.colors.textoSecundario,
  },
});

export default ComprasScreen;
