const pdfGen = require('../utils/pdfGenerator');
const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const isSqlite = process.env.DB_DIALECT === 'sqlite' || !process.env.DB_PASS;
const sequelize = isSqlite
  ? new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '..', 'safewaste.sqlite'),
      logging: false
    })
  : new Sequelize(
      process.env.DB_NAME || 'safewaste_db',
      process.env.DB_USER || 'root',
      process.env.DB_PASS || '',
      {
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false
      }
    );

async function syncAll() {
  try {
    const compDir = path.join(__dirname, '..', 'uploads', 'comprovantes');
    const destDir = path.join(__dirname, '..', 'uploads', 'destinacao');
    const docsDir = path.join(__dirname, '..', 'uploads', 'documents');

    if (!fs.existsSync(compDir)) fs.mkdirSync(compDir, { recursive: true });
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

    // 1. Gerar todos os documentos principais de conformidade
    await pdfGen.gerarPdfPGRSS(path.join(docsDir, 'pgrss-2026.pdf'));
    await pdfGen.gerarPdfAlvaraSanitario(path.join(docsDir, 'alvara-sanitario.pdf'));
    await pdfGen.gerarPdfLicencaAmbiental(path.join(docsDir, 'licenca-inema.pdf'));
    await pdfGen.gerarPdfContratoColeta(path.join(docsDir, 'contrato-coleta.pdf'));
    await pdfGen.gerarPdfTermoValidacaoDestinacao(path.join(docsDir, 'termo-validacao-destinacao.pdf'), 'MTR-2026-7821', {
      termoCodigo: 'TRM-DEST-2026-8812',
      cdfCodigo: 'CDF-2026-3391',
      clinicaNome: 'Clínica OdontoLife (Odontologia Especializada LTDA)',
      grupoResiduo: 'A',
      destinadorNome: 'Bahia Tratamento e Destinação de Resíduos Especiais S/A',
      destinadorCnpj: '03.882.190/0001-44',
      destinadorLao: 'INEMA LAO nº 2024-0012/BA',
      metodo: 'Descontaminação Térmica por Autoclavagem e Trituração (RDC 222/2018)',
      peso: 28.5
    });

    // 2. Buscar todos os resíduos e garantir que comprovantes e termos da usina existam
    const [residuos] = await sequelize.query('SELECT * FROM residuo_logs');

    for (const r of residuos) {
      const mtr = r.mtr_codigo;
      const peso = r.peso_coletado_kg || r.peso_gerado_kg || 15.0;

      // Se passou da etapa de coleta (etapa >= 2)
      if (r.etapa_atual >= 2) {
        const compFile = `comprovante-${mtr.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;
        await pdfGen.gerarPdfComprovanteColeta(path.join(compDir, compFile), mtr, {
          clinicaNome: r.clinica_nome || 'Clínica OdontoLife',
          motorista: r.motorista_nome || 'Carlos Eduardo Santos',
          veiculo: r.veiculo_placa || 'OKL-9214',
          peso,
          grupoResiduo: r.grupo_residuo || 'A',
          dataHora: r.data_hora_coleta || r.data_hora_geracao
        });

        await sequelize.query(
          'UPDATE residuo_logs SET comprovante_pdf_path = :comp WHERE mtr_codigo = :mtr',
          { replacements: { comp: compFile, mtr } }
        );
      }

      // Se concluiu destinação final (etapa 5)
      if (r.etapa_atual === 5) {
        const termoCode = r.termo_validacao_codigo || `TRM-DEST-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const cdfCode = r.cdf_codigo || `CDF-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const destFile = `termo-destinacao-${mtr.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;

        await pdfGen.gerarPdfTermoValidacaoDestinacao(path.join(destDir, destFile), mtr, {
          termoCodigo: termoCode,
          cdfCodigo: cdfCode,
          clinicaNome: r.clinica_nome || 'Clínica OdontoLife (Odontologia Especializada LTDA)',
          grupoResiduo: r.grupo_residuo || 'A',
          destinadorNome: r.destinador_final_nome || 'Bahia Tratamento e Destinação de Resíduos Especiais S/A',
          destinadorCnpj: r.destinador_final_cnpj || '03.882.190/0001-44',
          destinadorLao: r.destinador_final_lao || 'INEMA LAO nº 2024-0012/BA',
          metodo: r.metodo_tratamento || 'Descontaminação Térmica por Autoclavagem e Trituração (RDC 222/2018)',
          peso
        });

        await sequelize.query(
          'UPDATE residuo_logs SET termo_validacao_codigo = :tc, cdf_codigo = :cdf, termo_validacao_pdf_path = :destFile, status_coleta = :st WHERE mtr_codigo = :mtr',
          { replacements: { tc: termoCode, cdf: cdfCode, destFile, st: 'concluido', mtr } }
        );
      }
    }

    console.log('Sincronização e geração de todos os arquivos concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro na sincronização:', error);
    process.exit(1);
  }
}

syncAll();
