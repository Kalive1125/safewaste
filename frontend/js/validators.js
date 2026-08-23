// =========================================================================
// SafeWaste Validators - Camada de Verificações & Validações Client-Side
// =========================================================================

const Validators = {
  // --- VALIDAÇÃO MATEMÁTICA DE CPF ---
  validarCPF(cpfStr) {
    if (!cpfStr) return false;
    const cleanCPF = String(cpfStr).replace(/\D/g, '');

    if (cleanCPF.length !== 11) return false;
    // Checa repetições triviais como 111.111.111-11
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

    let soma = 0;
    let resto;

    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cleanCPF.substring(i - 1, i), 10) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cleanCPF.substring(9, 10), 10)) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cleanCPF.substring(i - 1, i), 10) * (12 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cleanCPF.substring(10, 11), 10)) return false;

    return true;
  },

  // --- MÁSCARA AUTOMÁTICA DE CPF ---
  mascararCPF(valor) {
    return valor
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  },

  // --- MÁSCARA DE CNPJ ---
  mascararCNPJ(valor) {
    return valor
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
      .substring(0, 18);
  },

  // --- VALIDAÇÃO DE PESO ---
  validarPeso(peso) {
    if (peso === undefined || peso === null || peso === '') return { valido: false, erro: 'Informe o peso do resíduo.' };
    const num = parseFloat(peso);
    if (isNaN(num)) return { valido: false, erro: 'O peso deve ser um valor numérico válido.' };
    if (num <= 0) return { valido: false, erro: 'O peso aferido deve ser maior que 0 kg.' };
    if (num > 10000) return { valido: false, erro: 'O peso excede o limite operacional por manifesto (máx 10.000 kg).' };
    return { valido: true, valor: num };
  },

  // --- VALIDAÇÃO DE DATAS ---
  validarDatas(dataEmissao, dataValidade) {
    if (!dataEmissao) {
      return { valido: false, erro: 'A data de emissão é obrigatória.' };
    }

    const dEmissao = new Date(dataEmissao);
    if (isNaN(dEmissao.getTime())) {
      return { valido: false, erro: 'Data de emissão inválida.' };
    }

    if (dataValidade) {
      const dValidade = new Date(dataValidade);
      if (isNaN(dValidade.getTime())) {
        return { valido: false, erro: 'Data de validade inválida.' };
      }
      if (dValidade < dEmissao) {
        return { valido: false, erro: 'A data de validade não pode ser anterior à data de emissão.' };
      }
    }

    return { valido: true };
  },

  // --- VALIDAÇÃO DE ARQUIVO PDF ---
  validarArquivoPdf(file) {
    if (!file) {
      return { valido: false, erro: 'Nenhum arquivo selecionado.' };
    }

    const nome = file.name.toLowerCase();
    const isPdf = nome.endsWith('.pdf') || file.type === 'application/pdf';

    if (!isPdf) {
      return {
        valido: false,
        erro: 'Formato incompatível. O sistema aceita exclusivamente arquivos no formato PDF (.pdf).'
      };
    }

    const maxBytes = 15 * 1024 * 1024; // 15MB
    if (file.size > maxBytes) {
      return {
        valido: false,
        erro: `O arquivo PDF ultrapassa o limite máximo permitido de 15MB (Tamanho atual: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`
      };
    }

    return { valido: true };
  },

  // --- APLICAR MÁSCARAS EM INPUTS ---
  aplicarMascarasEmInputs() {
    document.querySelectorAll('input[data-mask="cpf"]').forEach(input => {
      input.addEventListener('input', (e) => {
        e.target.value = Validators.mascararCPF(e.target.value);
      });
    });

    document.querySelectorAll('input[data-mask="cnpj"]').forEach(input => {
      input.addEventListener('input', (e) => {
        e.target.value = Validators.mascararCNPJ(e.target.value);
      });
    });
  }
};

window.Validators = Validators;
