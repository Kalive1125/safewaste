document.addEventListener('DOMContentLoaded', () => {
  // Inicialização de Ícones Lucide
  if (window.lucide) lucide.createIcons();

  // Carregar dados da API
  App.carregarTabelaResiduos();
});

const App = {
  // Precisa bater com as etapas definidas no backend (residuosController.js)
  ETAPAS: {
    1: { label: 'Resíduo Gerado', icone: 'flask-conical' },
    2: { label: 'Coletado', icone: 'package-check' },
    3: { label: 'Em Transporte', icone: 'truck' },
    4: { label: 'Recebido no Destino', icone: 'warehouse' },
    5: { label: 'Descarte Concluído', icone: 'shield-check' }
  },
  rastreioAtual: null,

  async carregarTabelaResiduos() {
    const result = await SafeWasteAPI.fetchResiduos();
    const tbody = document.getElementById('tabelaResiduosBody');
    if (!tbody) return;

    if (result.sucesso && result.data.length > 0) {
      tbody.innerHTML = result.data.map(item => {
        const etapa = App.ETAPAS[item.etapaAtual] || { label: `Etapa ${item.etapaAtual}` };
        const concluido = item.etapaAtual >= 5;
        const badgeClasses = concluido
          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
          : 'bg-amber-950 text-amber-400 border-amber-800';

        return `
        <tr class="hover:bg-slate-900/40">
          <td class="p-3 font-mono text-emerald-400 font-medium">${item.mtrCodigo}</td>
          <td class="p-3">Unidade Geradora Cadastrada</td>
          <td class="p-3"><span class="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">Grupo ${item.grupoResiduo}</span></td>
          <td class="p-3">${item.pesoGeradoKg} kg</td>
          <td class="p-3"><span class="px-2 py-0.5 rounded border ${badgeClasses}">${etapa.label}</span></td>
          <td class="p-3 text-right space-x-1 whitespace-nowrap">
            <button onclick="App.abrirRastreio('${item.mtrCodigo}')" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded text-[11px]">Rastrear</button>
            <button onclick="App.abrirPDF('${item.mtrCodigo}')" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px]">PDF</button>
          </td>
        </tr>
      `;
      }).join('');
    } else {
      tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-500">Nenhum resíduo registrado ainda.</td></tr>`;
    }
  },

  async submitGeracaoResiduo(e) {
    e.preventDefault();
    const grupoResiduo = document.getElementById('formGrupo').value;
    const descricao = document.getElementById('formDescricao').value;
    const pesoGeradoKg = document.getElementById('formPeso').value;
    const rtCpf = document.getElementById('formCpf').value;

    const res = await SafeWasteAPI.registrarResiduo({ grupoResiduo, descricao, pesoGeradoKg, rtCpf });
    if (res.sucesso) {
      alert('Resíduo e MTR registrados no banco de dados!');
      e.target.reset();
      UI.toggleModal('modalEtapa1', false);
      App.carregarTabelaResiduos();
    } else {
      alert(res.erro || 'Não foi possível registrar o resíduo.');
    }
  },

  abrirPDF(mtr) {
    document.getElementById('pdfMTR').innerText = mtr;
    UI.toggleModal('modalPDF', true);
  },

  // ----- RASTREAMENTO (estilo "acompanhar pedido") -----

  async abrirRastreio(mtrCodigo) {
    const result = await SafeWasteAPI.buscarRastreio(mtrCodigo);
    if (!result.sucesso) {
      alert(result.erro || 'Não foi possível carregar o rastreamento.');
      return;
    }

    App.rastreioAtual = mtrCodigo;
    document.getElementById('rastreioMTR').innerText = mtrCodigo;
    App.renderTimeline(result.data.residuo.etapaAtual, result.data.historico);

    const btnAvancar = document.getElementById('btnAvancarEtapa');
    btnAvancar.classList.toggle('hidden', result.data.residuo.etapaAtual >= result.data.etapaFinal);

    UI.toggleModal('modalRastreio', true);
  },

  renderTimeline(etapaAtual, historico) {
    const container = document.getElementById('rastreioTimeline');
    const chaves = Object.keys(App.ETAPAS).map(Number).sort((a, b) => a - b);

    container.innerHTML = chaves.map(num => {
      const info = App.ETAPAS[num];
      const registro = historico.find(h => h.etapa === num);
      const alcancada = num <= etapaAtual;
      const atual = num === etapaAtual;
      const ultimaLinha = num === chaves[chaves.length - 1];

      const circulo = alcancada
        ? 'bg-emerald-500 border-emerald-500 text-slate-950'
        : 'bg-slate-800 border-slate-700 text-slate-600';

      const linha = num < etapaAtual ? 'bg-emerald-500' : 'bg-slate-700';
      const dataFormatada = registro
        ? new Date(registro.createdAt || registro.created_at).toLocaleString('pt-BR')
        : null;

      return `
        <div class="flex space-x-4">
          <div class="flex flex-col items-center">
            <div class="w-8 h-8 shrink-0 rounded-full border-2 flex items-center justify-center ${circulo} ${atual ? 'ring-4 ring-emerald-500/20' : ''}">
              <i data-lucide="${alcancada ? 'check' : info.icone}" class="w-4 h-4"></i>
            </div>
            ${!ultimaLinha ? `<div class="w-0.5 flex-1 min-h-[28px] ${linha}"></div>` : ''}
          </div>
          <div class="pb-6">
            <p class="text-sm font-semibold ${alcancada ? 'text-white' : 'text-slate-500'}">${info.label}</p>
            ${dataFormatada ? `<p class="text-[11px] text-emerald-400 font-mono mt-0.5">${dataFormatada}</p>` : `<p class="text-[11px] text-slate-600 mt-0.5">Aguardando</p>`}
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  async avancarEtapaAtual() {
    if (!App.rastreioAtual) return;

    const res = await SafeWasteAPI.avancarEtapa(App.rastreioAtual);
    if (res.sucesso) {
      App.abrirRastreio(App.rastreioAtual);
      App.carregarTabelaResiduos();
    } else {
      alert(res.erro || 'Erro ao avançar etapa.');
    }
  }
};
