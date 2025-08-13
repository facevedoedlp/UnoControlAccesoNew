import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  // ==================== CONTENEDORES PRINCIPALES ====================
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // ==================== HEADER ====================
  header: {
    backgroundColor: '#dc2626',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  headerLeft: {
    flex: 1,
  },

  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.5,
  },

  // Header minimalista (cuando está en modo compacto)
  headerMinimal: {
    position: 'absolute',
    top: 60,
    right: 15,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
  },

  configButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  configButtonMinimal: {
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
    borderRadius: 25,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },

  adminButtonMinimal: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderRadius: 25,
    padding: 12,
    marginRight: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },

  // ==================== MARCA DE AGUA ====================
  watermark: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    transform: [
      { translateX: -width * 0.35 },
      { translateY: -60 },
      { rotate: '-25deg' }
    ],
    zIndex: 0,
    opacity: 0.03,
  },

  watermarkText: {
    fontSize: width * 0.25,
    fontWeight: '900',
    color: '#1f2937',
    letterSpacing: 8,
  },

  // ==================== CONTENIDO PRINCIPAL ====================
  content: {
    flex: 1,
    padding: 20,
    zIndex: 1,
    paddingTop: 10,
  },

  // ==================== INPUT CONTAINER ====================
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },

  scanButton: {
    padding: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f3f4f6',
    backgroundColor: '#f8fafc',
  },

  textInput: {
    flex: 1,
    padding: 18,
    fontSize: 18,
    fontWeight: '500',
    color: '#1f2937',
  },

  searchButton: {
    padding: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#f3f4f6',
    backgroundColor: '#f8fafc',
  },

  // ==================== TARJETA DE RESULTADO ====================
  resultCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  resultText: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    color: 'white',
    marginBottom: 16,
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },

  detallesContainer: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
  },

  detalleText: {
    fontSize: 17,
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // ==================== INFO CONTAINER ====================
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },

  infoText: {
    fontSize: 15,
    color: '#4b5563',
    marginBottom: 8,
    fontWeight: '500',
    lineHeight: 22,
  },

  // ==================== ÚLTIMO ESCANEADO ====================
  ultimoEscaneadoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },

  ultimoEscaneadoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1e293b',
    textAlign: 'center',
    letterSpacing: 0.8,
  },

  ultimoEscaneadoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  ultimoEscaneadoPersona: {
    flex: 2,
  },

  ultimoEscaneadoNombre: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },

  ultimoEscaneadoDni: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 4,
  },

  ultimoEscaneadoHora: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
    fontWeight: '500',
  },

  ultimoEscaneadoCarrera: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 80,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  ultimoEscaneadoTipo: {
    fontSize: 14,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
  },

  // ==================== PECHERA ====================
  pecheraContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  pecheraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  pecheraEmoji: {
    fontSize: 20,
    marginRight: 6,
  },

  pecheraTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16a34a',
  },

  pecheraCheck: {
    fontSize: 20,
    marginLeft: 6,
  },

  pecheraNumeroSection: {
    alignItems: 'center',
    marginVertical: 12,
  },

  pecheraLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },

  pecheraNumero: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#dc2626',
  },

  pecheraCategoria: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
    fontStyle: 'italic',
  },

  pecheraFecha: {
    marginVertical: 10,
    alignItems: 'center',
  },

  pecheraFechaLabel: {
    fontSize: 13,
    color: '#6b7280',
  },

  pecheraFechaTexto: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },

  pecheraMensaje: {
    marginTop: 12,
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    textAlign: 'center',
  },

  // ==================== BASE LOCAL ====================
  baseLocalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  baseLocalContainerCompact: {
    backgroundColor: '#f8f9fa',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },

  baseLocalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  baseLocalHeaderCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },

  baseLocalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
    color: '#111827',
    flex: 1,
    letterSpacing: 0.5,
  },

  baseLocalTitleCompact: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },

  baseLocalInfo: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },

  baseLocalInfoCompact: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },

  baseLocalWarning: {
    fontSize: 15,
    color: '#dc2626',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },

  // ==================== PROGRESO ====================
  progressContainer: {
    marginTop: 16,
    marginHorizontal: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 10,
  },

  progressText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },

  progressBar: {
    height: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },

  // ==================== ESTADÍSTICAS ====================
  statsContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    margin: 10,
  },

  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },

  statsLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },

  statsValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },

  estadisticasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
  },

  estadisticaItem: {
    alignItems: 'center',
    minWidth: '22%',
    marginBottom: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  estadisticaNumero: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  estadisticaLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 4,
  },

  // ==================== BOTONES ====================
  buttonRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },

  updateButton: {
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#d97706',
  },

  updateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.5,
  },

  statsButton: {
    backgroundColor: '#8b5cf6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#7c3aed',
  },

  statsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.5,
  },

  downloadButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    elevation: 4,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#2563eb',
  },

  downloadButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.5,
  },

  linkButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
    elevation: 3,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#2563eb',
  },

  linkButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  formularioButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: '#059669',
  },

  formularioButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  refreshButton: {
    backgroundColor: '#06b6d4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    marginLeft: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: '#0891b2',
  },

  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Botones de administración
  adminButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },

  adminButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },

  adminButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },

  // ==================== PERÍMETROS ====================
  perimetroScroll: {
    marginTop: 8,
  },

  perimetroButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  perimetroButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },

  perimetroEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },

  perimetroText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },

  perimetroTextActive: {
    color: '#2196F3',
    fontWeight: 'bold',
  },

  // ==================== CONFIGURACIÓN INICIAL ====================
  configContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  configContent: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },

  welcomeTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#dc2626',
    marginTop: 24,
    letterSpacing: 1,
  },

  welcomeSubtitle: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
    lineHeight: 26,
  },

  switchContainer: {
    marginBottom: 36,
  },

  switchLabel: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    color: '#111827',
    letterSpacing: 0.5,
  },

  modeButtons: {
    flexDirection: 'row',
    gap: 16,
  },

  modeButton: {
    flex: 1,
    padding: 20,
    borderWidth: 3,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  modeButtonActive: {
    borderColor: '#dc2626',
    backgroundColor: '#dc2626',
    elevation: 6,
    shadowColor: '#dc2626',
    shadowOpacity: 0.3,
  },

  modeButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#6b7280',
    letterSpacing: 0.5,
  },

  modeButtonTextActive: {
    color: 'white',
  },

  modeButtonSubtext: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 6,
    fontWeight: '500',
  },

  inputGroup: {
    marginBottom: 24,
  },

  inputLabel: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827',
    letterSpacing: 0.3,
  },

  configInput: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 18,
    fontSize: 16,
    backgroundColor: 'white',
    fontWeight: '500',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  inputHelp: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
    fontWeight: '500',
    lineHeight: 18,
  },

  saveButton: {
    backgroundColor: '#dc2626',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    elevation: 6,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#b91c1c',
  },

  saveButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowColor: '#9ca3af',
    borderColor: '#9ca3af',
  },

  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },

  footerText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 20,
    fontWeight: '500',
  },

  // ==================== MODALES ====================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxHeight: '85%',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },

  modalTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 24,
    textAlign: 'center',
    color: '#111827',
    letterSpacing: 0.5,
  },

  modalInput: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '500',
    backgroundColor: '#f9fafb',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
    gap: 12,
  },

  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },

  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#4b5563',
    letterSpacing: 0.5,
  },

  // ==================== SCANNER ====================
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },

  scannerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 48,
  },

  scannerPlaceholderText: {
    color: 'white',
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  scannerPlaceholderSubtext: {
    color: '#d1d5db',
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 36,
    fontWeight: '500',
    lineHeight: 24,
  },

  manualInputButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 12,
    elevation: 6,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: '#b91c1c',
  },

  manualInputButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  closeScannerButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 30,
    padding: 12,
    zIndex: 1,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  scannerOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  scannerText: {
    color: 'white',
    fontSize: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    borderRadius: 12,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
    letterSpacing: 0.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Frame del scanner
  scannerFrame: {
    width: 280,
    height: 280,
    position: 'relative',
    marginBottom: 36,
  },

  scannerCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#dc2626',
    borderWidth: 4,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    top: 0,
    left: 0,
    borderTopLeftRadius: 8,
  },

  scannerCornerTopRight: {
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    top: 0,
    right: 0,
    left: 'auto',
    borderTopRightRadius: 8,
  },

  scannerCornerBottomLeft: {
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderTopWidth: 0,
    borderRightWidth: 0,
    bottom: 0,
    top: 'auto',
    left: 0,
    borderBottomLeftRadius: 8,
  },

  scannerCornerBottomRight: {
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderBottomRightRadius: 8,
  },

  // ==================== MODALES DE DESLINDE ====================
  deslindeModalContent: {
    padding: 20,
  },

  deslindeModalText: {
    fontSize: 17,
    color: '#374151',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
  },

  deslindeModalItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  deslindeModalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
    letterSpacing: 0.3,
  },

  deslindeModalStatus: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 12,
    fontWeight: '500',
  },

  deslindeModalAcciones: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  deslindeModalInstrucciones: {
    fontSize: 15,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    fontWeight: '500',
  },

  // ==================== ALERTAS E INSCRIPCIONES ====================
  inscripcionStatusContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 5,
    marginVertical: 5,
  },

  alertaInscripcionContainer: {
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },

  alertaInscripcionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },

  alertaInscripcionSubtext: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.9,
  },

  // ==================== ESTADOS DE DESCARGA ====================
  downloadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  downloadingContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    minWidth: 250,
  },

  downloadingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },

  downloadingMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },

  // ==================== ESTADOS GENERALES ====================
  // Estados de carga
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },

  loadingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },

  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },

  // Estados de error
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },

  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Estados de éxito
  successContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },

  successText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ==================== ELEMENTOS DE UTILIDAD ====================
  // Espaciadores
  spacer: {
    height: 16,
  },

  spacerLarge: {
    height: 24,
  },

  // Texto destacado
  highlightText: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '700',
  },

  // Dividers
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },

  dividerThick: {
    height: 2,
    backgroundColor: '#d1d5db',
    marginVertical: 20,
  },

  // Badges
  badge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },

  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  badgeSuccess: {
    backgroundColor: '#10b981',
  },

  badgeWarning: {
    backgroundColor: '#f59e0b',
  },

  badgeError: {
    backgroundColor: '#ef4444',
  },

  // ==================== VERSIÓN ====================
  versionContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },

  versionText: {
    fontSize: 12,
    color: '#666666',
    opacity: 0.7,
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // ==================== RESPONSIVE ADJUSTMENTS ====================
  // Para pantallas pequeñas
  '@media (max-width: 380)': {
    content: {
      padding: 16,
    },
    headerTitle: {
      fontSize: 18,
    },
    resultText: {
      fontSize: 22,
    },
  },

  // Para tablets
  '@media (min-width: 768)': {
    content: {
      padding: 32,
      maxWidth: 600,
      alignSelf: 'center',
    },
    modalContent: {
      width: '70%',
    },
  },

  
  hamburgerMenu: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    borderRadius: 15,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 0,
    borderWidth: 1,
  },
  hamburgerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  hamburgerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  hamburgerDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
    marginVertical: 10,
  },
  hamburgerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 10,
    borderRadius: 10,
  },
  hamburgerItemText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 15,
  },
  }
);

export default styles;