// Middleware de autenticação e autorização por perfil
module.exports = (rolesPermitidas = []) => {
  return (req, res, next) => {
    // Para simplificar a demonstração no Hackathon, pass-through com injeção de perfil
    const perfil = req.headers['x-user-role'] || 'clinica';
    req.user = { perfil };

    if (rolesPermitidas.length > 0 && !rolesPermitidas.includes(perfil)) {
      return res.status(403).json({
        sucesso: false,
        erro: 'Acesso não autorizado para o perfil atual.'
      });
    }
    next();
  };
};
