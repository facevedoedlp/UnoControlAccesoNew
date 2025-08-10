// molinetes/api.js - API sin autenticación

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==================== CONFIGURACIÓN ====================
let API_CONFIG = {
    BASE_URL: 'http://10.0.10.30:8000',
    TOKEN: '', // Sin token por defecto
    TIMEOUT: 5000 // 5 segundos para debug más rápido
};

// Cargar configuración desde AsyncStorage
const cargarConfiguracion = async () => {
    try {
        const config = await AsyncStorage.getItem('appConfig');
        if (config) {
            const parsedConfig = JSON.parse(config);
            API_CONFIG.BASE_URL = parsedConfig.molinetesApiUrl || 'http://10.0.10.30:8000';
            API_CONFIG.TOKEN = parsedConfig.molinetesToken || ''; // Puede estar vacío
        }
    } catch (error) {
        console.error('Error cargando configuración de molinetes:', error);
    }
};

// Cargar configuración al inicializar
cargarConfiguracion();

// ==================== UTILIDADES ====================
const crearHeaders = () => {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    // Solo agregar Authorization si hay token configurado
    if (API_CONFIG.TOKEN && API_CONFIG.TOKEN.trim() !== '') {
        headers['Authorization'] = `Bearer ${API_CONFIG.TOKEN}`;
    }

    return headers;
};

const manejarTimeout = (promesa, timeoutMs = API_CONFIG.TIMEOUT) => {
    return Promise.race([
        promesa,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout de conexión')), timeoutMs)
        )
    ]);
};

// ==================== FUNCIONES DE API ====================

/**
 * Consultar código en la API de molinetes
 * @param {string} codigo - DNI o código a consultar
 * @param {string} puerta - Número de puerta (ej: "1;2;3")
 * @param {string} molinete - Número de molinete
 * @param {string} cons - "0" para perímetro, "1" para molinete
 * @param {string} aux - Información auxiliar (opcional)
 * @returns {Object} Resultado de la consulta
 */
/**
 * Consultar código en la API de molinetes
 * @param {string} codigo - DNI o código a consultar
 * @param {string} puerta - Número de puerta (ej: "1;2;3")
 * @param {string} molinete - Número de molinete
 * @param {string} cons - "0" para perímetro, "1" para molinete
 * @param {string} aux - Información auxiliar (opcional)
 * @returns {Object} Resultado de la consulta
 */
export const consultarCodigoMolinetes = async (codigo, puerta = "0;1;2;3;4;5;6;7;8;9;10;12;13;14;15;17;28;57;90;91;100;115;800;801;999", molinete = "1", cons = "0", aux = "") => {
    try {
        // Recargar configuración por si cambió
        await cargarConfiguracion();

        const payload = {
            codigo: codigo.toString(),
            puerta: puerta.toString(), // Usar todas las puertas por defecto
            molinete: molinete.toString(),
            cons: cons.toString(),
            token: API_CONFIG.TOKEN || "app_token",
            aux: aux || `pda_${new Date().getTime()}`
        };

        console.log('Consultando molinetes con payload:', payload);
        console.log('URL:', `${API_CONFIG.BASE_URL}/consulta`);

        const response = await manejarTimeout(
            fetch(`${API_CONFIG.BASE_URL}/consulta`, {
                method: 'POST',
                headers: crearHeaders(),
                body: JSON.stringify(payload)
            })
        );

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Response data:', data);

        // Ahora también obtenemos información adicional del DNI
        let detalleInfo = null;
        try {
            const detalleResponse = await obtenerDetalleCodigo(codigo);
            if (detalleResponse.success) {
                detalleInfo = detalleResponse.detalle;
            }
        } catch (detailError) {
            console.log('No se pudo obtener detalle adicional:', detailError);
        }

        // Procesar respuesta unificada
        return {
            success: true,
            pasa: data.pasa == 1 || data.pasa === true,
            mensaje: data.mensaje_de_respuesta || data.mensaje || 'Sin mensaje',
            color: determinarColor(data),
            detalles: {
                estado: data.mensaje_de_respuesta || 'DESCONOCIDO',
                codigo: codigo,
                puerta: puerta,
                molinete: molinete,
                salida: data.salida || 0,
                aux: data.aux || '',
                // Información adicional si está disponible
                detalle_extra: detalleInfo
            },
            salida: data.salida || false,
            raw_response: data
        };

    } catch (error) {
        console.error('Error consultando molinetes:', error);
        
        return {
            success: false,
            pasa: false,
            mensaje: 'ERROR DE CONEXIÓN',
            color: '#F44336',
            error: error.message,
            detalles: {
                estado: 'ERROR',
                codigo: codigo
            }
        };
    }
};

/**
 * Obtener estadísticas por puerta
 * @returns {Object} Estadísticas de todas las puertas
 */
