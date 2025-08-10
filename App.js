import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  Modal,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import styles from './src/styles/AppStyles';
import { 
  consultarCodigoMolinetes, 
  obtenerEstadisticasPuertas, 
  obtenerDetalleCodigo, 
  probarConexionMolinetes 
} from './molinetes/api.js';

// ==================== CONFIGURACIÓN DE CÁMARA ====================
let Camera, CameraView;
let isCameraAvailable = false;

try {
  const ExpoCamera = require('expo-camera');
  Camera = ExpoCamera.Camera;
  CameraView = ExpoCamera.CameraView;
  isCameraAvailable = true;
  console.log('expo-camera cargado correctamente');
} catch (error) {
  console.log('expo-camera no disponible:', error.message);
  Camera = null;
  CameraView = null;
  isCameraAvailable = false;
}

const { width } = Dimensions.get('window');

export default function App() {
  // ==================== ESTADOS PRINCIPALES ====================
  
  // Estados de configuración
  const [isPerimetro, setIsPerimetro] = useState(true);
  const [eventoId, setEventoId] = useState('');
  const [apiUrl, setApiUrl] = useState('https://gestion.estudiantesdelaplata.com/api/EventosGestionv2');
  const [puerta, setPuerta] = useState('1');
  const [molinete, setMolinete] = useState('1');
  const [isConfigured, setIsConfigured] = useState(false);

  // Estados para perímetros
  const [perimetroSeleccionado, setPerimetroSeleccionado] = useState('TODOS');
  const [modoVisitante, setModoVisitante] = useState(false);

  // Estados para API de molinetes
  const [usarApiMolinetes, setUsarApiMolinetes] = useState(false);
  const [molinetesApiUrl, setMolinetesApiUrl] = useState('http://10.0.10.30:8000');
  const [molinetesToken, setMolinetesToken] = useState('');

  // Estados de UI
  const [showConfig, setShowConfig] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [codigoInput, setCodigoInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estados de resultado UNIFICADO
  const [resultado, setResultado] = useState({
    mensaje: 'INGRESE CÓDIGO O DNI',
    color: '#808080',
    detalles: null
  });

  // Estados para base de datos local
  const [baseLocal, setBaseLocal] = useState([]);
  const [fechaDescarga, setFechaDescarga] = useState('');
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Estados para autenticación
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Referencias
  const inputRef = useRef(null);
  const cameraRef = useRef(null);

  // ==================== CONFIGURACIÓN DE PERÍMETROS ====================
  const PERIMETROS = {
    BOSQUE: {
      nombre: 'Bosque',
      puertas: ['2', '3', '4', '5', '6', '7', '8', '9', '10'],
      icono: '🌳'
    },
    VIP: {
      nombre: 'VIP',
      puertas: ['1', 'VIP'],
      icono: '👑'
    },
    ZONA_ALTA: {
      nombre: 'Zona Alta',
      puertas: ['17', '18', '19', '20'],
      icono: '🔢'
    },
    CODO: {
      nombre: 'Codo',
      puertas: ['CODO'],
      icono: '🥤'
    },
    TODOS: {
      nombre: 'Todos los Perímetros',
      puertas: [],
      icono: '🌐'
    }
  };

  // ==================== FUNCIONES DE VERSIÓN ====================

  const getAppVersion = () => {
    const version = Constants.expoConfig?.version || Constants.manifest?.version || '0.8.0';
    const buildNumber = Platform.OS === 'ios' 
      ? Constants.expoConfig?.ios?.buildNumber || '1'
      : Constants.expoConfig?.android?.versionCode || 8;

    return {
      version: version,
      buildNumber: buildNumber,
      fullVersion: `${version} (${buildNumber})`,
      platform: Platform.OS.toUpperCase()
    };
  };

  const mostrarInfoVersion = () => {
    const versionInfo = getAppVersion();
    const buildDate = Constants.expoConfig?.extra?.buildDate || new Date().toLocaleDateString();
    
    Alert.alert(
      '📱 Información de la Aplicación',
      `UNO - Control de Acceso\n\n` +
      `📦 Versión: ${versionInfo.version}\n` +
      `🔨 Build: ${versionInfo.buildNumber}\n` +
      `📱 Plataforma: ${versionInfo.platform}\n` +
      `📅 Fecha: ${buildDate}\n` +
      `⚙️ Expo: ${Constants.expoVersion || 'N/A'}`,
      [{ text: 'OK', onPress: () => focusInput() }]
    );
  };

  // ==================== FUNCIONES DE FOCUS AUTOMÁTICO ====================
  
  const focusInput = () => {
    // Solo hacer focus si estamos en la pantalla principal (no en configuración)
    if (!showConfig && !showScanner && isConfigured) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const resetearPantalla = () => {
    setCodigoInput('');
    focusInput();
  };

  // Focus automático al tocar la pantalla (solo en pantalla principal)
  const handleScreenPress = () => {
    if (!showConfig && !showScanner && isConfigured) {
      focusInput();
    }
  };

  useEffect(() => {
    cargarConfiguracion();
    getCameraPermissions();
    // Focus inicial
    focusInput();
  }, []);

  // Focus automático cuando se cierra scanner
  useEffect(() => {
    if (!showScanner) {
      focusInput();
    }
  }, [showScanner]);

  // ==================== FUNCIONES DE BASE OFFLINE CORREGIDAS ====================

  const cargarBaseLocal = async () => {
    try {
      if (!eventoId) {
        console.log('No hay eventoId configurado');
        return;
      }
      
      // Primero intentar cargar desde AsyncStorage (base ya descargada)
      const baseData = await AsyncStorage.getItem(`baseLocal_${eventoId}`);
      if (baseData) {
        const parsedBase = JSON.parse(baseData);
        setBaseLocal(parsedBase.entradas || []);
        setFechaDescarga(parsedBase.fechaDescarga || '');
        setTotalEntradas(parsedBase.entradas ? parsedBase.entradas.length : 0);
        console.log(`Base local cargada: ${parsedBase.entradas ? parsedBase.entradas.length : 0} entradas`);
        return parsedBase.entradas || [];
      } else {
        console.log('No hay base local guardada');
        return [];
      }
    } catch (error) {
      console.error('Error cargando base local:', error);
      return [];
    }
  };

  // ==================== FUNCIÓN DE DESCARGA DE BASE OFFLINE ====================

  const descargarBaseOffline = async () => {
    if (!eventoId) {
      Alert.alert('Error', 'Debe configurar el ID del evento primero');
      return;
    }

    if (!username || !password) {
      Alert.alert('Error', 'Debe configurar usuario y contraseña');
      return;
    }

    Alert.alert(
      'Descargar Base Completa',
      'Esto descargará todas las entradas del evento para uso offline. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Descargar', 
          onPress: async () => {
            setIsDownloading(true);
            setDownloadProgress(0);

            try {
              // Paso 1: Login si no estamos autenticados
              if (!isLoggedIn) {
                console.log('Iniciando login...');
                const loginSuccess = await loginToAPI(username, password);
                if (!loginSuccess) {
                  setIsDownloading(false);
                  return;
                }
              }

              console.log('Iniciando descarga de base completa...');
              setDownloadProgress(20);
              
              // Paso 2: Construir URL de descarga
              const url = `${apiUrl}/getConsultaGeneralControlAccesoHabilitado?estadoingreso=2&eventoid=${eventoId}`;
              console.log('URL de descarga:', url);
              
              // Paso 3: Realizar petición
              const response = await fetch(url, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-cache',
                },
                credentials: 'include'
              });

              setDownloadProgress(50);

              if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
              }

              const responseText = await response.text();
              
              // Verificar si recibimos HTML (login page)
              if (responseText.trim().startsWith('<!DOCTYPE html>') || responseText.includes('<form')) {
                setIsLoggedIn(false);
                throw new Error('Sesión expirada, necesita reautenticación');
              }

              setDownloadProgress(70);

              // Paso 4: Parsear respuesta
              let data;
              try {
                data = JSON.parse(responseText);
              } catch (parseError) {
                console.error('Error parsing JSON:', parseError);
                throw new Error('La respuesta del servidor no es JSON válido');
              }

              console.log(`Datos recibidos: ${Array.isArray(data) ? data.length : 'No es array'}`);

              if (!data || !Array.isArray(data) || data.length === 0) {
                throw new Error('No se recibieron datos válidos del servidor');
              }

              setDownloadProgress(90);

              // Paso 5: Preparar datos para guardar
              const baseData = {
                entradas: data,
                fechaDescarga: new Date().toLocaleString('es-AR'),
                eventoId: eventoId,
                totalEntradas: data.length,
                version: '1.0'
              };

              // Paso 6: Guardar en AsyncStorage
              await AsyncStorage.setItem(`baseLocal_${eventoId}`, JSON.stringify(baseData));
              
              // Paso 7: Actualizar estado local
              setBaseLocal(data);
              setFechaDescarga(baseData.fechaDescarga);
              setTotalEntradas(data.length);

              setDownloadProgress(100);

              Alert.alert(
                'Descarga Completa', 
                `Se descargaron ${data.length.toLocaleString()} entradas correctamente.\n\nAhora puede usar la app sin conexión.`
              );

              console.log(`Base offline guardada exitosamente: ${data.length} entradas`);

            } catch (error) {
              console.error('Error descargando base:', error);
              Alert.alert('Error', `No se pudo descargar la base: ${error.message}`);
            } finally {
              setIsDownloading(false);
              setDownloadProgress(0);
            }
          }
        }
      ]
    );
  };

  // ==================== FUNCIÓN DE LOGIN MEJORADA ====================

  const loginToAPI = async (user, pass) => {
    try {
      console.log('Intentando login...');
      
      // Paso 1: Obtener página de login para extraer token
      const loginPageResponse = await fetch('https://gestion.estudiantesdelaplata.com/Account/Login', {
        method: 'GET',
        credentials: 'include'
      });
      
      const loginPageText = await loginPageResponse.text();
      
      // Paso 2: Extraer token de verificación
      const tokenMatch = loginPageText.match(/name="__RequestVerificationToken".*?value="([^"]+)"/);
      const verificationToken = tokenMatch ? tokenMatch[1] : '';
      
      if (!verificationToken) {
        throw new Error('No se pudo obtener el token de verificación');
      }
      
      // Paso 3: Preparar datos de login
      const loginData = new FormData();
      loginData.append('tipoDocId', 'DNI');
      loginData.append('UserName', user);
      loginData.append('Password', pass);
      loginData.append('__RequestVerificationToken', verificationToken);
      
      // Paso 4: Enviar login
      const loginResponse = await fetch('https://gestion.estudiantesdelaplata.com/Account/Login', {
        method: 'POST',
        body: loginData,
        credentials: 'include',
        redirect: 'manual' // Importante para manejar redirects
      });
      
      console.log('Login response status:', loginResponse.status);
      
      if (loginResponse.status === 302 || loginResponse.status === 200) {
        setIsLoggedIn(true);
        console.log('Login exitoso');
        return true;
      } else {
        throw new Error('Credenciales incorrectas');
      }
      
    } catch (error) {
      console.error('Error en login:', error);
      Alert.alert('Error de Login', error.message);
      return false;
    }
  };

  // ==================== FUNCIÓN PARA CONSULTAR BASE LOCAL ====================

  const consultarLocal = (dni) => {
    console.log(`Consultando DNI ${dni} en base local de ${baseLocal.length} entradas`);
    
    const entrada = baseLocal.find(ticket => 
      ticket.beneficiario_identificador === dni
    );

    if (entrada) {
      console.log('Entrada encontrada en base local:', entrada);
      mostrarResultadoUnificado({
        ...entrada,
        dni: dni,
        origen: 'offline'
      });
      return true;
    } else {
      console.log('DNI no encontrado en base local');
      setResultado({
        mensaje: '✖ DNI NO ENCONTRADO ✖',
        color: '#F44336',
        detalles: { 
          dni: dni, 
          estado: 'OFFLINE',
          nombre: 'No encontrado en base local',
          sector: 'Sin datos'
        }
      });
      return false;
    }
  };

  // ==================== FUNCIÓN MARCAR ENTRADA COMO USADA ====================
  const marcarEntradaComoUsada = async (dni) => {
    try {
      const updatedBase = baseLocal.map(ticket => {
        if (ticket.beneficiario_identificador === dni) {
          return {
            ...ticket,
            ingreso_evento: true,
            ingreso_evento_hora: new Date().toISOString()
          };
        }
        return ticket;
      });

      setBaseLocal(updatedBase);

      // Guardar en AsyncStorage
      const baseData = {
        entradas: updatedBase,
        fechaDescarga: fechaDescarga,
        eventoId: eventoId,
        totalEntradas: updatedBase.length,
        version: '1.0'
      };

      await AsyncStorage.setItem(`baseLocal_${eventoId}`, JSON.stringify(baseData));
      console.log(`Entrada marcada como usada para DNI: ${dni}`);
    } catch (error) {
      console.error('Error marcando entrada como usada:', error);
    }
  };

  // ==================== FUNCIÓN CONSULTARAPI MEJORADA ====================

  const consultarAPI = async (dni) => {
    if (!eventoId) {
      Alert.alert('Error', 'Debe configurar el ID del evento primero');
      return;
    }

    if (!dni || dni.length < 6) {
      Alert.alert('Error', 'Ingrese un DNI válido (mínimo 6 dígitos)');
      return;
    }

    // Si usamos API de molinetes, usar esa función
    if (usarApiMolinetes) {
      consultarApiMolinetes(dni);
      return;
    }

    // Si tenemos base local, usar esa primero
    if (baseLocal.length > 0) {
      console.log('Usando base local para consultar');
      consultarLocal(dni);
      return;
    }

    // Si no hay base local, consultar API online
    console.log('Consultando API online...');
    
    if (!isLoggedIn && (username && password)) {
      const loginSuccess = await loginToAPI(username, password);
      if (!loginSuccess) {
        return;
      }
    }

    setIsLoading(true);
    setResultado({
      mensaje: 'Consultando...',
      color: '#FFA500',
      detalles: null
    });

    try {
      const url = `${apiUrl}/getConsultaGeneralControlAccesoHabilitado?estadoingreso=2&eventoid=${eventoId}&documento=${dni}`;
      console.log('Consultando URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const responseText = await response.text();
      
      if (responseText.trim().startsWith('<!DOCTYPE html>')) {
        setIsLoggedIn(false);
        throw new Error('Sesión expirada');
      }
      
      const data = JSON.parse(responseText);
      
      if (data && Array.isArray(data) && data.length > 0) {
        const entradaEncontrada = data.find(ticket => ticket.beneficiario_identificador == dni);
        
        if (entradaEncontrada) {
          mostrarResultadoUnificado({
            ...entradaEncontrada,
            dni: dni,
            origen: 'online'
          });
        } else {
          setResultado({
            mensaje: '✖ DNI NO POSEE TICKETS ✖',
            color: '#F44336',
            detalles: { 
              dni: dni, 
              estado: 'ONLINE',
              nombre: 'No encontrado',
              sector: 'Sin tickets válidos'
            }
          });
        }
      } else {
        setResultado({
          mensaje: '✖ DNI NO POSEE TICKETS ✖',
          color: '#F44336',
          detalles: { 
            dni: dni,
            estado: 'ONLINE',
            nombre: 'No encontrado',
            sector: 'Sin datos'
          }
        });
      }
    } catch (error) {
      console.error('Error en consulta:', error);
      setResultado({
        mensaje: '✖ ERROR DE CONEXIÓN ✖',
        color: '#F44336',
        detalles: { 
          dni: dni,
          estado: 'ERROR',
          nombre: 'Error de conexión',
          sector: error.message
        }
      });
    } finally {
      setIsLoading(false);
      
      // Auto-reset después de 5 segundos
      setTimeout(() => {
        setResultado({
          mensaje: 'INGRESE CÓDIGO O DNI',
          color: '#808080',
          detalles: null
        });
      }, 5000);
    }
  };

  // ==================== FUNCIONES AUXILIARES PARA ESTADÍSTICAS ====================

  const mostrarEstadisticasOffline = () => {
    if (baseLocal.length === 0) {
      Alert.alert(
        'Sin datos',
        'No hay base offline descargada.\n\nPrimero descargue la base para ver estadísticas.',
        [
          { text: 'Descargar Ahora', onPress: descargarBaseOffline },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
      return;
    }

    // Calcular estadísticas
    const entradasValidadas = baseLocal.filter(entrada => 
      entrada.estadoingreso === 2 || entrada.ingresohabilitado === 'CONFIRMADO'
    ).length;

    const entradasUsadas = baseLocal.filter(entrada => 
      entrada.ingreso_evento === true || entrada.ingreso_evento_hora
    ).length;

    const entradasDisponibles = entradasValidadas - entradasUsadas;

    Alert.alert(
      '📊 Estadísticas Base Offline',
      `📦 Total entradas: ${totalEntradas.toLocaleString()}\n` +
      `✅ Entradas validadas: ${entradasValidadas.toLocaleString()}\n` +
      `🎫 Entradas usadas: ${entradasUsadas.toLocaleString()}\n` +
      `🆕 Entradas disponibles: ${entradasDisponibles.toLocaleString()}\n\n` +
      `📅 Descargada: ${fechaDescarga}\n` +
      `🎪 Evento: ${eventoId}`,
      [
        { text: 'Actualizar Base', onPress: descargarBaseOffline },
        { text: 'Cerrar', style: 'cancel' }
      ]
    );
  };

  const limpiarBaseOffline = () => {
    if (baseLocal.length === 0) {
      Alert.alert('Sin datos', 'No hay base offline para limpiar');
      return;
    }

    Alert.alert(
      '⚠️ Confirmar Limpieza',
      '¿Está seguro que desea eliminar la base offline?\n\nEsta acción no se puede deshacer y requerirá conexión para consultas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(`baseLocal_${eventoId}`);
              setBaseLocal([]);
              setFechaDescarga('');
              setTotalEntradas(0);
              
              Alert.alert('Base Eliminada', 'La base offline ha sido eliminada correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la base offline');
            }
          }
        }
      ]
    );
  };

  const validarIntegridadBase = () => {
    if (baseLocal.length === 0) {
      Alert.alert('Sin datos', 'No hay base offline para validar');
      return;
    }

    let entradasCorruptas = 0;
    let entradasValidas = 0;
    
    baseLocal.forEach(entrada => {
      if (entrada.beneficiario_identificador && entrada.estadoingreso !== undefined) {
        entradasValidas++;
      } else {
        entradasCorruptas++;
      }
    });

    Alert.alert(
      '🔍 Validación de Integridad',
      `✅ Entradas válidas: ${entradasValidas}\n` +
      `❌ Entradas corruptas: ${entradasCorruptas}\n` +
      `📦 Total: ${baseLocal.length}\n\n` +
      `${entradasCorruptas === 0 ? '✅ Base íntegra' : '⚠️ Recomendado redescargar'}`,
      [
        entradasCorruptas > 0 && { text: 'Redescargar', onPress: descargarBaseOffline },
        { text: 'OK', style: 'cancel' }
      ].filter(Boolean)
    );
  };

  // ==================== FUNCIONES DE CONFIGURACIÓN ====================
  const cargarConfiguracion = async () => {
    try {
      const config = await AsyncStorage.getItem('appConfig');
      if (config) {
        const parsedConfig = JSON.parse(config);
        setIsPerimetro(parsedConfig.isPerimetro ?? true);
        setEventoId(parsedConfig.eventoId ?? '');
        setApiUrl(parsedConfig.apiUrl ?? 'https://gestion.estudiantesdelaplata.com/api/EventosGestionv2');
        setPuerta(parsedConfig.puerta ?? '1');
        setMolinete(parsedConfig.molinete ?? '1');
        setIsConfigured(parsedConfig.isConfigured ?? false);
        setUsername(parsedConfig.username ?? '');
        setPassword(parsedConfig.password ?? '');
        
        // Configuración API molinetes
        setUsarApiMolinetes(parsedConfig.usarApiMolinetes ?? false);
        setMolinetesApiUrl(parsedConfig.molinetesApiUrl ?? 'http://10.0.10.30:8000');
        setMolinetesToken(parsedConfig.molinetesToken ?? '');
        
        // Configuración de perímetros
        setPerimetroSeleccionado(parsedConfig.perimetroSeleccionado ?? 'TODOS');
        setModoVisitante(parsedConfig.modoVisitante ?? false);
      }
      
      await cargarBaseLocal();
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  };

  const guardarConfiguracion = async () => {
    try {
      const config = {
        isPerimetro,
        eventoId,
        apiUrl,
        puerta,
        molinete,
        isConfigured: true,
        username,
        password,
        usarApiMolinetes,
        molinetesApiUrl,
        molinetesToken,
        perimetroSeleccionado,
        modoVisitante
      };
      await AsyncStorage.setItem('appConfig', JSON.stringify(config));
      setIsConfigured(true);
      setShowConfig(false);
      
      await cargarBaseLocal();
      
      // Focus después de cerrar configuración
      setTimeout(() => focusInput(), 300);
      
      Alert.alert('Éxito', 'Configuración guardada correctamente');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };

  const mostrarConfiguracion = () => {
    if (!isConfigured) {
      setShowConfig(true);
      return;
    }

    Alert.prompt(
      'Contraseña requerida',
      'Ingrese la contraseña para acceder a la configuración:',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => setTimeout(() => focusInput(), 100) },
        {
          text: 'Aceptar',
          onPress: (password) => {
            if (password === 'root') {
              setShowConfig(true);
            } else {
              Alert.alert('Error', 'Contraseña incorrecta', [
                { text: 'OK', onPress: () => setTimeout(() => focusInput(), 100) }
              ]);
            }
          }
        }
      ],
      'secure-text'
    );
  };

  // ==================== FUNCIONES DE CÁMARA ====================
  const getCameraPermissions = async () => {
    try {
      if (!isCameraAvailable || !Camera) {
        console.log('expo-camera no disponible en esta plataforma');
        setHasPermission(false);
        return;
      }
      
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      console.log('Camera permission status:', status);
    } catch (error) {
      console.log('Error requesting camera permissions:', error);
      setHasPermission(false);
    }
  };

  const handleBarcodeScanned = (scanningResult) => {
    if (scanningResult.data) {
      console.log('Código escaneado:', scanningResult.data);
      setShowScanner(false);
      procesarCodigo(scanningResult.data);
    }
  };

  // ==================== FUNCIONES DE PROCESAMIENTO ====================
  const filtrarDNI = (barcode) => {
    // Detectar JWT (DNI nuevo)
    if (/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+$/.test(barcode)) {
      try {
        const parts = barcode.split('.');
        if (parts.length === 3) {
          let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) {
            base64 += '=';
          }
          const payload = JSON.parse(atob(base64));
          return payload.dni || barcode;
        }
      } catch (e) {
        console.log('Error parsing JWT:', e);
      }
    }

    // Detectar formato de DNI con @
    const datadni = barcode.split('@');
    if (datadni.length === 8 || datadni.length === 9) {
      return datadni[4].replace(/\D/g, '').replace(/^0+/, '');
    } else if (datadni.length > 9) {
      return datadni[1].replace(/\D/g, '').replace(/^0+/, '');
    } else if (datadni.length === 2) {
      return datadni[0].replace(/\D/g, '').replace(/^0+/, '');
    }

    return barcode.replace(/\D/g, '').replace(/^0+/, '');
  };

  const procesarCodigo = (codigo) => {
    if (codigo.length < 3) {
      Alert.alert('Error', 'Ingrese un código válido', [
        { text: 'OK', onPress: () => resetearPantalla() }
      ]);
      return;
    }
    
    const dni = filtrarDNI(codigo);
    consultarAPI(dni);
  };

  // ==================== FUNCIÓN DE RESULTADO UNIFICADO ====================
  
  const mostrarResultadoUnificado = (datos) => {
    let mensaje = '';
    let color = '';
    let estadoFinal = '';
    let nombreFinal = '';
    let sectorFinal = '';
    let horaFinal = '';
    let dniFinal = datos.dni || 'Sin DNI';

    // LÓGICA UNIFICADA - Misma validación para ambos modos
    if (datos.origen === 'molinetes') {
      // Para API molinetes, determinar estado basado en respuesta
      if (datos.mensaje && datos.mensaje.toLowerCase().includes('quemado')) {
        // Entrada ya utilizada
        mensaje = '❌ ENTRADA YA UTILIZADA ❌';
        color = '#F44336';
        estadoFinal = 'USADA';
      } else if (datos.mensaje && datos.mensaje.toLowerCase().includes('puerta incorrecta')) {
        // Perímetro incorrecto
        mensaje = '⚠️ PERÍMETRO INCORRECTO ⚠️';
        color = '#FF9800';
        estadoFinal = 'PERÍMETRO INCORRECTO';
      } else if (datos.pasa) {
        // Acceso autorizado
        mensaje = isPerimetro ? '✅ ACCESO AUTORIZADO ✅' : '✅ ENTRADA VÁLIDA ✅';
        color = '#4CAF50';
        estadoFinal = 'VÁLIDA';
      } else {
        // Acceso denegado genérico
        mensaje = '❌ ACCESO DENEGADO ❌';
        color = '#F44336';
        estadoFinal = 'NO VÁLIDA';
      }

      // Datos específicos de molinetes
      nombreFinal = 'Sin datos de nombre'; // API molinetes no devuelve nombre
      sectorFinal = `Puerta: ${datos.puerta}`;
      horaFinal = new Date().toLocaleTimeString();
      
    } else {
      // LÓGICA para base local/offline
      const yaIngreso = datos.ingreso_evento === true || datos.ingreso_evento_hora;
      
      if (yaIngreso) {
        mensaje = '❌ ENTRADA YA UTILIZADA ❌';
        color = '#F44336';
        estadoFinal = 'USADA';
      } else if (datos.estadoingreso === 2 || datos.ingresohabilitado === 'CONFIRMADO') {
        // Verificar perímetro usando la misma lógica
        const validacionPerimetro = validarPerimetroEntrada(datos);
        
        if (validacionPerimetro.valido) {
          mensaje = isPerimetro ? '✅ ACCESO AUTORIZADO ✅' : '✅ ENTRADA VÁLIDA ✅';
          color = '#4CAF50';
          estadoFinal = 'VÁLIDA';
          
          // En modo molinete, marcar como usada si es válida
          if (!isPerimetro) {
            marcarEntradaComoUsada(datos.dni);
          }
        } else {
          mensaje = '⚠️ PERÍMETRO INCORRECTO ⚠️';
          color = '#FF9800';
          estadoFinal = 'PERÍMETRO INCORRECTO';
        }
      } else {
        mensaje = '❌ ENTRADA NO VÁLIDA ❌';
        color = '#F44336';
        estadoFinal = 'NO VÁLIDA';
      }

      nombreFinal = datos.beneficiario_denominacion || datos.titular_denominacion || 'Sin nombre';
      sectorFinal = datos.sector_detalle || datos.sector_nombre || datos.sector || 'Sin sector';
      horaFinal = datos.ingreso_evento_hora ? 
        new Date(datos.ingreso_evento_hora).toLocaleString() : 
        new Date().toLocaleTimeString();
    }

    // Configurar resultado unificado
    setResultado({
      mensaje: mensaje,
      color: color,
      detalles: {
        dni: dniFinal,
        nombre: nombreFinal,
        estado: estadoFinal,
        sector: sectorFinal,
        hora: horaFinal,
        // Información adicional de perímetro si es incorrecto
        perimetroActual: perimetroSeleccionado !== 'TODOS' ? PERIMETROS[perimetroSeleccionado]?.nombre : 'Todos',
        // Datos adicionales para debugging
        raw: datos
      }
    });

    // Limpiar input y preparar para siguiente escaneo
    resetearPantalla();
  };

  // ==================== VALIDACIÓN DE PERÍMETRO ====================
  const validarPerimetroEntrada = (entrada) => {
    if (perimetroSeleccionado === 'TODOS') {
      return { valido: true, motivo: 'ACCESO_TOTAL' };
    }

    const perimetroActual = PERIMETROS[perimetroSeleccionado];
    if (!perimetroActual) {
      return { valido: true, motivo: 'PERIMETRO_DESCONOCIDO' };
    }

    let puertas_entrada = [];
    
    if (entrada.puerta) {
      const puertaStr = entrada.puerta.toString().toUpperCase();
      const numerosPuerta = puertaStr.match(/\d+/g) || [];
      puertas_entrada = [...puertas_entrada, ...numerosPuerta];
      
      if (puertaStr.includes('VIP')) puertas_entrada.push('VIP');
      if (puertaStr.includes('CODO')) puertas_entrada.push('CODO');
    }

    if (entrada.sector_detalle) {
      const sectorStr = entrada.sector_detalle.toString().toUpperCase();
      const numerosSector = sectorStr.match(/\d+/g) || [];
      puertas_entrada = [...puertas_entrada, ...numerosSector];
      
      if (sectorStr.includes('VIP')) puertas_entrada.push('VIP');
      if (sectorStr.includes('CODO')) puertas_entrada.push('CODO');
    }

    if (modoVisitante) {
      if (puertas_entrada.includes('CODO')) {
        puertas_entrada = ['VISITANTE'];
      }
      if (puertas_entrada.includes('14')) {
        puertas_entrada = ['COMITIVA_VISITANTE'];
      }
    }

    const coincide = puertas_entrada.some(puerta => 
      perimetroActual.puertas.includes(puerta)
    );

    return { valido: coincide };
  };

  const consultarApiMolinetes = async (codigo) => {
    setIsLoading(true);
    setResultado({
      mensaje: 'Consultando...',
      color: '#FFA500',
      detalles: null
    });

    try {
      const resultado = await consultarCodigoMolinetes(
        codigo,
        puerta,
        molinete,
        isPerimetro ? "0" : "1"
      );

      if (resultado.success) {
        mostrarResultadoUnificado({
          dni: codigo,
          origen: 'molinetes',
          pasa: resultado.pasa,
          estado: resultado.mensaje,
          color: resultado.color,
          puerta: puerta,
          mensaje: resultado.mensaje
        });
      } else {
        mostrarResultadoUnificado({
          dni: codigo,
          origen: 'molinetes',
          pasa: false,
          estado: 'ERROR DE CONEXIÓN',
          color: '#F44336',
          mensaje: 'Error de conexión'
        });
      }
    } catch (error) {
      console.error('Error consultando molinetes:', error);
      mostrarResultadoUnificado({
        dni: codigo,
        origen: 'molinetes',
        pasa: false,
        estado: 'ERROR DE MOLINETES',
        color: '#F44336',
        mensaje: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== FUNCIONES DE ADMINISTRACIÓN ====================
  const mostrarPanelAdmin = () => {
    Alert.prompt(
      'Panel de Administración',
      'Ingrese la contraseña de administrador:',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => focusInput() },
        {
          text: 'Aceptar',
          onPress: (password) => {
            if (password === 'root') {
              mostrarMenuAdminCompleto();
            } else {
              Alert.alert('Error', 'Contraseña incorrecta', [
                { text: 'OK', onPress: () => focusInput() }
              ]);
            }
          }
        }
      ],
      'secure-text'
    );
  };

  // Función mejorada para el menú de administración
  const mostrarMenuAdminCompleto = () => {
    const opciones = [
      { text: 'Cancelar', style: 'cancel', onPress: () => focusInput() }
    ];

    // Versión (siempre disponible)
    opciones.unshift(
      { text: '📱 Ver Versión', onPress: mostrarInfoVersion }
    );

    if (usarApiMolinetes) {
      // Opciones para API Molinetes
      opciones.unshift(
        { text: '🔌 Probar Conexión Molinetes', onPress: async () => {
          try {
            const resultado = await probarConexionMolinetes();
            Alert.alert(
              resultado.success ? 'Conexión Exitosa' : 'Error de Conexión',
              resultado.success ? 
                `✅ Conectado correctamente a:\n${resultado.url}` :
                `❌ No se pudo conectar a:\n${resultado.url}\n\nError: ${resultado.error}`,
              [{ text: 'OK', onPress: () => focusInput() }]
            );
          } catch (error) {
            Alert.alert('Error', 'Error al probar la conexión', [
              { text: 'OK', onPress: () => focusInput() }
            ]);
          }
        }}
      );
      
      opciones.unshift(
        { text: '📊 Ver Estadísticas Molinetes', onPress: async () => {
          try {
            const stats = await obtenerEstadisticasPuertas();
            if (stats.success) {
              Alert.alert(
                '📊 Estadísticas Molinetes',
                `Información del sistema de molinetes:\n\n${JSON.stringify(stats.data, null, 2)}`,
                [{ text: 'OK', onPress: () => focusInput() }]
              );
            } else {
              throw new Error(stats.error);
            }
          } catch (error) {
            Alert.alert('Error', 'No se pudieron obtener las estadísticas', [
              { text: 'OK', onPress: () => focusInput() }
            ]);
          }
        }}
      );
    } else {
      // Opciones para base offline
      if (baseLocal.length > 0) {
        opciones.unshift(
          { text: '🗑️ Limpiar Base Offline', onPress: limpiarBaseOffline },
          { text: '🔍 Validar Integridad', onPress: validarIntegridadBase },
          { text: '📊 Ver Estadísticas', onPress: mostrarEstadisticasOffline }
        );
      }
      
      opciones.unshift(
        { text: '☁️ Actualizar Base Offline', onPress: descargarBaseOffline }
      );
    }

    Alert.alert(
      '🔧 Panel de Administración',
      'Seleccione una opción:',
      opciones
    );
  };

  // ==================== FUNCIÓN PARA RENDERIZAR BARRA DE PROGRESO ====================
  const renderProgressBar = () => {
    if (!isDownloading) return null;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${downloadProgress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Descargando... {downloadProgress}%
        </Text>
      </View>
    );
  };

  // ==================== COMPONENTES DE RENDERIZADO ====================
  
  const renderResultadoPrincipal = () => (
    <View style={[styles.resultCard, { backgroundColor: resultado.color }]}>
      <Text style={styles.resultText}>{resultado.mensaje}</Text>

      {resultado.detalles && (
        <View style={styles.detallesContainer}>
          {/* DNI */}
          <Text style={styles.detalleText}>🆔 DNI: {resultado.detalles.dni}</Text>
          
          {/* Nombre */}
          <Text style={styles.detalleText}>👤 {resultado.detalles.nombre}</Text>
          
          {/* Estado */}
          <Text style={styles.detalleText}>
            🎫 Estado: {resultado.detalles.estado.toUpperCase()}
          </Text>
          
          {/* Sector */}
          <Text style={styles.detalleText}>🏟️ {resultado.detalles.sector}</Text>
          
          {/* Información de perímetro si está seleccionado */}
          {resultado.detalles.perimetroActual && perimetroSeleccionado !== 'TODOS' && (
            <Text style={styles.detalleText}>📍 Perímetro: {resultado.detalles.perimetroActual}</Text>
          )}

          {/* Mensaje de perímetro incorrecto */}
          {resultado.detalles.estado === 'PERÍMETRO INCORRECTO' && (
            <Text style={[styles.detalleText, {color: '#FF5722', fontWeight: 'bold'}]}>
              ⚠️ Debe ir a otro perímetro
            </Text>
          )}
          
          {/* Hora */}
          <Text style={styles.detalleText}>⏰ {resultado.detalles.hora}</Text>
        </View>
      )}
    </View>
  );

  const renderBaseLocalInfoCompleta = () => {
    return (
      <View style={styles.baseLocalContainerCompact}>
        <View style={styles.baseLocalHeaderCompact}>
          <Text style={styles.baseLocalTitleCompact}>
            {PERIMETROS[perimetroSeleccionado]?.icono} {PERIMETROS[perimetroSeleccionado]?.nombre}
            {modoVisitante ? ' 🚌' : ' 🏠'}
          </Text>
        </View>
        <Text style={styles.baseLocalInfoCompact}>
          {usarApiMolinetes ? 
            `🖥️ ONLINE - ${molinetesApiUrl}` :
            baseLocal.length > 0 ? 
              `☁️ OFFLINE - ${totalEntradas.toLocaleString()} entradas (${fechaDescarga})` :
              '⚠️ Sin base offline - Toque Admin > Actualizar Base'
          }
        </Text>
        {/* Mostrar barra de progreso durante descarga */}
        {renderProgressBar()}
      </View>
    );
  };

  // ==================== CONFIGURACIÓN INICIAL ====================
  const renderConfiguracionInicial = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#F44336" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>UNO - CONTROL DE ACCESO</Text>
        <Text style={styles.headerSubtitle}>Configuración Inicial</Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.configContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.configContent}>
          
          <View style={styles.logoContainer}>
            <Ionicons name="settings" size={80} color="#F44336" />
            <Text style={styles.welcomeTitle}>Bienvenido</Text>
            <Text style={styles.welcomeSubtitle}>Configure la aplicación para comenzar</Text>
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Sistema de consulta</Text>
            <View style={styles.modeButtons}>
              <TouchableOpacity
                style={[styles.modeButton, !usarApiMolinetes && styles.modeButtonActive]}
                onPress={() => setUsarApiMolinetes(false)}
              >
                <Text style={[styles.modeButtonText, !usarApiMolinetes && styles.modeButtonTextActive]}>
                  API EVENTOS
                </Text>
                <Text style={styles.modeButtonSubtext}>Sistema original</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modeButton, usarApiMolinetes && styles.modeButtonActive]}
                onPress={() => setUsarApiMolinetes(true)}
              >
                <Text style={[styles.modeButtonText, usarApiMolinetes && styles.modeButtonTextActive]}>
                  API MOLINETES
                </Text>
                <Text style={styles.modeButtonSubtext}>Sistema Python</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Modo de operación</Text>
            <View style={styles.modeButtons}>
              <TouchableOpacity
                style={[styles.modeButton, isPerimetro && styles.modeButtonActive]}
                onPress={() => setIsPerimetro(true)}
              >
                <Text style={[styles.modeButtonText, isPerimetro && styles.modeButtonTextActive]}>
                  PERÍMETRO
                </Text>
                <Text style={styles.modeButtonSubtext}>Solo validación</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modeButton, !isPerimetro && styles.modeButtonActive]}
                onPress={() => setIsPerimetro(false)}
              >
                <Text style={[styles.modeButtonText, !isPerimetro && styles.modeButtonTextActive]}>
                  MOLINETE
                </Text>
                <Text style={styles.modeButtonSubtext}>Controla ingreso</Text>
              </TouchableOpacity>
            </View>
          </View>

          {!usarApiMolinetes && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ID del Evento</Text>
                <TextInput
                  style={styles.modalInput}
                  value={eventoId}
                  onChangeText={setEventoId}
                  placeholder="Ej: 386"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Usuario (para API)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Usuario del sistema"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contraseña (para API)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Contraseña del sistema"
                  secureTextEntry={true}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>URL de la API</Text>
                <TextInput
                  style={styles.modalInput}
                  value={apiUrl}
                  onChangeText={setApiUrl}
                  placeholder="URL base de la API"
                />
              </View>
            </>
          )}

          {usarApiMolinetes && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>URL API Molinetes</Text>
                <TextInput
                  style={styles.modalInput}
                  value={molinetesApiUrl}
                  onChangeText={setMolinetesApiUrl}
                  placeholder="http://10.0.10.30:8000"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Token de Autenticación</Text>
                <TextInput
                  style={styles.modalInput}
                  value={molinetesToken}
                  onChangeText={setMolinetesToken}
                  placeholder="Token de autenticación"
                />
              </View>
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Puerta</Text>
            <TextInput
              style={styles.modalInput}
              value={puerta}
              onChangeText={setPuerta}
              placeholder="0;1;2;3;4;5;6;7;8;9;10;12;13;14;15;17;28;57;90;91;100;115;800;801;999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Molinete</Text>
            <TextInput
              style={styles.modalInput}
              value={molinete}
              onChangeText={setMolinete}
              placeholder="1"
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, (!eventoId && !usarApiMolinetes) && styles.saveButtonDisabled]}
            onPress={guardarConfiguracion}
            disabled={!eventoId && !usarApiMolinetes}
          >
            <Text style={styles.saveButtonText}>INICIAR APLICACIÓN</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  // ==================== SCANNER MODAL ====================
  const renderModalScanner = () => (
    <Modal visible={showScanner} animationType="slide">
      <View style={styles.scannerContainer}>
        {hasPermission === null ? (
          <View style={styles.scannerPlaceholder}>
            <Ionicons name="camera-outline" size={80} color="white" />
            <Text style={styles.scannerPlaceholderText}>
              📷 Solicitando permisos...
            </Text>
          </View>
        ) : hasPermission === false ? (
          <View style={styles.scannerPlaceholder}>
            <Ionicons name="camera-off-outline" size={80} color="white" />
            <Text style={styles.scannerPlaceholderText}>
              📷 Sin acceso a la cámara
            </Text>
            <TouchableOpacity 
              style={styles.manualInputButton}
              onPress={() => setShowScanner(false)}
            >
              <Text style={styles.manualInputButtonText}>
                Usar Input Manual
              </Text>
            </TouchableOpacity>
          </View>
        ) : !isCameraAvailable || !CameraView ? (
          <View style={styles.scannerPlaceholder}>
            <Ionicons name="construct-outline" size={80} color="white" />
            <Text style={styles.scannerPlaceholderText}>
              📱 Scanner no disponible
            </Text>
            <Text style={styles.scannerPlaceholderSubtext}>
              {Platform.OS === 'ios' 
                ? 'Instale expo-camera para usar el scanner'
                : 'Error cargando módulo de cámara'
              }
            </Text>
            <TouchableOpacity 
              style={styles.manualInputButton}
              onPress={() => setShowScanner(false)}
            >
              <Text style={styles.manualInputButtonText}>
                Usar Input Manual
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr", "pdf417", "datamatrix", "code128", "code39"],
              }}
            />
            
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerFrame}>
                <View style={styles.scannerCorner} />
                <View style={[styles.scannerCorner, styles.scannerCornerTopRight]} />
                <View style={[styles.scannerCorner, styles.scannerCornerBottomLeft]} />
                <View style={[styles.scannerCorner, styles.scannerCornerBottomRight]} />
              </View>
              <Text style={styles.scannerText}>
                Apunte la cámara hacia el código QR o código de barras
              </Text>
              <TouchableOpacity 
                style={styles.manualInputButton}
                onPress={() => setShowScanner(false)}
              >
                <Text style={styles.manualInputButtonText}>
                  Input Manual
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        
        <TouchableOpacity
          style={styles.closeScannerButton}
          onPress={() => setShowScanner(false)}
        >
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
      </View>
    </Modal>
  );

  // ==================== MODAL CONFIGURACIÓN ====================
  const renderModalConfiguracion = () => (
    <Modal visible={showConfig} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>⚙️ Configuración</Text>
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Perímetro de Control</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.perimetroScroll}>
                {Object.entries(PERIMETROS).map(([key, perimetro]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.perimetroButton,
                      perimetroSeleccionado === key && styles.perimetroButtonActive
                    ]}
                    onPress={() => setPerimetroSeleccionado(key)}
                  >
                    <Text style={styles.perimetroEmoji}>{perimetro.icono}</Text>
                    <Text style={[
                      styles.perimetroText,
                      perimetroSeleccionado === key && styles.perimetroTextActive
                    ]}>
                      {perimetro.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Sistema de consulta</Text>
              <View style={styles.modeButtons}>
                <TouchableOpacity
                  style={[styles.modeButton, !usarApiMolinetes && styles.modeButtonActive]}
                  onPress={() => setUsarApiMolinetes(false)}
                >
                  <Text style={[styles.modeButtonText, !usarApiMolinetes && styles.modeButtonTextActive]}>
                    API EVENTOS
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modeButton, usarApiMolinetes && styles.modeButtonActive]}
                  onPress={() => setUsarApiMolinetes(true)}
                >
                  <Text style={[styles.modeButtonText, usarApiMolinetes && styles.modeButtonTextActive]}>
                    API MOLINETES
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {!usarApiMolinetes && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ID del Evento</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={eventoId}
                    onChangeText={setEventoId}
                    placeholder="Ej: 386"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Usuario (para API)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Usuario del sistema"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Contraseña (para API)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Contraseña del sistema"
                    secureTextEntry={true}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>URL de la API</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={apiUrl}
                    onChangeText={setApiUrl}
                    placeholder="URL base de la API"
                  />
                </View>
              </>
            )}

            {usarApiMolinetes && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>URL API Molinetes</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={molinetesApiUrl}
                    onChangeText={setMolinetesApiUrl}
                    placeholder="http://10.0.10.30:8000"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Token de Autenticación</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={molinetesToken}
                    onChangeText={setMolinetesToken}
                    placeholder="Token de autenticación"
                  />
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Puerta</Text>
              <TextInput
                style={styles.modalInput}
                value={puerta}
                onChangeText={setPuerta}
                placeholder="0;1;2;3;4;5;6;7;8;9;10;12;13;14;15;17;28;57;90;91;100;115;800;801;999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Molinete</Text>
              <TextInput
                style={styles.modalInput}
                value={molinete}
                onChangeText={setMolinete}
                placeholder="1"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowConfig(false);
                  // Focus después de cerrar modal
                  setTimeout(() => focusInput(), 300);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={guardarConfiguracion}
              >
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ==================== COMPONENTE PRINCIPAL ====================
  
  // Si no está configurado, mostrar pantalla de configuración inicial
  if (!isConfigured) {
    return renderConfiguracionInicial();
  }

  // Pantalla principal
  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={1} 
      onPress={handleScreenPress}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#F44336" />
        
        {/* Header minimalista - botones de administración */}
        <View style={styles.headerMinimal}>
          <TouchableOpacity style={styles.adminButtonMinimal} onPress={mostrarPanelAdmin}>
            <Ionicons name="shield-checkmark" size={26} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.configButtonMinimal} onPress={mostrarConfiguracion}>
            <Ionicons name="settings" size={26} color="white" />
          </TouchableOpacity>
        </View>

        {/* Marca de agua */}
        <View style={styles.watermark}>
          <Text style={styles.watermarkText}>
            {isPerimetro ? 'PERIMETRO' : 'MOLINETE'}
          </Text>
        </View>

        {/* Contenido principal */}
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          
          {/* Estado de la base local - USANDO LA FUNCIÓN COMPLETA */}
          {renderBaseLocalInfoCompleta()}

          {/* Input de código - SIEMPRE FOCUS */}
          <View style={styles.inputContainer}>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={() => setShowScanner(true)}
            >
              <Ionicons name="qr-code" size={30} color="#666" />
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="DNI o QR"
              value={codigoInput}
              onChangeText={setCodigoInput}
              onSubmitEditing={() => procesarCodigo(codigoInput)}
              autoCapitalize="none"
              keyboardType="numeric"
              returnKeyType="search"
              autoFocus={true}
              blurOnSubmit={false}
              onBlur={() => {
                // Solo hacer focus automático si estamos en pantalla principal
                if (!showConfig && !showScanner && isConfigured) {
                  focusInput();
                }
              }} // Volver a hacer focus si pierde el focus
            />
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={() => procesarCodigo(codigoInput)}
            >
              <Ionicons name="search" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Resultado principal UNIFICADO */}
          {renderResultadoPrincipal()}

          {/* Indicador de carga */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Consultando...</Text>
            </View>
          )}
        </ScrollView>

        {/* Versión clickeable en la parte inferior */}
        <TouchableOpacity 
          style={styles.versionContainer}
          onPress={mostrarInfoVersion}
        >
          <Text style={styles.versionText}>
            v{getAppVersion().version} ({getAppVersion().buildNumber})
          </Text>
        </TouchableOpacity>

        {/* Modales */}
        {renderModalConfiguracion()}
        {renderModalScanner()}
      </SafeAreaView>
    </TouchableOpacity>
  );
}