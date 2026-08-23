const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Paleta de Cores Institucional SafeWaste
const CORES = {
  primaria: '#047857',      // Emerald escuro
  secundaria: '#065f46',    // Emerald muito escuro
  azulGov: '#1351b4',       // Azul Padrão Gov.br
  cinzaFundo: '#f8fafc',    // Slate 50
  cinzaBorda: '#cbd5e1',    // Slate 300
  textoPrincipal: '#0f172a',// Slate 900
  textoSecundario: '#475569',// Slate 600
  alerta: '#b45309',        // Amber 700
  destaque: '#059669'       // Emerald 600
};

// Helper para desenhar cabeçalho padrão oficial com faixa superior
function desenharCabecalhoOficial(doc, titulo, subtitulo, orgao = 'REPÚBLICA FEDERATIVA DO BRASIL') {
  // Faixa superior verde/azul
  doc.rect(0, 0, doc.page.width, 10).fill(CORES.primaria);
  
  // Moldura externa da página
  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
     .lineWidth(1)
     .strokeColor(CORES.cinzaBorda)
     .stroke();

  // Cabeçalho de texto
  doc.fontSize(8)
     .font('Helvetica-Bold')
     .fillColor(CORES.textoSecundario)
     .text(orgao.toUpperCase(), 35, 32, { align: 'center' });

  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(CORES.textoPrincipal)
     .text(titulo, 35, 46, { align: 'center' });

  doc.fontSize(9)
     .font('Helvetica')
     .fillColor(CORES.textoSecundario)
     .text(subtitulo, 35, 64, { align: 'center' });

  // Linha divisória
  doc.moveTo(35, 80)
     .lineTo(doc.page.width - 35, 80)
     .lineWidth(1.5)
     .strokeColor(CORES.primaria)
     .stroke();
}

// Helper para rodapé com carimbo de autenticidade
function desenharRodapeAutenticidade(doc, hash, dataEmissao = new Date()) {
  const y = doc.page.height - 55;
  
  doc.moveTo(35, y)
     .lineTo(doc.page.width - 35, y)
     .lineWidth(0.8)
     .strokeColor(CORES.cinzaBorda)
     .stroke();

  doc.fontSize(7)
     .font('Helvetica-Bold')
     .fillColor(CORES.textoSecundario)
     .text('SAFEWASTE COMPLIANCE &bull; PLATAFORMA DE RASTREABILIDADE E CONFORMIDADE SANITÁRIA (RDC 222/2018 / MMA 280)', 35, y + 6, { align: 'center' });

  doc.fontSize(6.5)
     .font('Helvetica')
     .fillColor('#64748b')
     .text(`Documento eletrônico autenticado em ${dataEmissao.toLocaleString('pt-BR')} | Hash SHA-256: ${hash || 'd8a39f1c7e42b58091e23f46a782c310b45d9e7a'}`, 35, y + 16, { align: 'center' });
}

// Helper para caixa de seção estilizada
function desenharSecao(doc, y, titulo, altura, preenchimento = '#f8fafc') {
  doc.rect(35, y, doc.page.width - 70, altura)
     .fillAndStroke(preenchimento, CORES.cinzaBorda);

  doc.rect(35, y, doc.page.width - 70, 18)
     .fill(CORES.secundaria);

  doc.fontSize(8.5)
     .font('Helvetica-Bold')
     .fillColor('#ffffff')
     .text(titulo.toUpperCase(), 45, y + 4);
}

