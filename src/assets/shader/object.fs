varying vec2 vUv;
varying vec3 vNormal;
uniform float uTime;
uniform float uProgress;

void main( void ) {
  vec4 color = vec4(0.0);

  vec4 c1 = vec4(vUv, 1.0, 1.0);
  vec4 c2 = vec4(vNormal + vec3(0.5), 1.0);

  color = mix(c1, c2, uProgress);

  gl_FragColor = color;
}
