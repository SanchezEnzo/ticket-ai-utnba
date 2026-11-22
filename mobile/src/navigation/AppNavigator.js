import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../context/SessionContext.js';
import theme from '../theme.js';

import LoginScreen from '../screens/LoginScreen.js';
import ExplorarScreen from '../screens/ExplorarScreen.js';
import FavoritosScreen from '../screens/FavoritosScreen.js';
import ComprasScreen from '../screens/ComprasScreen.js';
import MisEventosScreen from '../screens/MisEventosScreen.js';
import CuentaScreen from '../screens/CuentaScreen.js';
import DetalleEventoScreen from '../screens/DetalleEventoScreen.js';
import CompraScreen from '../screens/CompraScreen.js';
import CrearEventoScreen from '../screens/CrearEventoScreen.js';
import ComprasDelEventoScreen from '../screens/ComprasDelEventoScreen.js';
import ChatScreen from '../screens/ChatScreen.js';
import ResenaScreen from '../screens/ResenaScreen.js';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Explorar') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Favoritos') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Compras') {
            iconName = focused ? 'ticket' : 'ticket-outline';
          } else if (route.name === 'Mis eventos') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Cuenta') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primario,
        tabBarInactiveTintColor: theme.colors.textoSecundario,
        headerStyle: {
          backgroundColor: theme.colors.primario,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      })}
    >
      <Tab.Screen name="Explorar" component={ExplorarScreen} options={{ headerTitle: 'Explorar' }} />
      <Tab.Screen name="Favoritos" component={FavoritosScreen} options={{ headerTitle: 'Favoritos' }} />
      <Tab.Screen name="Compras" component={ComprasScreen} options={{ headerTitle: 'Compras' }} />
      <Tab.Screen name="Mis eventos" component={MisEventosScreen} options={{ headerTitle: 'Mis eventos' }} />
      <Tab.Screen name="Cuenta" component={CuentaScreen} options={{ headerTitle: 'Mi Cuenta' }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isLoggedIn } = useSession();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen
            name="Detalle"
            component={DetalleEventoScreen}
            options={{
              headerShown: true,
              headerStyle: {
                backgroundColor: theme.colors.primario,
              },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              headerTitle: 'Detalle del evento',
            }}
          />
          <Stack.Screen
            name="Compra"
            component={CompraScreen}
            options={{
              headerShown: true,
              headerStyle: {
                backgroundColor: theme.colors.primario,
              },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              headerTitle: 'Comprar entradas',
            }}
          />
          <Stack.Screen
            name="CrearEvento"
            component={CrearEventoScreen}
            options={{
              headerShown: true,
              headerStyle: {
                backgroundColor: theme.colors.primario,
              },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              headerTitle: 'Crear evento',
            }}
          />
          <Stack.Screen
            name="ComprasDelEvento"
            component={ComprasDelEventoScreen}
            options={{
              headerShown: true,
              headerStyle: {
                backgroundColor: theme.colors.primario,
              },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              headerTitle: 'Compras del evento',
            }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={({ route }) => ({
              headerShown: true,
              headerStyle: {
                backgroundColor: theme.colors.primario,
              },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              headerTitle: route.params?.titulo || 'Mensajes',
            })}
          />
          <Stack.Screen
            name="Resena"
            component={ResenaScreen}
            options={({ route }) => ({
              headerShown: true,
              headerStyle: {
                backgroundColor: theme.colors.primario,
              },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              headerTitle: route.params?.titulo || 'Dejar reseña',
            })}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default AppNavigator;