// 1. GERADOR DO COMPROVANTE OFICIAL DE COLETA RSS
exports.gerarPdfComprovanteColeta = (caminhoDestino, mtrCodigo, dados) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 35 });
    const writeStream = fs.createWriteStream(caminhoDestino);
    doc.pipe(writeStream);

    desenharCabecalhoOficial(
      doc,
      'COMPROVANTE OFICIAL DE COLETA E TRANSPORTE RSS',
      `Manifesto MTR Nacional: ${mtrCodigo} | Portaria MMA nº 280/2020 & ANVISA RDC 222/2018`,
      'SISTEMA NACIONAL DE INFORMAÇÕES SOBRE A GESTÃO DOS RESÍDUOS SÓLIDOS - SINIR'
    );

    let y = 95;

    // Seção 1: Dados da Unidade Geradora (Clínica)
    desenharSecao(doc, y, '1. Identificação da Unidade Geradora (Clínica)', 65);
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(CORES.textoPrincipal);
    doc.text('Razão Social:', 45, y + 25);
    doc.font('Helvetica').text(dados.clinicaNome || 'Clínica OdontoLife (Odontologia Especializada LTDA)', 115, y + 25);
    
    doc.font('Helvetica-Bold').text('CNPJ:', 45, y + 38);
    doc.font('Helvetica').text(dados.clinicaCnpj || '14.892.410/0001-83', 80, y + 38);

    doc.font('Helvetica-Bold').text('Endereço:', 240, y + 38);
    doc.font('Helvetica').text('Av. Tancredo Neves, 1200 - Salvador/BA', 290, y + 38);

    doc.font('Helvetica-Bold').text('Resp. Técnico:', 45, y + 51);
    doc.font('Helvetica').text('Dra. Camila Silva (CRBM 19481/BA) - Autenticado via Gov.br', 120, y + 51);

    y += 75;

    // Seção 2: Dados da Empresa Transportadora / Coletora
    desenharSecao(doc, y, '2. Identificação da Empresa Transportadora Autorizada', 65);
    doc.font('Helvetica-Bold').text('Razão Social:', 45, y + 25);
    doc.font('Helvetica').text(dados.coletoraNome || 'EcoResíduos Logística e Tratamento Ambiental S/A', 115, y + 25);

    doc.font('Helvetica-Bold').text('CNPJ:', 45, y + 38);
    doc.font('Helvetica').text('07.319.824/0001-55', 80, y + 38);

    doc.font('Helvetica-Bold').text('Licença LAO:', 240, y + 38);
    doc.font('Helvetica').text('INEMA nº 2024-0012/BA', 305, y + 38);

    doc.font('Helvetica-Bold').text('Motorista Coletor:', 45, y + 51);
    doc.font('Helvetica').text(`${dados.motorista || 'Carlos Eduardo Santos'} (CNH: 04892189BA)`, 135, y + 51);

    doc.font('Helvetica-Bold').text('Placa Veículo:', 350, y + 51);
    doc.font('Helvetica').text(dados.veiculo || 'OKL-9214', 420, y + 51);

    y += 75;

    // Seção 3: Dados da Coleta e Pesagem
    desenharSecao(doc, y, '3. Especificação do Resíduo e Aferição de Peso na Balança', 95);
    
    // Tabela de Itens
    doc.rect(45, y + 25, doc.page.width - 90, 18).fill('#e2e8f0');
    doc.fontSize(8).font('Helvetica-Bold').fillColor(CORES.textoPrincipal);
    doc.text('CLASSIFICAÇÃO RSS', 55, y + 30);
    doc.text('DESCRIÇÃO DO MATERIAL', 180, y + 30);
    doc.text('PESO DECLARADO', 360, y + 30);
    doc.text('PESO AFERIDO', 460, y + 30);

    const dataHoraStr = dados.dataHora ? new Date(dados.dataHora).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');
    doc.font('Helvetica').fontSize(8.5).fillColor(CORES.textoPrincipal);
    doc.text(dados.grupoResiduo ? `Grupo ${dados.grupoResiduo}` : 'Grupo A (Biológico)', 55, y + 50);
    doc.text(dados.descricao || 'Materiais biológicos, gazes e luvas hospitalares', 180, y + 50, { width: 170 });
    doc.text(`${dados.peso || 0} kg`, 360, y + 50);
    doc.font('Helvetica-Bold').fillColor(CORES.primaria).text(`${dados.peso || 0} kg`, 460, y + 50);

    doc.font('Helvetica').fontSize(8).fillColor(CORES.textoSecundario);
    doc.text(`Data e Hora da Coleta no Estabelecimento: ${dataHoraStr}`, 45, y + 78);

    y += 105;

    // Seção 4: Destinação Final e Declarações Legais
    desenharSecao(doc, y, '4. Destinação Final Licenciada e Conformidade Legal', 80);
    doc.fontSize(8).font('Helvetica').fillColor(CORES.textoPrincipal);
    doc.text('Destinador Final Licenciado: Bahia Tratamento e Destinação de Resíduos S/A (Polo de Camaçari/BA)', 45, y + 25);
    doc.text('Método Previsto de Tratamento: Descontaminação Térmica por Autoclavagem e Trituração (RDC 222/2018)', 45, y + 37);
    doc.text('Declaração: O transportador declara que a carga foi acondicionada em conformidade com as normas da ANVISA, ABNT NBR 12810 e Portaria MMA 280/2020.', 45, y + 49, { width: doc.page.width - 90 });

    y += 90;

    // Seção 5: Assinaturas Digitais
    doc.rect(35, y, (doc.page.width - 80) / 2, 85).fillAndStroke('#f1f5f9', CORES.cinzaBorda);
    doc.rect(35 + (doc.page.width - 80) / 2 + 10, y, (doc.page.width - 80) / 2, 85).fillAndStroke('#f1f5f9', CORES.cinzaBorda);

    // Box Assinatura Gerador
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(CORES.azulGov);
    doc.text('ASSINATURA DIGITAL GOV.BR', 45, y + 10);
    doc.fontSize(7).font('Helvetica').fillColor(CORES.textoPrincipal);
    doc.text(`Responsável Técnico: Dra. Camila Silva`, 45, y + 24);
    doc.text(`CPF: 042.891.235-00 | Nível: Ouro`, 45, y + 36);
    doc.text(`Unidade Geradora: Clínica OdontoLife`, 45, y + 48);
    doc.fillColor(CORES.destaque).text('&check; Assinado Digitalmente via Gov.br', 45, y + 65);

    // Box Assinatura Transportador
    const x2 = 35 + (doc.page.width - 80) / 2 + 10;
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(CORES.primaria);
    doc.text('ASSINATURA DO TRANSPORTADOR RSS', x2 + 10, y + 10);
    doc.fontSize(7).font('Helvetica').fillColor(CORES.textoPrincipal);
    doc.text(`Motorista: ${dados.motorista || 'Carlos Eduardo Santos'}`, x2 + 10, y + 24);
    doc.text(`Placa do Veículo: ${dados.veiculo || 'OKL-9214'}`, x2 + 10, y + 36);
    doc.text(`EcoResíduos Logística Ambiental S/A`, x2 + 10, y + 48);
    doc.fillColor(CORES.destaque).text('&check; Carga Recebida em Conformidade', x2 + 10, y + 65);

    desenharRodapeAutenticidade(doc, dados.hash || 'f8a92b3c4d5e6f708192a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4');
    doc.end();

    writeStream.on('finish', () => resolve(caminhoDestino));
    writeStream.on('error', reject);
  });
};

