import { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { onAuthStateChanged }  from 'firebase/auth';
import { auth }                from '../config/firebase';

import SplashScreen  from '../screens/SplashScreen';
import AuthNavigator from './AuthNavigator';
import AppNavigator  from './AppNavigator';

export default function RootNavigator() {
  const [splash,      setSplash]  = useState(true);
  const [sesionActiva, setSesion] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setSesion(!!user);
    });
    return unsub;
  }, []);

  if (splash) return <SplashScreen onFinish={() => setSplash(false)} />;

  return (
    <NavigationContainer>
      {sesionActiva ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}