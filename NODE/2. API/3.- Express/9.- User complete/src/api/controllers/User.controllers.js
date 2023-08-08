const User = require("../models/User.model");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const setError = require("../helpers/handle-error");
const randomCode = require("../../utils/randomCode");
const { deleteImgCloudinary } = require("../../middleware/files.middleware");
const sendEmail = require("../../utils/sendEmail");
const { get } = require("mongoose");
const { getTestEmailSend, setTestEmailSend } = require("../state/state.data");
dotenv.config();
const nodemailer = require("nodemailer");
const { generateToken } = require("../../utils/token");

//! -----------------------------------------------------------------------------
//? ----------------------------REGISTER CORTO EN CODIGO ------------------------
//! -----------------------------------------------------------------------------

const register = async (req, res, next) => {
  let catchImg = req.file?.path;
  try {
    await User.syncIndexes();

    // gestionar la generacion de un codigo random para que se pueda verificar
    let confirmationCode = randomCode();

    // Destructuring del email y el animation-name:
    const { email, name } = req.body;

    // vamos a comprobar que el usuario existe
    const userExist = await User.findOne({ email: email }, { name: name });

    // condicionamos el codigo a que este usuario exista o no

    if (!userExist) {
      // istanciamos al modelo y creamos una nueva instancia del mismo
      const newUser = new User({ ...req.body, confirmationCode });

      // vamos a ver si tenemos imagen subida por el form y si exsite la metemos al modelo instanciado
      if (req.file) {
        newUser.image = catchImg;
      } else {
        newUser.image = "https://pic.onlinewebfonts.com/svg/img_181369.png";
      }

      // guardar el nuevo usuario dentro de mongo const {second} =

      try {
        const userSave = await newUser.save();
        if (userSave) {
          // si hemos guardado el usuario, llamamos a una funct que nos envie el email

          sendEmail(email, name, confirmationCode);
          setTimeout(() => {
            if (getTestEmailSend()) {
              setTestEmailSend(false);
              return res.status(200).json({ user: userSave, confirmationCode });
            } else {
              setTestEmailSend(false);
              return res.status(404).json({
                user: userSave,
                confirmationCode: "error, resend code",
              });
            }
          }, 1400);
        } else {
          return res.status(404).json("not saved user");
        }
      } catch (error) {
        return res.status(404).json("not saved user", error.message);
      }
    } else {
      /// si no existe lanzamos un error y borramos la imagen subida en caso que la haya
      if (req.file) deleteImgCloudinary(catchImg);
      return res.status(409).json("this user already exist");
    }
  } catch (error) {
    return next(error);
  }
};

//! -----------------------------------------------------------------------------
//? ----------------------------REGISTER LARGO EN CODIGO ------------------------
//! -----------------------------------------------------------------------------

const registerSlow = async (req, res, next) => {
  let catchImg = req.file?.path;
  try {
    await User.syncIndexes();
    let confirmationCode = randomCode();
    const { email, name } = req.body;

    const userExist = await User.findOne(
      { email: req.body.email },
      { name: req.body.name }
    );
    if (!userExist) {
      const newUser = new User({ ...req.body, confirmationCode });
      if (req.file) {
        newUser.image = req.file.path;
      } else {
        newUser.image = "https://pic.onlinewebfonts.com/svg/img_181369.png";
      }
      try {
        const userSave = await newUser.save();

        if (userSave) {
          const emailEnv = process.env.EMAIL;
          const password = process.env.PASSWORD;

          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: emailEnv,
              pass: password,
            },
          });

          const mailOptions = {
            from: emailEnv,
            to: email,
            subject: "Confirmation code",
            text: `tu codigo es ${confirmationCode}, gracias por confiar en nosotros ${name}`,
          };

          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
              return res.status(404).json({
                user: userSave,
                confirmationCode: "error, resend code",
              });
            } else {
              console.log("Email sent: " + info.response);
              return res.status(200).json({
                user: userSave,
                confirmationCode,
              });
            }
          });
        }
      } catch (error) {
        return res.status(404).json(error.message);
      }
    } else {
      if (req.file) deleteImgCloudinary(catchImg);
      return res.status(409).json("this user already exist");
    }
  } catch (error) {
    if (req.file) deleteImgCloudinary(catchImg);
    return next(error);
  }
};

//! -----------------------------------------------------------------------------
//? ------------------REGISTER REDIRECT --------------------
//! ----------------------------------------------------------------------------

const registerWithRedirect = async (req, res, next) => {
  let catchImg = req.file?.path;

  try {
    await User.syncIndexes();
    let confirmationCode = randomCode();
    const userExist = await User.findOne(
      { email: req.body.email },
      { name: req.body.name }
    );
    if (!userExist) {
      const newUser = new User({ ...req.body, confirmationCode });
      if (req.file) {
        newUser.image = req.file.path;
      } else {
        newUser.image = "https://pic.onlinewebfonts.com/svg/img_181369.png";
      }

      try {
        const userSave = await newUser.save();

        if (userSave) {
          return res.redirect(
            307,
            `http://localhost:8081/api/v1/users/register/sendMail/${userSave._id}`
          );
        }
      } catch (error) {
        return res.status(404).json(error.message);
      }
    } else {
      if (req.file) deleteImgCloudinary(catchImg);
      return res.status(409).json("this user already exist");
    }
  } catch (error) {
    if (req.file) {
      deleteImgCloudinary(catchImg);
    }
    return next(error);
  }
};

