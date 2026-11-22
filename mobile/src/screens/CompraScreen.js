import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import Pantalla from '../components/Pantalla.js';
import Boton from '../components/Boton.js';
import CampoTexto from '../components/CampoTexto.js';
import EstadoBadge from '../components/EstadoBadge.js';
import { useSession } from '../context/SessionContext.js';
import { crearCompra as apiCrearCompra } from '../api/compras.js';
import { pagarCompra as apiPagarCompra } from '../api/compras.js';
import { formatearPrecio } from '../utils/formato.js';
import theme from '../theme.js';

function CompraScreen({ navigation }) {
  const route = useRoute();
  const { eventoId, tiposEntrada } = route.params;
  const { token, usuario } = useSession();

  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [cantidadStr, setCantidadStr] = useState('1');
  const [compra, setCompra] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cantidad = Math.max(1, parseInt(cantidadStr, 10) || 1);

  const cambiarCantidad = (delta) => {
    const nuevo = Math.max(1, cantidad + delta);
    setCantidadStr(String(nuevo));
  };

  const handleConfirmar = useCallback(async () => {
    if (!tipoSeleccionado) {
      setError('Seleccioná un tipo de entrada.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const resultado = await apiCrearCompra(
        {
          eventoId,
          tipoEntradaId: tipoSeleccionado.id,
          cantidad: Number(cantidad),
        },
        token
      );
      setCompra(resultado);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tipoSeleccionado, cantidad, eventoId, token]);

  const handlePagar = useCallback(async () => {
    if (!compra) return;
    setLoading(true);
    setError(null);

    try {
      const actualizada = await apiPagarCompra(compra.id, token);
      setCompra(actualizada);
      // Navegar a la pestaña Compras
      navigation.navigate('Compras');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [compra, token, navigation]);

  const handlePagarMasTarde = () => {
    navigation.goBack();
  };

  // Fase resumen: ya se creó la compra
  if (compra) {
    const esConfirmada = compra.estado === 'CONFIRMADA';

    return (
      <Pantalla>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.titulo}>Resumen de compra</Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Evento</Text>
            <Text style={styles.infoValue}>{compra.evento?.nombre}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Tipo de entrada</Text>
            <Text style={styles.infoValue}>{compra.tipoEntrada?.nombre}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Cantidad</Text>
            <Text style={styles.infoValue}>{compra.cantidad}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Total</Text>
            <Text style={styles.infoValue}>{formatearPrecio(compra.total)}</Text>
          </View>

          <View style={styles.badgeContainer}>
            <EstadoBadge estado={compra.estado} />
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {esConfirmada ? (
            <View style={styles.exitoContainer}>
              <Text style={styles.exitoText}>¡Compra confirmada!</Text>
            </View>
          ) : (
            <>
              <Boton
                title="Pagar ahora (simulado)"
                onPress={handlePagar}
                loading={loading}
              />
              <Boton
                title="Pagar más tarde"
                onPress={handlePagarMasTarde}
                variant="secondary"
              />
            </>
          )}
        </ScrollView>
      </Pantalla>
    );
  }

  // Fase selección
  return (
    <Pantalla>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.titulo}>Seleccioná tus entradas</Text>

        {/* Tipos de entrada */}
        <Text style={styles.subtitulo}>Tipo de entrada</Text>
        {tiposEntrada?.map((tipo) => {
          const agotado = tipo.cupoDisponible === 0;
          const seleccionado = tipoSeleccionado?.id === tipo.id;

          return (
            <TouchableOpacity
              key={tipo.id}
              style={[
                styles.tipoCard,
                seleccionado && styles.tipoSeleccionado,
                agotado && styles.tipoAgotado,
              ]}
              onPress={() => !agotado && setTipoSeleccionado(tipo)}
              disabled={agotado}
            >
              <View style={styles.tipoHeader}>
                <Text style={[
                  styles.tipoNombre,
                  agotado && styles.tipoNombreAgotado,
                ]}>
                  {tipo.nombre}
                </Text>
                <Text style={[
                  styles.tipoPrecio,
                  agotado && styles.tipoNombreAgotado,
                ]}>
                  {formatearPrecio(tipo.precio)}
                </Text>
              </View>
              {tipo.descripcion && (
                <Text style={[
                  styles.tipoDescripcion,
                  agotado && styles.tipoNombreAgotado,
                ]}>
                  {tipo.descripcion}
                </Text>
              )}
              <Text style={[
                agotado ? styles.tipoAgotadoText : styles.tipoCupo,
                agotado && styles.tipoNombreAgotado,
              ]}>
                {agotado ? 'Agotado' : `Quedan ${tipo.cupoDisponible}`}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Cantidad */}
        <Text style={styles.subtitulo}>Cantidad</Text>
        <View style={styles.cantidadRow}>
          <TouchableOpacity
            style={styles.cantidadBtn}
            onPress={() => cambiarCantidad(-1)}
            disabled={cantidad <= 1}
            accessibilityLabel="Reducir cantidad"
          >
            <Text style={[
              styles.cantidadBtnText,
              cantidad <= 1 && styles.cantidadBtnDisabled,
            ]}>
              −
            </Text>
          </TouchableOpacity>

          <CampoTexto
            value={cantidadStr}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9]/g, '');
              setCantidadStr(cleaned || '1');
            }}
            placeholder="1"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={styles.cantidadBtn}
            onPress={() => cambiarCantidad(1)}
            accessibilityLabel="Aumentar cantidad"
          >
            <Text style={styles.cantidadBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Total estimado */}
        {tipoSeleccionado && (
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total estimado</Text>
            <Text style={styles.totalValue}>
              {formatearPrecio(tipoSeleccionado.precio * cantidad)}
            </Text>
            <Text style={styles.totalNota}>
              El total definitivo lo calcula el servidor.
            </Text>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Botón confirmar */}
        <Boton
          title="Confirmar"
          onPress={handleConfirmar}
          loading={loading}
          disabled={!tipoSeleccionado}
        />
      </ScrollView>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: theme.espaciados.md,
    flexGrow: 1,
  },
  titulo: {
    ...theme.texto.large,
    fontWeight: '700',
    color: theme.colors.texto,
    marginBottom: theme.espaciados.lg,
  },
  subtitulo: {
    ...theme.texto.medium,
    fontWeight: '600',
    color: theme.colors.texto,
    marginBottom: theme.espaciados.sm,
    marginTop: theme.espaciados.md,
  },
  tipoCard: {
    backgroundColor: theme.colors.fondoSecundario,
    borderRadius: theme.botones.radio,
    padding: theme.espaciados.md,
    marginBottom: theme.espaciados.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tipoSeleccionado: {
    borderColor: theme.colors.primario,
  },
  tipoAgotado: {
    opacity: 0.5,
  },
  tipoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.espaciados.xs,
  },
  tipoNombre: {
    ...theme.texto.medium,
    fontWeight: '600',
    color: theme.colors.texto,
  },
  tipoNombreAgotado: {
    color: theme.colors.textoSecundario,
  },
  tipoPrecio: {
    ...theme.texto.medium,
    fontWeight: '700',
    color: theme.colors.primario,
  },
  tipoDescripcion: {
    ...theme.texto.small,
    color: theme.colors.textoSecundario,
    marginBottom: theme.espaciados.xs,
  },
  tipoCupo: {
    ...theme.texto.small,
    color: theme.colors.secundario,
    fontWeight: '500',
  },
  tipoAgotadoText: {
    ...theme.texto.small,
    color: theme.colors.error,
    fontWeight: '500',
  },
  cantidadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.espaciados.md,
    marginBottom: theme.espaciados.md,
  },
  cantidadBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primario,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cantidadBtnText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  cantidadBtnDisabled: {
    opacity: 0.3,
  },
  totalContainer: {
    backgroundColor: theme.colors.fondoSecundario,
    borderRadius: theme.botones.radio,
    padding: theme.espaciados.md,
    marginBottom: theme.espaciados.md,
    alignItems: 'center',
  },
  totalLabel: {
    ...theme.texto.medium,
    color: theme.colors.textoSecundario,
    marginBottom: 4,
  },
  totalValue: {
    ...theme.texto.large,
    fontWeight: '700',
    color: theme.colors.primario,
    marginBottom: 4,
  },
  totalNota: {
    ...theme.texto.small,
    color: theme.colors.textoSecundario,
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: '#F8D7DA',
    padding: theme.espaciados.sm,
    borderRadius: theme.botones.radio,
    marginBottom: theme.espaciados.md,
  },
  errorText: {
    ...theme.texto.small,
    color: '#721C24',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: theme.colors.fondoSecundario,
    borderRadius: theme.botones.radio,
    padding: theme.espaciados.md,
    marginBottom: theme.espaciados.sm,
  },
  infoLabel: {
    ...theme.texto.small,
    color: theme.colors.textoSecundario,
    marginBottom: 4,
  },
  infoValue: {
    ...theme.texto.medium,
    fontWeight: '600',
    color: theme.colors.texto,
  },
  badgeContainer: {
    marginTop: theme.espaciados.md,
    marginBottom: theme.espaciados.md,
  },
  exitoContainer: {
    backgroundColor: '#D4EDDA',
    padding: theme.espaciados.md,
    borderRadius: theme.botones.radio,
    marginBottom: theme.espaciados.md,
    alignItems: 'center',
  },
  exitoText: {
    ...theme.texto.medium,
    color: '#155724',
    fontWeight: '700',
  },
});

export default CompraScreen;
