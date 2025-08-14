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
// Corrección en molinetes/api.js

export const consultarCodigoMolinetes = async (codigo, puerta = "1", molinete = "1", cons = "0", aux = "") => {
    try {
        // Recargar configuración por si cambió
        await cargarConfiguracion();

        // VALIDAR Y LIMPIAR PARÁMETROS
        const codigoLimpio = (codigo || '').toString().trim();
        const puertaLimpia = (puerta || '1').toString().trim();
        const molineteLimpio = (molinete || '1').toString().trim();
        const consLimpio = (cons || '0').toString().trim();
        const auxLimpio = aux || `pda_${new Date().getTime()}`;

        // Validaciones básicas
        if (!codigoLimpio) {
            throw new Error('Código no puede estar vacío');
        }

        if (!puertaLimpia) {
            throw new Error('Puerta no puede estar vacía');
        }

        const payload = {
            codigo: codigoLimpio,
            puerta: puertaLimpia,
            molinete: molineteLimpio,
            cons: consLimpio,
            token: API_CONFIG.TOKEN || "app_token",
            aux: auxLimpio
        };

        console.log('=== PAYLOAD MOLINETES ===');
        console.log('URL:', `${API_CONFIG.BASE_URL}/consulta`);
        console.log('Payload completo:', JSON.stringify(payload, null, 2));
        console.log('Headers:', JSON.stringify(crearHeaders(), null, 2));

        const response = await manejarTimeout(
            fetch(`${API_CONFIG.BASE_URL}/consulta`, {
                method: 'POST',
                headers: crearHeaders(),
                body: JSON.stringify(payload)
            })
        );

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));

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
                codigo: codigoLimpio,
                puerta: puertaLimpia,
                molinete: molineteLimpio,
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
                codigo: codigo || 'Sin código'
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
// En molinetes/api.js - Función mejorada para probar conexión

export const probarConexionMolinetes = async () => {
    try {
        await cargarConfiguracion();

        console.log('=== INICIANDO PRUEBA DE CONEXIÓN ===');
        console.log('URL:', API_CONFIG.BASE_URL);
        console.log('Token configurado:', API_CONFIG.TOKEN ? '[SÍ]' : '[NO]');
        console.log('Headers que se enviarán:', JSON.stringify(crearHeaders(), null, 2));

        const startTime = Date.now();
        
        // Intentar obtener estadísticas como test de conectividad
        const response = await manejarTimeout(
            fetch(`${API_CONFIG.BASE_URL}/pasoxpuerta`, {
                method: 'GET',
                headers: crearHeaders()
            }),
            5000 // Timeout más corto para prueba de conexión
        );

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        console.log('=== RESPUESTA RECIBIDA ===');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Tiempo de respuesta:', responseTime + 'ms');
        console.log('Headers de respuesta:', JSON.stringify([...response.headers.entries()], null, 2));

        if (response.ok) {
            const responseText = await response.text();
            console.log('=== CONTENIDO DE LA RESPUESTA ===');
            console.log('Respuesta raw:', responseText);
            
            try {
                const data = JSON.parse(responseText);
                console.log('Respuesta parseada:', JSON.stringify(data, null, 2));
                
                return {
                    success: true,
                    url: API_CONFIG.BASE_URL,
                    status: response.status,
                    responseTime: responseTime,
                    data: data,
                    mensaje: `Conexión exitosa - ${responseTime}ms`
                };
            } catch (parseError) {
                console.log('Error parseando JSON:', parseError);
                return {
                    success: true,
                    url: API_CONFIG.BASE_URL,
                    status: response.status,
                    responseTime: responseTime,
                    rawResponse: responseText,
                    mensaje: `Conexión exitosa pero respuesta no es JSON - ${responseTime}ms`
                };
            }
        } else {
            const errorText = await response.text();
            console.log('=== ERROR EN LA RESPUESTA ===');
            console.log('Error text:', errorText);
            
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

    } catch (error) {
        console.error('=== ERROR DE CONEXIÓN ===');
        console.error('Tipo de error:', error.constructor.name);
        console.error('Mensaje:', error.message);
        console.error('Stack:', error.stack);
        
        return {
            success: false,
            url: API_CONFIG.BASE_URL,
            error: error.message,
            errorType: error.constructor.name,
            mensaje: `Error de conexión: ${error.message}`
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

// AGREGAR ESTA FUNCIÓN AL FINAL DE molinetes/api.js

// AGREGAR AL FINAL DE molinetes/api.js

// Nueva función para testear con un código específico
export const probarConsultaCompleta = async (codigoPrueba = "12345678") => {
    console.log('=== INICIANDO PRUEBA DE CONSULTA COMPLETA ===');
    console.log('Código de prueba:', codigoPrueba);
    
    try {
        const resultado = await consultarCodigoMolinetes(
            codigoPrueba,
            "1", // puerta
            "1", // molinete
            "0", // cons (perímetro)
            "test_desde_app" // aux
        );
        
        console.log('=== RESULTADO DE CONSULTA ===');
        console.log('Success:', resultado.success);
        console.log('Pasa:', resultado.pasa);
        console.log('Mensaje:', resultado.mensaje);
        console.log('Detalles:', JSON.stringify(resultado.detalles, null, 2));
        console.log('Raw response:', JSON.stringify(resultado.raw_response, null, 2));
        
        return resultado;
        
    } catch (error) {
        console.error('=== ERROR EN CONSULTA ===');
        console.error('Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
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