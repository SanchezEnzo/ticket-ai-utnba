import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import Pantalla from '../components/Pantalla.js';
import Boton from '../components/Boton.js';
import CampoTexto from '../components/CampoTexto.js';
import Cargando from '../components/Cargando.js';
import ErrorMensaje from '../components/ErrorMensaje.js';
import { useSession } from '../context/SessionContext.js';
import { crearEvento as apiCrearEvento } from '../api/eventos.js';
import { listarCategorias as apiListarCategorias } from '../api/eventos.js';
import { validarFechaTexto, validarHoraTexto, parsearFechaHora } from '../utils/fecha.js';
import theme from '../theme.js';

const tipoEntradaVacia = () => ({
  nombre: '',
  descripcion: '',
  precio: '',
  cupo: '',
});

function CrearEventoScreen({ navigation }) {
  const { token } = useSession();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaId, setCategoriaId] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [fechaTexto, setFechaTexto] = useState('');
  const [horaTexto, setHoraTexto] = useState('');
  const [multimedia, setMultimedia] = useState([]);
  const [urlMultimedia, setUrlMultimedia] = useState('');
  const [tiposEntrada, setTiposEntrada] = useState([tipoEntradaVacia()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [erroresCampo, setErroresCampo] = useState({});

  // Cargar categorías al montar
  const cargarCategorias = useCallback(() => {
    if (!token) return;
    apiListarCategorias(token)
      .then((lista) => {
        setCategorias(lista || []);
      })
      .catch(() => {
        // Si falla, se continúa sin categorías
        setCategorias([]);
      });
  }, [token]);

  cargarCategorias();

  // Multimedia
  const agregarMultimedia = () => {
    const url = urlMultimedia.trim();
    if (url) {
      setMultimedia((prev) => [...prev, url]);
      setUrlMultimedia('');
    }
  };

  const quitarMultimedia = (index) => {
    setMultimedia((prev) => prev.filter((_, i) => i !== index));
  };

  // Tipos de entrada
  const agregarTipoEntrada = () => {
    setTiposEntrada((prev) => [...prev, tipoEntradaVacia()]);
  };

  const quitarTipoEntrada = (index) => {
    setTiposEntrada((prev) => prev.filter((_, i) => i !== index));
  };

  const actualizarTipoEntrada = (index, campo, valor) => {
    setTiposEntrada((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [campo]: valor };
      return copia;
    });
  };

  // Submit
  const handleCrear = () => {
    setError(null);
    setErroresCampo({});

    // Validaciones de formato fecha/hora
    const camposErroneos = {};

    if (!nombre.trim()) {
      camposErroneos.nombre = 'El nombre es obligatorio.';
    }
    if (!descripcion.trim()) {
      camposErroneos.descripcion = 'La descripción es obligatoria.';
    }
    if (!validarFechaTexto(fechaTexto)) {
      camposErroneos.fecha = 'Usá el formato DD/MM/AAAA.';
    }
    if (!validarHoraTexto(horaTexto)) {
      camposErroneos.hora = 'Usá el formato HH:mm.';
    }
    if (!categoriaId) {
      camposErroneos.categoria = 'Seleccioná una categoría.';
    }

    // Validar tipos de entrada
    for (let i = 0; i < tiposEntrada.length; i++) {
      const tipo = tiposEntrada[i];
      const prefijo = `tipo${i}`;
      if (!tipo.nombre.trim()) {
        camposErroneos[`${prefijo}.nombre`] = 'Nombre obligatorio.';
      }
      const precioNum = Number(tipo.precio);
      if (tipo.precio === '' || isNaN(precioNum)) {
        camposErroneos[`${prefijo}.precio`] = 'Precio inválido.';
      }
      const cupoNum = Number(tipo.cupo);
      if (tipo.cupo === '' || isNaN(cupoNum) || !Number.isInteger(cupoNum)) {
        camposErroneos[`${prefijo}.cupo`] = 'Cupo inválido.';
      }
    }

    if (Object.keys(camposErroneos).length > 0) {
      setErroresCampo(camposErroneos);
      return;
    }

    // Construir el payload
    const fechaISO = parsearFechaHora(fechaTexto, horaTexto);

    const tiposPayload = tiposEntrada.map((tipo) => ({
      nombre: tipo.nombre.trim(),
      descripcion: tipo.descripcion.trim(),
      precio: Number(tipo.precio),
      cupo: Number(tipo.cupo),
    }));

    const payload = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      categoriaId,
      fecha: fechaISO,
      tiposEntrada: tiposPayload,
    };

    if (multimedia.length > 0) {
      payload.multimedia = multimedia;
    }

    setLoading(true);
    apiCrearEvento(payload, token)
      .then((resultado) => {
        navigation.navigate('Detalle', { eventoId: resultado.id });
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <Pantalla>
        <Cargando mensaje="Creando evento..." />
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      <ScrollView contentContainerStyle={styles.form}>
        {error && <ErrorMensaje message={error} />}

        <CampoTexto
          label="Nombre"
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre del evento"
          autoCapitalize="words"
        />
        {erroresCampo.nombre && <Text style={styles.errorTexto}>{erroresCampo.nombre}</Text>}

        <CampoTexto
          label="Descripción"
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Descripción del evento"
          autoCapitalize="sentences"
        />
        {erroresCampo.descripcion && <Text style={styles.errorTexto}>{erroresCampo.descripcion}</Text>}

        {/* Categoría */}
        <Text style={styles.label}>Categoría</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriasScroll}>
          <View style={styles.categoriasRow}>
            {categorias.map((cat) => {
              const seleccionada = categoriaId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, seleccionada && styles.chipSeleccionado]}
                  onPress={() => setCategoriaId(cat.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipTexto, seleccionada && styles.chipTextoSeleccionado]}>
                    {cat.nombre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
        {erroresCampo.categoria && <Text style={styles.errorTexto}>{erroresCampo.categoria}</Text>}

        {/* Fecha y Hora */}
        <View style={styles.fechaHoraRow}>
          <View style={styles.campoMitad}>
            <CampoTexto
              label="Fecha"
              value={fechaTexto}
              onChangeText={setFechaTexto}
              placeholder="DD/MM/AAAA"
            />
            {erroresCampo.fecha && <Text style={styles.errorTexto}>{erroresCampo.fecha}</Text>}
          </View>
          <View style={styles.campoMitad}>
            <CampoTexto
              label="Hora"
              value={horaTexto}
              onChangeText={setHoraTexto}
              placeholder="HH:mm"
            />
            {erroresCampo.hora && <Text style={styles.errorTexto}>{erroresCampo.hora}</Text>}
          </View>
        </View>

        {/* Multimedia */}
        <Text style={styles.label}>Multimedia (opcional)</Text>
        <View style={styles.multimediaRow}>
          <CampoTexto
            value={urlMultimedia}
            onChangeText={setUrlMultimedia}
            placeholder="URL de imagen"
          />
          <TouchableOpacity
            style={styles.agregarBtn}
            onPress={agregarMultimedia}
            activeOpacity={0.7}
          >
            <Text style={styles.agregarBtnTexto}>+</Text>
          </TouchableOpacity>
        </View>
        {multimedia.length > 0 && (
          <View style={styles.multimediaLista}>
            {multimedia.map((url, index) => (
              <View key={index} style={styles.multimediaItem}>
                <Text style={styles.multimediaTexto} numberOfLines={1}>{url}</Text>
                <TouchableOpacity
                  onPress={() => quitarMultimedia(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quitarTexto}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Tipos de entrada */}
        <Text style={styles.seccionTitulo}>Tipos de entrada</Text>
        {tiposEntrada.map((tipo, index) => (
          <View key={index} style={styles.tipoCard}>
            <View style={styles.tipoHeader}>
              <Text style={styles.tipoTitulo}>Tipo {index + 1}</Text>
              {tiposEntrada.length > 1 && (
                <TouchableOpacity
                  onPress={() => quitarTipoEntrada(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quitarTipoTexto}>Quitar</Text>
                </TouchableOpacity>
              )}
            </View>
            <CampoTexto
              label="Nombre"
              value={tipo.nombre}
              onChangeText={(val) => actualizarTipoEntrada(index, 'nombre', val)}
              placeholder="Ej: General, VIP"
              autoCapitalize="words"
            />
            {erroresCampo[`tipo${index}.nombre`] && (
              <Text style={styles.errorTexto}>{erroresCampo[`tipo${index}.nombre`]}</Text>
            )}
            <CampoTexto
              label="Descripción"
              value={tipo.descripcion}
              onChangeText={(val) => actualizarTipoEntrada(index, 'descripcion', val)}
              placeholder="Descripción del tipo"
              autoCapitalize="sentences"
            />
            <View style={styles.fechaHoraRow}>
              <View style={styles.campoMitad}>
                <CampoTexto
                  label="Precio"
                  value={tipo.precio}
                  onChangeText={(val) => actualizarTipoEntrada(index, 'precio', val)}
                  placeholder="0"
                />
                {erroresCampo[`tipo${index}.precio`] && (
                  <Text style={styles.errorTexto}>{erroresCampo[`tipo${index}.precio`]}</Text>
                )}
              </View>
              <View style={styles.campoMitad}>
                <CampoTexto
                  label="Cupo"
                  value={tipo.cupo}
                  onChangeText={(val) => actualizarTipoEntrada(index, 'cupo', val)}
                  placeholder="100"
                />
                {erroresCampo[`tipo${index}.cupo`] && (
                  <Text style={styles.errorTexto}>{erroresCampo[`tipo${index}.cupo`]}</Text>
                )}
              </View>
            </View>
          </View>
        ))}
        <Boton
          title="+ Agregar tipo de entrada"
          onPress={agregarTipoEntrada}
          variant="secondary"
        />

        <View style={styles.submitContainer}>
          <Boton
            title="Crear evento"
            onPress={handleCrear}
            loading={loading}
            disabled={loading}
            variant="primary"
          />
        </View>
      </ScrollView>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  form: {
    padding: theme.espaciados.md,
    paddingBottom: theme.espaciados.xl,
  },
  label: {
    marginBottom: theme.espaciados.xs,
    color: theme.colors.texto,
    ...theme.texto.medium,
    fontWeight: '500',
  },
  errorTexto: {
    ...theme.texto.small,
    color: theme.colors.error,
    marginBottom: theme.espaciados.sm,
  },
  categoriasScroll: {
    marginBottom: theme.espaciados.md,
  },
  categoriasRow: {
    flexDirection: 'row',
    gap: theme.espaciados.sm,
  },
  chip: {
    paddingHorizontal: theme.espaciados.md,
    paddingVertical: theme.espaciados.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.borde,
    backgroundColor: theme.colors.fondo,
  },
  chipSeleccionado: {
    backgroundColor: theme.colors.primario,
    borderColor: theme.colors.primario,
  },
  chipTexto: {
    ...theme.texto.medium,
    color: theme.colors.texto,
  },
  chipTextoSeleccionado: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  fechaHoraRow: {
    flexDirection: 'row',
    gap: theme.espaciados.sm,
  },
  campoMitad: {
    flex: 1,
  },
  multimediaRow: {
    flexDirection: 'row',
    gap: theme.espaciados.sm,
    marginBottom: theme.espaciados.md,
  },
  agregarBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    height: 44,
    borderRadius: theme.botones.radio,
    backgroundColor: theme.colors.primario,
  },
  agregarBtnTexto: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  multimediaLista: {
    gap: theme.espaciados.xs,
    marginBottom: theme.espaciados.md,
  },
  multimediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.espaciados.sm,
    backgroundColor: theme.colors.fondoSecundario,
    borderRadius: theme.botones.radio,
  },
  multimediaTexto: {
    ...theme.texto.small,
    color: theme.colors.texto,
    flex: 1,
    marginRight: theme.espaciados.sm,
  },
  quitarTexto: {
    ...theme.texto.medium,
    color: theme.colors.error,
    fontWeight: '700',
  },
  seccionTitulo: {
    ...theme.texto.large,
    fontWeight: '700',
    color: theme.colors.texto,
    marginTop: theme.espaciados.md,
    marginBottom: theme.espaciados.sm,
  },
  tipoCard: {
    backgroundColor: theme.colors.fondoSecundario,
    borderRadius: theme.botones.radio,
    padding: theme.espaciados.md,
    marginBottom: theme.espaciados.sm,
  },
  tipoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.espaciados.sm,
  },
  tipoTitulo: {
    ...theme.texto.medium,
    fontWeight: '700',
    color: theme.colors.texto,
  },
  quitarTipoTexto: {
    ...theme.texto.small,
    color: theme.colors.error,
    fontWeight: '600',
  },
  submitContainer: {
    marginTop: theme.espaciados.lg,
  },
});

export default CrearEventoScreen;
