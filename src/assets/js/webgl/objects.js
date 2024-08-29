import * as THREE from "three";

import ObjectVs from "../../shader/object.vs?raw";
import ObjectFs from "../../shader/object.fs?raw";

export class Objects {
  constructor(_stage, _resolution) {
    this.stage = _stage;
    this.resolution = _resolution;
  }

  resize(_resolution) {
    this.resolution = _resolution;
  }

  update(_time) {
    const t = _time.elapsed * 0.25;
    if (this.cubeMesh) {
      this.cubeMesh.rotation.x += t;
      this.cubeMesh.rotation.y += t;
      this.cubeMesh.rotation.z += t;
    }
  }

  init() {
    const g = new THREE.BoxGeometry(1, 1, 1);
    // const m = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const m = new THREE.ShaderMaterial({
      vertexShader: ObjectVs,
      fragmentShader: ObjectFs,
      uniforms: {
        uTime: { value: 0.0 },
        uProgress: { value: 0.0 },
      },
      side: THREE.DoubleSide,
    });
    this.cubeMesh = new THREE.Mesh(g, m);
    this.stage.scene.add(this.cubeMesh);
  }
}
