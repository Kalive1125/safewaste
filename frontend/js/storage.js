// =========================================================================
// SafeWaste Storage Manager - Persistência Local Inteligente (localStorage & sessionStorage)
// =========================================================================

const StorageManager = {
  KEYS: {
    ROLE: 'safewaste_active_role',
    VIEW: 'safewaste_active_view',
    FILTRO_MES: 'safewaste_filtro_mes',
    FILTRO_ANO: 'safewaste_filtro_ano',
    GOVBR_SESSION: 'safewaste_govbr_session',
    DRAFT_RESIDUO: 'safewaste_draft_residuo',
    DRAFT_DOCUMENTO: 'safewaste_draft_documento',
    CACHE_METADADOS: 'safewaste_cache_metadados',
    CACHE_RESIDUOS: 'safewaste_cache_residuos',
    CACHE_DOCUMENTOS: 'safewaste_cache_documentos',
    CACHE_SITUACAO: 'safewaste_cache_situacao',
    CACHE_RELATORIO: 'safewaste_cache_relatorio',
    CACHE_AUDITORIA: 'safewaste_cache_auditoria'
  },

  // --- SESSÃO GOV.BR & CONFIABILIDADES (ISOLADA POR PERFIL EM sessionStorage) ---
  // Cada perfil (Clínica ou Coletora) tem seu próprio usuário Gov.br, deslogado no primeiro acesso e ao fechar o site
  getGovBrSession(role = 'clinica') {
    try {
      // Limpeza preventiva de chaves legadas no localStorage se houverem
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.KEYS.GOVBR_SESSION);
        localStorage.removeItem(`${this.KEYS.GOVBR_SESSION}_clinica`);
        localStorage.removeItem(`${this.KEYS.GOVBR_SESSION}_coletora`);
      }
      const key = `${this.KEYS.GOVBR_SESSION}_${role}`;
      const sess = sessionStorage.getItem(key);
      return sess ? JSON.parse(sess) : null;
    } catch (e) {
      return null;
    }
  },

  setGovBrSession(sessionData, role = 'clinica') {
    try {
      const key = `${this.KEYS.GOVBR_SESSION}_${role}`;
      sessionStorage.setItem(key, JSON.stringify(sessionData));
    } catch (e) {
      console.warn('Erro ao salvar sessão Gov.br:', e);
    }
  },

  clearGovBrSession(role = null) {
    try {
      if (role) {
        sessionStorage.removeItem(`${this.KEYS.GOVBR_SESSION}_${role}`);
      } else {
        sessionStorage.removeItem(`${this.KEYS.GOVBR_SESSION}_clinica`);
        sessionStorage.removeItem(`${this.KEYS.GOVBR_SESSION}_coletora`);
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.KEYS.GOVBR_SESSION);
        localStorage.removeItem(`${this.KEYS.GOVBR_SESSION}_clinica`);
        localStorage.removeItem(`${this.KEYS.GOVBR_SESSION}_coletora`);
      }
    } catch (e) {}
  },

  // --- PREFERÊNCIAS DE SESSÃO & NAVEGAÇÃO (localStorage: preserva preferências) ---
  getActiveRole() {
    return localStorage.getItem(this.KEYS.ROLE) || 'clinica';
  },

  setActiveRole(role) {
    if (role === 'clinica' || role === 'coletora') {
      localStorage.setItem(this.KEYS.ROLE, role);
    }
  },

  getActiveView() {
    return localStorage.getItem(this.KEYS.VIEW) || 'dashboard';
  },

  setActiveView(view) {
    localStorage.setItem(this.KEYS.VIEW, view);
  },

  getFiltros() {
    return {
      mes: localStorage.getItem(this.KEYS.FILTRO_MES) || '8',
      ano: localStorage.getItem(this.KEYS.FILTRO_ANO) || '2026'
    };
  },

  setFiltros(mes, ano) {
    if (mes) localStorage.setItem(this.KEYS.FILTRO_MES, String(mes));
    if (ano) localStorage.setItem(this.KEYS.FILTRO_ANO, String(ano));
  },

  // --- RASCUNHOS DE FORMULÁRIOS (DRAFTS) ---
  saveDraftResiduo(data) {
    try {
      localStorage.setItem(this.KEYS.DRAFT_RESIDUO, JSON.stringify(data));
    } catch (e) {
      console.warn('Erro ao salvar rascunho de resíduo:', e);
    }
  },

  getDraftResiduo() {
    try {
      const draft = localStorage.getItem(this.KEYS.DRAFT_RESIDUO);
      return draft ? JSON.parse(draft) : null;
    } catch (e) {
      return null;
    }
  },

  clearDraftResiduo() {
    localStorage.removeItem(this.KEYS.DRAFT_RESIDUO);
  },

  saveDraftDocumento(data) {
    try {
      localStorage.setItem(this.KEYS.DRAFT_DOCUMENTO, JSON.stringify(data));
    } catch (e) {
      console.warn('Erro ao salvar rascunho de documento:', e);
    }
  },

  getDraftDocumento() {
    try {
      const draft = localStorage.getItem(this.KEYS.DRAFT_DOCUMENTO);
      return draft ? JSON.parse(draft) : null;
    } catch (e) {
      return null;
    }
  },

  clearDraftDocumento() {
    localStorage.removeItem(this.KEYS.DRAFT_DOCUMENTO);
  },

  // --- CACHE DE DADOS & OFFLINE CAPABILITY ---
  setCache(key, data) {
    try {
      const payload = {
        timestamp: Date.now(),
        data
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      console.warn(`Erro ao salvar cache em ${key}:`, e);
    }
  },

  getCache(key, maxAgeMinutes = 15) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      const parsed = JSON.parse(item);
      const ageMs = Date.now() - (parsed.timestamp || 0);
      if (maxAgeMinutes && ageMs > maxAgeMinutes * 60 * 1000) {
        return parsed.data;
      }
      return parsed.data;
    } catch (e) {
      return null;
    }
  },

  limparTudo() {
    try {
      Object.values(this.KEYS).forEach(k => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
      sessionStorage.removeItem(`${this.KEYS.GOVBR_SESSION}_clinica`);
      sessionStorage.removeItem(`${this.KEYS.GOVBR_SESSION}_coletora`);
    } catch (e) {}
  }
};

window.StorageManager = StorageManager;
