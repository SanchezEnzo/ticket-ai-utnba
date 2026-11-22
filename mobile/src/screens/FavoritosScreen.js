import { FlatList } from 'react-native';
import Pantalla from '../components/Pantalla.js';
import Cargando from '../components/Cargando.js';
import ErrorMensaje from '../components/ErrorMensaje.js';
import EstadoVacio from '../components/EstadoVacio.js';
import EventoCard from '../components/EventoCard.js';
import { useFavoritos } from '../context/FavoritosContext.js';

function FavoritosScreen({ navigation }) {
  const { favoritos, loading, error } = useFavoritos();

  const handleEventoPress = (evento) => {
    navigation.navigate('Detalle', { eventoId: evento.id });
  };

  const renderItem = ({ item }) => (
    <EventoCard
      evento={item}
      onPress={() => handleEventoPress(item)}
      showEventStatus
    />
  );

  if (loading) {
    return (
      <Pantalla>
        <Cargando mensaje="Cargando favoritos..." />
      </Pantalla>
    );
  }

  if (error) {
    return (
      <Pantalla>
        <ErrorMensaje message={error} />
      </Pantalla>
    );
  }

  if (favoritos.length === 0) {
    return (
      <Pantalla>
        <EstadoVacio
          icon="heart-outline"
          message="Todavía no marcaste favoritos."
        />
      </Pantalla>
    );
  }

  return (
    <Pantalla style={{ padding: 0 }}>
      <FlatList
        data={favoritos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
      />
    </Pantalla>
  );
}

export default FavoritosScreen;
