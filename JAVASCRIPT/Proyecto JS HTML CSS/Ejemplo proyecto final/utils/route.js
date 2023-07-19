import { printTemplateDashboard } from "../pages";

//! ----------------------------------------------------------------------------------------------------------------------
//? ------------------------------------- CONTROLADOR DE LO QUE SE RENDERIZA EN CADA MOMENTO------------------------------
//! ----------------------------------------------------------------------------------------------------------------------

export const initControler = (pagesRender) => {
  switch (pagesRender) {
    case undefined:
      return localStorage.getItem("user") ? "Dashboard()" : "Login()";
      break;
    case "Pokemon":
      "Pokemon()";
      break;
    case "Dashboard":
      printTemplateDashboard();
      break;
    case "Topo":
      "Topo()";
      break;
    case "Login":
      "Login()";
      break;
    case "Memory":
      "Memory()";
      break;
  }
};
