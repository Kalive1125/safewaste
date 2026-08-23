const ConfiguracaoSistema = require('../models/ConfiguracaoSistema');
const Empresa = require('../models/Empresa');

// Constantes de fallback normativo (ANVISA RDC 222/2018 e CONAMA 358/2005)
const GRUPOS_RSS_PADRAO = [
  {
    codigo: 'A',
    nome: 'Grupo A - Biológico / Infectante',
    descricao: 'Resíduos com presença de agentes biológicos (gases, luvas, culturas, bolsas de sangue, tecidos humanos e animais).',
    cor: '#059669',
    exemplos: 'Luvas, gazes, campos cirúrgicos, algodão contaminado com sangue'
  },
  {
    codigo: 'B',
    nome: 'Grupo B - Químico',
    descricao: 'Resíduos contendo substâncias químicas com risco de inflamabilidade, corrosividade, toxicidade ou mutagenicidade.',
    cor: '#10b981',
    exemplos: 'Medicamentos vencidos, reagentes de laboratório, reveladores radiográficos, desinfetantes'
  },
  {
    codigo: 'C',
    nome: 'Grupo C - Rejeito Radioativo',
    descricao: 'Quaisquer materiais resultantes de atividades humanas que contenham radionuclídeos em quantidades superiores aos limites.',
    cor: '#334155',
    exemplos: 'Materiais de medicina nuclear e radioterapia'
  },
  {
    codigo: 'D',
    nome: 'Grupo D - Resíduo Comum / Reciclável',
    descricao: 'Resíduos que não apresentam risco biológico, químico ou radiológico (equiparados aos resíduos domiciliares).',
    cor: '#64748b',
    exemplos: 'Papel toalha não contaminado, embalagens plásticas, copos descartáveis'
  },
  {
    codigo: 'E',
    nome: 'Grupo E - Perfurocortante',
    descricao: 'Materiais perfurantes ou cortantes potencialmente contaminados com agentes biológicos.',
    cor: '#047857',
    exemplos: 'Agulhas, lâminas de bisturi, ampolas de vidro, escalpes, ponteiras'
  }
];

const DOCUMENTOS_EXIGIDOS_PADRAO = [
  {
    id: 'pgrss',
    tipo: 'PGRSS (Plano de Gerenciamento de Resíduos de Serviços de Saúde)',
    obrigatorio: true,
    sigla: 'PGRSS',
    descricao: 'Documento técnico que estabelece as ações relativas ao manejo dos resíduos gerados.',
    orgaoEmissor: 'Responsável Técnico / Vigilância Sanitária',
    renovacaoMeses: 12
  },
  {
    id: 'alvara',
    tipo: 'Alvará Sanitário Vigente',
    obrigatorio: true,
    sigla: 'Alvará',
    descricao: 'Licença expedida pelo órgão de vigilância sanitária municipal que autoriza o funcionamento.',
    orgaoEmissor: 'Vigilância Sanitária Municipal',
    renovacaoMeses: 12
  },
  {
    id: 'lao',
    tipo: 'Licença Ambiental de Operação (LAO)',
    obrigatorio: true,
    sigla: 'LAO',
    descricao: 'Autoriza o funcionamento da atividade após as verificações do cumprimento de exigências ambientais.',
    orgaoEmissor: 'Órgão Ambiental Estadual/Municipal (Ex: INEMA)',
    renovacaoMeses: 24
  },
  {
    id: 'contrato',
    tipo: 'Contrato de Prestação de Serviços de Coleta RSS',
    obrigatorio: true,
    sigla: 'Contrato',
    descricao: 'Contrato formal e vigente com empresa devidamente licenciada para coleta, transporte e destinação.',
    orgaoEmissor: 'Empresa Coletora Especializada',
    renovacaoMeses: 12
  },
  {
    id: 'cdf',
    tipo: 'Certificado de Destinação Final (CDF)',
    obrigatorio: false,
    sigla: 'CDF',
    descricao: 'Documento que comprova a efetiva destinação final ambientalmente adequada dos resíduos.',
    orgaoEmissor: 'Aterro ou Usina de Tratamento',
    renovacaoMeses: 0
  },
  {
    id: 'outros',
    tipo: 'Outros Documentos Complementares',
    obrigatorio: false,
    sigla: 'Outros',
    descricao: 'Certificados de capacitação técnica, laudos de descontaminação e relatórios adicionais.',
    orgaoEmissor: 'Diversos',
    renovacaoMeses: 0
  }
];

exports.obterMetadados = async (req, res) => {
  try {
    // Buscar configurações do banco se existirem
    let gruposRss = GRUPOS_RSS_PADRAO;
    let docsExigidos = DOCUMENTOS_EXIGIDOS_PADRAO;

    const confGrupos = await ConfiguracaoSistema.findOne({ where: { chave: 'GRUPOS_RSS' } });
    if (confGrupos && confGrupos.valor) {
      try { gruposRss = JSON.parse(confGrupos.valor); } catch (e) {}
    }

    const confDocs = await ConfiguracaoSistema.findOne({ where: { chave: 'DOCUMENTOS_OBRIGATORIOS' } });
    if (confDocs && confDocs.valor) {
      try { docsExigidos = JSON.parse(confDocs.valor); } catch (e) {}
    }

    const empresas = await Empresa.findAll({ where: { ativo: true } });
    const clinica = empresas.find(e => e.tipo === 'geradora') || null;
    const coletora = empresas.find(e => e.tipo === 'coletora') || null;

    return res.json({
      sucesso: true,
      data: {
        sistema: {
          nome: 'SafeWaste Compliance',
          versao: '2.5.0',
          normasReferencia: ['ANVISA RDC 222/2018', 'CONAMA 358/2005', 'Portaria MS 3.44/98'],
          anoVigente: 2026,
          meses: [
            { numero: 1, nome: 'Janeiro' },
            { numero: 2, nome: 'Fevereiro' },
            { numero: 3, nome: 'Março' },
            { numero: 4, nome: 'Abril' },
            { numero: 5, nome: 'Maio' },
            { numero: 6, nome: 'Junho' },
            { numero: 7, nome: 'Julho' },
            { numero: 8, nome: 'Agosto' },
            { numero: 9, nome: 'Setembro' },
            { numero: 10, nome: 'Outubro' },
            { numero: 11, nome: 'Novembro' },
            { numero: 12, nome: 'Dezembro' }
          ],
          anosDisponiveis: [2025, 2026, 2027]
        },
        gruposResiduos: gruposRss,
        documentosExigidos: docsExigidos,
        empresas: {
          clinica,
          coletora
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};
