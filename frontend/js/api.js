const getApiBase = () => {
  if (typeof window === 'undefined') return 'http://localhost:3001/api/v1';
  if (window.location && window.location.origin) {
    // Se aberto via VS Code Live Server (porta 5500) ou arquivo local
    if (window.location.port === '5500' || window.location.protocol === 'file:') {
      return 'http://localhost:3002/api/v1';
    }
    // Para produção na nuvem (Render, Railway, VPS, Vercel, AWS, etc.) ou servidor Express local:
    return `${window.location.origin}/api/v1`;
  }
  return '/api/v1';
};

const API_BASE = getApiBase();

const SafeWasteAPI = {
  // --- AUTENTICAÇÃO GOV.BR & CONFIABILIDADES V3 ---
  async loginGovBr(payload = {}) {
    try {
      const response = await fetch(`${API_BASE}/auth/govbr/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (error) {
      console.error('Erro no login Gov.br:', error);
      return { sucesso: false, erro: 'Falha ao conectar com o serviço de autenticação Gov.br.' };
    }
  },

  async fetchGovBrConfiabilidades(cpf) {
    try {
      const cleanCPF = String(cpf || '').replace(/\D/g, '');
      const response = await fetch(`${API_BASE}/auth/govbr/confiabilidades/${cleanCPF}?response-type=ids`);
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar confiabilidades Gov.br:', error);
      return [];
    }
  },

  async fetchGovBrNiveis(cpf) {
    try {
      const cleanCPF = String(cpf || '').replace(/\D/g, '');
      const response = await fetch(`${API_BASE}/auth/govbr/niveis/${cleanCPF}?response-type=ids`);
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar níveis Gov.br:', error);
      return [];
    }
  },

  async validarVinculoMTR(cpf) {
    try {
      const cleanCPF = String(cpf || '').replace(/\D/g, '');
      const response = await fetch(`${API_BASE}/auth/govbr/validar-vinculo-mtr?cpf=${cleanCPF}`);
      return await response.json();
    } catch (error) {
      console.error('Erro ao validar vínculo MTR:', error);
      return { sucesso: false, data: { vinculadoSinir: false } };
    }
  },

  // --- CONFIGURAÇÃO & METADADOS DO SISTEMA ---
  async fetchMetadados() {
    try {
      const response = await fetch(`${API_BASE}/config/metadados`);
      if (!response.ok) throw new Error('Falha HTTP');
      const data = await response.json();
      if (data.sucesso && window.StorageManager) {
        StorageManager.setCache(StorageManager.KEYS.CACHE_METADADOS, data.data);
      }
      return data;
    } catch (error) {
      console.warn('Usando cache local para metadados:', error);
      const cached = window.StorageManager ? StorageManager.getCache(StorageManager.KEYS.CACHE_METADADOS) : null;
      if (cached) return { sucesso: true, data: cached, offline: true };
      return { sucesso: false, erro: 'Não foi possível carregar os metadados do sistema.' };
    }
  },

  // --- EMPRESAS & CADASTROS ---
  async fetchPerfilEmpresa(tipo = 'clinica') {
    try {
      const response = await fetch(`${API_BASE}/empresas/perfil/${tipo}`);
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar perfil da empresa:', error);
      return { sucesso: false, erro: 'Falha de comunicação com o servidor.' };
    }
  },

  async atualizarPerfilEmpresa(id, payload) {
    try {
      const response = await fetch(`${API_BASE}/empresas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      return { sucesso: false, erro: 'Falha ao atualizar dados cadastrais.' };
    }
  },

  // --- RESÍDUOS & COLETAS ---
  async fetchResiduos(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const url = `${API_BASE}/residuos${query ? `?${query}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Falha HTTP');
      const data = await response.json();
      if (data.sucesso && window.StorageManager) {
        StorageManager.setCache(StorageManager.KEYS.CACHE_RESIDUOS, data.data);
      }
      return data;
    } catch (error) {
      console.warn('Recorrendo ao cache local para resíduos:', error);
      const cached = window.StorageManager ? StorageManager.getCache(StorageManager.KEYS.CACHE_RESIDUOS) : null;
      if (cached) return { sucesso: true, data: cached, offline: true };
      return { sucesso: false, erro: 'Erro de conexão com o servidor.', data: [] };
    }
  },

  async registrarResiduo(payload) {
    try {
      const response = await fetch(`${API_BASE}/residuos/gerar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (error) {
      console.error('Erro ao registrar resíduo:', error);
      return { sucesso: false, erro: 'Falha ao conectar com o servidor para registro.' };
    }
  },

  async buscarRastreio(mtrCodigo) {
    try {
      const response = await fetch(`${API_BASE}/residuos/${mtrCodigo}/rastreio`);
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar rastreio:', error);
      return { sucesso: false, erro: 'Falha ao carregar dados de rastreamento.' };
    }
  },

  async registrarColeta(mtrCodigo, formData) {
    try {
      const response = await fetch(`${API_BASE}/residuos/${mtrCodigo}/coletar`, {
        method: 'POST',
        body: formData
      });
      return await response.json();
    } catch (error) {
      console.error('Erro ao registrar coleta:', error);
      return { sucesso: false, erro: 'Falha ao enviar comprovante de coleta.' };
    }
  },

  async avancarEtapa(mtrCodigo, payload = {}) {
    try {
      const response = await fetch(`${API_BASE}/residuos/${mtrCodigo}/avancar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (error) {
      console.error('Erro ao avançar etapa:', error);
      return { sucesso: false, erro: 'Falha ao avançar etapa.' };
    }
  },

  downloadComprovanteUrl(mtrCodigo) {
    return `${API_BASE}/residuos/${mtrCodigo}/comprovante`;
  },

  downloadTermoValidacaoUrl(mtrCodigo) {
    return `${API_BASE}/residuos/${mtrCodigo}/termo-validacao`;
  },

  // --- GESTÃO DOCUMENTAL ---
  async fetchDocumentos() {
    try {
      const response = await fetch(`${API_BASE}/documentos`);
      if (!response.ok) throw new Error('Falha HTTP');
      const data = await response.json();
      if (data.sucesso && window.StorageManager) {
        StorageManager.setCache(StorageManager.KEYS.CACHE_DOCUMENTOS, data.data);
      }
      return data;
    } catch (error) {
      console.warn('Recorrendo ao cache local para documentos:', error);
      const cached = window.StorageManager ? StorageManager.getCache(StorageManager.KEYS.CACHE_DOCUMENTOS) : null;
      if (cached) return { sucesso: true, data: cached, offline: true };
      return { sucesso: false, data: [] };
    }
  },

  async verificarSituacaoDocumental() {
    try {
      const response = await fetch(`${API_BASE}/documentos/situacao`);
      if (!response.ok) throw new Error('Falha HTTP');
      const data = await response.json();
      if (data.sucesso && window.StorageManager) {
        StorageManager.setCache(StorageManager.KEYS.CACHE_SITUACAO, data.data);
      }
      return data;
    } catch (error) {
      console.warn('Recorrendo ao cache local para situação documental:', error);
      const cached = window.StorageManager ? StorageManager.getCache(StorageManager.KEYS.CACHE_SITUACAO) : null;
      if (cached) return { sucesso: true, data: cached, offline: true };
      return { sucesso: false, data: { regular: false, pendencias: [] } };
    }
  },

  async uploadDocumento(formData) {
    try {
      const response = await fetch(`${API_BASE}/documentos/upload`, {
        method: 'POST',
        body: formData
      });
      return await response.json();
    } catch (error) {
      console.error('Erro no upload de documento:', error);
      return { sucesso: false, erro: 'Falha ao conectar com o servidor para upload.' };
    }
  },

  downloadDocumentoUrl(id) {
    return `${API_BASE}/documentos/${id}/download`;
  },

  async excluirDocumento(id) {
    try {
      const response = await fetch(`${API_BASE}/documentos/${id}`, {
        method: 'DELETE'
      });
      return await response.json();
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      return { sucesso: false, erro: 'Falha ao excluir documento.' };
    }
  },

  // --- RELATÓRIOS & AUDITORIA ---
  async fetchRelatorioMensal(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE}/relatorios/mensal${query ? `?${query}` : ''}`);
      if (!response.ok) throw new Error('Falha HTTP');
      const data = await response.json();
      if (data.sucesso && window.StorageManager) {
        StorageManager.setCache(StorageManager.KEYS.CACHE_RELATORIO, data.data);
      }
      return data;
    } catch (error) {
      console.warn('Recorrendo ao cache local para relatório:', error);
      const cached = window.StorageManager ? StorageManager.getCache(StorageManager.KEYS.CACHE_RELATORIO) : null;
      if (cached) return { sucesso: true, data: cached, offline: true };
      return { sucesso: false, data: null };
    }
  },

  async fetchAuditLogs() {
    try {
      const response = await fetch(`${API_BASE}/auditoria/logs`);
      if (!response.ok) throw new Error('Falha HTTP');
      const data = await response.json();
      if (data.sucesso && window.StorageManager) {
        StorageManager.setCache(StorageManager.KEYS.CACHE_AUDITORIA, data.data);
      }
      return data;
    } catch (error) {
      console.warn('Recorrendo ao cache local para auditoria:', error);
      const cached = window.StorageManager ? StorageManager.getCache(StorageManager.KEYS.CACHE_AUDITORIA) : null;
      if (cached) return { sucesso: true, data: cached, offline: true };
      return { sucesso: false, data: [] };
    }
  }
};

window.SafeWasteAPI = SafeWasteAPI;