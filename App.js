import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { inicializarDB } from './src/config/database';

export default function App() {
  useEffect(() => {
    inicializarDB();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <RootNavigator />
    </>
  );
}