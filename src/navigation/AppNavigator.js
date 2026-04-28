import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator }     from '@react-navigation/stack';
import { Ionicons }                 from '@expo/vector-icons';
import { colors }                   from '../config/theme';

import DashboardScreen  from '../screens/DashboardScreen';
import MaterialesScreen from '../screens/MaterialesScreen';
import PersonalScreen   from '../screens/PersonalScreen';
import TareasScreen     from '../screens/TareasScreen';
import PerfilScreen     from '../screens/PerfilScreen';
import PlanosScreen     from '../screens/PlanosScreen';
import ObrasScreen      from '../screens/ObrasScreen';
import GaleriaScreen    from '../screens/GaleriaScreen';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

const tabIcons = {
  Dashboard:  ['home',     'home-outline'    ],
  Materiales: ['cube',     'cube-outline'    ],
  Personal:   ['people',   'people-outline'  ],
  Tareas:     ['checkbox', 'checkbox-outline'],
};

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          const [filled, outline] = tabIcons[route.name] ?? ['apps', 'apps-outline'];
          return <Ionicons name={focused ? filled : outline} size={size} color={color} />;
        },
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor:  colors.border,
          height:          60,
          paddingBottom:   8,
        },
        tabBarLabelStyle: { fontSize: 11 },
        headerStyle: {
          backgroundColor:   colors.bgCard,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
          elevation:         0,
          shadowOpacity:     0,
        },
        headerTintColor:  colors.textPrimary,
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen name="Dashboard"  component={DashboardScreen}  options={{ title: 'Inicio'     }} />
      <Tab.Screen name="Materiales" component={MaterialesScreen} options={{ title: 'Materiales' }} />
      <Tab.Screen name="Personal"   component={PersonalScreen}   options={{ title: 'Personal'   }} />
      <Tab.Screen name="Tareas"     component={TareasScreen}     options={{ title: 'Tareas'     }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor:   colors.bgCard,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
          elevation:         0,
          shadowOpacity:     0,
        },
        headerTintColor:  colors.primary,
        headerTitleStyle: { fontWeight: 'bold', color: colors.textPrimary },
      }}
    >
      <Stack.Screen name="HomeTabs"   component={HomeTabs}          options={{ headerShown: false }} />
      <Stack.Screen name="Perfil"     component={PerfilScreen}      options={{ title: 'Mi Perfil'  }} />
      <Stack.Screen name="Planos"     component={PlanosScreen}      options={{ title: 'Planos'     }} />
      <Stack.Screen name="Obras"      component={ObrasScreen}       options={{ title: 'Mis Obras'  }} />
      <Stack.Screen name="Galeria"    component={GaleriaScreen}     options={{ title: 'Galería'    }} />
      <Stack.Screen name="Materiales" component={MaterialesScreen}  options={{ title: 'Materiales' }} />
      <Stack.Screen name="Personal"   component={PersonalScreen}    options={{ title: 'Personal'   }} />
      <Stack.Screen name="Tareas"     component={TareasScreen}      options={{ title: 'Tareas'     }} />
    </Stack.Navigator>
  );
}