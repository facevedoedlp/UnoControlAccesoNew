// ==================== CONFIGURACIÓN ====================
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
        setUrlFormularioDeslinde(parsedConfig.urlFormularioDeslinde ?? '');
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
        urlFormularioDeslinde
      };
      await AsyncStorage.setItem('appConfig', JSON.stringify(config));
      setIsConfigured(true);
      setShowConfig(false);
      
      await cargarBaseLocal();
      
      Alert.alert('Éxito', 'Configuración guardada correctamente');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };
