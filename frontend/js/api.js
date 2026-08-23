const API_BASE = 'http://localhost:3000/api/v1';

const SafeWasteAPI = {
  async fetchResiduos() {
    try {
      const response = await fetch(`${API_BASE}/residuos`);
      return await response.json();
    } catch (error) {
      console.error('Erro na requisição:', error);
      return { sucesso: false, data: [] };
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
      console.error('Erro ao salvar resíduo:', error);
      return { sucesso: false };
    }
  },

  async buscarRastreio(mtrCodigo) {
    try {
      const response = await fetch(`${API_BASE}/residuos/${mtrCodigo}/rastreio`);
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar rastreio:', error);
      return { sucesso: false };
    }
  },

  async avancarEtapa(mtrCodigo, observacao) {
    try {
      const response = await fetch(`${API_BASE}/residuos/${mtrCodigo}/avancar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observacao })
      });
      return await response.json();
    } catch (error) {
      console.error('Erro ao avançar etapa:', error);
      return { sucesso: false };
    }
  }
};