import * as THREE from "three";
import { Stage } from "./stage";
import { Objects } from "./objects";

class Controller {
  constructor(_canvas, _resolution, _coords) {
    this.canvas = _canvas;
    this.resolution = _resolution;
    this.coords = _coords;

    this.stage = new Stage(this.canvas, this.resolution);
    this.objects = new Objects(this.stage, this.resolution);
  }

  move(_x, _y) {
    this.coords.x = _x;
    this.coords.y = _y;
  }

  resize(_resolution) {
    this.resolution = _resolution;
    this.stage.resize(_resolution);
    this.objects.resize(_resolution);
  }

  updateOrbitControls(_position, _quaternion) {
    this.stage.camera.position.fromArray(_position);
    this.stage.camera.quaternion.fromArray(_quaternion);
  }

  update(_time) {
    this.objects.update(_time);
    this.stage.renderer.render(this.stage.scene, this.stage.camera);
  }

  init() {
    this.stage.init();
    this.objects.init();
  }
}

// !(async () => {
//   await G.delay(0);
// })();

let controller = null;
onmessage = async (e) => {
  const data = e.data;
  const mode = data.mode;
  if (mode === "init") {
    const canvas = data.canvas;
    const resolution = data.resolution;
    const coords = data.coords;

    canvas.style = { width: 0, height: 0 };

    controller = new Controller(canvas, resolution, coords);
    controller.init();
    controller.resize(data.resolution);

    const camera = controller.stage.camera;
    self.postMessage({
      mode: "initCamera",
      near: camera.near,
      far: camera.far,
      fov: camera.fov,
      aspect: camera.aspect,
      position: camera.position.toArray(),
      quaternion: camera.quaternion.toArray(),
    });
  } else if (mode === "resize") {
    controller.resize(e.data.resolution);
    const camera = controller.stage.camera;
    self.postMessage({
      mode: "resizeCamera",
      aspect: camera.aspect,
    });
  } else if (mode === "update") {
    controller.update(e.data.time);
  } else if (mode === "updateCamera") {
    controller.stage.camera.position.fromArray(data.position);
    controller.stage.camera.quaternion.fromArray(data.quaternion);
  } else if (mode === "move") {
    controller.move(data.x, data.y);
  }

  // --------------------------

  if (mode === "gui-scene") {
    if (data.color) {
      controller.stage.scene.background.r = data.color.r;
      controller.stage.scene.background.g = data.color.g;
      controller.stage.scene.background.b = data.color.b;
    }
  } else if (mode === "gui-cube") {
    controller.objects.cubeMesh.material.uniforms.uProgress.value = data.uProgress;
  }
};
