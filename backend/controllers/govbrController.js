const Empresa = require('../models/Empresa');
const auditoriaController = require('./auditoriaController');

// Simulação e integração com a API Confiabilidades V3 do ConectaGov / Serpro
// Swagger: https://apigateway.conectagov.estaleiro.serpro.gov.br/api-govbr-confiabilidades/v3

const BASE_CONFIABILIDADES = {
  '201': { id: '201', nome: 'Validação de Dados Previdenciários / Balcão Presencial', categoria: '102', nivel: '2', nivelNome: 'Prata' },
  '202': { id: '202', nome: 'Validação via Internet Banking de Bancos Credenciados', categoria: '102', nivel: '2', nivelNome: 'Prata' },
  '301': { id: '301', nome: 'Certificado Digital de Pessoa Física ICP-Brasil (e-CPF)', categoria: '103', nivel: '3', nivelNome: 'Ouro' },
  '302': { id: '302', nome: 'Validação Biométrica / Reconhecimento Facial TSE', categoria: '103', nivel: '3', nivelNome: 'Ouro' }
};

// 1. GET /contas/{id-conta}/confiabilidades
exports.obterConfiabilidades = async (req, res) => {
  try {
    const { cpf } = req.params;
    const cleanCPF = String(cpf || '').replace(/\D/g, '');

    if (!cleanCPF || cleanCPF.length !== 11) {
      return res.status(400).json({
        errors: [{ code: 'ACCOUNTID_MUSTBEVALIDCPF', status: 400, title: 'O identificador da conta deve ser um CPF válido.' }]
      });
    }

    const dataAtual = new Date().toISOString();
    const reliabilities = [
      { id: '301', dataAtualizacao: dataAtual },
      { id: '201', dataAtualizacao: dataAtual }
    ];

    return res.json(reliabilities);
  } catch (error) {
    return res.status(500).json({ errors: [{ code: 'INTERNAL_ERROR', status: 500, title: error.message }] });
  }
};

// 2. GET /contas/{id-conta}/categorias
exports.obterCategorias = async (req, res) => {
  try {
    const { cpf } = req.params;
    const cleanCPF = String(cpf || '').replace(/\D/g, '');

    if (!cleanCPF || cleanCPF.length !== 11) {
      return res.status(400).json({
        errors: [{ code: 'ACCOUNTID_MUSTBEVALIDCPF', status: 400, title: 'O identificador da conta deve ser um CPF válido.' }]
      });
    }

    const dataAtual = new Date().toISOString();
    const categories = [
      { id: '102', dataAtualizacao: dataAtual },
      { id: '103', dataAtualizacao: dataAtual }
    ];

    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ errors: [{ code: 'INTERNAL_ERROR', status: 500, title: error.message }] });
  }
};

// 3. GET /contas/{id-conta}/niveis
exports.obterNiveis = async (req, res) => {
  try {
    const { cpf } = req.params;
    const cleanCPF = String(cpf || '').replace(/\D/g, '');

    if (!cleanCPF || cleanCPF.length !== 11) {
      return res.status(400).json({
        errors: [{ code: 'ACCOUNTID_MUSTBEVALIDCPF', status: 400, title: 'O identificador da conta deve ser um CPF válido.' }]
      });
    }

    const dataAtual = new Date().toISOString();
    const levels = [
      { id: '3', dataAtualizacao: dataAtual }
    ];

    return res.json(levels);
  } catch (error) {
    return res.status(500).json({ errors: [{ code: 'INTERNAL_ERROR', status: 500, title: error.message }] });
  }
};

