class AuthController {
  constructor({ authService }) {
    this._authService = authService;
  }

  login = async (req, res, next) => {
    const { email, password } = req.validado.body;

    const { token, usuario } = this._authService.login(email, password);

    res.json({ token, usuario });
  };

  yo = (req, res, _next) => {
    res.json(req.usuario.sinPassword());
  };
}

export { AuthController };