//! -----------------------------------------------------------------------------
//? ------------------REDIRECT SEND CODE --------------------
//! ----------------------------------------------------------------------------
const sendCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userDB = await User.findById(id);

    const emailEnv = process.env.EMAIL;
    const password = process.env.PASSWORD;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailEnv,
        pass: password,
      },
    });

    const mailOptions = {
      from: emailEnv,
      to: userDB.email,
      subject: "Confirmation code",
      text: `tu codigo es ${userDB.confirmationCode}, gracias por confiar en nosotros ${userDB.name}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        return res.status(404).json({
          user: userDB,
          confirmationCode: "error, resend code",
        });
      } else {
        console.log("Email sent: " + info.response);
        return res.status(200).json({
          user: userDB,
          confirmationCode: userDB.confirmationCode,
        });
      }
    });
  } catch (error) {
    return next(error);
  }
};

//! -----------------------------------------------------------------------------
//? --------------------------------LOGIN ---------------------------------------
//! -----------------------------------------------------------------------------
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const userDb = await User.findOne({ email });

    if (userDb) {
      if (bcrypt.compareSync(password, userDb.password)) {
        const token = generateToken(userDb._id, email);
        return res.status(200).json({
          user: userDb,
          token,
        });
      } else {
        return res.status(404).json("password dont match");
      }
    } else {
      return res.status(404).json("user not register");
    }
  } catch (error) {
    return next(error);
  }
};
//! -----------------------------------------------------------------------------
//? --------------------------------AUTOLOGIN -----------------------------------
//! -----------------------------------------------------------------------------
const autoLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const userDb = await User.findOne({ email });

    if (userDb) {
      if (password === userDb.password) {
        const token = generateToken(userDb._id, email);
        return res.status(200).json({
          user: userDb,
          token,
        });
      } else {
        return res.status(404).json("password dont match");
      }
    } else {
      return res.status(404).json("user not register");
    }
  } catch (error) {
    return next(error);
  }
};
//! -----------------------------------------------------------------------------
//? ------------------------------RESEND CODE -----------------------------------
//! -----------------------------------------------------------------------------
const resendCode = async (req, res, next) => {
  try {
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: email,
        pass: password,
      },
    });

    const userExist = await User.findOne({ email: req.body.email });

    if (userExist) {
      const mailOptions = {
        from: email,
        to: req.body.email,
        subject: "Confirmation code",
        text: `tu codigo es ${userExist.confirmationCode}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
          return res.status(200).json({
            resend: true,
          });
        }
      });
    } else {
      return res.status(404).json("User not found");
    }
  } catch (error) {
    return next(setError(500, error.message || "Error general to send code"));
  }
};
//! -----------------------------------------------------------------------------
//? ---------------------------- CHECK NEW USER----------------------------------
//! -----------------------------------------------------------------------------
const checkNewUser = async (req, res, next) => {
  try {
    const { email, confirmationCode } = req.body;
    const userExists = await User.findOne({ email });

    if (!userExists) {
      return res.status(404).json("User not found");
    } else {
      if (userExists.confirmationCode === confirmationCode) {
        try {
          await userExists.updateOne({ check: true });
          const updateUser = await User.findOne({ email });
          return res.status(200).json({
            testCheckUser: updateUser.check == true ? true : false,
          });
        } catch (error) {
          return res.status(404).json(error.message);
        }
      } else {
        await User.findByIdAndDelete(userExists._id);
        deleteImgCloudinary(userExists.image);
        return res.status(404).json({
          userExists,
          check: false,
          delete: (await User.findById(userExists._id))
            ? "error delete user"
            : "ok delete user",
        });
      }
    }
  } catch (error) {
    return next(setError(500, error.message));
  }
};

//! -----------------------------------------------------------------------------
//? -----------------------CONTRASEÑAS Y SUS CAMBIOS-----------------------------
//! -----------------------------------------------------------------------------

//? -----------------------------------------------------------------------------
//! ------------------CAMBIO DE CONTRASEÑA CUANDO NO ESTAS LOGADO---------------
//? -----------------------------------------------------------------------------

//? -----------------------------------------------------------------------------
//! ------------------CAMBIO DE CONTRASEÑA CUANDO YA SE ESTA ESTA LOGADO---------
//? -----------------------------------------------------------------------------

//! -----------------------------------------------------------------------------
//? ---------------------------------UPDATE--------------------------------------
//! -----------------------------------------------------------------------------

//! --------------EXPORTACIONES ----------------------------

module.exports = {
  register,
  registerSlow,
  registerWithRedirect,
  sendCode,
  login,
  autoLogin,
  resendCode,
  checkNewUser,
};
