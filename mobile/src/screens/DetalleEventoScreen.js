import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Image, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import Pantalla from '../components/Pantalla.js';
import Cargando from '../components/Cargando.js';
import ErrorMensaje from '../components/ErrorMensaje.js';
import EventoCard from '../components/EventoCard.js';
import { useSession } from '../context/SessionContext.js';
import { obtenerEvento as apiObtenerEvento } from '../api/eventos.js';
import { listarResenias as apiListarResenias } from '../api/eventos.js';
import { formatearFechaHora, formatearPrecio, formatearFecha } from '../utils/formato.js';
import theme from '../theme.js';

function DetalleEventoScreen({ navigation }) {
  const route = useRoute();
  const { eventoId } = route.params;
  const { token } = useSession();

  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [resenias, setResenias] = useState([]);
  const [reseniasLoading, setReseniasLoading] = useState(true);
  const [reseniasError, setReseniasError] = useState(null);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    setError(null);

    apiObtenerEvento(eventoId, token)
      .then((resultado) => {
        setEvento(resultado);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, eventoId]);

  useEffect(() => {
    if (!token) return;

    setReseniasLoading(true);
    setReseniasError(null);

    apiListarResenias(eventoId, token)
      .then((resultado) => {
        setResenias(resultado || []);
      })
      .catch((err) => {
        setReseniasError(err.message);
      })
      .finally(() => {
        setReseniasLoading(false);
      });
  }, [token, eventoId]);

  const handleReseniasRetry = useCallback(() => {
    if (!token) return;
    setReseniasLoading(true);
    setReseniasError(null);

    apiListarResenias(eventoId, token)
      .then((resultado) => {
        setResenias(resultado || []);
      })
      .catch((err) => {
        setReseniasError(err.message);
      })
      .finally(() => {
        setReseniasLoading(false);
      });
  }, [token, eventoId]);

  if (loading) {
    return (
      <Pantalla>
        <Cargando mensaje="Cargando evento..." />
      </Pantalla>
    );
  }

  if (error) {
    return (
      <Pantalla>
        <ErrorMensaje message={error} onPress={() => navigation.goBack()} />
      </Pantalla>
    );
  }

  if (!evento) {
    return (
      <Pantalla>
        <ErrorMensaje message="Evento no encontrado" onPress={() => navigation.goBack()} />
      </Pantalla>
    );
  }

  const fechaEvento = new Date(evento.fecha);
  const yaRealizado = fechaEvento < new Date();

  return (
    <Pantalla style={{ padding: 0 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Carrusel de imágenes */}
        {evento.multimedia && evento.multimedia.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
            {evento.multimedia.map((url, index) => (
              <Image
                key={index}
                source={{ uri: url }}
                style={styles.carouselImage}
                resizeMode="cover"
                onError={() => {
                  // Si la imagen falla, se muestra un recuadro neutro
                }}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>Sin imágenes</Text>
          </View>
        )}

        {/* Tarjeta de evento */}
        <View style={styles.content}>
          <EventoCard evento={evento} onPress={() => {}} />

          {/* Aviso de evento realizado */}
          {yaRealizado && (
            <View style={styles.avisoRealizado}>
              <Text style={styles.avisoRealizadoText}>Este evento ya se realizó</Text>
            </View>
          )}

          {/* Descripción */}
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Descripción</Text>
            <Text style={styles.descripcion}>{evento.descripcion}</Text>
          </View>

          {/* Fecha y organizador */}
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Detalles</Text>
            <Text style={styles.detalleText}>
              📅 {formatearFechaHora(evento.fecha)}
            </Text>
            <Text style={styles.detalleText}>
              📂 {evento.categoria?.nombre || ''}
            </Text>
            <Text style={styles.detalleText}>
              👤 {evento.organizador?.nombre} {evento.organizador?.apellido}
            </Text>
            {evento.puntajeOrganizador !== null && evento.puntajeOrganizador !== undefined && (
              <Text style={styles.detalleText}>
                ★ Puntaje: {evento.puntajeOrganizador.toFixed(1)}
              </Text>
            )}
          </View>

          {/* Tipos de entrada */}
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Entradas disponibles</Text>
            {evento.tiposEntrada?.map((tipo) => (
              <View key={tipo.id} style={styles.entradaCard}>
                <View style={styles.entradaHeader}>
                  <Text style={styles.entradaNombre}>{tipo.nombre}</Text>
                  <Text style={styles.entradaPrecio}>{formatearPrecio(tipo.precio)}</Text>
                </View>
                {tipo.descripcion && (
                  <Text style={styles.entradaDescripcion}>{tipo.descripcion}</Text>
                )}
                <Text style={
                  tipo.cupoDisponible === 0
                    ? styles.entradaAgotado
                    : styles.entradaDisponibilidad
                }>
                  {tipo.cupoDisponible === 0
                    ? 'Agotado'
                    : `Quedan ${tipo.cupoDisponible}`
                  }
                </Text>
              </View>
            ))}
          </View>

          {/* Reseñas del organizador */}
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Reseñas del organizador</Text>

            {reseniasLoading ? (
              <View style={styles.reseniasCargando}>
                <ActivityIndicator size="small" color={theme.colors.primario} />
              </View>
            ) : reseniasError ? (
              <ErrorMensaje message={reseniasError} onPress={handleReseniasRetry} />
            ) : resenias.length === 0 ? (
              <Text style={styles.sinResenias}>
                Este organizador todavía no tiene reseñas.
              </Text>
            ) : (
              resenias.map((resenia) => (
                <View key={resenia.id} style={styles.reseniaCard}>
                  <View style={styles.reseniaHeader}>
                    <Text style={styles.reseniaPuntaje}>
                      ★ {resenia.puntaje.toFixed(1)}
                    </Text>
                    <Text style={styles.reseniaFecha}>
                      {formatearFecha(resenia.fecha)}
                    </Text>
                  </View>
                  <Text style={styles.reseniaComentario}>{resenia.comentario}</Text>
                  <View style={styles.reseniaFooter}>
                    <Text style={styles.reseniaAutor}>
                      {resenia.autor?.nombre} {resenia.autor?.apellido}
                    </Text>
                    <Text style={styles.reseniaEvento}>
                      en: {resenia.evento?.nombre}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  carousel: {
    height: 200,
  },
  carouselImage: {
    width: 300,
    height: 200,
  },
  placeholderImage: {
    height: 200,
    backgroundColor: theme.colors.fondoSecundario,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    ...theme.texto.medium,
    color: theme.colors.textoSecundario,
  },
  content: {
    padding: theme.espaciados.md,
  },
  avisoRealizado: {
    marginTop: theme.espaciados.sm,
    padding: theme.espaciados.sm,
    backgroundColor: theme.colors.avisoFondo,
    borderRadius: theme.botones.radio,
    marginBottom: theme.espaciados.md,
  },
  avisoRealizadoText: {
    ...theme.texto.medium,
    color: theme.colors.avisoTexto,
    fontWeight: '600',
    textAlign: 'center',
  },
  seccion: {
    marginTop: theme.espaciados.lg,
  },
  seccionTitulo: {
    ...theme.texto.large,
    fontWeight: '700',
    color: theme.colors.texto,
    marginBottom: theme.espaciados.sm,
  },
  descripcion: {
    ...theme.texto.medium,
    color: theme.colors.texto,
    lineHeight: 24,
  },
  detalleText: {
    ...theme.texto.medium,
    color: theme.colors.texto,
    marginBottom: theme.espaciados.xs,
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
    marginBottom: theme.espaciados.xs,
  },
  entradaNombre: {
    ...theme.texto.medium,
    fontWeight: '600',
    color: theme.colors.texto,
  },
  entradaPrecio: {
    ...theme.texto.medium,
    fontWeight: '700',
    color: theme.colors.primario,
  },
  entradaDescripcion: {
    ...theme.texto.small,
    color: theme.colors.textoSecundario,
    marginBottom: theme.espaciados.xs,
  },
  entradaDisponibilidad: {
    ...theme.texto.small,
    color: theme.colors.secundario,
    fontWeight: '500',
  },
  entradaAgotado: {
    ...theme.texto.small,
    color: theme.colors.error,
    fontWeight: '500',
  },
  reseniasCargando: {
    padding: theme.espaciados.md,
    alignItems: 'center',
  },
  sinResenias: {
    ...theme.texto.medium,
    color: theme.colors.textoSecundario,
    fontStyle: 'italic',
  },
  reseniaCard: {
    backgroundColor: theme.colors.fondoSecundario,
    borderRadius: theme.botones.radio,
    padding: theme.espaciados.md,
    marginBottom: theme.espaciados.sm,
  },
  reseniaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.espaciados.sm,
  },
  reseniaPuntaje: {
    ...theme.texto.medium,
    fontWeight: '600',
    color: theme.colors.primario,
  },
  reseniaFecha: {
    ...theme.texto.small,
    color: theme.colors.textoSecundario,
  },
  reseniaComentario: {
    ...theme.texto.medium,
    color: theme.colors.texto,
    marginBottom: theme.espaciados.sm,
  },
  reseniaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reseniaAutor: {
    ...theme.texto.small,
    color: theme.colors.textoSecundario,
    fontWeight: '500',
  },
  reseniaEvento: {
    ...theme.texto.small,
    color: theme.colors.textoSecundario,
    fontStyle: 'italic',
  },
});

export default DetalleEventoScreen;
