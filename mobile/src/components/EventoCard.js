import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import theme from '../theme.js';
import { formatearFechaHora, formatearPrecio } from '../utils/formato.js';
import { useFavoritos } from '../context/FavoritosContext.js';
import { useSession } from '../context/SessionContext.js';

function EventoCard({ evento, onPress, showEventStatus = false }) {
  const { esFavorito, alternar } = useFavoritos();
  const { token } = useSession();

  const esFav = esFavorito(evento.id);
  const fechaEvento = new Date(evento.fecha);
  const yaRealizado = fechaEvento < new Date();

  const handleFavorito = (e) => {
    e.stopPropagation();
    if (token) {
      alternar(evento, token);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.nombre} numberOfLines={1}>{evento.nombre}</Text>
          <Text style={styles.categoria}>{evento.categoria?.nombre || ''}</Text>
        </View>
        <TouchableOpacity
          style={styles.favButton}
          onPress={handleFavorito}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.heart, esFav && styles.heartActive]}>
            {esFav ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.fecha}>{formatearFechaHora(evento.fecha)}</Text>

      <View style={styles.row}>
        <Text style={styles.precio}>{formatearPrecio(evento.precioDesde)}</Text>
        <View style={styles.organizadorRow}>
          {evento.puntajeOrganizador !== null && evento.puntajeOrganizador !== undefined ? (
            <Text style={styles.puntaje}>★ {evento.puntajeOrganizador.toFixed(1)}</Text>
          ) : (
            <Text style={styles.puntaje}>Sin reseñas</Text>
          )}
          <Text style={styles.organizador} numberOfLines={1}>
            {evento.organizador?.nombre} {evento.organizador?.apellido}
          </Text>
        </View>
      </View>

      {showEventStatus && yaRealizado && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Ya se realizó</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.fondo,
    borderRadius: theme.botones.radio,
    padding: theme.espaciados.md,
    marginBottom: theme.espaciados.sm,
    borderWidth: 1,
    borderColor: theme.colors.borde,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.espaciados.xs,
  },
  headerText: {
    flex: 1,
    marginRight: theme.espaciados.sm,
  },
  nombre: {
    ...theme.texto.large,
    fontWeight: '700',
    color: theme.colors.texto,
  },
  categoria: {
    ...theme.texto.small,
    color: theme.colors.textoSecundario,
    marginTop: 2,
  },
  favButton: {
    padding: 4,
  },
  heart: {
    fontSize: 24,
  },
  heartActive: {
    opacity: 1,
  },
  fecha: {
    ...theme.texto.small,
    color: theme.colors.textoSecundario,
    marginBottom: theme.espaciados.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  precio: {
    ...theme.texto.medium,
    fontWeight: '600',
    color: theme.colors.primario,
  },
  organizadorRow: {
    alignItems: 'flex-end',
    gap: 2,
  },
  puntaje: {
    ...theme.texto.small,
    color: theme.colors.textoSecundario,
  },
  organizador: {
    ...theme.texto.small,
    color: theme.colors.textoSecundario,
  },
  badge: {
    marginTop: theme.espaciados.sm,
    paddingHorizontal: theme.espaciados.sm,
    paddingVertical: theme.espaciados.xs,
    backgroundColor: theme.colors.avisoFondo,
    borderRadius: theme.espaciados.xs,
    alignSelf: 'flex-start',
  },
  badgeText: {
    ...theme.texto.small,
    color: theme.colors.avisoTexto,
    fontWeight: '600',
  },
});

export default EventoCard;
