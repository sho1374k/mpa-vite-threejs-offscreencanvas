import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import GUI from "three/examples/jsm/libs/lil-gui.module.min";

const FPS = 30;
export class Controller {
  constructor() {
    this.elements = {
      webglWrapper: document.getElementById("webgl"),
      canvas: document.getElementById("webgl-canvas"),
    };

    this.resolution = {
      x: this.elements.webglWrapper.clientWidth,
      y: this.elements.webglWrapper.clientHeight,
      aspect: this.elements.webglWrapper.clientWidth / this.elements.webglWrapper.clientHeight,
      devicePixelRatio: Math.min(2, window.devicePixelRatio),
    };

    this.time = {
      now: 0,
      delta: 0,
      elapsed: 0,
    };

    this.fps = {
      lastTime: 0,
      frameCount: 0,
      startTime: null,
      nowTime: 0,
      limit: FPS,
      interval: 1000 / FPS,
    };

    this.coords = {
      x: 0,
      y: 0,
    };

    this.elements.canvas.width = this.resolution.x;
    this.elements.canvas.height = this.resolution.y;
    this.offscreenCanvas = this.elements.canvas.transferControlToOffscreen();

    this.controls = null;
    this.camera = new THREE.PerspectiveCamera();

    this.stats = null;
    this.stats = new Stats();
    this.stats.domElement.style = `position: fixed; top: 0; left: 0; right: initial; bottom: initial; z-index: 9999;`;
    document.body.appendChild(this.stats.domElement);

    this.gui = new GUI();

    this.worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
    this.worker.onmessage = (e) => {
      const data = e.data;

      const mode = data.mode;
      if (mode === "initCamera" && this.camera != null) {
        this.camera.near = data.near;
        this.camera.far = data.far;
        this.camera.fov = data.fov;
        this.camera.aspect = data.aspect;
        this.camera.position.fromArray(data.position);
        this.camera.quaternion.fromArray(data.quaternion);
        this.camera.updateProjectionMatrix();
      } else if (mode === "resizeCamera" && this.camera != null) {
        this.camera.aspect = data.aspect;
        this.camera.updateProjectionMatrix();
      }
    };

    window.addEventListener("resize", this.resize.bind(this), { passive: true });
    window.addEventListener("mousemove", this.move.bind(this), { passive: true });
    window.addEventListener("touchmove", this.move.bind(this), { passive: true });
  }

  move(e) {
    this.worker.postMessage({
      mode: "move",
      x: e.touches ? e.touches[0].clientX : e.clientX,
      y: e.touches ? e.touches[0].clientY : e.clientY,
    });
  }

  resize() {
    this.resolution.x = this.elements.webglWrapper.clientWidth;
    this.resolution.y = this.elements.webglWrapper.clientHeight;
    this.resolution.aspect = this.resolution.x / this.resolution.y;
    this.worker.postMessage({
      mode: "resize",
      resolution: this.resolution,
    });
  }

  update(now) {
    requestAnimationFrame(this.update.bind(this));
    if (!this.fps.startTime) this.fps.startTime = now;
    this.time.now = now;
    const elapsed = now - this.fps.lastTime;
    this.time.elapsed = elapsed * 0.001;
    this.time.delta = (now - this.fps.startTime) * 0.001;

    if (elapsed > this.fps.interval) {
      this.fps.lastTime = now - (elapsed % this.fps.interval);
      this.fps.frameCount++;
      // console.log(this.fps.frameCount / this.time.delta); // fpsの値を確認する

      if (this.stats) this.stats.update();

      this.worker.postMessage({
        mode: "update",
        time: this.time,
      });
    }
  }

  init() {
    this.worker.postMessage(
      {
        mode: "init",
        canvas: this.offscreenCanvas,
        resolution: this.resolution,
        coords: this.coords,
      },
      [this.offscreenCanvas],
    );

    this.controls = new OrbitControls(this.camera, this.elements.canvas);
    this.controls.addEventListener("change", () => {
      this.worker.postMessage({
        mode: "updateCamera",
        position: this.camera.position.toArray(),
        quaternion: this.camera.quaternion.toArray(),
      });
    });

    this.update();

    // gui
    {
      const createHandler = (worker, mode) => ({
        set(target, property, value) {
          target[property] = value;
          const tmp = { mode: mode };
          tmp[property] = value;
          worker.postMessage(tmp);
          return true;
        },
      });

      // scene
      {
        const tmp = new Proxy(
          {
            background: new THREE.Color("#000").convertLinearToSRGB(),
          },
          createHandler(this.worker, "gui-scene"),
        );

        const f = this.gui.addFolder("scene");
        f.addColor(tmp, "background").onChange((_value) => {
          tmp.background = new THREE.Color(_value);
        });
      }

      // cube
      {
        const tmp = new Proxy(
          {
            uProgress: 0,
          },
          createHandler(this.worker, "gui-cube"),
        );

        const f = this.gui.addFolder("cube");
        f.add(tmp, "uProgress", 0.0, 1.0)
          .name("progress")
          .onChange((_value) => {
            tmp.uProgress = _value;
          });
      }
    }
  }
}
