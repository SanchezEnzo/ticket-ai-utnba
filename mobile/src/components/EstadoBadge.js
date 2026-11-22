import { View, Text, StyleSheet } from 'react-native';
import theme from '../theme.js';

const ESTADOS = {
  PENDIENTE: {
    icon: '⏳',
    label: 'Pendiente',
    bgColor: '#FFF3CD',
    textColor: '#856404',
  },
  CONFIRMADA: {
    icon: '✅',
    label: 'Confirmada',
    bgColor: '#D4EDDA',
    textColor: '#155724',
  },
  UTILIZADA: {
    icon: '🎟️',
    label: 'Utilizada',
    bgColor: '#CCE5FF',
    textColor: '#004085',
  },
  CANCELADA: {
    icon: '❌',
    label: 'Cancelada',
    bgColor: '#E2E3E5',
    textColor: '#383D43',
  },
  REEMBOLSADA: {
    icon: '💰',
    label: 'Reembolsada',
    bgColor: '#E8DAEF',
    textColor: '#6C3483',
  },
};

function EstadoBadge({ estado }) {
  const config = ESTADOS[estado] || ESTADOS.PENDIENTE;

  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={[styles.label, { color: config.textColor }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.espaciados.sm,
    paddingVertical: theme.espaciados.xs,
    borderRadius: theme.botones.radio,
    gap: 4,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    ...theme.texto.small,
    fontWeight: '600',
  },
});

export default EstadoBadge;
