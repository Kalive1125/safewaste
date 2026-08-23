const UI = {
  navigate(viewId) {
    document.querySelectorAll('main > section').forEach(sec => sec.classList.add('hidden'));
    const targetSection = document.getElementById(`view-${viewId}`);
    if (targetSection) targetSection.classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => {
      if (btn.getAttribute('data-target') === viewId) {
        btn.classList.add('bg-slate-800', 'text-white');
      } else {
        btn.classList.remove('bg-slate-800', 'text-white');
      }
    });
  },

  toggleModal(modalId, show = true) {
    const modal = document.getElementById(modalId);
    if (modal) {
      if (show) modal.classList.remove('hidden');
      else modal.classList.add('hidden');
    }
  },

  switchRole(role) {
    const nameDisp = document.getElementById('userNameDisplay');
    const roleDisp = document.getElementById('userRoleDisplay');

    const roleMap = {
      master: { name: 'Administrador do Sistema', role: 'ADMINISTRADOR MASTER' },
      clinica: { name: 'Clínica OdontoLife', role: 'CLÍNICA GERADORA' },
      coletora: { name: 'EcoResíduos Logística', role: 'EMPRESA COLETORA' },
      destino: { name: 'Bahia Tratamento RSS', role: 'DESTINO FINAL' },
      demo: { name: 'Demonstração Comercial', role: 'MODO DEMO (ENTERPRISE)' }
    };

    if (roleMap[role]) {
      nameDisp.innerText = roleMap[role].name;
      roleDisp.innerText = roleMap[role].role;
    }
  }
};