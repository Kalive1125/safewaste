const UI = {
  navigate(viewId) {
    document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
    document.getElementById(`view-${viewId}`)?.classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.target === viewId));
    if (window.lucide) lucide.createIcons();
  },
  toggleModal(id, show = true) {
    document.getElementById(id)?.classList.toggle('hidden', !show);
    if (show && window.lucide) lucide.createIcons();
  },
  switchRole(role) {
    const roles = { clinica: ['Clínica OdontoLife', 'CLÍNICA GERADORA', 'CL', 'OdontoLife'], coletora: ['EcoResíduos Logística', 'EMPRESA COLETORA', 'EC', 'EcoResíduos'] };
    const [name, label, initials, greeting] = roles[role];
    document.getElementById('userNameDisplay').textContent = name;
    document.getElementById('userRoleDisplay').textContent = label;
    document.getElementById('avatarDisplay').textContent = initials;
    document.getElementById('greetingName').textContent = greeting;
    document.querySelectorAll('.clinic-only').forEach(el => el.classList.toggle('hidden', role !== 'clinica'));
    document.querySelectorAll('.collector-only').forEach(el => el.classList.toggle('hidden', role !== 'coletora'));
    App.role = role;
    App.log(`Perfil alterado para ${label}.`);
    App.render();
  },
  toast(message) {
    const toast = document.getElementById('toast'); toast.textContent = message; toast.classList.remove('hidden');
    clearTimeout(UI.toastTimer); UI.toastTimer = setTimeout(() => toast.classList.add('hidden'), 3600);
  }
};
