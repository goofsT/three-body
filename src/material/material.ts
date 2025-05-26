import {Color, DoubleSide, LineBasicMaterial, MeshBasicMaterial, ShaderMaterial,AdditiveBlending} from "three";

export const  ringMaterial:ShaderMaterial = new ShaderMaterial({
    uniforms: {
        u_time: { value: 0 },
        u_color1: { value: new Color('#04202f') },
        u_color2: { value: new Color('#031e31') },
    },
    vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    uniform float u_time;
    uniform vec3 u_color1;
    uniform vec3 u_color2;
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      float r = length(vPosition.xz);
      float alpha = 0.6 + 0.4 * sin(u_time * 2.0 + r * 10.0); // 动态闪烁
      float t = smoothstep(0.0, 0.5, r); // 控制渐变半径
      float s = sin(u_time); // -1 ~ 1
      vec3 color = mix(u_color1, u_color2, s*0.5+0.5); // 中心红，外圈蓝
      gl_FragColor = vec4(color, alpha);
    }
  `,
    transparent: true,
    side: DoubleSide,
    depthWrite: false,
})

export const bodyMaterial=new MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
});

export const bodyLineMaterial= new LineBasicMaterial({
    color: 0x00e6ff,
    transparent: true,
    opacity: 0.1,
})

export const scanMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: {
        uScanY: { value: 3.5 }, // 当前扫描位置 Y
        uColor: { value: new Color(0xff0000) },
        uOpacity: { value: 0.2 },
    },
    vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
    fragmentShader: `
     uniform float uScanY;
    uniform vec3 uColor;
    uniform float uOpacity;
    varying vec3 vWorldPosition;

    void main() {
      gl_FragColor = vec4(uColor, uOpacity);
    }
  `,
})