const { upload } = require("../../middleware/files.middleware");
const {
  register,
  registerSlow,
  registerWithRedirect,
  sendCode,
  login,
  autoLogin,
  resendCode,
  checkNewUser,
} = require("../controllers/User.controllers");

const UserRoutes = require("express").Router();

UserRoutes.post("/registerUtil", upload.single("image"), register);
UserRoutes.post("/register", upload.single("image"), registerSlow);
UserRoutes.post(
  "/registerRedirect",
  upload.single("image"),
  registerWithRedirect
);
UserRoutes.post("/login", login);
UserRoutes.post("/login/autologin", autoLogin);
UserRoutes.post("/resend", resendCode);
UserRoutes.post("/check", checkNewUser);

//! --------------------- rutas que sirven como un redirects ---------------------
UserRoutes.post("/register/sendMail/:id", sendCode);

module.exports = UserRoutes;