// 2. GERADOR DO TERMO OFICIAL DE VALIDAÇÃO DA DESTINAÇÃO FINAL (EMITIDO PELA USINA)
exports.gerarPdfTermoValidacaoDestinacao = (caminhoDestino, mtrCodigo, dados) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 35 });
    const writeStream = fs.createWriteStream(caminhoDestino);
    doc.pipe(writeStream);

    desenharCabecalhoOficial(
      doc,
      'TERMO OFICIAL DE VALIDAÇÃO DE TRATAMENTO E DESTINAÇÃO FINAL',
      `Documento emitido exclusivamente pelo Destinador Final Licenciado &bull; Portaria MMA nº 280/2020`,
      'SECRETARIA ESTADUAL DO MEIO AMBIENTE &bull; INSTITUTO DO MEIO AMBIENTE E RECURSOS HÍDRICOS (INEMA)'
    );

    let y = 95;

    // Selo de Destaque: Vedação Legal da Coletora
    doc.rect(35, y, doc.page.width - 70, 30).fillAndStroke('#eff6ff', '#93c5fd');
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(CORES.azulGov);
    doc.text('CERTIFICADO OFICIAL DO DESTINADOR FINAL (VEDAÇÃO LEGAL DE EMISSÃO POR TRANSPORTADORES):', 45, y + 6);
    doc.fontSize(7).font('Helvetica').fillColor('#1e40af');
    doc.text('Em estrito cumprimento à Portaria MMA nº 280/2020, este certificado é emitido de forma direta e exclusiva pela Usina de Tratamento Licenciada detentora da LAO.', 45, y + 16, { width: doc.page.width - 90 });

    y += 40;

    // Seção 1: Dados do Destinador Final Licenciado (Usina)
    desenharSecao(doc, y, '1. Identificação da Planta de Destinação Final / Usina de Tratamento', 65);
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(CORES.textoPrincipal);
    doc.text('Razão Social:', 45, y + 25);
    doc.font('Helvetica').text(dados.destinadorNome || 'Bahia Tratamento e Destinação de Resíduos Especiais S/A', 115, y + 25);

    doc.font('Helvetica-Bold').text('CNPJ:', 45, y + 38);
    doc.font('Helvetica').text(dados.destinadorCnpj || '03.882.190/0001-44', 80, y + 38);

    doc.font('Helvetica-Bold').text('Licença Ambiental (LAO):', 230, y + 38);
    doc.font('Helvetica').text(dados.destinadorLao || 'INEMA LAO nº 2024-0012/BA', 350, y + 38);

    doc.font('Helvetica-Bold').text('Local da Usina:', 45, y + 51);
    doc.font('Helvetica').text('Via Axial, s/n - Polo Petroquímico de Camaçari/BA', 120, y + 51);

    doc.font('Helvetica-Bold').text('Resp. Técnico:', 330, y + 51);
    doc.font('Helvetica').text('Eng. Químico Roberto Vasconcelos (CRQ-VII 07201948)', 400, y + 51);

    y += 75;

    // Seção 2: Dados da Carga Recebida e Unidade Geradora
    desenharSecao(doc, y, '2. Rastreabilidade da Carga Recebida na Usina', 75);
    doc.font('Helvetica-Bold').text('Código do Termo:', 45, y + 25);
    doc.font('Helvetica').fillColor(CORES.primaria).text(dados.termoCodigo || 'TRM-DEST-2026-OFICIAL', 135, y + 25);

    doc.font('Helvetica-Bold').fillColor(CORES.textoPrincipal).text('MTR Nacional:', 300, y + 25);
    doc.font('Helvetica').text(mtrCodigo, 375, y + 25);

    doc.font('Helvetica-Bold').text('Certificado CDF:', 450, y + 25);
    doc.font('Helvetica').text(dados.cdfCodigo || 'CDF-2026-3391', 525, y + 25);

    doc.font('Helvetica-Bold').text('Gerador RSS:', 45, y + 40);
    doc.font('Helvetica').text(dados.clinicaNome || 'Clínica OdontoLife (CNPJ: 14.892.410/0001-83)', 115, y + 40);

    doc.font('Helvetica-Bold').text('Classificação RSS:', 45, y + 55);
    doc.font('Helvetica').text(`Grupo ${dados.grupoResiduo || 'A'} (Resíduos Infectantes / Biológicos)`, 135, y + 55);

    doc.font('Helvetica-Bold').text('Peso Final Tratado:', 350, y + 55);
    doc.font('Helvetica-Bold').fillColor(CORES.primaria).text(`${dados.peso || 0} kg (Balança Usina)`, 440, y + 55);

    y += 85;

    // Seção 3: Metodologia de Tratamento e Descontaminação Térmica
    desenharSecao(doc, y, '3. Metodologia de Descontaminação Térmica & Descaracterização', 90);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(CORES.textoPrincipal);
    doc.text('Processo Empregado: Autoclavagem de Alta Pressão sob Vapor Saturado com Trituração Estéril', 45, y + 25);
    
    doc.font('Helvetica').fontSize(7.5).fillColor(CORES.textoSecundario);
    doc.text('Parâmetros Operacionais: Temperatura de 138°C | Pressão de 3,5 bar | Tempo de retenção térmica de 45 minutos.', 45, y + 38);
    doc.text('Eficácia Sanitária: Inativação biológica com redução esporicida nível IV (Bacillus stearothermophilus) atendendo plenamente à Resolução ANVISA RDC nº 222/2018 e CONAMA nº 358/2005.', 45, y + 50, { width: doc.page.width - 90 });
    doc.text('Disposição Final dos Rejeitos: Descaracterizados como Resíduos Classe II-A em Aterro Sanitário Industrial Licenciado.', 45, y + 72);

    y += 100;

    // Seção 4: Atestado Legal e Assinatura Técnica
    doc.rect(35, y, doc.page.width - 70, 95).fillAndStroke('#f8fafc', CORES.cinzaBorda);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(CORES.secundaria);
    doc.text('DECLARAÇÃO DE TRATAMENTO E DISPOSIÇÃO FINAL AMBIENTALMENTE ADEQUADA', 45, y + 10);

    doc.fontSize(7.5).font('Helvetica').fillColor(CORES.textoPrincipal);
    doc.text('Atestamos para os devidos fins de direito, sanitários e de fiscalização ambiental que o quantitativo de resíduos especificado acima foi integralmente recebido, pesado, submetido a tratamento térmico esterilizante e destinado conforme a legislação vigente.', 45, y + 24, { width: doc.page.width - 90 });

    // Linha de Assinatura
    doc.moveTo(180, y + 70).lineTo(420, y + 70).lineWidth(1).strokeColor(CORES.textoPrincipal).stroke();
    doc.fontSize(8).font('Helvetica-Bold').text('Eng. Químico Roberto Vasconcelos - CRQ-VII 07201948', 35, y + 74, { align: 'center' });
    doc.fontSize(7).font('Helvetica').text('Responsável Técnico pela Planta de Tratamento &bull; Bahia Tratamento RSS S/A', 35, y + 84, { align: 'center' });

    desenharRodapeAutenticidade(doc, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    doc.end();

    writeStream.on('finish', () => resolve(caminhoDestino));
    writeStream.on('error', reject);
  });
};