// 4. POST /auth/govbr/login (Fluxo SSO OAuth2 com suporte a perfil Clínica vs Coletora)
exports.loginGovBr = async (req, res) => {
  try {
    const { cpf, nome, tipoAutenticacao, perfil } = req.body;
    const papelPerfil = perfil === 'coletora' ? 'coletora' : 'clinica';
    const cleanCPF = String(cpf || '').replace(/\D/g, '');

    if (cleanCPF.length !== 11) {
      return res.status(400).json({ sucesso: false, erro: 'CPF informado é inválido para login Gov.br.' });
    }

    // Buscar empresas cadastradas
    const clinica = await Empresa.findOne({ where: { tipo: 'geradora', ativo: true } });
    const coletora = await Empresa.findOne({ where: { tipo: 'coletora', ativo: true } });

    const nivelNome = tipoAutenticacao === 'banco' ? 'Prata' : 'Ouro';
    const nivelId = tipoAutenticacao === 'banco' ? '2' : '3';

    let vinculoInfo;
    let nomeFinal = nome;

    if (papelPerfil === 'clinica') {
      nomeFinal = nome || (clinica ? clinica.responsavelTecnicoNome : 'Dra. Camila Silva');
      vinculoInfo = {
        perfil: 'clinica',
        vinculado: true,
        unidadeNome: clinica ? clinica.nomeFantasia : 'Clínica OdontoLife',
        unidadeCnpj: clinica ? clinica.cnpj : '14.892.410/0001-83',
        numeroRegistroMtr: 'SINIR-BA-2026-98124',
        papel: 'Responsável Técnico / Gerador RSS Autorizado',
        status: 'ATIVO / REGULAR'
      };
    } else {
      nomeFinal = nome || (coletora ? coletora.responsavelTecnicoNome : 'Carlos Eduardo Santos');
      vinculoInfo = {
        perfil: 'coletora',
        vinculado: true,
        unidadeNome: coletora ? coletora.nomeFantasia : 'EcoResíduos Logística Ambiental',
        unidadeCnpj: coletora ? coletora.cnpj : '07.319.824/0001-55',
        numeroRegistroMtr: 'SINIR-TRANSP-2026-4412',
        papel: 'Transportador / Coletor RSS Credenciado',
        status: 'ATIVO / REGULAR'
      };
    }

    const usuario = {
      cpf: cpf,
      nome: nomeFinal,
      perfil: papelPerfil,
      nivelConta: nivelNome,
      nivelId: nivelId,
      seloPrincipal: tipoAutenticacao === 'banco' ? 'Validação Bancária / Balcão Presencial' : 'Certificado Digital ICP-Brasil (e-CPF)',
      selosIds: tipoAutenticacao === 'banco' ? ['201', '202'] : ['301', '201'],
      vinculoMtrNacional: vinculoInfo,
      token: `govbr-oauth2-jwt-${papelPerfil}-${Date.now()}`
    };

    await auditoriaController.registrarAcao(
      `Autenticação Gov.br (${papelPerfil === 'clinica' ? 'Clínica' : 'Coletora'} - Nível ${nivelNome} - Selo ${usuario.seloPrincipal})`,
      usuario.nome,
      papelPerfil,
      { cpf: usuario.cpf, nivel: nivelNome, unidade: vinculoInfo.unidadeNome, vinculoSinir: vinculoInfo.status }
    );

    return res.json({
      sucesso: true,
      mensagem: `Autenticação Gov.br (${papelPerfil === 'clinica' ? 'Responsável pela Clínica' : 'Responsável pela Coletora'}) realizada com sucesso! Nível ${nivelNome} validado no SINIR/MTR.`,
      data: usuario
    });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};

// 5. GET /auth/govbr/validar-vinculo-mtr
exports.validarVinculoMTR = async (req, res) => {
  try {
    const { cpf, perfil } = req.query;
    const cleanCPF = String(cpf || '').replace(/\D/g, '');
    const papelPerfil = perfil === 'coletora' ? 'coletora' : 'clinica';

    const empresa = await Empresa.findOne({ where: { tipo: papelPerfil === 'clinica' ? 'geradora' : 'coletora', ativo: true } });

    return res.json({
      sucesso: true,
      data: {
        cpfValido: cleanCPF.length === 11,
        vinculadoSinir: true,
        perfil: papelPerfil,
        unidade: empresa ? empresa.nomeFantasia : (papelPerfil === 'clinica' ? 'Clínica OdontoLife' : 'EcoResíduos Logística'),
        cnpj: empresa ? empresa.cnpj : '-',
        permissaoMTR: true,
        normaRegulamentadora: 'Portaria MMA nº 280/2020 (MTR Nacional / SINIR)'
      }
    });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};
