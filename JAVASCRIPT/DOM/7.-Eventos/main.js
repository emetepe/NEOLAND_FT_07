import "./style.css";
import javascriptLogo from "./javascript.svg";
import viteLogo from "/vite.svg";

const app = document.querySelector("#app");

const init = () => {
  app.innerHTML = `
  <div>
    <button>Press!</button>
    <input />
    <div class="box" ></div>
  </div>
`;
};

init();

const h2 = () => {
  const title = (document.createElement("h2").innerText = "Hola");
  const box = document.getElementsByClassName("box");
  box.appendChild(title);
};

const listener = () => {
  const button = document.querySelector("button");
  button.addEventListener("click", () => h2());
};

listener();