export const obtenerEstadisticasPuertas = async () => {
    try {
        await cargarConfiguracion();

        console.log('Obteniendo estadísticas de:', `${API_CONFIG.BASE_URL}/pasoxpuerta`);

        const response = await manejarTimeout(
            fetch(`${API_CONFIG.BASE_URL}/pasoxpuerta`, {
                method: 'GET',
                headers: crearHeaders()
            })
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('Estadísticas obtenidas:', data);

        // Formatear las estadísticas
        const estadisticas = Array.isArray(data) ? data : Object.entries(data).map(([puerta, cantidad]) => ({
            puerta: puerta,
            cantidad: cantidad
        }));

        return {
            success: true,
            estadisticas: estadisticas
        };

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        return {
            success: false,
            error: error.message,
            estadisticas: []
        };
    }
};

/**
 * Obtener detalle de un código específico
 * @param {string} codigo - Código a consultar
 * @returns {Object} Detalle del código
 */
export const obtenerDetalleCodigo = async (codigo) => {
    try {
        await cargarConfiguracion();

        const url = `${API_CONFIG.BASE_URL}/detalle_codigo?codigo=${encodeURIComponent(codigo)}`;
        console.log('Obteniendo detalle de:', url);

        const response = await manejarTimeout(
            fetch(url, {
                method: 'GET',
                headers: crearHeaders()
            })
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('Detalle obtenido:', data);

        return {
            success: true,
            detalle: data
        };

    } catch (error) {
        console.error('Error obteniendo detalle:', error);
        return {
            success: false,
            error: error.message,
            detalle: null
        };
    }
};

/**
 * Probar la conexión con la API de molinetes
 * @returns {Object} Resultado de la prueba de conexión
 */
export const probarConexionMolinetes = async () => {
    try {
        await cargarConfiguracion();

        console.log('Probando conexión a:', API_CONFIG.BASE_URL);

        // Intentar obtener estadísticas como test de conectividad
        const response = await manejarTimeout(
            fetch(`${API_CONFIG.BASE_URL}/pasoxpuerta`, {
                method: 'GET',
                headers: crearHeaders()
            }),
            5000 // Timeout más corto para prueba de conexión
        );

        if (response.ok) {
            return {
                success: true,
                url: API_CONFIG.BASE_URL,
                status: response.status,
                mensaje: 'Conexión exitosa'
            };
        } else {
            throw new Error(`HTTP ${response.status}`);
        }

    } catch (error) {
        console.error('Error probando conexión:', error);
        return {
            success: false,
            url: API_CONFIG.BASE_URL,
            error: error.message,
            mensaje: 'Error de conexión'
        };
    }
};

// ==================== UTILIDADES AUXILIARES ====================

/**
 * Determinar color basado en la respuesta de la API
 * @param {Object} data - Respuesta de la API
 * @returns {string} Color hexadecimal
 */
const determinarColor = (data) => {
    // Usar el color que devuelve tu API
    if (data.color) {
        switch (data.color.toUpperCase()) {
            case 'VERDE': return '#4CAF50';
            case 'ROJO': return '#F44336';
            case 'AMARILLO': return '#FF9800';
            default: return '#FF9800';
        }
    }
    
    // Fallback al método anterior
    if (data.pasa == 1 || data.pasa === true) {
        return '#4CAF50'; // Verde - Acceso autorizado
    } else if (data.pasa == 0 || data.pasa === false) {
        return '#F44336'; // Rojo - Acceso denegado
    } else {
        return '#FF9800'; // Naranja - Estado incierto
    }
};

/**
 * Actualizar configuración de la API
 * @param {Object} nuevaConfig - Nueva configuración
 */
export const actualizarConfiguracionAPI = (nuevaConfig) => {
    if (nuevaConfig.molinetesApiUrl) {
        API_CONFIG.BASE_URL = nuevaConfig.molinetesApiUrl;
    }
    if (nuevaConfig.molinetesToken !== undefined) {
        API_CONFIG.TOKEN = nuevaConfig.molinetesToken;
    }
    console.log('Configuración de API actualizada:', API_CONFIG);
};

// ==================== EXPORTACIONES ADICIONALES ====================

// Exportar configuración actual (para debugging)
export const obtenerConfiguracionActual = () => ({
    ...API_CONFIG
});

// Exportar función para test manual
export const testearConexion = async () => {
    console.log('=== TEST DE CONEXIÓN MOLINETES ===');
    console.log('URL:', API_CONFIG.BASE_URL);
    console.log('Token:', API_CONFIG.TOKEN ? '[CONFIGURADO]' : '[NO CONFIGURADO]');
    
    const resultado = await probarConexionMolinetes();
    console.log('Resultado:', resultado);
    
    return resultado;
};