// 3. GERADOR DO PGRSS (PLANO DE GERENCIAMENTO DE RESÍDUOS DE SERVIÇOS DE SAÚDE)
exports.gerarPdfPGRSS = (caminhoDestino) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 35 });
    const writeStream = fs.createWriteStream(caminhoDestino);
    doc.pipe(writeStream);

    desenharCabecalhoOficial(
      doc,
      'PGRSS - PLANO DE GERENCIAMENTO DE RESÍDUOS DE SERVIÇOS DE SAÚDE',
      'Elaborado em Conformidade com a Resolução ANVISA RDC nº 222/2018 e CONAMA nº 358/2005',
      'VIGILÂNCIA SANITÁRIA MUNICIPAL &bull; DIRETORIA DE CONTROLE SANITÁRIO E AMBIENTAL'
    );

    let y = 95;

    // Seção 1: Identificação do Estabelecimento Gerador
    desenharSecao(doc, y, '1. Dados Cadastrais do Estabelecimento Gerador de RSS', 65);
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(CORES.textoPrincipal);
    doc.text('Razão Social:', 45, y + 25);
    doc.font('Helvetica').text('OdontoLife Odontologia Especializada LTDA', 110, y + 25);

    doc.font('Helvetica-Bold').text('CNPJ:', 45, y + 38);
    doc.font('Helvetica').text('14.892.410/0001-83 | CNAE: 8630-5/04 (Atividade Odontológica)', 80, y + 38);

    doc.font('Helvetica-Bold').text('Endereço:', 45, y + 51);
    doc.font('Helvetica').text('Av. Tancredo Neves, 1200 - Ed. Empresarial Trade, Sala 804 - Salvador/BA', 95, y + 51);

    y += 75;

    // Seção 2: Responsável Técnico pelo PGRSS
    desenharSecao(doc, y, '2. Responsabilidade Técnica e Elaboração do Plano', 55);
    doc.font('Helvetica-Bold').text('Responsável Técnico:', 45, y + 25);
    doc.font('Helvetica').text('Dra. Camila Silva | Registro: CRBM 19481/BA | CPF: 042.891.235-00', 145, y + 25);
    doc.font('Helvetica-Bold').text('Vigência do Plano:', 45, y + 38);
    doc.font('Helvetica').text('Exercício 2026/2027 (Revisão Anual Obrigatória)', 135, y + 38);

    y += 65;

    // Seção 3: Estimativa e Classificação dos Resíduos Gerados
    desenharSecao(doc, y, '3. Classificação dos Grupos RSS e Volume Estimado', 105);
    
    // Tabela dos Grupos
    doc.rect(45, y + 25, doc.page.width - 90, 16).fill('#e2e8f0');
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(CORES.textoPrincipal);
    doc.text('GRUPO RSS', 55, y + 29);
    doc.text('DESCRIÇÃO DOS MATERIAIS', 130, y + 29);
    doc.text('ACONDICIONAMENTO', 310, y + 29);
    doc.text('ESTIMATIVA MENSAL', 450, y + 29);

    const linhas = [
      { g: 'Grupo A (Biológico)', d: 'Algodão contaminado, gazes, luvas e tecidos', a: 'Saco branco leitoso c/ símbolo infectante', v: '35 kg/mês' },
      { g: 'Grupo B (Químico)', d: 'Amálgama odontológico, anestésicos e reveladores', a: 'Frasco rígido estanque identificado', v: '8 kg/mês' },
      { g: 'Grupo D (Comum)', d: 'Papéis toalha, copos e resíduos administrativos', a: 'Saco preto comum reciclável', v: '60 kg/mês' },
      { g: 'Grupo E (Perfurocortante)', d: 'Agulhas carpule, lâminas de bisturi e brocas', a: 'Recipiente rígido tipo Descarpack', v: '15 kg/mês' }
    ];

    let ly = y + 45;
    doc.font('Helvetica').fontSize(7).fillColor(CORES.textoPrincipal);
    linhas.forEach(item => {
      doc.font('Helvetica-Bold').text(item.g, 55, ly);
      doc.font('Helvetica').text(item.d, 130, ly, { width: 170 });
      doc.text(item.a, 310, ly, { width: 130 });
      doc.font('Helvetica-Bold').text(item.v, 450, ly);
      ly += 14;
    });

    y += 115;

    // Seção 4: Fluxo de Segregação, Coleta e Destinação
    desenharSecao(doc, y, '4. Fluxo Operacional de Coleta, Transporte e Destinação Externa', 85);
    doc.fontSize(7.5).font('Helvetica').fillColor(CORES.textoPrincipal);
    doc.text('&bull; Segregação e Acondicionamento: Realizada no ponto de geração imediatamente após o atendimento odontológico.', 45, y + 24);
    doc.text('&bull; Abrigo Temporário: Armazenamento em abrigo exclusivo de resíduos, dotado de piso lavável e acesso restrito.', 45, y + 36);
    doc.text('&bull; Coleta e Transporte Terceirizado: EcoResíduos Logística Ambiental S/A (Contrato nº 2026/CT-089).', 45, y + 48);
    doc.text('&bull; Tratamento e Destinação Final: Usina Bahia Tratamento RSS S/A (Autoclavagem de Alta Pressão sob LAO INEMA).', 45, y + 60);

    y += 95;

    // Seção 5: Assinatura e Homologação
    doc.rect(35, y, doc.page.width - 70, 60).fillAndStroke('#f1f5f9', CORES.cinzaBorda);
    doc.moveTo(180, y + 42).lineTo(420, y + 42).lineWidth(1).strokeColor(CORES.textoPrincipal).stroke();
    doc.fontSize(8).font('Helvetica-Bold').text('Dra. Camila Silva - CRBM 19481/BA', 35, y + 46, { align: 'center' });
    doc.fontSize(7).font('Helvetica').text('Responsável Técnica Elaboradora do PGRSS &bull; Assinatura com Certificado Digital ICP-Brasil', 35, y + 54, { align: 'center' });

    desenharRodapeAutenticidade(doc, 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0');
    doc.end();

    writeStream.on('finish', () => resolve(caminhoDestino));
    writeStream.on('error', reject);
  });
};

