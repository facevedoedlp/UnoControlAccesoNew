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
import { getAppVersion } from './src/utils/version.js';
// ==================== CONFIGURACIÓN DE CÁMARA ====================
let Camera, CameraView;
let isCameraAvailable = false;

try {
  const ExpoCamera = require('expo-camera');
  Camera = ExpoCamera.Camera;
  CameraView = ExpoCamera.CameraView;
  isCameraAvailable = true;
} catch (error) {
  Camera = null;
  CameraView = null;
  isCameraAvailable = false;
}

const { width } = Dimensions.get('window');

// ==================== CONFIGURACIÓN DE PERÍMETROS ====================
const PERIMETROS = {
  BOSQUE: {
    nombre: 'LAGO & 1 Y 54',
    puertas: ['2', '3', '4', '5', '6', '7', '8', '9', '10'],
    icono: '🌳'
  },
  VIP: {
    nombre: '2 Y 55',
    puertas: ['1', 'VIP'],
    icono: '👑'
  },
  ZONA_ALTA: {
    nombre: 'POPULAR 57',
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

// ==================== FUNCIONES DE UTILIDAD ====================
function eliminarEspacios(cadena) {
  return cadena ? cadena.split(' ').join('') : '';
}

const validarComoC = (cadena) => {
  if (!cadena) return { dni: '', tipo: 1 };
  
  let extraido = null;
  let tipo = 1;

  try {
    const regex1 = /^@([^@]+)@/;
    const match1 = cadena.match(regex1);
    if (match1) {
      extraido = match1[1];
      tipo = 0;
    }

    if (!extraido) {
      const regex2 = /^([^@]*@){4}([^@]+)@/;
      const match2 = cadena.match(regex2);
      if (match2) {
        extraido = match2[2];
        tipo = 0;
      }
    }

    if (!extraido) {
      extraido = cadena;
      tipo = 1;
    }

    let procesada = eliminarEspacios(extraido);

    if (procesada && procesada.length > 0 && (procesada[0] === 'M' || procesada[0] === 'F' || procesada[0] === '0')) {
      procesada = procesada.slice(1);
    }

    let dni = procesada ? procesada.slice(0, 254) : '';

    return { dni, tipo };
  } catch (error) {
    return { dni: cadena || '', tipo: 1 };
  }
};

const aplicarValidacionQRDinamico = (dni) => {
  if (!dni) return '';
  
  try {
    const soloNumeros = dni.replace(/\D/g, '');
    
    if (soloNumeros.length >= 7 && soloNumeros.length <= 15) {
      let dniProcesado = soloNumeros;
      
      if (dniProcesado.length > 8 && dniProcesado.length < 15) {
        dniProcesado = dniProcesado.slice(0, -4);
      }
      
      return dniProcesado;
    }
    
    return dni;
  } catch (error) {
    return dni;
  }
};

const filtrarDNI = (barcode, modoOffline = false) => {
  if (!barcode) return '';
  
  try {
    // Verificar si es JWT
    if (/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+$/.test(barcode)) {
      try {
        const parts = barcode.split('.');
        if (parts.length === 3) {
          let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) {
            base64 += '=';
          }
          const payload = JSON.parse(atob(base64));
          const dniFromJWT = payload.dni || barcode;
          
          if (modoOffline) {
            return aplicarValidacionQRDinamico(dniFromJWT);
          }
          
          return dniFromJWT;
        }
      } catch (e) {
        // JWT parsing failed, continue with C logic
      }
    }

    const resultado = validarComoC(barcode);
    let dniFinal = resultado.dni;

    if (modoOffline) {
      dniFinal = aplicarValidacionQRDinamico(dniFinal);
    } else {
      const soloNumeros = dniFinal ? dniFinal.replace(/\D/g, '') : '';
      if (soloNumeros.length >= 6 && soloNumeros.length <= 15) {
        dniFinal = soloNumeros;
      }
    }

    return dniFinal || '';
  } catch (error) {
    return barcode || '';
  }
};



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

  const [showMenuHamburguesa, setShowMenuHamburguesa] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [actionAfterAuth, setActionAfterAuth] = useState('');

  // Referencias
  const inputRef = useRef(null);
  const cameraRef = useRef(null);

  // ==================== FUNCIÓN DE COLORES DINÁMICOS ====================
  
  const getAppColors = () => {
    if (usarApiMolinetes) {
      // API MOLINETES - Colores ROJOS (quema entradas)
      return {
        primary: '#F44336',        // Rojo principal
        primaryDark: '#D32F2F',    // Rojo oscuro
        primaryLight: '#FFCDD2',   // Rojo claro
        headerBg: '#F44336',       // Header rojo
        headerText: 'white',       // Texto blanco en header
        statusBar: '#D32F2F',      // Status bar rojo oscuro
        watermarkText: '#F44336',  // Watermark rojo
        buttonBg: 'rgba(255,255,255,0.1)', // Botones semi-transparentes blancos
      };
    } else {
      // API EVENTOS - Colores BLANCOS (modo offline/perímetro)
      return {
        primary: '#FFFFFF',        // Blanco principal
        primaryDark: '#F5F5F5',    // Gris muy claro
        primaryLight: '#FAFAFA',   // Blanco hueso
        headerBg: '#FFFFFF',       // Header blanco
        headerText: '#333333',     // Texto oscuro en header
        statusBar: '#E0E0E0',      // Status bar gris claro
        watermarkText: '#666666',  // Watermark gris
        buttonBg: 'rgba(0,0,0,0.1)', // Botones semi-transparentes negros
      };
    }
  };

  // ==================== FUNCIONES DE ALMACENAMIENTO ====================
  
  const limpiarCacheAntesDeSave = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const keysToDelete = keys.filter(key => 
        key.includes('temp_') || 
        key.includes('cache_') || 
        key.includes('old_') ||
        (key.includes('baseLocal_') && key !== `baseLocal_${eventoId}`)
      );
      
      if (keysToDelete.length > 0) {
        await AsyncStorage.multiRemove(keysToDelete);
      }
      
      if (global.gc) {
        global.gc();
      }
      
      return true;
    } catch (error) {
      return false;
    }
  };

  const guardarConEstrategias = async (data) => {
    const estrategias = [
      {
        nombre: 'Guardado Normal',
        ejecutar: async () => {
          const baseData = {
            entradas: data,
            fechaDescarga: new Date().toLocaleString('es-AR'),
            eventoId: eventoId,
            totalEntradas: data.length,
            version: '1.0'
          };
          await AsyncStorage.setItem(`baseLocal_${eventoId}`, JSON.stringify(baseData));
          return baseData;
        }
      },
      {
        nombre: 'Guardado Comprimido',
        ejecutar: async () => {
          const datosComprimidos = data.map(entrada => ({
            dni: entrada.beneficiario_identificador,
            est: entrada.estadoingreso,
            nom: entrada.beneficiario_denominacion?.substring(0, 30) || '',
            sec: entrada.sector_detalle?.substring(0, 15) || entrada.sector || '',
            ing: entrada.ingreso_evento || false,
            hor: entrada.ingreso_evento_hora || null
          }));
          
          const baseData = {
            entradas: datosComprimidos,
            fechaDescarga: new Date().toLocaleString('es-AR'),
            eventoId: eventoId,
            totalEntradas: datosComprimidos.length,
            version: '2.0',
            comprimido: true
          };
          await AsyncStorage.setItem(`baseLocal_${eventoId}`, JSON.stringify(baseData));
          return baseData;
        }
      },
      {
        nombre: 'Guardado Ultra-Comprimido',
        ejecutar: async () => {
          const datosUltraComprimidos = data.map(entrada => ({
            d: entrada.beneficiario_identificador,
            e: entrada.estadoingreso,
            n: entrada.beneficiario_denominacion?.substring(0, 20) || '',
            i: entrada.ingreso_evento || false
          }));
          
          const baseData = {
            entradas: datosUltraComprimidos,
            fechaDescarga: new Date().toLocaleString('es-AR'),
            eventoId: eventoId,
            totalEntradas: datosUltraComprimidos.length,
            version: '3.0',
            ultraComprimido: true
          };
          await AsyncStorage.setItem(`baseLocal_${eventoId}`, JSON.stringify(baseData));
          return baseData;
        }
      }
    ];

    for (const estrategia of estrategias) {
      try {
        const baseData = await estrategia.ejecutar();
        
        setBaseLocal(baseData.entradas);
        setFechaDescarga(baseData.fechaDescarga);
        setTotalEntradas(baseData.entradas.length);
        
        return baseData;
      } catch (error) {
        if (estrategia === estrategias[estrategias.length - 1]) {
          throw error;
        }
      }
    }
  };

  // ==================== FUNCIONES DE FOCUS Y NAVEGACIÓN ====================
  
  const focusInput = () => {
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

  const handleScreenPress = () => {
    if (!showConfig && !showScanner && isConfigured) {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // ==================== FUNCIONES DE VALIDACIÓN ====================
  
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

  const mostrarResultadoUnificado = (datos) => {
    let mensaje = '';
    let color = '';
    let estadoFinal = '';
    let nombreFinal = '';
    let sectorFinal = '';
    let horaFinal = '';
    let dniFinal = datos.dni || 'Sin DNI';

    if (datos.origen === 'molinetes') {
      if (datos.mensaje && datos.mensaje.toLowerCase().includes('quemado')) {
        mensaje = '❌ ENTRADA YA UTILIZADA ❌';
        color = '#F44336';
        estadoFinal = 'USADA';
      } else if (datos.mensaje && datos.mensaje.toLowerCase().includes('puerta incorrecta')) {
        mensaje = '⚠️ PERÍMETRO INCORRECTO ⚠️';
        color = '#FF9800';
        estadoFinal = 'PERÍMETRO INCORRECTO';
      } else if (datos.pasa) {
        mensaje = '✅ ENTRADA VÁLIDA - ACCESO PERMITIDO ✅';
        color = '#4CAF50';
        estadoFinal = 'VÁLIDA Y QUEMADA';
      } else {
        mensaje = '❌ ACCESO DENEGADO ❌';
        color = '#F44336';
        estadoFinal = 'NO VÁLIDA';
      }

      nombreFinal = 'Sin datos de nombre';
      sectorFinal = `Puerta: ${datos.puerta} | Molinete: ${molinete}`;
      horaFinal = new Date().toLocaleTimeString();
      
    } else {
      const yaIngreso = datos.ingreso_evento === true || datos.ingreso_evento_hora;
      
      if (yaIngreso) {
        mensaje = '❌ ENTRADA YA UTILIZADA ❌';
        color = '#F44336';
        estadoFinal = 'USADA';
      } else if (datos.estadoingreso === 2 || datos.ingresohabilitado === 'CONFIRMADO') {
        const validacionPerimetro = validarPerimetroEntrada(datos);
        
        if (validacionPerimetro.valido) {
          if (isPerimetro) {
            mensaje = '✅ ACCESO AUTORIZADO ✅';
            color = '#4CAF50';
            estadoFinal = 'VÁLIDA - PERÍMETRO';
          } else {
            mensaje = '✅ ENTRADA VÁLIDA - ACCESO PERMITIDO ✅';
            color = '#4CAF50';
            estadoFinal = 'VÁLIDA Y QUEMADA';
            
            if (datos.origen === 'offline') {
              marcarEntradaComoUsada(datos.dni);
            } else {
              estadoFinal = 'VÁLIDA - SIN QUEMAR';
            }
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

    setResultado({
      mensaje: mensaje,
      color: color,
      detalles: {
        dni: dniFinal,
        nombre: nombreFinal,
        estado: estadoFinal,
        sector: sectorFinal,
        hora: horaFinal,
        perimetroActual: perimetroSeleccionado !== 'TODOS' ? PERIMETROS[perimetroSeleccionado]?.nombre : 'Todos',
        raw: datos
      }
    });

    resetearPantalla();
  };

  // ==================== FUNCIONES DE CONSULTA ====================
  
  const procesarCodigo = (codigo) => {
    // Delay imperceptible para evitar procesamiento inmediato
    setTimeout(() => {
      // Validaciones básicas mejoradas
      if (!codigo) {
        return; // No hacer nada si está vacío
      }
      
      // Limpiar espacios y caracteres extraños
      const codigoLimpio = codigo.toString().trim();
      
      // Validar longitud mínima más estricta
      if (codigoLimpio.length < 3) {
        Alert.alert('Error', 'Ingrese un código válido (mínimo 3 caracteres)', [
          { text: 'OK', onPress: () => resetearPantalla() }
        ]);
        return;
      }
      
      // Validar que no sean solo espacios o caracteres especiales
      if (!/[a-zA-Z0-9]/.test(codigoLimpio)) {
        Alert.alert('Error', 'El código debe contener al menos un carácter alfanumérico', [
          { text: 'OK', onPress: () => resetearPantalla() }
        ]);
        return;
      }
      
      // Prevenir procesamiento múltiple si ya está cargando
      if (isLoading) {
        return;
      }
      
      const modoOffline = baseLocal.length > 0 && !usarApiMolinetes;
      const dni = filtrarDNI(codigoLimpio, modoOffline);
      
      // Validar DNI procesado
      if (!dni || dni.length < 3) {
        Alert.alert('Error', 'No se pudo procesar el código correctamente', [
          { text: 'OK', onPress: () => resetearPantalla() }
        ]);
        return;
      }
      
      consultarAPI(dni);
    }, 50); // 50ms de delay imperceptible
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

  const consultarLocal = (dni) => {
    const entrada = baseLocal.find(ticket => {
      const dniTicket = ticket.beneficiario_identificador || ticket.dni || ticket.d;
      return dniTicket === dni;
    });

    if (entrada) {
      const entradaExpandida = {
        beneficiario_identificador: entrada.dni || entrada.d || entrada.beneficiario_identificador,
        estadoingreso: entrada.est || entrada.e || entrada.estadoingreso,
        beneficiario_denominacion: entrada.nom || entrada.n || entrada.beneficiario_denominacion || 'Nombre comprimido',
        sector_detalle: entrada.sec || entrada.sector_detalle || 'Sector comprimido',
        ingreso_evento: entrada.ing || entrada.i || entrada.ingreso_evento,
        ingreso_evento_hora: entrada.hor || entrada.ingreso_evento_hora
      };
      
      mostrarResultadoUnificado({
        ...entradaExpandida,
        dni: dni,
        origen: 'offline'
      });
      return true;
    } else {
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

  const consultarAPI = async (dni) => {
    if (!usarApiMolinetes && !eventoId) {
      Alert.alert('Error', 'Debe configurar el ID del evento primero');
      return;
    }

    if (!dni || dni.length < 6) {
      Alert.alert('Error', 'Ingrese un DNI válido (mínimo 6 dígitos)');
      return;
    }

    if (usarApiMolinetes) {
      consultarApiMolinetes(dni);
      return;
    }

    if (baseLocal.length > 0) {
      consultarLocal(dni);
      return;
    }

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
      
      setTimeout(() => {
        setResultado({
          mensaje: 'INGRESE CÓDIGO O DNI',
          color: '#808080',
          detalles: null
        });
      }, 5000);
    }
  };

  // ==================== FUNCIONES DE AUTENTICACIÓN ====================
  
  const loginToAPI = async (user, pass) => {
    try {
      const loginPageResponse = await fetch('https://gestion.estudiantesdelaplata.com/Account/Login', {
        method: 'GET',
        credentials: 'include'
      });
      
      const loginPageText = await loginPageResponse.text();
      
      const tokenMatch = loginPageText.match(/name="__RequestVerificationToken".*?value="([^"]+)"/);
      const verificationToken = tokenMatch ? tokenMatch[1] : '';
      
      if (!verificationToken) {
        throw new Error('No se pudo obtener el token de verificación');
      }
      
      const loginData = new FormData();
      loginData.append('tipoDocId', 'DNI');
      loginData.append('UserName', user);
      loginData.append('Password', pass);
      loginData.append('__RequestVerificationToken', verificationToken);
      
      const loginResponse = await fetch('https://gestion.estudiantesdelaplata.com/Account/Login', {
        method: 'POST',
        body: loginData,
        credentials: 'include',
        redirect: 'manual'
      });
      
      if (loginResponse.status === 302 || loginResponse.status === 200) {
        setIsLoggedIn(true);
        return true;
      } else {
        throw new Error('Credenciales incorrectas');
      }
      
    } catch (error) {
      Alert.alert('Error de Login', error.message);
      return false;
    }
  };

  // ==================== FUNCIONES DE BASE LOCAL ====================
  
  const cargarBaseLocal = async () => {
    try {
      if (!eventoId) {
        return;
      }
      
      const baseData = await AsyncStorage.getItem(`baseLocal_${eventoId}`);
      if (baseData) {
        const parsedBase = JSON.parse(baseData);
        setBaseLocal(parsedBase.entradas || []);
        setFechaDescarga(parsedBase.fechaDescarga || '');
        setTotalEntradas(parsedBase.entradas ? parsedBase.entradas.length : 0);
        return parsedBase.entradas || [];
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  };

  const marcarEntradaComoUsada = async (dni) => {
    try {
      const updatedBase = baseLocal.map(ticket => {
        const dniTicket = ticket.beneficiario_identificador || ticket.dni || ticket.d;
        if (dniTicket === dni) {
          return {
            ...ticket,
            ingreso_evento: true,
            ingreso_evento_hora: new Date().toISOString(),
            ing: true,
            i: true
          };
        }
        return ticket;
      });

      setBaseLocal(updatedBase);

      const baseData = {
        entradas: updatedBase,
        fechaDescarga: fechaDescarga,
        eventoId: eventoId,
        totalEntradas: updatedBase.length,
        version: '1.0'
      };

      await AsyncStorage.setItem(`baseLocal_${eventoId}`, JSON.stringify(baseData));
    } catch (error) {
      // Error handling silenciado para no interrumpir el flujo
    }
  };

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
      'Esto descargará todas las entradas del evento. Se aplicará limpieza automática y compresión si es necesario.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Descargar', 
          onPress: async () => {
            setIsDownloading(true);
            setDownloadProgress(0);

            try {
              await limpiarCacheAntesDeSave();
              setDownloadProgress(5);

              if (!isLoggedIn) {
                const loginSuccess = await loginToAPI(username, password);
                if (!loginSuccess) {
                  setIsDownloading(false);
                  return;
                }
              }

              setDownloadProgress(20);
              
              const url = `${apiUrl}/getConsultaGeneralControlAccesoHabilitado?estadoingreso=2&eventoid=${eventoId}`;
              
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
              
              if (responseText.trim().startsWith('<!DOCTYPE html>') || responseText.includes('<form')) {
                setIsLoggedIn(false);
                throw new Error('Sesión expirada, necesita reautenticación');
              }

              setDownloadProgress(70);

              let data;
              try {
                data = JSON.parse(responseText);
              } catch (parseError) {
                throw new Error('La respuesta del servidor no es JSON válido');
              }

              if (!data || !Array.isArray(data) || data.length === 0) {
                throw new Error('No se recibieron datos válidos del servidor');
              }

              setDownloadProgress(85);

              const baseData = await guardarConEstrategias(data);

              setDownloadProgress(100);

              const tipoCompresion = baseData.ultraComprimido ? 'ultra-comprimida' : 
                                   baseData.comprimido ? 'comprimida' : 'normal';

              Alert.alert(
                'Descarga Completa', 
                `✅ Se descargaron ${data.length.toLocaleString()} entradas correctamente.\n\n` +
                `💾 Datos guardados en versión ${tipoCompresion}.\n` +
                `📱 Ahora puede usar la app sin conexión.`
              );

            } catch (error) {
              Alert.alert(
                'Error de Descarga', 
                `No se pudo descargar la base: ${error.message}\n\n` +
                `💡 Tip: Intente liberar espacio en su dispositivo y vuelva a intentar.`
              );
            } finally {
              setIsDownloading(false);
              setDownloadProgress(0);
            }
          }
        }
      ]
    );
  };

  // ==================== FUNCIONES DE ADMINISTRACIÓN ====================
  
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

    const entradasValidadas = baseLocal.filter(entrada => {
      const estado = entrada.estadoingreso || entrada.est || entrada.e;
      return estado === 2;
    }).length;

    const entradasUsadas = baseLocal.filter(entrada => {
      return entrada.ingreso_evento === true || entrada.ing === true || entrada.i === true || entrada.ingreso_evento_hora;
    }).length;

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
      const dni = entrada.beneficiario_identificador || entrada.dni || entrada.d;
      const estado = entrada.estadoingreso || entrada.est || entrada.e;
      
      if (dni && estado !== undefined) {
        entradasValidas++;
      } else {
        entradasCorruptas++;
      }
    });

    const opcionesBotones = [
      { text: 'OK', style: 'cancel' }
    ];

    if (entradasCorruptas > 0) {
      opcionesBotones.unshift({ text: 'Redescargar', onPress: descargarBaseOffline });
    }

    Alert.alert(
      '🔍 Validación de Integridad',
      `✅ Entradas válidas: ${entradasValidas}\n` +
      `❌ Entradas corruptas: ${entradasCorruptas}\n` +
      `📦 Total: ${baseLocal.length}\n\n` +
      `${entradasCorruptas === 0 ? '✅ Base íntegra' : '⚠️ Recomendado redescargar'}`,
      opcionesBotones
    );
  };

  const mostrarInfoVersion = () => {
    const versionInfo = getAppVersion();
    const buildDate = Constants.expoConfig?.extra?.buildDate || new Date().toLocaleDateString();
    
    Alert.alert(
      '📱 Información de la Aplicación',
      `UNO - Control de Acceso\n\n` +
      `📦 Versión: 0.1.0\n` +
      `🔨 Build: ${versionInfo.buildNumber}\n` +
      `📱 Plataforma: ${versionInfo.platform}\n` +
      `📅 Fecha: ${buildDate}\n` +
      `⚙️ Expo: ${Constants.expoVersion || 'N/A'}`,
      [{ text: 'OK', onPress: () => focusInput() }]
    );
  };

  const mostrarMenuAdminCompleto = () => {
    const opciones = [
      { text: 'Cancelar', style: 'cancel', onPress: () => focusInput() }
    ];

    opciones.unshift(
      { text: '📱 Ver Versión', onPress: mostrarInfoVersion }
    );

    if (usarApiMolinetes) {
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
        
        setUsarApiMolinetes(parsedConfig.usarApiMolinetes ?? false);
        setMolinetesApiUrl(parsedConfig.molinetesApiUrl ?? 'http://10.0.10.30:8000');
        setMolinetesToken(parsedConfig.molinetesToken ?? '');
        
        setPerimetroSeleccionado(parsedConfig.perimetroSeleccionado ?? 'TODOS');
        setModoVisitante(parsedConfig.modoVisitante ?? false);
      }
      
      await cargarBaseLocal();
    } catch (error) {
      // Error handling silenciado
    }
  };

  const guardarConfiguracion = async () => {
    try {
      const modoPerimetro = usarApiMolinetes ? false : isPerimetro;
      
      const config = {
        isPerimetro: modoPerimetro,
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
      
      if (usarApiMolinetes) {
        setIsPerimetro(false);
      }
      
      setIsConfigured(true);
      setShowConfig(false);
      
      await cargarBaseLocal();
      
      setTimeout(() => focusInput(), 300);
      
      Alert.alert('Éxito', 'Configuración guardada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };

  // ==================== FUNCIONES DE CÁMARA ====================
  
  const getCameraPermissions = async () => {
    try {
      if (!isCameraAvailable || !Camera) {
        setHasPermission(false);
        return;
      }
      
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      setHasPermission(false);
    }
  };

  const handleBarcodeScanned = (scanningResult) => {
    if (scanningResult.data) {
      setShowScanner(false);
      procesarCodigo(scanningResult.data);
    }
  };

  // ==================== FUNCIONES DE BOTONES ====================
  
  const handleAdminPress = () => {
    mostrarMenuAdminCompleto();
  };

  const handleConfigPress = () => {
    setShowConfig(true);
  };

  // ==================== COMPONENTES DE RENDERIZADO ====================
  
  const HeaderButton = ({ onPress, iconName, label }) => {
    const colors = getAppColors();
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{
          backgroundColor: colors.buttonBg,
          borderRadius: 30,
          width: 60,
          height: 60,
          justifyContent: 'center',
          alignItems: 'center',
          margin: 10,
        }}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <Ionicons name={iconName} size={24} color={colors.headerText} />
      </TouchableOpacity>
    );
  };

  const renderHeader = () => {
    const colors = getAppColors();
    
    return (
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: colors.headerBg,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      }}>
        
        <HeaderButton
          onPress={handleAdminPress}
          iconName="shield-checkmark"
          label="Admin"
        />

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ 
            color: colors.headerText, 
            fontSize: 18, 
            fontWeight: 'bold' 
          }}>
            UNO - Control de Acceso
          </Text>
          <Text style={{ 
            color: colors.headerText, 
            fontSize: 12, 
            opacity: 0.8 
          }}>
            {usarApiMolinetes ? 'MOLINETES' : 'EVENTOS'}
          </Text>
          {/* NUEVA LÍNEA: Mostrar puerta y molinete cuando está en modo molinete */}
          {usarApiMolinetes && (
            <Text style={{ 
              color: colors.headerText, 
              fontSize: 11, 
              opacity: 0.7,
              fontWeight: 'bold'
            }}>
              P:{puerta} | M:{molinete}
            </Text>
          )}
        </View>

        <HeaderButton
          onPress={handleConfigPress}
          iconName="settings"
          label="Config"
        />
      </View>
    );
  };

  const renderWatermark = () => {
    const colors = getAppColors();
    
    return (
      <View style={[styles.watermark, { 
        backgroundColor: colors.primary === '#FFFFFF' 
          ? 'rgba(0,0,0,0.05)' 
          : 'rgba(255,255,255,0.1)' 
      }]}>
        <Text style={[styles.watermarkText, { 
          color: colors.watermarkText,
          fontWeight: 'bold'
        }]}>
          {usarApiMolinetes ? 'MOLINETES' : (isPerimetro ? 'PERÍMETRO' : 'MOLINETE')}
        </Text>
      </View>
    );
  };

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

  const renderResultadoPrincipal = () => (
    <View style={[styles.resultCard, { backgroundColor: resultado.color }]}>
      <Text style={styles.resultText}>{resultado.mensaje}</Text>

      {resultado.detalles && (
        <View style={styles.detallesContainer}>
          <Text style={styles.detalleText}>🆔 DNI: {resultado.detalles.dni}</Text>
          <Text style={styles.detalleText}>👤 {resultado.detalles.nombre}</Text>
          <Text style={styles.detalleText}>
            🎫 Estado: {resultado.detalles.estado.toUpperCase()}
          </Text>
          <Text style={styles.detalleText}>🏟️ {resultado.detalles.sector}</Text>
          
          {resultado.detalles.perimetroActual && perimetroSeleccionado !== 'TODOS' && (
            <Text style={styles.detalleText}>📍 Perímetro: {resultado.detalles.perimetroActual}</Text>
          )}

          {resultado.detalles.estado === 'PERÍMETRO INCORRECTO' && (
            <Text style={[styles.detalleText, {color: '#FF5722', fontWeight: 'bold'}]}>
              ⚠️ Debe ir a otro perímetro
            </Text>
          )}
          
          <Text style={styles.detalleText}>⏰ {resultado.detalles.hora}</Text>
        </View>
      )}
    </View>
  );

  const renderBaseLocalInfo = () => {
    const tipoConexion = usarApiMolinetes ? 
      `🖥️ MOLINETES` :
      baseLocal.length > 0 ? 
        `☁️ OFFLINE - ${totalEntradas.toLocaleString()} entradas (${fechaDescarga})` :
        '⚠️ Sin base offline - Toque Admin > Actualizar Base';

    return (
      <View style={styles.baseLocalContainerCompact}>
        <View style={styles.baseLocalHeaderCompact}>
          <Text style={styles.baseLocalTitleCompact}>
            {!usarApiMolinetes && PERIMETROS[perimetroSeleccionado]?.icono} {!usarApiMolinetes && PERIMETROS[perimetroSeleccionado]?.nombre}
            {!usarApiMolinetes && (modoVisitante ? ' 🚌' : ' 🏠')}
          </Text>
        </View>
        <Text style={styles.baseLocalInfoCompact}>
          {tipoConexion}
        </Text>
        {renderProgressBar()}
      </View>
    );
  };

  // ==================== MODAL SCANNER ====================
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

  const renderModalConfiguracion = () => (
    <Modal visible={showConfig} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>⚙️ Configuración</Text>
            
            {/* PERÍMETRO - Solo visible con API EVENTOS */}
            {!usarApiMolinetes && (
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
            )}

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
                  <Text style={styles.modeButtonSubtext}>Perímetro/Molinete offline</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modeButton, usarApiMolinetes && styles.modeButtonActive]}
                  onPress={() => setUsarApiMolinetes(true)}
                >
                  <Text style={[styles.modeButtonText, usarApiMolinetes && styles.modeButtonTextActive]}>
                    API MOLINETES
                  </Text>
                  <Text style={styles.modeButtonSubtext}>Molinete automático</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* MODO OPERACIÓN - Solo visible con API EVENTOS */}
            {!usarApiMolinetes && (
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
            )}

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

  const renderConfiguracionInicial = () => {
    const colors = getAppColors();
    
    return (
      <SafeAreaView style={[styles.container, { 
        backgroundColor: colors.primary 
      }]}>
        <StatusBar 
          barStyle={usarApiMolinetes ? "light-content" : "dark-content"} 
          backgroundColor={colors.statusBar} 
        />
        
        <View style={[styles.header, { 
          backgroundColor: colors.headerBg 
        }]}>
          <Text style={[styles.headerTitle, { 
            color: colors.headerText 
          }]}>
            UNO - CONTROL DE ACCESO
          </Text>
          <Text style={[styles.headerSubtitle, { 
            color: colors.headerText,
            opacity: 0.8 
          }]}>
            Configuración
          </Text>
        </View>

        <KeyboardAvoidingView 
          style={styles.configContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.configContent}>
            
            <View style={styles.logoContainer}>
              <Ionicons name="settings" size={80} color={usarApiMolinetes ? "#FFFFFF" : "#F44336"} />
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
                  <Text style={styles.modeButtonSubtext}>Perímetro/Molinete offline</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modeButton, usarApiMolinetes && styles.modeButtonActive]}
                  onPress={() => setUsarApiMolinetes(true)}
                >
                  <Text style={[styles.modeButtonText, usarApiMolinetes && styles.modeButtonTextActive]}>
                    API MOLINETES
                  </Text>
                  <Text style={styles.modeButtonSubtext}>Molinete automático</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* MODO OPERACIÓN - Solo visible con API EVENTOS */}
            {!usarApiMolinetes && (
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
            )}

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
  };

  // ==================== EFFECTS ====================
  
  useEffect(() => {
    cargarConfiguracion();
    getCameraPermissions();
    focusInput();
  }, []);

  useEffect(() => {
    if (!showScanner) {
      focusInput();
    }
  }, [showScanner]);

  // useEffect para mantener el input siempre enfocado
  useEffect(() => {
    const interval = setInterval(() => {
      if (!showConfig && !showScanner && isConfigured && inputRef.current) {
        // Solo hacer focus si no hay otro elemento enfocado
        if (!inputRef.current.isFocused()) {
          inputRef.current.focus();
        }
      }
    }, 1000); // Verificar cada segundo

    return () => clearInterval(interval);
  }, [showConfig, showScanner, isConfigured]);

  // ==================== COMPONENTE PRINCIPAL ====================
  
  if (!isConfigured) {
    return renderConfiguracionInicial();
  }

  const colors = getAppColors();

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { 
        backgroundColor: colors.primary 
      }]}>
        <StatusBar 
          barStyle={usarApiMolinetes ? "light-content" : "dark-content"} 
          backgroundColor={colors.statusBar} 
        />
        
        {renderHeader()}

        {renderWatermark()}

        <ScrollView 
          style={[styles.content, { 
            backgroundColor: colors.primary 
          }]} 
          keyboardShouldPersistTaps="handled"
        >
          
          {/* Removido renderBaseLocalInfo() para liberar espacio */}

          <TouchableOpacity 
            style={{ flex: 1, minHeight: 200 }}
            activeOpacity={1} 
            onPress={handleScreenPress}
          >
            <View style={styles.inputContainer}>
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={() => setShowScanner(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="qr-code" size={30} color="#666" />
              </TouchableOpacity>
              
              {/* AQUÍ ESTÁ EL TextInput QUE FALTABA */}
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                placeholder="DNI o QR"
                value={codigoInput}
                onChangeText={setCodigoInput}
                onSubmitEditing={(event) => {
                  const valor = event.nativeEvent.text || codigoInput;
                  if (valor && valor.trim().length >= 3) {
                    procesarCodigo(valor);
                  }
                }}
                autoCapitalize="none"
                keyboardType="numeric"
                returnKeyType="search"
                autoFocus={true}
                blurOnSubmit={false}
                selectTextOnFocus={true}
                clearButtonMode="while-editing"
                onBlur={() => {
                  if (!showConfig && !showScanner && isConfigured) {
                    focusInput();
                  }
                }}
              />
              
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={() => procesarCodigo(codigoInput)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="search" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {renderResultadoPrincipal()}

            {isLoading && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Consultando...</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* VERSIÓN VISIBLE EN PANTALLA PRINCIPAL */}
        <TouchableOpacity 
          style={{
            position: 'absolute',
            bottom: 100,
            alignSelf: 'center',
            backgroundColor: usarApiMolinetes ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
            paddingHorizontal: 15,
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: usarApiMolinetes ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
            zIndex: 1000,
          }}
          onPress={mostrarInfoVersion}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Text style={{
            fontSize: 14,
            color: usarApiMolinetes ? '#FFFFFF' : '#666666',
            fontWeight: '600',
            opacity: 0.9
          }}>
            v0.1.0
          </Text>
        </TouchableOpacity>

        {renderModalConfiguracion()}
        {renderModalScanner()}
      </SafeAreaView>
    </View>
  );
}