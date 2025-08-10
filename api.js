import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import axios from 'axios';

const DEFAULT_API_URL = 'https://estudiantesdelaplata.com/wp-json/formapi/v1';
const DEFAULT_API_KEY = 'TaGMenU60M0cHMRWgD7zB5dDlJCodbEx';

// Configuración dinámica de la API
const getConfig = async () => {
  try {
    const stored = await AsyncStorage.getItem('appConfig');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        apiUrl: parsed.kitApiUrl || DEFAULT_API_URL,
        apiKey: parsed.kitApiKey || DEFAULT_API_KEY,
      };
    }
  } catch (err) {
    console.error('Error leyendo config:', err);
  }

  return {
    apiUrl: DEFAULT_API_URL,
    apiKey: DEFAULT_API_KEY,
  };
};

// Consultar participante
export const consultarParticipante = async (dni) => {
  const config = await getConfig();

  try {
    const response = await axios.get(`${config.apiUrl}/consultar-participante/${dni}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
      withCredentials: true,
    });

    const data = response.data;
    console.log('🔍 Participante consultado:', data);

    // Verificar si la inscripción está completa
    const completa = data?.participante?.inscripcion_completa;
    if (completa !== true) {
      Alert.alert(
        'Participante en proceso',
        '⚠️ Este usuario aún no completó su inscripción. No se puede entregar el kit.'
      );
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Error consultando participante:', error);
    Alert.alert(
      'Error',
      'Ocurrió un error al consultar el participante. Verificá tu conexión o intentá nuevamente.'
    );
    throw error;
  }
};

// Entregar kit
export const entregarKit = async (dni, userId) => {
  const config = await getConfig();

  try {
    const response = await axios.post(
      `${config.apiUrl}/entregar-kit`,
      { dni },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.apiKey,
          'X-User-Id': String(userId),
        },
        withCredentials: true,
      }
    );

    const data = response.data;

    return {
      success: true,
      mensaje: data.message,
      numero_pechera: data.participante?.numero_pechera ?? null,
    };
  } catch (error) {
    console.error('❌ Error entregando kit:', error);

    const message =
      error.response?.data?.message || 'Ocurrió un error al entregar el kit';

    return { error: message };
  }
};

// Obtener estadísticas
export const obtenerEstadisticasKit = async () => {
  const config = await getConfig();

  try {
    const response = await axios.get(`${config.apiUrl}/estadisticas-kit`, {
      headers: {
        'X-API-Key': config.apiKey,
      },
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    throw error;
  }
};
