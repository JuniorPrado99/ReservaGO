import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

// 1. Importação de todos os Gerenciadores de Dados (Contextos)
import { AuthProvider } from '../context/AuthContext'; 
import { BookingProvider } from '../context/BookingContext';
import { FavoritesProvider } from '../context/FavoritesContext'; 
import { useColorScheme } from '../components/useColorScheme';

export { ErrorBoundary } from 'expo-router';

// 2. AJUSTE: O app agora inicia nas abas (acesso convidado)
export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AuthProvider>
      <BookingProvider> 
        <FavoritesProvider>
          <RootLayoutNav />
        </FavoritesProvider>
      </BookingProvider>
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName="(tabs)">
        {/* Acesso principal sem login */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Telas de Autenticação */}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="select-role" options={{ headerShown: false }} />

        {/* --- NOVO: Fluxo do Anfitrião --- */}
        <Stack.Screen 
          name="create-listing" 
          options={{ 
            title: 'Anunciar Cabana', 
            headerShown: true, // Mostrar header para ter o botão de voltar automático
            headerTitleStyle: { fontWeight: 'bold' },
            headerTintColor: '#2D5A27' 
          }} 
        />

        {/* Telas de conteúdo e suporte */}
        <Stack.Screen name="details" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        
        <Stack.Screen name="admin-dashboard" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}