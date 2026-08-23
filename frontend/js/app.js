// =========================================================================
// SafeWaste Application Controller (DELTA MIND Edition - White & Emerald Theme)
// =========================================================================

const App = {
  filtroMes: '8', // Agosto padrão
  filtroAno: '2026',
  metadados: null,
  situacaoDocumental: null,
  coletaAtualMTR: null,
  rastreioAtual: null,
  chartMensal: null,
  chartGrupos: null,
  govBrTipoSelecionado: 'certificado',
  govBrSession: null,

  ETAPAS: {
    1: { label: 'Resíduo Gerado (MTR Nacional)', cor: 'amber', icone: 'clock' },
    2: { label: 'Coleta Realizada', cor: 'emerald', icone: 'truck' },
    3: { label: 'Em Transporte Especializado', cor: 'emerald', icone: 'navigation' },
    4: { label: 'Recebido na Planta de Destinação', cor: 'emerald', icone: 'flame' },
    5: { label: 'Destinação Final & Validação Concluídas', cor: 'emerald', icone: 'shield-check' }
  },

  async init() {
    console.log('[SafeWaste] Inicializando aplicação com Gov.br & Destinação Final...');

    // 1. Restaurar preferências do localStorage
    if (window.StorageManager) {
      const savedRole = StorageManager.getActiveRole();
      UI.activeRole = savedRole;
      const roleSelector = document.getElementById('roleSelector');
      if (roleSelector) roleSelector.value = savedRole;

      const savedFiltros = StorageManager.getFiltros();
      this.filtroMes = savedFiltros.mes;
      this.filtroAno = savedFiltros.ano;

      // Carregar sessão Gov.br específica do perfil ativo
      this.govBrSession = StorageManager.getGovBrSession(savedRole);
    }

    // 2. Aplicar máscaras de inputs (CPF, CNPJ)
    if (window.Validators) {
      Validators.aplicarMascarasEmInputs();
    }

    // 3. Configurar listeners de dropzones e rascunhos automáticos
    this.configurarValidadorDropzone();
    this.configurarAutoSaveDrafts();

    // 4. Carregar metadados dinâmicos do backend
    await this.carregarMetadados();

    // 5. Inicializar / Atualizar Header Gov.br para o perfil ativo
    this.atualizarHeaderGovBr();

    // 6. Restaurar rascunhos salvos se houverem
    this.restaurarDrafts();

    // 7. Carregar dados completos
    await this.carregarTudo();

    // 8. Restaurar visualização ativa
    if (window.StorageManager) {
      const savedView = StorageManager.getActiveView();
      UI.navigate(savedView);
    }

    // Criar ícones lucide
    if (window.lucide) lucide.createIcons();
  },

  // Chamado quando o usuário altera o perfil no select do topo
  onRoleSwitch(newRole) {
    if (window.StorageManager) {
      this.govBrSession = StorageManager.getGovBrSession(newRole);
    } else {
      this.govBrSession = null;
    }
    this.atualizarHeaderGovBr();
  },

  // --- GOV.BR AUTHENTICATION & CONFIABILIDADES V3 ---
  atualizarHeaderGovBr() {
    const btnGovBrText = document.getElementById('btnGovBrText');
    const govBrNivelBadge = document.getElementById('govBrNivelBadge');
    const btnGovBrHeader = document.getElementById('btnGovBrHeader');

    // Garantir que a sessão carregada corresponde ao perfil atual
    if (window.StorageManager) {
      this.govBrSession = StorageManager.getGovBrSession(UI.activeRole);
    }

    if (this.govBrSession) {
      const nomeExibicao = this.govBrSession.nome ? this.govBrSession.nome.split(' ')[0] : 'Gov.br';
      if (btnGovBrText) btnGovBrText.innerText = `${nomeExibicao} (${UI.activeRole === 'clinica' ? 'Clínica' : 'Coletora'})`;
      if (govBrNivelBadge) {
        govBrNivelBadge.classList.remove('hidden');
        govBrNivelBadge.innerText = (this.govBrSession.nivelConta || 'OURO').toUpperCase();
      }
      if (btnGovBrHeader) {
        btnGovBrHeader.title = `Autenticado via Gov.br como ${this.govBrSession.nome} (${this.govBrSession.nivelConta}) - Perfil ${UI.activeRole === 'clinica' ? 'Clínica' : 'Coletora'}`;
        btnGovBrHeader.className = 'flex items-center space-x-2 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition border border-emerald-600 shadow-sm';
      }
    } else {
      if (btnGovBrText) btnGovBrText.innerText = UI.activeRole === 'clinica' ? 'Entrar Gov.br (Clínica)' : 'Entrar Gov.br (Coletora)';
      if (govBrNivelBadge) govBrNivelBadge.classList.add('hidden');
      if (btnGovBrHeader) {
        btnGovBrHeader.title = `Conectar conta Gov.br do responsável pela ${UI.activeRole === 'clinica' ? 'Clínica' : 'Coletora'}`;
        btnGovBrHeader.className = 'flex items-center space-x-2 px-3 py-1.5 bg-[#1351b4] hover:bg-[#0c326f] text-white text-xs font-bold transition border border-[#1351b4] shadow-sm';
      }
    }
  },

  abrirModalGovBr() {
    const cpfInput = document.getElementById('govBrCpfInput');
    const nomeInput = document.getElementById('govBrNomeInput');
    const activeContainer = document.getElementById('govBrActiveSessionContainer');
    const formLogin = document.getElementById('formGovBrLogin');
    const activeNome = document.getElementById('activeGovBrNome');
    const activeCpf = document.getElementById('activeGovBrCpf');
    const activeNivel = document.getElementById('activeGovBrNivel');
    const statusBox = document.getElementById('govBrStatusConfiabilidadeBox');

    // Carrega a sessão específica do perfil ativo
    if (window.StorageManager) {
      this.govBrSession = StorageManager.getGovBrSession(UI.activeRole);
    }

    if (this.govBrSession) {
      if (activeContainer) activeContainer.classList.remove('hidden');
      if (formLogin) formLogin.classList.add('hidden');
      if (activeNome) activeNome.innerText = `${this.govBrSession.nome} (${UI.activeRole === 'clinica' ? 'Responsável pela Clínica' : 'Responsável pela Coletora'})`;
      if (activeCpf) activeCpf.innerText = this.govBrSession.cpf;
      if (activeNivel) activeNivel.innerText = (this.govBrSession.nivelConta || 'Ouro').toUpperCase();
    } else {
      if (activeContainer) activeContainer.classList.add('hidden');
      if (formLogin) formLogin.classList.remove('hidden');

      if (cpfInput) cpfInput.value = '';
      if (nomeInput) nomeInput.value = '';

      if (UI.activeRole === 'clinica') {
        if (statusBox) {
          statusBox.innerHTML = `
            <p class="font-bold text-slate-800 flex items-center justify-between">
              <span>Unidade MTR Nacional:</span>
              <span class="text-emerald-700 font-mono font-bold">GERADOR RSS (SINIR)</span>
            </p>
            <p class="text-slate-600">Empresa: ${UI.empresaClinica ? UI.empresaClinica.nomeFantasia : 'Clínica OdontoLife'} | CNPJ: ${UI.empresaClinica ? UI.empresaClinica.cnpj : '14.892.410/0001-83'}</p>
            <p class="text-[10px] text-slate-500 font-mono">Papel: Responsável Técnico da Clínica Geradora</p>
          `;
        }
      } else {
        if (statusBox) {
          statusBox.innerHTML = `
            <p class="font-bold text-slate-800 flex items-center justify-between">
              <span>Unidade MTR Nacional:</span>
              <span class="text-emerald-700 font-mono font-bold">TRANSPORTADOR RSS</span>
            </p>
            <p class="text-slate-600">Empresa: ${UI.empresaColetora ? UI.empresaColetora.nomeFantasia : 'EcoResíduos Logística'} | CNPJ: ${UI.empresaColetora ? UI.empresaColetora.cnpj : '07.319.824/0001-55'}</p>
            <p class="text-[10px] text-slate-500 font-mono">Papel: Responsável Operacional / Motorista Coletor</p>
          `;
        }
      }
    }

    this.selecionarTipoGovBr(this.govBrTipoSelecionado);
    UI.toggleModal('modalGovBr', true);
    if (window.lucide) lucide.createIcons();
  },

  desconectarGovBr() {
    this.govBrSession = null;
    if (window.StorageManager) {
      StorageManager.clearGovBrSession(UI.activeRole);
    }
    this.atualizarHeaderGovBr();
    UI.toast('info', 'Sessão Encerrada', `Conta Gov.br do perfil ${UI.activeRole === 'clinica' ? 'Clínica' : 'Coletora'} desconectada.`);
    UI.toggleModal('modalGovBr', false);
  },

  selecionarTipoGovBr(tipo) {
    this.govBrTipoSelecionado = tipo;
    const btnCert = document.getElementById('btnGovBrTipoCertificado');
    const btnBanco = document.getElementById('btnGovBrTipoBanco');

    if (tipo === 'certificado') {
      if (btnCert) btnCert.className = 'p-2.5 border-2 border-[#1351b4] bg-blue-50 text-[#1351b4] font-bold text-center flex flex-col items-center space-y-1';
      if (btnBanco) btnBanco.className = 'p-2.5 border border-slate-300 bg-white text-slate-700 font-medium text-center flex flex-col items-center space-y-1';
    } else {
      if (btnCert) btnCert.className = 'p-2.5 border border-slate-300 bg-white text-slate-700 font-medium text-center flex flex-col items-center space-y-1';
      if (btnBanco) btnBanco.className = 'p-2.5 border-2 border-[#1351b4] bg-blue-50 text-[#1351b4] font-bold text-center flex flex-col items-center space-y-1';
    }
  },

  async submitGovBrLogin(e) {
    e.preventDefault();
    const cpf = document.getElementById('govBrCpfInput').value;
    const nome = document.getElementById('govBrNomeInput').value;

    if (window.Validators && !Validators.validarCPF(cpf)) {
      UI.toast('error', 'CPF Inválido', 'O CPF informado não é válido segundo as regras da Receita Federal.');
      return;
    }

    const res = await SafeWasteAPI.loginGovBr({
      cpf,
      nome,
      tipoAutenticacao: this.govBrTipoSelecionado,
      perfil: UI.activeRole
    });

    if (res.sucesso) {
      this.govBrSession = res.data;
      if (window.StorageManager) StorageManager.setGovBrSession(res.data, UI.activeRole);
      this.atualizarHeaderGovBr();
      UI.toast('success', 'Gov.br Conectado', res.mensagem || 'Conta Gov.br autenticada e vinculada ao MTR Nacional!');
      UI.toggleModal('modalGovBr', false);
    } else {
      UI.toast('error', 'Erro Gov.br', res.erro || 'Falha na autenticação Gov.br.');
    }
  },



  // --- CARREGAMENTO DE METADADOS DINÂMICOS DO BACK-END ---
  async carregarMetadados() {
    const res = await SafeWasteAPI.fetchMetadados();
    if (!res.sucesso || !res.data) return;

    this.metadados = res.data;
    const { sistema, gruposResiduos, documentosExigidos, empresas } = res.data;

    // Atualizar referências de empresas na UI
    if (empresas) {
      UI.empresaClinica = empresas.clinica;
      UI.empresaColetora = empresas.coletora;

      const clinica = empresas.clinica;
      const coletora = empresas.coletora;

      // Atualizar identificação do topo
      if (UI.activeRole === 'clinica' && clinica) {
        const nameDisp = document.getElementById('userNameDisplay');
        if (nameDisp) nameDisp.innerText = clinica.nomeFantasia;
        const avatarDisp = document.getElementById('userAvatarDisplay');
        if (avatarDisp) avatarDisp.innerText = clinica.nomeFantasia.substring(0, 2).toUpperCase();
      } else if (UI.activeRole === 'coletora' && coletora) {
        const nameDisp = document.getElementById('userNameDisplay');
        if (nameDisp) nameDisp.innerText = coletora.nomeFantasia;
        const avatarDisp = document.getElementById('userAvatarDisplay');
        if (avatarDisp) avatarDisp.innerText = coletora.nomeFantasia.substring(0, 2).toUpperCase();
      }

      // Atualizar subtítulo da coletora
      const coletoraSubtitle = document.getElementById('coletoraHeaderSubtitle');
      if (coletoraSubtitle && coletora) {
        coletoraSubtitle.innerText = `${coletora.nomeFantasia} — Gestão Logística de Transportes`;
      }

      // Atualizar cabeçalho do relatório oficial
      const relUnidade = document.getElementById('relUnidadeGeradoraInfo');
      const relRT = document.getElementById('relResponsavelTecnicoInfo');
      if (relUnidade && clinica) {
        relUnidade.innerText = `Unidade Geradora: ${clinica.nomeFantasia} | CNPJ: ${clinica.cnpj}`;
      }
      if (relRT && clinica) {
        relRT.innerText = `Responsável Técnico: ${clinica.responsavelTecnicoNome} (${clinica.responsavelTecnicoRegistro})`;
      }

      // Preencher campos padrão em formulários
      const formCpf = document.getElementById('formCpf');
      if (formCpf && clinica && !formCpf.value) {
        formCpf.value = clinica.responsavelTecnicoCpf;
      }
      const coletaMotorista = document.getElementById('coletaMotoristaInput');
      if (coletaMotorista && coletora && !coletaMotorista.value) {
        coletaMotorista.value = coletora.responsavelTecnicoNome || 'Carlos Eduardo Santos';
      }
    }

    // Popular filtros de Mês e Ano dinamicamente
    const filtroMesSelect = document.getElementById('filtroMesSelect');
    if (filtroMesSelect && sistema && sistema.meses) {
      filtroMesSelect.innerHTML = `
        <option value="todos">Todos os Meses</option>
        ${sistema.meses.map(m => `<option value="${m.numero}" ${String(m.numero) === String(this.filtroMes) ? 'selected' : ''}>${m.nome}</option>`).join('')}
      `;
    }

    const filtroAnoSelect = document.getElementById('filtroAnoSelect');
    if (filtroAnoSelect && sistema && sistema.anosDisponiveis) {
      filtroAnoSelect.innerHTML = sistema.anosDisponiveis.map(a => `
        <option value="${a}" ${String(a) === String(this.filtroAno) ? 'selected' : ''}>${a}</option>
      `).join('');
    }

    // Popular Select de Grupos RSS no Modal
    const selectGrupo = document.getElementById('formGrupo');
    if (selectGrupo && gruposResiduos) {
      selectGrupo.innerHTML = gruposResiduos.map(g => `
        <option value="${g.codigo}">${g.nome} (${g.exemplos})</option>
      `).join('');
    }

    // Popular Select de Tipos de Documentos no Modal
    const selectDocTipo = document.getElementById('docTipoSelect');
    if (selectDocTipo && documentosExigidos) {
      selectDocTipo.innerHTML = documentosExigidos.map(d => `
        <option value="${d.tipo}">${d.tipo} ${d.obrigatorio ? '(Obrigatório)' : ''}</option>
      `).join('');
    }

    // Renderizar Cards de Exigências Legais na Aba Documentos
    const containerLegais = document.getElementById('legalRequirementsContainer');
    if (containerLegais && documentosExigidos) {
      const obrigatorios = documentosExigidos.filter(d => d.obrigatorio);
      containerLegais.innerHTML = obrigatorios.map((doc, idx) => `
        <div class="p-3 bg-white border border-slate-300 flex items-center space-x-2">
          <i data-lucide="file-check-2" class="w-4 h-4 text-emerald-600 shrink-0"></i>
          <span class="text-slate-900 font-bold">${idx + 1}. ${doc.sigla || doc.tipo}</span>
        </div>
      `).join('');
    }

    if (window.lucide) lucide.createIcons();
  },

  // --- CONFIGURAÇÃO DE PERSISTÊNCIA LOCAL (DRAFTS) ---
  configurarAutoSaveDrafts() {
    const formGrupo = document.getElementById('formGrupo');
    const formDesc = document.getElementById('formDescricao');
    const formPeso = document.getElementById('formPeso');
    const formCpf = document.getElementById('formCpf');

    const saveResiduoDraft = () => {
      if (!window.StorageManager) return;
      StorageManager.saveDraftResiduo({
        grupo: formGrupo ? formGrupo.value : '',
        descricao: formDesc ? formDesc.value : '',
        peso: formPeso ? formPeso.value : '',
        cpf: formCpf ? formCpf.value : ''
      });
    };

    [formGrupo, formDesc, formPeso, formCpf].forEach(el => {
      if (el) {
        el.addEventListener('input', saveResiduoDraft);
        el.addEventListener('change', saveResiduoDraft);
      }
    });

    const docNome = document.getElementById('docNomeInput');
    const docTipo = document.getElementById('docTipoSelect');
    const docObrigatorio = document.getElementById('docObrigatorioSelect');
    const docEmissao = document.getElementById('docEmissaoInput');
    const docValidade = document.getElementById('docValidadeInput');

    const saveDocDraft = () => {
      if (!window.StorageManager) return;
      StorageManager.saveDraftDocumento({
        nome: docNome ? docNome.value : '',
        tipo: docTipo ? docTipo.value : '',
        obrigatorio: docObrigatorio ? docObrigatorio.value : 'true',
        emissao: docEmissao ? docEmissao.value : '',
        validade: docValidade ? docValidade.value : ''
      });
    };

    [docNome, docTipo, docObrigatorio, docEmissao, docValidade].forEach(el => {
      if (el) {
        el.addEventListener('input', saveDocDraft);
        el.addEventListener('change', saveDocDraft);
      }
    });
  },

  restaurarDrafts() {
    if (!window.StorageManager) return;

    const draftResiduo = StorageManager.getDraftResiduo();
    if (draftResiduo) {
      const formGrupo = document.getElementById('formGrupo');
      const formDesc = document.getElementById('formDescricao');
      const formPeso = document.getElementById('formPeso');
      const formCpf = document.getElementById('formCpf');

      if (formGrupo && draftResiduo.grupo) formGrupo.value = draftResiduo.grupo;
      if (formDesc && draftResiduo.descricao) formDesc.value = draftResiduo.descricao;
      if (formPeso && draftResiduo.peso) formPeso.value = draftResiduo.peso;
      if (formCpf && draftResiduo.cpf) formCpf.value = draftResiduo.cpf;
    }

    const draftDoc = StorageManager.getDraftDocumento();
    if (draftDoc) {
      const docNome = document.getElementById('docNomeInput');
      const docTipo = document.getElementById('docTipoSelect');
      const docObrigatorio = document.getElementById('docObrigatorioSelect');
      const docEmissao = document.getElementById('docEmissaoInput');
      const docValidade = document.getElementById('docValidadeInput');

      if (docNome && draftDoc.nome) docNome.value = draftDoc.nome;
      if (docTipo && draftDoc.tipo) docTipo.value = draftDoc.tipo;
      if (docObrigatorio && draftDoc.obrigatorio) docObrigatorio.value = draftDoc.obrigatorio;
      if (docEmissao && draftDoc.emissao) docEmissao.value = draftDoc.emissao;
      if (docValidade && draftDoc.validade) docValidade.value = draftDoc.validade;
    }
  },

  async carregarTudo() {
    await this.carregarSituacaoDocumental();
    await this.carregarResiduos();
    await this.carregarDocumentos();
    await this.carregarRelatorioMensal();
    await this.carregarAuditoria();
  },

  onNavigate(viewId) {
    if (viewId === 'dashboard') {
      this.carregarResiduos();
      this.carregarRelatorioMensal();
      this.carregarSituacaoDocumental();
    } else if (viewId === 'documentos') {
      this.carregarDocumentos();
      this.carregarSituacaoDocumental();
    } else if (viewId === 'coletas') {
      this.carregarResiduos();
    } else if (viewId === 'relatorios') {
      this.carregarRelatorioMensal();
    } else if (viewId === 'auditoria') {
      this.carregarAuditoria();
    }
  },

  onFiltroChange() {
    const elMes = document.getElementById('filtroMesSelect');
    const elAno = document.getElementById('filtroAnoSelect');
    if (elMes) this.filtroMes = elMes.value;
    if (elAno) this.filtroAno = elAno.value;

    if (window.StorageManager) {
      StorageManager.setFiltros(this.filtroMes, this.filtroAno);
    }

    const mesesNomes = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const txtMes = this.filtroMes === 'todos' ? 'Todos os Meses' : mesesNomes[parseInt(this.filtroMes, 10)];

    const dispPeriodo = document.getElementById('filtroPeriodoDisplay');
    if (dispPeriodo) dispPeriodo.innerText = `${txtMes} de ${this.filtroAno}`;

    UI.toast('info', 'Filtro Aplicado', `Exibindo dados para ${txtMes}/${this.filtroAno}`);
    this.carregarResiduos();
    this.carregarRelatorioMensal();
  },

  // --- SITUAÇÃO DOCUMENTAL & CONFORMIDADE REGULATÓRIA ---
  async carregarSituacaoDocumental() {
    const res = await SafeWasteAPI.verificarSituacaoDocumental();
    if (!res.sucesso || !res.data) return;

    this.situacaoDocumental = res.data;
    const { regular, pendencias, vencimentosProximos, vencidos, totalObrigatoriosValidos, totalObrigatoriosExigidos } = res.data;

    // Badges de Status Geral
    const badgeStatus = document.getElementById('statusConformidadeBadge');
    const descStatus = document.getElementById('statusConformidadeDesc');
    const cardStatus = document.getElementById('cardStatusConformidade');
    const btnNovaGeracao = document.getElementById('btnNovaGeracaoResiduo');

    if (badgeStatus && descStatus) {
      if (regular) {
        badgeStatus.className = 'px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-600 inline-flex items-center space-x-1.5';
        badgeStatus.innerHTML = '<span class="w-2 h-2 bg-emerald-600"></span><span>SITUAÇÃO REGULAR</span>';
        descStatus.innerText = `Todos os ${totalObrigatoriosExigidos} documentos obrigatórios estão registrados e válidos.`;
        if (cardStatus) cardStatus.className = 'glass-card glass-card-hover p-5 border border-emerald-500 bg-emerald-50/40 space-y-2';
        if (btnNovaGeracao) {
          btnNovaGeracao.title = 'Documentação em conformidade. Liberação ativa.';
        }
      } else {
        badgeStatus.className = 'px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-800 border border-rose-600 inline-flex items-center space-x-1.5';
        badgeStatus.innerHTML = '<span class="w-2 h-2 bg-rose-600"></span><span>COLETA CONDICIONADA (PENDÊNCIAS)</span>';
        descStatus.innerText = `${pendencias.length} documento(s) obrigatório(s) ausente(s) ou vencido(s).`;
        if (cardStatus) cardStatus.className = 'glass-card glass-card-hover p-5 border border-rose-500 bg-rose-50/40 space-y-2';
      }
    }

    // Banner de Vencimentos Próximos no Dashboard
    const containerVencimentos = document.getElementById('vencimentosAlertContainer');
    if (containerVencimentos) {
      if ((vencimentosProximos && vencimentosProximos.length > 0) || (vencidos && vencidos.length > 0)) {
        containerVencimentos.classList.remove('hidden');
        let htmlAlert = '';
        if (vencidos && vencidos.length > 0) {
          htmlAlert += `
            <div class="p-3 bg-rose-50 border border-rose-400 flex items-center justify-between text-xs text-rose-900">
              <div class="flex items-center space-x-2">
                <i data-lucide="alert-triangle" class="w-4 h-4 text-rose-600 shrink-0"></i>
                <span><strong>Atenção Crítica:</strong> Existem ${vencidos.length} documento(s) VENCIDO(S). Regularize para conformidade sanitária.</span>
              </div>
              <button onclick="UI.navigate('documentos')" class="text-rose-700 font-bold underline hover:text-rose-900">Ver Documentos</button>
            </div>
          `;
        }
        if (vencimentosProximos && vencimentosProximos.length > 0) {
          htmlAlert += `
            <div class="p-3 bg-amber-50 border border-amber-400 flex items-center justify-between text-xs text-amber-900">
              <div class="flex items-center space-x-2">
                <i data-lucide="clock" class="w-4 h-4 text-amber-600 shrink-0"></i>
                <span><strong>Vencimento Próximo:</strong> ${vencimentosProximos.map(d => `${d.nome} (Vence em ${UI.formatDate(d.dataValidade)})`).join(', ')}.</span>
              </div>
              <button onclick="UI.navigate('documentos')" class="text-amber-700 font-bold underline hover:text-amber-900">Atualizar PDF</button>
            </div>
          `;
        }
        containerVencimentos.innerHTML = htmlAlert;
      } else {
        containerVencimentos.classList.add('hidden');
      }
    }

    if (window.lucide) lucide.createIcons();
  },

  // --- RESÍDUOS & COLETAS ---
  async carregarResiduos() {
    const params = {
      ano: this.filtroAno,
      mes: this.filtroMes
    };
    const res = await SafeWasteAPI.fetchResiduos(params);
    const tbodyClinica = document.getElementById('tabelaResiduosClinicaBody');
    const tbodyColetora = document.getElementById('tabelaResiduosColetoraBody');
    const tbodyColetasGeral = document.getElementById('tabelaColetasRealizadasBody');

    if (!res.sucesso) return;
    const lista = res.data;

    let pesoTotalKg = 0;
    let coletasRealizadas = 0;
    let coletasPendentes = 0;

    lista.forEach(item => {
      pesoTotalKg += parseFloat(item.pesoGeradoKg || 0);
      if (item.etapaAtual >= 2) coletasRealizadas++;
      else coletasPendentes++;
    });

    const elPesoTotal = document.getElementById('kpiTotalDescartadoMes');
    if (elPesoTotal) elPesoTotal.innerText = `${pesoTotalKg.toFixed(1)} kg`;

    const elColetasFeitas = document.getElementById('kpiColetasFeitas');
    if (elColetasFeitas) elColetasFeitas.innerText = coletasRealizadas;

    const elColetasPendentes = document.getElementById('kpiColetasPendentes');
    if (elColetasPendentes) elColetasPendentes.innerText = coletasPendentes;

    // KPIs Coletora
    const kpiColAtribuidas = document.getElementById('kpiColetoraTotal');
    if (kpiColAtribuidas) kpiColAtribuidas.innerText = lista.length;
    const kpiColPendentes = document.getElementById('kpiColetoraPendentes');
    if (kpiColPendentes) kpiColPendentes.innerText = coletasPendentes;
    const kpiColRealizadas = document.getElementById('kpiColetoraRealizadas');
    if (kpiColRealizadas) kpiColRealizadas.innerText = coletasRealizadas;
    const kpiColPeso = document.getElementById('kpiColetoraPesoTotal');
    if (kpiColPeso) kpiColPeso.innerText = `${pesoTotalKg.toFixed(1)} kg`;

    // Renderizar Tabela Clínica (com Validação da Destinação Final)
    if (tbodyClinica) {
      if (lista.length === 0) {
        tbodyClinica.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-slate-500">Nenhum resíduo registrado no período selecionado (${this.filtroMes}/${this.filtroAno}).</td></tr>`;
      } else {
        tbodyClinica.innerHTML = lista.map(item => {
          const etapa = App.ETAPAS[item.etapaAtual] || { label: `Etapa ${item.etapaAtual}` };
          const concluido = item.etapaAtual >= 5;
          const coletado = item.etapaAtual >= 2;

          let statusBadgeClass = 'bg-amber-50 text-amber-800 border-amber-400';
          if (concluido) statusBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-600';
          else if (coletado) statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-500';

          return `
            <tr class="hover:bg-slate-50 transition border-b border-slate-200">
              <td class="p-3.5 font-mono text-emerald-700 font-bold">
                <div>${item.mtrCodigo}</div>
                <div class="text-[9px] text-[#1351b4] font-bold flex items-center space-x-1 mt-0.5">
                  <span>Gov.br ${item.govbrNivelConta || 'Ouro'}</span>
                </div>
              </td>
              <td class="p-3.5 text-slate-700">
                <div>${UI.formatDateTime(item.dataHoraGeracao || item.created_at)}</div>
              </td>
              <td class="p-3.5">
                <span class="px-2 py-0.5 font-bold text-[11px] bg-slate-100 border border-slate-300 text-slate-800">
                  Grupo ${item.grupoResiduo}
                </span>
              </td>
              <td class="p-3.5 font-mono text-slate-900 font-bold">${parseFloat(item.pesoGeradoKg).toFixed(1)} kg</td>
              <td class="p-3.5">
                <span class="px-2.5 py-1 text-[11px] font-bold border ${statusBadgeClass} inline-flex items-center space-x-1">
                  <span>${etapa.label}</span>
                </span>
              </td>
              <td class="p-3.5">
                ${item.comprovantePdfPath
              ? `<a href="${SafeWasteAPI.downloadComprovanteUrl(item.mtrCodigo)}" target="_blank" class="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-[11px] font-bold transition">
                      <i data-lucide="file-check" class="w-3.5 h-3.5 text-emerald-600"></i><span>PDF Coleta</span>
                     </a>`
              : `<span class="text-slate-400 text-[11px] italic">Pendente</span>`
            }
              </td>
              <td class="p-3.5">
                ${concluido && item.termoValidacaoPdfPath
              ? `<a href="${SafeWasteAPI.downloadTermoValidacaoUrl(item.mtrCodigo)}" target="_blank" class="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 border border-emerald-600 text-emerald-800 text-[11px] font-bold hover:bg-emerald-100 transition" title="Termo Oficial da Usina Licenciada">
                      <i data-lucide="shield-check" class="w-3.5 h-3.5"></i><span>Termo Usina</span>
                     </a>`
              : `<span class="text-slate-400 text-[11px] italic">Em trânsito</span>`
            }
              </td>
              <td class="p-3.5 text-right space-x-1 whitespace-nowrap">
                <button onclick="App.abrirRastreio('${item.mtrCodigo}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition inline-flex items-center space-x-1 border border-emerald-600">
                  <i data-lucide="git-commit" class="w-3.5 h-3.5"></i><span>Rastrear</span>
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // Renderizar Tabela Coletora (Gestão Operacional)
    if (tbodyColetora) {
      if (lista.length === 0) {
        tbodyColetora.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-500">Nenhum manifesto de coleta registrado no período.</td></tr>`;
      } else {
        tbodyColetora.innerHTML = lista.map(item => {
          const etapa = App.ETAPAS[item.etapaAtual] || { label: `Etapa ${item.etapaAtual}` };
          const aguardandoColeta = item.etapaAtual === 1;

          return `
            <tr class="hover:bg-slate-50 transition border-b border-slate-200">
              <td class="p-3.5 font-mono text-emerald-700 font-bold">${item.mtrCodigo}</td>
              <td class="p-3.5 text-slate-900 font-semibold">${item.clinicaNome || 'Clínica OdontoLife'}</td>
              <td class="p-3.5 text-slate-500 text-xs">${UI.formatDateTime(item.dataHoraGeracao || item.created_at)}</td>
              <td class="p-3.5 font-bold text-slate-800">Grupo ${item.grupoResiduo} (${parseFloat(item.pesoGeradoKg).toFixed(1)} kg)</td>
              <td class="p-3.5">
                <span class="px-2.5 py-1 text-[11px] font-bold border ${aguardandoColeta ? 'bg-amber-50 text-amber-800 border-amber-400' : 'bg-emerald-50 text-emerald-800 border-emerald-600'}">
                  ${etapa.label}
                </span>
              </td>
              <td class="p-3.5">
                ${item.comprovantePdfPath
              ? `<a href="${SafeWasteAPI.downloadComprovanteUrl(item.mtrCodigo)}" target="_blank" class="text-emerald-700 font-bold hover:underline inline-flex items-center space-x-1 text-xs">
                      <i data-lucide="file-check" class="w-3.5 h-3.5"></i><span>Baixar Comprovante</span>
                     </a>`
              : `<span class="text-amber-700 text-xs font-bold">Pendente de Coleta</span>`
            }
              </td>
              <td class="p-3.5 text-right space-x-1 whitespace-nowrap">
                ${aguardandoColeta
              ? `<button onclick="App.abrirModalColeta('${item.mtrCodigo}', ${item.pesoGeradoKg})" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition inline-flex items-center space-x-1 border border-emerald-600">
                      <i data-lucide="truck" class="w-3.5 h-3.5"></i><span>Realizar Coleta</span>
                     </button>`
              : `<button onclick="App.abrirRastreio('${item.mtrCodigo}')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition inline-flex items-center space-x-1 border border-slate-300">
                      <i data-lucide="eye" class="w-3.5 h-3.5"></i><span>Acompanhar</span>
                     </button>`
            }
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // Renderizar Aba Coletas & Destinações Realizadas Geral
    if (tbodyColetasGeral) {
      const coletasConcluidas = lista.filter(i => i.etapaAtual >= 2);
      if (coletasConcluidas.length === 0) {
        tbodyColetasGeral.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-500">Nenhuma coleta realizada registrada para este período.</td></tr>`;
      } else {
        tbodyColetasGeral.innerHTML = coletasConcluidas.map(item => `
          <tr class="hover:bg-slate-50 transition border-b border-slate-200">
            <td class="p-3.5 font-mono text-emerald-700 font-bold">${item.mtrCodigo}</td>
            <td class="p-3.5 text-slate-700 font-mono text-xs">${UI.formatDateTime(item.dataHoraColeta || item.updated_at)}</td>
            <td class="p-3.5 text-slate-800 font-bold">Grupo ${item.grupoResiduo}</td>
            <td class="p-3.5 font-mono text-emerald-800 font-black">${parseFloat(item.pesoColetadoKg || item.pesoGeradoKg).toFixed(1)} kg</td>
            <td class="p-3.5 text-slate-700 text-xs">${item.motoristaNome || 'Motorista'} (${item.veiculoPlaca || '-'})</td>
            <td class="p-3.5">
              ${item.comprovantePdfPath
            ? `<a href="${SafeWasteAPI.downloadComprovanteUrl(item.mtrCodigo)}" target="_blank" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold inline-flex items-center space-x-1">
                    <i data-lucide="file-check" class="w-3.5 h-3.5 text-emerald-600"></i><span>PDF Coleta</span>
                   </a>`
            : '-'
          }
            </td>
            <td class="p-3.5 text-right">
              ${item.termoValidacaoPdfPath
            ? `<a href="${SafeWasteAPI.downloadTermoValidacaoUrl(item.mtrCodigo)}" target="_blank" class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-600 text-xs font-bold inline-flex items-center space-x-1">
                    <i data-lucide="shield-check" class="w-3.5 h-3.5"></i><span>Termo Usina</span>
                   </a>`
            : `<span class="text-slate-400 text-xs italic">Em processamento</span>`
          }
            </td>
          </tr>
        `).join('');
      }
    }

    if (window.lucide) lucide.createIcons();
  },

  // --- GESTÃO DE DOCUMENTOS ---
  async carregarDocumentos() {
    const res = await SafeWasteAPI.fetchDocumentos();
    const tbody = document.getElementById('tabelaDocumentosBody');
    if (!tbody) return;

    if (!res.sucesso || res.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-500">Nenhum documento cadastrado até o momento.</td></tr>`;
      return;
    }

    tbody.innerHTML = res.data.map(doc => {
      let statusBadge = `<span class="px-2.5 py-1 text-xs font-bold badge-valido">Válido</span>`;
      if (doc.status === 'vencendo') {
        statusBadge = `<span class="px-2.5 py-1 text-xs font-bold badge-vencendo">Vencendo em breve</span>`;
      } else if (doc.status === 'vencido') {
        statusBadge = `<span class="px-2.5 py-1 text-xs font-bold badge-vencido">Vencido</span>`;
      }

      return `
        <tr class="hover:bg-slate-50 transition border-b border-slate-200">
          <td class="p-3.5 font-bold text-slate-900 flex items-center space-x-2">
            <div class="p-1.5 bg-rose-50 text-rose-600 border border-rose-300">
              <i data-lucide="file-text" class="w-4 h-4"></i>
            </div>
            <div>
              <div class="text-xs font-bold text-slate-900">${doc.nome}</div>
              <div class="text-[11px] text-slate-500 font-mono">${doc.arquivoNomeOriginal} (${UI.formatBytes(doc.tamanhoBytes)})</div>
            </div>
          </td>
          <td class="p-3.5 text-slate-700 text-xs font-medium">${doc.tipo}</td>
          <td class="p-3.5">
            ${doc.obrigatorio
          ? `<span class="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-600">OBRIGATÓRIO</span>`
          : `<span class="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-300">COMPLEMENTAR</span>`
        }
          </td>
          <td class="p-3.5 text-slate-700 text-xs font-mono">${UI.formatDate(doc.dataEmissao)}</td>
          <td class="p-3.5 text-slate-900 text-xs font-mono font-bold">${doc.dataValidade ? UI.formatDate(doc.dataValidade) : 'Indeterminado'}</td>
          <td class="p-3.5">${statusBadge}</td>
          <td class="p-3.5 text-right space-x-1 whitespace-nowrap">
            <a href="${SafeWasteAPI.downloadDocumentoUrl(doc.id)}" target="_blank" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-emerald-700 border border-slate-300 text-xs font-bold inline-flex items-center space-x-1 transition" title="Baixar PDF">
              <i data-lucide="download" class="w-3.5 h-3.5"></i><span>Baixar</span>
            </a>
            <button onclick="App.excluirDocumento('${doc.id}', '${doc.nome}')" class="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold inline-flex items-center space-x-1 transition" title="Excluir Documento">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  // --- DROPZONE & VALIDAÇÃO DE ARQUIVO CLIENT-SIDE ---
  configurarValidadorDropzone() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (window.Validators) {
          const val = Validators.validarArquivoPdf(file);
          if (!val.valido) {
            UI.toast('error', 'Arquivo Incompatível', val.erro);
            e.target.value = '';
            return;
          }
        }

        const label = document.getElementById(e.target.id + 'Label');
        if (label) {
          label.innerText = `Selecionado: ${file.name} (${UI.formatBytes(file.size)})`;
          label.classList.add('text-emerald-700', 'font-bold');
        }
      });
    });
  },

  async submitUploadDocumento(e) {
    e.preventDefault();
    const form = e.target;
    const fileInput = document.getElementById('docArquivoPdf');

    if (!fileInput.files || fileInput.files.length === 0) {
      UI.toast('warning', 'Arquivo Ausente', 'Por favor, selecione o arquivo PDF do documento.');
      return;
    }

    const file = fileInput.files[0];
    if (window.Validators) {
      const valFile = Validators.validarArquivoPdf(file);
      if (!valFile.valido) {
        UI.toast('error', 'Formato Inválido', valFile.erro);
        return;
      }

      const emissao = document.getElementById('docEmissaoInput').value;
      const validade = document.getElementById('docValidadeInput').value;
      const valDatas = Validators.validarDatas(emissao, validade);
      if (!valDatas.valido) {
        UI.toast('warning', 'Datas Inconsistentes', valDatas.erro);
        return;
      }
    }

    const formData = new FormData(form);
    const res = await SafeWasteAPI.uploadDocumento(formData);

    if (res.sucesso) {
      UI.toast('success', 'Documento Cadastrado', res.mensagem || 'Documento PDF salvo e registrado na trilha de auditoria.');
      form.reset();
      if (window.StorageManager) StorageManager.clearDraftDocumento();
      const label = document.getElementById('docArquivoPdfLabel');
      if (label) label.innerText = 'Clique ou arraste o arquivo PDF aqui';
      UI.toggleModal('modalUploadDocumento', false);
      await this.carregarDocumentos();
      await this.carregarSituacaoDocumental();
      await this.carregarAuditoria();
    } else {
      UI.toast('error', 'Falha no Upload', res.erro || 'Não foi possível cadastrar o documento.');
    }
  },

  excluirDocumento(id, nome) {
    UI.confirm({
      title: 'Excluir Documento',
      message: `Tem certeza que deseja excluir o documento "${nome}"? Esta ação será registrada no log de auditoria.`,
      confirmText: 'Sim, Excluir',
      cancelText: 'Cancelar',
      isDanger: true,
      onConfirm: async () => {
        const res = await SafeWasteAPI.excluirDocumento(id);
        if (res.sucesso) {
          UI.toast('success', 'Documento Excluído', 'O documento foi removido com sucesso.');
          await App.carregarDocumentos();
          await App.carregarSituacaoDocumental();
          await App.carregarAuditoria();
        } else {
          UI.toast('error', 'Erro ao Excluir', res.erro || 'Não foi possível excluir o documento.');
        }
      }
    });
  },

  // --- GERAÇÃO DE RESÍDUO (CLÍNICA) COM GOV.BR ---
  abrirModalNovaGeracao() {
    // Se não estiver com sessão Gov.br ativa, convida para conectar
    if (!this.govBrSession) {
      UI.confirm({
        title: 'Autenticação Gov.br Recomendada',
        message: 'Para emitir o Manifesto MTR com validade jurídica no SINIR, conecte sua conta Gov.br (Nível Prata ou Ouro). Deseja autenticar agora?',
        confirmText: 'Entrar com Gov.br',
        cancelText: 'Continuar sem Gov.br',
        isDanger: false,
        onConfirm: () => {
          this.abrirModalGovBr();
        }
      });
    }

    if (this.situacaoDocumental && this.situacaoDocumental.bloqueiaColeta) {
      UI.confirm({
        title: 'Atenção: Documentação Incompleta',
        message: `Existem pendências obrigatórias de conformidade (${this.situacaoDocumental.pendencias.join(', ')}). Deseja gerar o resíduo em modo condicional?`,
        confirmText: 'Prosseguir',
        cancelText: 'Regularizar Docs',
        isDanger: false,
        onConfirm: () => {
          UI.toggleModal('modalEtapa1', true);
        }
      });
      return;
    }
    UI.toggleModal('modalEtapa1', true);
  },

  async submitGeracaoResiduo(e) {
    e.preventDefault();
    const grupoResiduo = document.getElementById('formGrupo').value;
    const descricao = document.getElementById('formDescricao').value;
    const pesoGeradoKg = document.getElementById('formPeso').value;
    const rtCpf = document.getElementById('formCpf').value;

    // Validações Client-Side com feedback
    if (window.Validators) {
      const valPeso = Validators.validarPeso(pesoGeradoKg);
      if (!valPeso.valido) {
        UI.toast('warning', 'Peso Inválido', valPeso.erro);
        return;
      }

      if (!Validators.validarCPF(rtCpf)) {
        UI.toast('error', 'CPF Inválido', 'O CPF do Responsável Técnico informado é inválido. Por favor, verifique.');
        return;
      }
    }

    const payload = {
      grupoResiduo,
      descricao,
      pesoGeradoKg,
      rtCpf,
      govbrAutenticado: !!this.govBrSession,
      govbrNivelConta: this.govBrSession ? this.govBrSession.nivelConta : 'Ouro'
    };

    const res = await SafeWasteAPI.registrarResiduo(payload);
    if (res.sucesso) {
      UI.toast('success', 'Resíduo & MTR Registrados', `Manifesto ${res.data.mtrCodigo} criado com sucesso e assinado via Gov.br.`);
      e.target.reset();
      if (window.StorageManager) StorageManager.clearDraftResiduo();
      UI.toggleModal('modalEtapa1', false);
      await this.carregarResiduos();
      await this.carregarRelatorioMensal();
      await this.carregarAuditoria();
    } else {
      UI.toast('error', 'Erro ao Registrar', res.erro || 'Não foi possível salvar o resíduo.');
    }
  },

  // --- REALIZAÇÃO DE COLETA (EMPRESA COLETORA) ---
  abrirModalColeta(mtrCodigo, pesoSugerido) {
    this.coletaAtualMTR = mtrCodigo;
    const elMTR = document.getElementById('coletaModalMTR');
    if (elMTR) elMTR.innerText = mtrCodigo;

    const elPeso = document.getElementById('coletaPeso');
    if (elPeso && pesoSugerido) elPeso.value = pesoSugerido;

    const now = new Date();
    const localIso = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    const inputData = document.getElementById('coletaDataHora');
    if (inputData) inputData.value = localIso;

    UI.toggleModal('modalRealizarColeta', true);
  },

  async submitRealizarColeta(e) {
    e.preventDefault();
    if (!this.coletaAtualMTR) return;

    const fileInput = document.getElementById('coletaComprovantePdf');
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      if (window.Validators) {
        const val = Validators.validarArquivoPdf(file);
        if (!val.valido) {
          UI.toast('error', 'Formato Incompatível', val.erro);
          return;
        }
      }
    }

    const form = e.target;
    const formData = new FormData(form);

    const res = await SafeWasteAPI.registrarColeta(this.coletaAtualMTR, formData);
    if (res.sucesso) {
      UI.toast('success', 'Coleta Registrada', `Coleta do MTR ${this.coletaAtualMTR} confirmada com sucesso!`);
      form.reset();
      const label = document.getElementById('coletaComprovantePdfLabel');
      if (label) label.innerText = 'Clique ou arraste o comprovante PDF assinado aqui';
      UI.toggleModal('modalRealizarColeta', false);
      await this.carregarResiduos();
      await this.carregarRelatorioMensal();
      await this.carregarAuditoria();
    } else {
      UI.toast('error', 'Erro na Coleta', res.erro || 'Falha ao registrar coleta.');
    }
  },

  // --- RASTREAMENTO TIMELINE & TERMO DE DESTINAÇÃO FINAL ---
  async abrirRastreio(mtrCodigo) {
    const result = await SafeWasteAPI.buscarRastreio(mtrCodigo);
    if (!result.sucesso) {
      UI.toast('error', 'Erro', result.erro || 'Não foi possível carregar rastreio.');
      return;
    }

    this.rastreioAtual = mtrCodigo;
    document.getElementById('rastreioMTR').innerText = mtrCodigo;
    this.renderTimeline(result.data.residuo, result.data.historico);

    const btnAvancar = document.getElementById('btnAvancarEtapa');
    if (btnAvancar) {
      if (UI.activeRole === 'coletora' && result.data.residuo.etapaAtual < result.data.etapaFinal && result.data.residuo.etapaAtual >= 2) {
        btnAvancar.classList.remove('hidden');
      } else {
        btnAvancar.classList.add('hidden');
      }
    }

    UI.toggleModal('modalRastreio', true);
  },

  renderTimeline(residuo, historico) {
    const container = document.getElementById('rastreioTimeline');
    const chaves = Object.keys(App.ETAPAS).map(Number).sort((a, b) => a - b);
    const etapaAtual = residuo.etapaAtual;

    container.innerHTML = chaves.map(num => {
      const info = App.ETAPAS[num];
      const registro = historico.find(h => h.etapa === num);
      const alcancada = num <= etapaAtual;
      const atual = num === etapaAtual;
      const ultimaLinha = num === chaves[chaves.length - 1];

      const circulo = alcancada
        ? 'bg-emerald-600 border-emerald-600 text-white'
        : 'bg-slate-100 border-slate-300 text-slate-400';

      const linha = num < etapaAtual ? 'bg-emerald-600' : 'bg-slate-300';

      return `
        <div class="flex space-x-4">
          <div class="flex flex-col items-center">
            <div class="w-8 h-8 shrink-0 border-2 flex items-center justify-center ${circulo} ${atual ? 'ring-2 ring-emerald-600' : ''}">
              <i data-lucide="${alcancada ? 'check' : info.icone}" class="w-4 h-4"></i>
            </div>
            ${!ultimaLinha ? `<div class="w-0.5 flex-1 min-h-[36px] ${linha}"></div>` : ''}
          </div>
          <div class="pb-6 flex-1">
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold ${alcancada ? 'text-slate-900' : 'text-slate-400'} uppercase tracking-wider">${info.label}</p>
              ${registro ? `<span class="text-[11px] text-emerald-700 font-mono font-bold">${UI.formatDateTime(registro.dataHora || registro.created_at)}</span>` : ''}
            </div>
            ${registro
          ? `<p class="text-xs text-slate-700 mt-1 leading-relaxed">${registro.observacao || ''}</p>
                 ${registro.responsavel ? `<p class="text-[11px] text-slate-500 mt-0.5 font-medium">Responsável: ${registro.responsavel}</p>` : ''}`
          : `<p class="text-xs text-slate-400 mt-1 italic">Aguardando cumprimento desta etapa</p>`
        }
            ${num === 1
          ? `<div class="mt-1.5">
                  <span class="inline-flex items-center space-x-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-[#1351b4] text-[10px] font-bold">
                    <i data-lucide="shield-check" class="w-3 h-3"></i><span>Assinado digitalmente via Gov.br (Nível ${residuo.govbrNivelConta || 'Ouro'})</span>
                  </span>
                 </div>`
          : ''}
            ${num === 2 && residuo.comprovantePdfPath
          ? `<div class="mt-2">
                  <a href="${SafeWasteAPI.downloadComprovanteUrl(residuo.mtrCodigo)}" target="_blank" class="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs text-slate-800 font-bold">
                    <i data-lucide="file-check" class="w-3.5 h-3.5 text-emerald-600"></i><span>Ver Comprovante de Coleta</span>
                  </a>
                 </div>`
          : ''}
            ${num === 5 && residuo.termoValidacaoPdfPath
          ? `<div class="mt-3 p-3 bg-emerald-50 border border-emerald-600 space-y-2 text-xs text-emerald-950">
                  <div class="flex items-center justify-between">
                    <strong>Termo Oficial de Validação da Destinação Final:</strong>
                    <span class="font-mono font-bold text-emerald-800">${residuo.termoValidacaoCodigo || 'TRM-DEST-OFICIAL'}</span>
                  </div>
                  <p class="text-[11px] text-slate-700 leading-tight">
                    Emitido e assinado pela usina licenciada: <strong>${residuo.destinadorFinalNome}</strong> (${residuo.destinadorFinalLao}). Método: ${residuo.metodoTratamento}.
                  </p>
                  <a href="${SafeWasteAPI.downloadTermoValidacaoUrl(residuo.mtrCodigo)}" target="_blank" class="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition border border-emerald-600 shadow-sm">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i><span>Baixar Termo Assinado da Usina (PDF)</span>
                  </a>
                 </div>`
          : ''}
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  async avancarEtapaAtual() {
    if (!this.rastreioAtual) return;

    const res = await SafeWasteAPI.avancarEtapa(this.rastreioAtual, { responsavel: 'EcoResíduos Logística' });
    if (res.sucesso) {
      UI.toast('success', 'Etapa Avançada', `MTR ${this.rastreioAtual} avançado com sucesso!`);
      this.abrirRastreio(this.rastreioAtual);
      await this.carregarResiduos();
      await this.carregarRelatorioMensal();
      await this.carregarAuditoria();
    } else {
      UI.toast('error', 'Erro', res.erro || 'Erro ao avançar etapa.');
    }
  },

  // --- RELATÓRIOS & GRÁFICOS (CHART.JS) ---
  async carregarRelatorioMensal() {
    const params = {
      ano: this.filtroAno,
      mes: this.filtroMes
    };
    const res = await SafeWasteAPI.fetchRelatorioMensal(params);
    if (!res.sucesso || !res.data) return;

    const data = res.data;

    const elRelDocValidos = document.getElementById('relDocsValidos');
    if (elRelDocValidos) elRelDocValidos.innerText = data.documentos.validos;
    const elRelDocPendentes = document.getElementById('relDocsPendentes');
    if (elRelDocPendentes) elRelDocPendentes.innerText = data.documentos.vencendo + data.documentos.vencidos;
    const elRelColetas = document.getElementById('relColetasRealizadas');
    if (elRelColetas) elRelColetas.innerText = data.resumo.coletasRealizadas;
    const elRelPeso = document.getElementById('relPesoTotal');
    if (elRelPeso) elRelPeso.innerText = `${data.resumo.totalPesoGeradoKg} kg`;

    const elRelPeriodo = document.getElementById('relPeriodoTexto');
    if (elRelPeriodo) {
      const mesesNomes = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const txtMes = this.filtroMes === 'todos' ? 'Todos os Meses' : mesesNomes[parseInt(this.filtroMes, 10)];
      elRelPeriodo.innerText = `${txtMes} de ${this.filtroAno}`;
    }

    const elRelEmissao = document.getElementById('relDataEmissao');
    if (elRelEmissao) {
      elRelEmissao.innerText = new Date().toLocaleDateString('pt-BR');
    }

    this.renderCharts(data.historicoMensal, data.resumo.pesoPorGrupo);
  },

  renderCharts(historicoMensal, pesoPorGrupo) {
    if (!window.Chart) return;

    const ctxMensal = document.getElementById('chartDescarteMensal');
    if (ctxMensal) {
      if (this.chartMensal) this.chartMensal.destroy();

      const labels = historicoMensal.map(h => h.mes);
      const dataValores = historicoMensal.map(h => h.pesoKg);

      this.chartMensal = new Chart(ctxMensal, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Resíduos Descartados (kg)',
            data: dataValores,
            backgroundColor: '#059669',
            borderColor: '#047857',
            borderWidth: 1,
            borderRadius: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              grid: { color: '#f1f5f9' },
              ticks: { color: '#0f172a', font: { family: 'Inter', size: 11, weight: 'bold' } }
            },
            y: {
              grid: { color: '#f1f5f9' },
              ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } }
            }
          }
        }
      });
    }

    const ctxGrupos = document.getElementById('chartGruposResiduos');
    if (ctxGrupos) {
      if (this.chartGrupos) this.chartGrupos.destroy();

      const labelsGrupos = ['Grupo A (Biológico)', 'Grupo B (Químico)', 'Grupo C (Radioativo)', 'Grupo D (Comum)', 'Grupo E (Perfurocortante)'];
      const dataGrupos = [
        pesoPorGrupo.A || 0,
        pesoPorGrupo.B || 0,
        pesoPorGrupo.C || 0,
        pesoPorGrupo.D || 0,
        pesoPorGrupo.E || 0
      ];

      this.chartGrupos = new Chart(ctxGrupos, {
        type: 'doughnut',
        data: {
          labels: labelsGrupos,
          datasets: [{
            data: dataGrupos,
            backgroundColor: ['#059669', '#10b981', '#334155', '#64748b', '#047857'],
            borderColor: '#ffffff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#0f172a', font: { family: 'Inter', size: 10, weight: 'bold' }, boxWidth: 12 }
            }
          },
          cutout: '68%'
        }
      });
    }
  },

  exportarRelatorioPDF() {
    UI.toast('info', 'Gerando Relatório', 'Formatando relatório de conformidade para impressão/exportação em PDF...');
    setTimeout(() => {
      window.print();
    }, 500);
  },

  async exportarRelatorioCSV() {
    const params = { ano: this.filtroAno, mes: this.filtroMes };
    const res = await SafeWasteAPI.fetchResiduos(params);
    if (!res.sucesso || res.data.length === 0) {
      UI.toast('warning', 'Sem Dados', 'Não há registros no período selecionado para exportação.');
      return;
    }

    const headers = ['MTR_Codigo', 'Data_Geracao', 'Data_Coleta', 'Grupo_Residuo', 'Descricao', 'Peso_Gerado_kg', 'Peso_Coletado_kg', 'Status_Coleta', 'Responsavel_Tecnico', 'GovBr_Nivel', 'Motorista', 'Veiculo_Placa', 'Destinador_Final', 'Termo_Validacao_Codigo', 'CDF_Codigo'];

    const rows = res.data.map(item => [
      `"${item.mtrCodigo}"`,
      `"${UI.formatDateTime(item.dataHoraGeracao || item.created_at)}"`,
      `"${item.dataHoraColeta ? UI.formatDateTime(item.dataHoraColeta) : 'Pendente'}"`,
      `"Grupo ${item.grupoResiduo}"`,
      `"${(item.descricao || '').replace(/"/g, '""')}"`,
      parseFloat(item.pesoGeradoKg).toFixed(2),
      item.pesoColetadoKg ? parseFloat(item.pesoColetadoKg).toFixed(2) : '0.00',
      `"${item.statusColeta}"`,
      `"${item.rtCpf}"`,
      `"${item.govbrNivelConta || 'Ouro'}"`,
      `"${item.motoristaNome || '-'}"`,
      `"${item.veiculoPlaca || '-'}"`,
      `"${item.destinadorFinalNome || '-'}"`,
      `"${item.termoValidacaoCodigo || '-'}"`,
      `"${item.cdfCodigo || '-'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SafeWaste_Relatorio_${this.filtroMes}_${this.filtroAno}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    UI.toast('success', 'Relatório Exportado', 'Download da planilha CSV concluído com sucesso!');
  },

  // --- TRILHA DE AUDITORIA ---
  async carregarAuditoria() {
    const res = await SafeWasteAPI.fetchAuditLogs();
    const tbody = document.getElementById('tabelaAuditoriaBody');
    if (!tbody) return;

    if (!res.sucesso || res.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-500">Nenhum evento registrado no log de auditoria.</td></tr>`;
      return;
    }

    tbody.innerHTML = res.data.map(log => {
      let badgePerfil = `<span class="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">SISTEMA</span>`;
      if (log.perfil === 'clinica') {
        badgePerfil = `<span class="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-600">CLÍNICA</span>`;
      } else if (log.perfil === 'coletora') {
        badgePerfil = `<span class="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-600">COLETORA</span>`;
      }

      return `
        <tr class="hover:bg-slate-50 transition border-b border-slate-200 text-xs">
          <td class="p-3.5 font-mono text-slate-600 whitespace-nowrap">${UI.formatDateTime(log.created_at || log.createdAt)}</td>
          <td class="p-3.5 font-bold text-slate-900">${log.acao}</td>
          <td class="p-3.5 text-slate-700 font-medium">${log.autor}</td>
          <td class="p-3.5">${badgePerfil}</td>
          <td class="p-3.5 font-mono text-[10px] text-slate-500 tracking-wider break-all">${log.hashImutabilidade}</td>
        </tr>
      `;
    }).join('');
  }
};

window.App = App;

// Inicialização automática do App
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});