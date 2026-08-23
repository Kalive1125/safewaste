// =========================================================================
// SafeWaste UI Presentation Layer & View Management
// =========================================================================

const UI = {
  activeRole: 'clinica',
  activeView: 'dashboard',
  empresaClinica: null,
  empresaColetora: null,

  // --- SISTEMA DE TOASTS CUSTOMIZADOS ---
  toast(type = 'info', title = '', message = '', duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-item';

    const typeConfig = {
      success: {
        icon: 'check-circle-2',
        color: 'text-emerald-700',
        bgColor: 'bg-white',
        borderColor: 'border-emerald-600',
        progressColor: 'bg-emerald-600'
      },
      error: {
        icon: 'alert-triangle',
        color: 'text-rose-700',
        bgColor: 'bg-white',
        borderColor: 'border-rose-600',
        progressColor: 'bg-rose-600'
      },
      warning: {
        icon: 'alert-circle',
        color: 'text-amber-700',
        bgColor: 'bg-white',
        borderColor: 'border-amber-600',
        progressColor: 'bg-amber-600'
      },
      info: {
        icon: 'info',
        color: 'text-emerald-700',
        bgColor: 'bg-white',
        borderColor: 'border-slate-300',
        progressColor: 'bg-emerald-600'
      }
    };

    const cfg = typeConfig[type] || typeConfig.info;
    toast.classList.add(cfg.bgColor, cfg.borderColor);

    toast.innerHTML = `
      <div class="${cfg.color} shrink-0 mt-0.5">
        <i data-lucide="${cfg.icon}" class="w-5 h-5"></i>
      </div>
      <div class="flex-1 min-w-0 pr-2">
        <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider">${title}</h4>
        <p class="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">${message}</p>
      </div>
      <button class="text-slate-400 hover:text-slate-900 shrink-0 -mt-1 -mr-1 p-1 hover:bg-slate-100 transition" onclick="this.closest('.toast-item').remove()">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
      <div class="toast-progress ${cfg.progressColor}" style="animation-duration: ${duration}ms;"></div>
    `;

    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.add('toast-leave');
        setTimeout(() => toast.remove(), 250);
      }
    }, duration);
  },

  // --- SISTEMA DE MODAIS CUSTOMIZADOS ---
  toggleModal(modalId, show = true) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    if (show) {
      modal.classList.remove('hidden');
      setTimeout(() => {
        modal.classList.add('modal-active');
      }, 10);
    } else {
      modal.classList.remove('modal-active');
      setTimeout(() => {
        modal.classList.add('hidden');
      }, 150);
    }
  },

  // --- MODAL DE CONFIRMAÇÃO CUSTOMIZADO ---
  confirm({ title = 'Confirmação', message = 'Deseja prosseguir?', confirmText = 'Confirmar', cancelText = 'Cancelar', isDanger = false, onConfirm = () => {} }) {
    let confirmModal = document.getElementById('modalConfirmCustom');
    if (!confirmModal) {
      confirmModal = document.createElement('div');
      confirmModal.id = 'modalConfirmCustom';
      confirmModal.className = 'fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 hidden modal-backdrop';
      confirmModal.innerHTML = `
        <div class="modal-content glass-card bg-white border border-emerald-600 w-full max-w-md p-6 space-y-4 shadow-xl">
          <div class="flex items-start space-x-3">
            <div id="confirmIconWrapper" class="p-2 border shrink-0">
              <i id="confirmIcon" data-lucide="alert-circle" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 id="confirmTitle" class="text-sm font-bold text-slate-900 uppercase tracking-wider"></h3>
              <p id="confirmMessage" class="text-xs text-slate-600 mt-1 leading-relaxed"></p>
            </div>
          </div>
          <div class="flex justify-end space-x-2 pt-3 border-t border-slate-200">
            <button id="confirmBtnCancel" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold uppercase tracking-wider transition border border-slate-300"></button>
            <button id="confirmBtnOk" class="px-4 py-2 font-bold text-xs uppercase tracking-wider transition shadow-sm"></button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmModal);
    }

    const iconWrapper = document.getElementById('confirmIconWrapper');
    const iconEl = document.getElementById('confirmIcon');
    const titleEl = document.getElementById('confirmTitle');
    const msgEl = document.getElementById('confirmMessage');
    const btnCancel = document.getElementById('confirmBtnCancel');
    const btnOk = document.getElementById('confirmBtnOk');

    titleEl.innerText = title;
    msgEl.innerText = message;
    btnCancel.innerText = cancelText;
    btnOk.innerText = confirmText;

    if (isDanger) {
      iconWrapper.className = 'p-2 border border-rose-300 bg-rose-50 text-rose-700 shrink-0';
      iconEl.setAttribute('data-lucide', 'alert-triangle');
      btnOk.className = 'px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition border border-rose-600';
    } else {
      iconWrapper.className = 'p-2 border border-emerald-300 bg-emerald-50 text-emerald-700 shrink-0';
      iconEl.setAttribute('data-lucide', 'help-circle');
      btnOk.className = 'px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition border border-emerald-600';
    }

    if (window.lucide) lucide.createIcons();

    const closeModal = () => {
      confirmModal.classList.remove('modal-active');
      setTimeout(() => confirmModal.classList.add('hidden'), 150);
    };

    btnCancel.onclick = () => closeModal();
    btnOk.onclick = () => {
      closeModal();
      onConfirm();
    };

    confirmModal.classList.remove('hidden');
    setTimeout(() => confirmModal.classList.add('modal-active'), 10);
  },

  // --- NAVEGAÇÃO ENTRE ABAS ---
  navigate(viewId) {
    UI.activeView = viewId;
    if (window.StorageManager) StorageManager.setActiveView(viewId);

    document.querySelectorAll('main > section').forEach(sec => sec.classList.add('hidden'));

    let targetSectionId = `view-${viewId}`;
    if (viewId === 'dashboard') {
      targetSectionId = UI.activeRole === 'coletora' ? 'view-dashboard-coletora' : 'view-dashboard-clinica';
    }

    const targetSection = document.getElementById(targetSectionId);
    if (targetSection) targetSection.classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => {
      if (btn.getAttribute('data-target') === viewId) {
        btn.classList.add('bg-white', 'text-slate-900', 'border-l-4', 'border-emerald-600', 'shadow-sm');
        btn.classList.remove('text-slate-600', 'hover:bg-slate-200');
      } else {
        btn.classList.remove('bg-white', 'text-slate-900', 'border-l-4', 'border-emerald-600', 'shadow-sm');
        btn.classList.add('text-slate-600', 'hover:bg-slate-200');
      }
    });

    if (window.App && App.onNavigate) {
      App.onNavigate(viewId);
    }
  },

  // --- SELEÇÃO DINÂMICA DE PERFIL (CLÍNICA OU COLETORA) ---
  switchRole(role) {
    if (role !== 'clinica' && role !== 'coletora') {
      role = 'clinica';
    }

    UI.activeRole = role;
    if (window.StorageManager) StorageManager.setActiveRole(role);

    const roleSelector = document.getElementById('roleSelector');
    if (roleSelector && roleSelector.value !== role) {
      roleSelector.value = role;
    }

    const nameDisp = document.getElementById('userNameDisplay');
    const roleDisp = document.getElementById('userRoleDisplay');
    const roleAvatar = document.getElementById('userAvatarDisplay');
    const roleBadge = document.getElementById('userRoleBadge');

    const clinica = UI.empresaClinica || { nomeFantasia: 'Clínica OdontoLife' };
    const coletora = UI.empresaColetora || { nomeFantasia: 'EcoResíduos Logística Ambiental' };

    if (role === 'clinica') {
      if (nameDisp) nameDisp.innerText = clinica.nomeFantasia;
      if (roleDisp) roleDisp.innerText = 'CLÍNICA GERADORA RSS';
      if (roleAvatar) {
        roleAvatar.innerText = clinica.nomeFantasia.substring(0, 2).toUpperCase();
        roleAvatar.className = 'w-8 h-8 bg-emerald-50 border border-emerald-600 flex items-center justify-center text-emerald-700 font-bold text-xs tracking-wider';
      }
      if (roleBadge) {
        roleBadge.innerText = 'GERADOR RSS';
        roleBadge.className = 'text-[10px] font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-600 font-mono uppercase';
      }
    } else {
      if (nameDisp) nameDisp.innerText = coletora.nomeFantasia;
      if (roleDisp) roleDisp.innerText = 'EMPRESA COLETORA RSS';
      if (roleAvatar) {
        roleAvatar.innerText = coletora.nomeFantasia.substring(0, 2).toUpperCase();
        roleAvatar.className = 'w-8 h-8 bg-emerald-50 border border-emerald-600 flex items-center justify-center text-emerald-700 font-bold text-xs tracking-wider';
      }
      if (roleBadge) {
        roleBadge.innerText = 'TRANSPORTADOR / COLETOR';
        roleBadge.className = 'text-[10px] font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-600 font-mono uppercase';
      }
    }

    UI.toast('info', 'Perfil Atualizado', `Ambiente alterado para: ${role === 'clinica' ? clinica.nomeFantasia : coletora.nomeFantasia}`);
    
    if (window.App && App.onRoleSwitch) {
      App.onRoleSwitch(role);
    }

    UI.navigate(UI.activeView);
    if (window.App && App.carregarTudo) {
      App.carregarTudo();
    }
  },

  // --- HELPERS DE FORMATAÇÃO ---
  formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('pt-BR');
  },

  formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  },

  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
};

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-active').forEach(m => {
      UI.toggleModal(m.id, false);
    });
  }
});

window.UI = UI;