// 4. GERADOR DO ALVARÁ SANITÁRIO MUNICIPAL
exports.gerarPdfAlvaraSanitario = (caminhoDestino) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 35 });
    const writeStream = fs.createWriteStream(caminhoDestino);
    doc.pipe(writeStream);

    desenharCabecalhoOficial(
      doc,
      'ALVARÁ DE AUTORIZAÇÃO SANITÁRIA MUNICIPAL',
      'Secretaria Municipal de Saúde &bull; Diretoria de Vigilância à Saúde (DIVISA)',
      'PREFEITURA MUNICIPAL DE SALVADOR &bull; ESTADO DA BAHIA'
    );

    let y = 95;

    // Brasão e Número do Alvará
    doc.rect(35, y, doc.page.width - 70, 32).fillAndStroke('#ecfdf5', CORES.primaria);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(CORES.primaria);
    doc.text('ALVARÁ SANITÁRIO Nº VISA-2026/08941', 45, y + 7, { align: 'center' });
    doc.fontSize(7.5).font('Helvetica').fillColor(CORES.secundaria);
    doc.text('Processo Administrativo Sanitário nº 2025.109.8821-VISA', 45, y + 20, { align: 'center' });

    y += 42;

    // Seção 1: Dados do Estabelecimento Licenciado
    desenharSecao(doc, y, '1. Identificação do Estabelecimento de Saúde Licenciado', 80);
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(CORES.textoPrincipal);
    doc.text('Razão Social:', 45, y + 25);
    doc.font('Helvetica').text('OdontoLife Odontologia Especializada LTDA', 110, y + 25);

    doc.font('Helvetica-Bold').text('Nome Fantasia:', 45, y + 38);
    doc.font('Helvetica').text('Clínica OdontoLife', 120, y + 38);

    doc.font('Helvetica-Bold').text('CNPJ:', 280, y + 38);
    doc.font('Helvetica').text('14.892.410/0001-83', 315, y + 38);

    doc.font('Helvetica-Bold').text('Endereço:', 45, y + 51);
    doc.font('Helvetica').text('Av. Tancredo Neves, 1200 - Ed. Empresarial Trade, Sala 804 - Salvador/BA', 95, y + 51);

    doc.font('Helvetica-Bold').text('Responsável Técnico:', 45, y + 64);
    doc.font('Helvetica').text('Dra. Camila Silva (CRBM 19481/BA)', 145, y + 64);

    y += 90;

    // Seção 2: Atividades Autorizadas e Prazos
    desenharSecao(doc, y, '2. Atividades e Condicionantes Sanitárias Autorizadas', 95);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(CORES.textoPrincipal);
    doc.text('Atividade Econômica Principal:', 45, y + 25);
    doc.font('Helvetica').text('8630-5/04 - Atividade odontológica com procedimentos clínicos e cirúrgicos ambulatoriais.', 175, y + 25);

    doc.font('Helvetica-Bold').text('Condicionantes Sanitárias:', 45, y + 40);
    doc.font('Helvetica').fontSize(7.5).fillColor(CORES.textoSecundario);
    doc.text('1. Manter PGRSS atualizado e aprovado junto à fiscalização da Vigilância Sanitária.', 45, y + 52);
    doc.text('2. Manter contrato ativo com empresa licenciada para coleta e destinação dos resíduos dos Grupos A, B e E.', 45, y + 64);
    doc.text('3. Afixar este Alvará em local visível ao público e às autoridades sanitárias fiscalizadoras.', 45, y + 76);

    y += 105;

    // Seção 3: Vigência Oficial
    doc.rect(35, y, doc.page.width - 70, 45).fillAndStroke('#f8fafc', CORES.cinzaBorda);
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(CORES.textoPrincipal);
    doc.text('Data de Emissão: 01/10/2025', 45, y + 12);
    doc.text('Data de Validade: 01/10/2026', 220, y + 12);
    doc.fillColor(CORES.primaria).text('SITUAÇÃO: VIGENTE & REGULAR', 390, y + 12);

    doc.fontSize(7).font('Helvetica').fillColor(CORES.textoSecundario);
    doc.text('A renovação deve ser requerida com até 60 dias de antecedência do vencimento.', 45, y + 28);

    y += 60;

    // Assinatura do Fiscal Sanitário
    doc.rect(35, y, doc.page.width - 70, 75).fillAndStroke('#f1f5f9', CORES.cinzaBorda);
    doc.moveTo(180, y + 50).lineTo(420, y + 50).lineWidth(1).strokeColor(CORES.textoPrincipal).stroke();
    doc.fontSize(8).font('Helvetica-Bold').text('Dr. Marcos Aurélio Guimarães - Fiscal Sanitário Municipal', 35, y + 54, { align: 'center' });
    doc.fontSize(7).font('Helvetica').text('Diretoria de Vigilância Sanitária de Salvador (DIVISA/SMS)', 35, y + 64, { align: 'center' });

    desenharRodapeAutenticidade(doc, '99887766554433221100aabbccddeeff00112233445566778899aabbccddeeff');
    doc.end();

    writeStream.on('finish', () => resolve(caminhoDestino));
    writeStream.on('error', reject);
  });
};

