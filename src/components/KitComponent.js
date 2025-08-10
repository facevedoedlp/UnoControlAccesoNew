import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './src/styles/AppStyles';

// Función para verificar y renderizar el estado de entrega de kit
const renderKitDeliveryStatus = (resultado, procesarCodigo) => {
  const [isDeliveringKit, setIsDeliveringKit] = useState(false);
  const [kitStatus, setKitStatus] = useState(null);
  
  // Si no hay detalles o no incluye kit, no mostrar nada
  if (!resultado.detalles || !resultado.detalles.incluye_kit) {
    return null;
  }

  const handleEntregarKit = async () => {
    if (!resultado.detalles.dni) {
      Alert.alert('Error', 'DNI no disponible para entregar kit');
      return;
    }

    Alert.alert(
      'Confirmar Entrega de Kit',
      `¿Confirma la entrega del kit para ${resultado.detalles.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setIsDeliveringKit(true);
            try {
              // Aquí llamarías a tu función entregarKit
              await entregarKit(resultado.detalles.dni);
              
              Alert.alert('Éxito', 'Kit marcado como entregado correctamente');
              
              // Actualizar el estado local
              setKitStatus('entregado');
              
              // Refrescar la consulta para obtener datos actualizados
              if (procesarCodigo) {
                procesarCodigo(resultado.detalles.dni);
              }
              
            } catch (error) {
              console.error('Error entregando kit:', error);
              Alert.alert('Error', 'No se pudo marcar el kit como entregado. Intente nuevamente.');
            } finally {
              setIsDeliveringKit(false);
            }
          }
        }
      ]
    );
  };

  // Determinar el estado actual del kit
  const currentKitStatus = kitStatus || (resultado.detalles.kitEntregado ? 'entregado' : 'pendiente');
  
  return (
    <View style={styles.kitDeliveryContainer}>
      {/* Header del componente kit */}
      <View style={styles.kitDeliveryHeader}>
        <Ionicons name="shirt-outline" size={24} color="#374151" />
        <Text style={styles.kitDeliveryTitle}>ENTREGA DE KIT</Text>
      </View>

      {/* Estado actual del kit */}
      <View style={styles.kitStatusContainer}>
        <View style={[
          styles.kitStatusBadge,
          currentKitStatus === 'entregado' ? styles.kitEntregadoBadge : styles.kitPendienteBadge
        ]}>
          <View style={styles.kitStatusIcon}>
            <Ionicons 
              name={currentKitStatus === 'entregado' ? 'checkmark-circle' : 'time'} 
              size={20} 
              color="white" 
            />
          </View>
          <View>
            <Text style={styles.kitStatusText}>
              {currentKitStatus === 'entregado' ? '✅ KIT ENTREGADO' : '⏳ KIT PENDIENTE'}
            </Text>
            {currentKitStatus === 'entregado' && resultado.detalles.fechaEntregaKit && (
              <Text style={styles.kitDeliveryDate}>
                Entregado: {new Date(resultado.detalles.fechaEntregaKit).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Información adicional del kit */}
      <View style={styles.kitInfoContainer}>
        <View style={styles.kitInfoRow}>
          <Text style={styles.kitInfoLabel}>Participante:</Text>
          <Text style={styles.kitInfoValue}>{resultado.detalles.nombre}</Text>
        </View>
        <View style={styles.kitInfoRow}>
          <Text style={styles.kitInfoLabel}>DNI:</Text>
          <Text style={styles.kitInfoValue}>{resultado.detalles.dni}</Text>
        </View>
        {resultado.detalles.tipoCarrera && (
          <View style={styles.kitInfoRow}>
            <Text style={styles.kitInfoLabel}>Categoría:</Text>
            <Text style={styles.kitInfoValue}>{resultado.detalles.tipoCarrera}</Text>
          </View>
        )}
        {resultado.detalles.distancia && (
          <View style={styles.kitInfoRow}>
            <Text style={styles.kitInfoLabel}>Distancia:</Text>
            <Text style={styles.kitInfoValue}>{resultado.detalles.distancia}</Text>
          </View>
        )}
      </View>

      {/* Botón de entrega (solo si está pendiente) */}
      {currentKitStatus === 'pendiente' && (
        <>
          {isDeliveringKit ? (
            <View style={styles.kitLoadingContainer}>
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text style={styles.kitLoadingText}>Procesando entrega...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.kitDeliveryButton,
                isDeliveringKit && styles.kitDeliveryButtonDisabled
              ]}
              onPress={handleEntregarKit}
              disabled={isDeliveringKit}
            >
              <View style={styles.kitDeliveryButtonIcon}>
                <Ionicons name="checkmark-circle-outline" size={20} color="white" />
              </View>
              <Text style={styles.kitDeliveryButtonText}>
                MARCAR COMO ENTREGADO
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Confirmación de entrega exitosa */}
      {kitStatus === 'entregado' && (
        <View style={styles.kitConfirmationContainer}>
          <Text style={styles.kitConfirmationText}>
            ✅ Kit entregado correctamente
          </Text>
        </View>
      )}
    </View>
  );
};

// Función mejorada para mostrar resultado con kit
const mostrarResultadoConKitMejorado = async (entrada, verificarEntregaKit, urlFormularioDeslinde, verificarEstadoDeslinde, isPerimetro, baseLocal, setResultado, setUltimoEscaneado, setEstadoDeslinde, determinarTipoCarrera, tieneCategoriasCarrera) => {
  const monto = parseFloat(entrada.monto) || 0;
  const tipoCarrera = determinarTipoCarrera(monto);
  const dni = entrada.beneficiario_identificador || entrada.dni;
  
  let mensajeFinal = '';
  let colorFinal = '';
  
  // Verificar estado del kit si incluye kit
  let infoKit = null;
  if (tipoCarrera && tipoCarrera.incluye_kit && dni) {
    try {
      infoKit = await verificarEntregaKit(dni);
    } catch (error) {
      console.error('Error verificando kit:', error);
    }
  }
  
  // Verificar estado del deslinde si hay URL configurada
  let infoEstadoDeslinde = null;
  if (urlFormularioDeslinde && dni) {
    infoEstadoDeslinde = await verificarEstadoDeslinde(dni);
    setEstadoDeslinde(infoEstadoDeslinde);
  }

  // Determinar mensaje y color según el estado del deslinde
  if (infoEstadoDeslinde) {
    switch (infoEstadoDeslinde.state) {
      case 1: // Registro completo y deslinde firmado
        if (isPerimetro) {
          mensajeFinal = '✔ ENTRADA VÁLIDA ✔';
          colorFinal = '#4CAF50';
        } else {
          mensajeFinal = '✔ ACCESO PERMITIDO ✔';
          colorFinal = '#4CAF50';
        }
        break;
      case 2: // Registro completo pero falta firmar deslinde
        mensajeFinal = '⚠️ FALTA FIRMAR DESLINDE ⚠️';
        colorFinal = '#FF9800';
        break;
      case 3: // Registro iniciado pero incompleto
        mensajeFinal = '⚠️ REGISTRO INCOMPLETO ⚠️';
        colorFinal = '#FF9800';
        break;
      default: // DNI no encontrado o error
        mensajeFinal = '✖ VERIFICAR INFORMACIÓN ✖';
        colorFinal = '#F44336';
        break;
    }
  } else {
    // Comportamiento anterior si no hay verificación de deslinde
    if (isPerimetro) {
      mensajeFinal = '✔ ENTRADA VÁLIDA ✔';
      colorFinal = '#4CAF50';
    } else {
      mensajeFinal = '✔ ACCESO PERMITIDO ✔';
      colorFinal = '#4CAF50';
    }
  }

  const detallesResultado = {
    // Datos básicos
    nombre: entrada.beneficiario_denominacion || 'Sin nombre',
    dni: dni,
    
    // Datos del evento
    sector: entrada.sector || entrada.sectorid || 'Sin sector',
    puerta: entrada.puerta || 'Sin puerta',
    fila: entrada.fila || '',
    asiento: entrada.asiento || '',
    titular: entrada.titular_denominacion || entrada.titular || '',
    titular_id: entrada.titular_identificador || entrada.titular_id || '',
    origen: entrada.origen || '',
    tipoEntrada: entrada.tipo_entrada || entrada.tipoEntrada || '',
    estado: baseLocal.length > 0 ? 'OFFLINE' : 'ONLINE',
    monto: monto,
    
    // Información del deslinde
    estadoDeslinde: infoEstadoDeslinde,
    
    // NUEVA INFORMACIÓN DEL KIT
    kitEntregado: infoKit ? infoKit.estado === 'entregado' : false,
    fechaEntregaKit: infoKit ? infoKit.fecha_entrega : null,
    estadoKit: infoKit ? infoKit.estado : 'pendiente'
  };

  // Agregar información de carrera solo si existe y es válida
  if (tipoCarrera && tieneCategoriasCarrera) {
    detallesResultado.tipoCarrera = tipoCarrera.tipo;
    detallesResultado.distancia = tipoCarrera.distancia;
    detallesResultado.categoria = tipoCarrera.categoria;
    detallesResultado.incluye_kit = tipoCarrera.incluye_kit;
    detallesResultado.descripcion = tipoCarrera.descripcion;
    detallesResultado.colorCategoria = tipoCarrera.color;
    detallesResultado.colorFondo = tipoCarrera.colorFondo;
    detallesResultado.esAproximado = tipoCarrera.esAproximado || false;
    detallesResultado.montoOriginal = tipoCarrera.montoOriginal;
  }

  setResultado({
    mensaje: mensajeFinal,
    color: colorFinal,
    detalles: detallesResultado
  });

  // Guardar como último escaneado
  setUltimoEscaneado({
    ...detallesResultado,
    timestamp: new Date().toLocaleTimeString()
  });
};

// Función para renderizar el resultado principal mejorado con kit
const renderResultadoPrincipalConKit = (resultado, procesarCodigo, tieneCategoriasCarrera, renderEstadoDeslinde) => (
  <View style={[styles.resultCard, { backgroundColor: resultado.color }]}>
    <Text style={styles.resultText}>{resultado.mensaje}</Text>
    
    {resultado.detalles && (
      <View style={styles.detallesContainer}>
        {/* Información personal */}
        {resultado.detalles.nombre && (
          <Text style={styles.detalleText}>👤 {resultado.detalles.nombre}</Text>
        )}
        {resultado.detalles.dni && (
          <Text style={styles.detalleText}>🆔 DNI: {resultado.detalles.dni}</Text>
        )}
        
        {/* Información del estado del deslinde */}
        {renderEstadoDeslinde && renderEstadoDeslinde()}
        
        {/* Información de carrera - DESTACADA si existe */}
        {resultado.detalles.tipoCarrera && tieneCategoriasCarrera && (
          <View style={[styles.carreraContainer, { backgroundColor: resultado.detalles.colorCategoria || '#666' }]}>
            <View style={styles.carreraHeader}>
              <Text style={styles.carreraTitle}>🏃‍♂️ TIPO DE CARRERA</Text>
              <View style={styles.kitIndicator}>
                <Text style={styles.kitText}>
                  {resultado.detalles.incluye_kit ? '✅ CON KIT' : '❌ SIN KIT'}
                </Text>
              </View>
            </View>
            
            <View style={styles.carreraInfo}>
              <Text style={styles.carreraTipo}>{resultado.detalles.tipoCarrera}</Text>
              <Text style={styles.carreraDistancia}>{resultado.detalles.distancia}</Text>
              <Text style={styles.carreraMonto}>${resultado.detalles.monto}</Text>
            </View>
            
            {resultado.detalles.esAproximado && (
              <Text style={styles.aproximadoText}>
                ⚠️ Categoría aproximada
              </Text>
            )}
          </View>
        )}

        {/* NUEVO: Componente de entrega de kit mejorado */}
        {resultado.detalles.incluye_kit && renderKitDeliveryStatus(resultado, procesarCodigo)}
        
        {/* Información adicional del evento (solo si no hay carrera o como complemento) */}
        {!tieneCategoriasCarrera && resultado.detalles.sector && (
          <Text style={styles.detalleText}>🏟️ Sector: {resultado.detalles.sector}</Text>
        )}
        {!tieneCategoriasCarrera && resultado.detalles.puerta && (
          <Text style={styles.detalleText}>🚪 Puerta: {resultado.detalles.puerta}</Text>
        )}
        {resultado.detalles.titular && resultado.detalles.titular !== resultado.detalles.nombre && (
          <Text style={styles.detalleText}>👥 Titular: {resultado.detalles.titular}</Text>
        )}
      </View>
    )}
  </View>
);

export {
  renderKitDeliveryStatus,
  mostrarResultadoConKitMejorado,
  renderResultadoPrincipalConKit
};