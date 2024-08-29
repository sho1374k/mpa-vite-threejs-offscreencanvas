varying vec2 vUv;
varying vec3 vNormal;
uniform float uProgress;

void main(){
  vUv = uv;
  vNormal = normal;

  vec3 p = position;

  p.xyz = mix(p.xyz, p.xyz + vNormal, uProgress);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0 );
}