import "@scss/index.scss";

import { Controller } from "./webgl/controller";

window.addEventListener("load", (e) => {
  const controller = new Controller();
  controller.init();
});
