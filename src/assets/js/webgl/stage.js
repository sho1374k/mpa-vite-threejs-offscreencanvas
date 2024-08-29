import * as THREE from "three";

export class Stage {
  constructor(_canvas, _resolution) {
    this.canvas = _canvas;
    this.resolution = _resolution;

    this.renderer = null;
    this.camera = null;
    this.scene = null;
  }

  resizeRenderer() {
    this.renderer.setSize(this.resolution.x, this.resolution.y);
    this.renderer.setPixelRatio(this.resolution.pixelRatio);
  }

  setRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.resizeRenderer();
  }

  resizeCamera() {
    this.camera.aspect = this.resolution.x / this.resolution.y;
    this.camera.updateProjectionMatrix();
  }

  setCamera() {
    this.camera = new THREE.PerspectiveCamera();
    this.camera.near = 1;
    this.camera.far = 100;
    this.camera.fov = 60;
    this.camera.position.z = 4;
    this.resizeCamera();
  }

  setScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#000");

    this.scene.add(new THREE.GridHelper(1000, 100));
    this.scene.add(new THREE.AxesHelper(100));
  }

  resize(_resolution) {
    this.resolution = _resolution;
    this.resizeRenderer();
    this.resizeCamera();
  }

  init() {
    this.setRenderer();
    this.setCamera();
    this.setScene();
  }
}