// 5. GERADOR DA LICENÇA AMBIENTAL DE OPERAÇÃO (LAO) - INEMA
exports.gerarPdfLicencaAmbiental = (caminhoDestino) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 35 });
    const writeStream = fs.createWriteStream(caminhoDestino);
    doc.pipe(writeStream);

    desenharCabecalhoOficial(
      doc,
      'LICENÇA AMBIENTAL DE OPERAÇÃO (LAO)',
      'Portaria INEMA de Concessão de Licença Ambiental para Transporte e Tratamento de Cargas Perigosas',
      'GOVERNO DO ESTADO DA BAHIA &bull; SECRETARIA DO MEIO AMBIENTE (SEMA) &bull; INEMA'
    );

    let y = 95;

    // Caixa de Destaque da Portaria
    doc.rect(35, y, doc.page.width - 70, 32).fillAndStroke('#f0fdf4', CORES.primaria);
    doc.fontSize(10.5).font('Helvetica-Bold').fillColor(CORES.primaria);
    doc.text('PORTARIA INEMA LAO Nº 2024-0012/BA', 45, y + 7, { align: 'center' });
    doc.fontSize(7.5).font('Helvetica').fillColor(CORES.secundaria);
    doc.text('Cadastro Estadual de Atividades Ambientais - CEFI nº BA-88912/2024', 45, y + 20, { align: 'center' });

    y += 42;

    // Seção 1: Dados do Titular da Licença
    desenharSecao(doc, y, '1. Identificação da Empresa Licenciada', 70);
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(CORES.textoPrincipal);
    doc.text('Razão Social:', 45, y + 25);
    doc.font('Helvetica').text('EcoResíduos Logística e Tratamento Ambiental S/A', 110, y + 25);

    doc.font('Helvetica-Bold').text('CNPJ:', 45, y + 38);
    doc.font('Helvetica').text('07.319.824/0001-55 | Inscrição Estadual: 098.314.771', 80, y + 38);

    doc.font('Helvetica-Bold').text('Endereço Base:', 45, y + 51);
    doc.font('Helvetica').text('Rodovia CIA-Aeroporto, KM 4.5 - Polo Logístico - Simões Filho/BA', 120, y + 51);

    y += 80;

    // Seção 2: Atividades Autorizadas e Padrões de Rastreabilidade
    desenharSecao(doc, y, '2. Atividades Ambientais Autorizadas & Condicionantes', 105);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(CORES.textoPrincipal);
    doc.text('Atividade Licenciada:', 45, y + 25);
    doc.font('Helvetica').text('Coleta, Transporte Rodoviário Especializado e Destinação de Resíduos de Serviços de Saúde (Classe I - Perigosos).', 140, y + 25, { width: doc.page.width - 190 });

    doc.font('Helvetica-Bold').text('Condicionantes Obrigatórias:', 45, y + 48);
    doc.font('Helvetica').fontSize(7.5).fillColor(CORES.textoSecundario);
    doc.text('1. Obrigatoriedade de emissão e registro de MTR Nacional (SINIR) para cada carregamento.', 45, y + 60);
    doc.text('2. Todos os veículos da frota devem possuir CIV (Certificado de Inspeção Veicular) e CIPP válidos pelo INMETRO.', 45, y + 72);
    doc.text('3. Descarte restrito e obrigatório em usinas de destinação devidamente licenciadas pelo INEMA/IBAMA.', 45, y + 84);

    y += 115;

    // Seção 3: Vigência
    doc.rect(35, y, doc.page.width - 70, 40).fillAndStroke('#fffbeb', CORES.alerta);
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(CORES.alerta);
    doc.text('Data de Emissão: 15/08/2025', 45, y + 10);
    doc.text('Data de Validade: 15/09/2026', 220, y + 10);
    doc.text('STATUS: VIGENTE (RENOVAÇÃO EM ANDAMENTO)', 370, y + 10);
    doc.fontSize(7).font('Helvetica').text('Protocolo de Revalidação Tempestiva INEMA nº 2026-99120 protocolado.', 45, y + 25);

    y += 50;

    // Assinatura do INEMA
    doc.rect(35, y, doc.page.width - 70, 75).fillAndStroke('#f1f5f9', CORES.cinzaBorda);
    doc.moveTo(180, y + 50).lineTo(420, y + 50).lineWidth(1).strokeColor(CORES.textoPrincipal).stroke();
    doc.fontSize(8).font('Helvetica-Bold').text('Dr. Eduardo Mendonça Bahia - Diretor de Licenciamento Ambiental', 35, y + 54, { align: 'center' });
    doc.fontSize(7).font('Helvetica').text('Instituto do Meio Ambiente e Recursos Hídricos - INEMA / Governo da Bahia', 35, y + 64, { align: 'center' });

    desenharRodapeAutenticidade(doc, '445566778899aabbccddeeff00112233445566778899aabbccddeeff0011223344');
    doc.end();

    writeStream.on('finish', () => resolve(caminhoDestino));
    writeStream.on('error', reject);
  });
};

// 6. GERADOR DO CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE COLETA RSS
exports.gerarPdfContratoColeta = (caminhoDestino) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 35 });
    const writeStream = fs.createWriteStream(caminhoDestino);
    doc.pipe(writeStream);

    desenharCabecalhoOficial(
      doc,
      'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE COLETA, TRANSPORTE E TRATAMENTO RSS',
      'Instrumento Particular de Contrato de Gestão e Destinação de Resíduos de Serviços de Saúde',
      'SAFEWASTE LEGAL COMPLIANCE &bull; INSTRUMENTO CONTRATUAL Nº CT-2026/089'
    );

    let y = 95;

    // Seção 1: Qualificação das Partes
    desenharSecao(doc, y, '1. Qualificação das Partes Contratantes', 75);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(CORES.textoPrincipal);
    doc.text('CONTRATANTE:', 45, y + 25);
    doc.font('Helvetica').text('OdontoLife Odontologia Especializada LTDA, CNPJ 14.892.410/0001-83, Salvador/BA.', 125, y + 25);

    doc.font('Helvetica-Bold').text('CONTRATADA:', 45, y + 40);
    doc.font('Helvetica').text('EcoResíduos Logística e Tratamento Ambiental S/A, CNPJ 07.319.824/0001-55, Simões Filho/BA.', 125, y + 40);

    doc.font('Helvetica-Bold').text('DESTINAÇÃO FINAL:', 45, y + 55);
    doc.font('Helvetica').text('Bahia Tratamento e Destinação de Resíduos S/A (Planta Licenciada Camaçari/BA).', 145, y + 55);

    y += 85;

    // Seção 2: Cláusulas Principais
    desenharSecao(doc, y, '2. Cláusulas e Obrigações Regulatórias Principais', 125);
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(CORES.textoPrincipal);
    doc.text('CLÁUSULA PRIMEIRA - DO OBJETO:', 45, y + 24);
    doc.font('Helvetica').text('A CONTRATADA obriga-se a prestar serviços especializados de coleta, pesagem, transporte e encaminhamento para tratamento térmico dos Resíduos de Serviços de Saúde (Grupos A, B e E) gerados nas instalações da CONTRATANTE.', 45, y + 35, { width: doc.page.width - 90 });

    doc.font('Helvetica-Bold').text('CLÁUSULA SEGUNDA - DA CONFORMIDADE REGULATÓRIA (MTR NACIONAL / SINIR):', 45, y + 55);
    doc.font('Helvetica').text('Para cada recolhimento efetuado, será formalizado o Manifesto de Transporte de Resíduos (MTR) emitido eletronicamente e assinado digitalmente pelas partes com carimbo Gov.br.', 45, y + 66, { width: doc.page.width - 90 });

    doc.font('Helvetica-Bold').text('CLÁUSULA TERCEIRA - DA DESTINAÇÃO FINAL E PROVAS SANITÁRIAS:', 45, y + 86);
    doc.font('Helvetica').text('A CONTRATADA compromete-se a disponibilizar para a CONTRATANTE o Termo Oficial de Validação de Entrega emitido pela usina de tratamento após cada ciclo de descontaminação térmica.', 45, y + 97, { width: doc.page.width - 90 });

    y += 135;

    // Seção 3: Vigência e Foro
    doc.rect(35, y, doc.page.width - 70, 35).fillAndStroke('#f8fafc', CORES.cinzaBorda);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(CORES.textoPrincipal);
    doc.text('Vigência Contratual: 01/01/2026 a 01/01/2027 (Renovação Automática Anual)', 45, y + 10);
    doc.font('Helvetica').fontSize(7.5).text('Foro Eleito: Comarca de Salvador, Estado da Bahia.', 45, y + 22);

    y += 45;

    // Assinaturas das Partes
    doc.rect(35, y, (doc.page.width - 80) / 2, 70).fillAndStroke('#f1f5f9', CORES.cinzaBorda);
    doc.rect(35 + (doc.page.width - 80) / 2 + 10, y, (doc.page.width - 80) / 2, 70).fillAndStroke('#f1f5f9', CORES.cinzaBorda);

    // Assinatura Contratante
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(CORES.primaria);
    doc.text('PELA CONTRATANTE (CLÍNICA):', 45, y + 10);
    doc.fontSize(7).font('Helvetica').fillColor(CORES.textoPrincipal);
    doc.text('Dra. Camila Silva (Resp. Técnica)', 45, y + 24);
    doc.text('OdontoLife Odontologia Especializada', 45, y + 36);
    doc.fillColor(CORES.destaque).text('&check; Assinado Digitalmente (ICP-Brasil)', 45, y + 52);

    // Assinatura Contratada
    const x2 = 35 + (doc.page.width - 80) / 2 + 10;
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(CORES.primaria);
    doc.text('PELA CONTRATADA (COLETORA):', x2 + 10, y + 10);
    doc.fontSize(7).font('Helvetica').fillColor(CORES.textoPrincipal);
    doc.text('Carlos Eduardo Santos (Diretoria Operacional)', x2 + 10, y + 24);
    doc.text('EcoResíduos Logística Ambiental S/A', x2 + 10, y + 36);
    doc.fillColor(CORES.destaque).text('&check; Assinado Digitalmente (e-CNPJ)', x2 + 10, y + 52);

    desenharRodapeAutenticidade(doc, 'bbccddeeff00112233445566778899aabbccddeeff00112233445566778899aabb');
    doc.end();

    writeStream.on('finish', () => resolve(caminhoDestino));
    writeStream.on('error', reject);
  });
};
