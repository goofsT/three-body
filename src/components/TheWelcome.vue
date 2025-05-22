<template>
  <div class="scene-container" ref="container">
    <div id="card" class="card"></div>
  </div>
  <div style="background-color:#ccc;position:fixed;z-index: 99;height:100px;width:200px;right:0;top:0;display: flex">
    <button @click="handleAnimate('head')">脑子</button>
    <button @click="handleAnimate('Lungs')">肺部</button>
    <button @click="handleAnimate('heart')">心脏</button>
    <button @click="handleAnimate('stomach')">肠胃</button>
    <button @click="handleAnimate('Pancreas')">胰脏</button>
    <button @click="resetView">复原</button>

  </div>
</template>
<script setup lang="ts">
import {Layers,Scene, Color,Line, PerspectiveCamera, Mesh, Clock,DoubleSide,
  BufferGeometry,BufferAttribute, AxesHelper,LineBasicMaterial, ShaderMaterial, AmbientLight, DirectionalLight,
  WebGLRenderer, PCFSoftShadowMap, Camera, Vector2, MeshStandardMaterial, Raycaster, Object3D, Vector3
} from 'three'
import { throttle } from 'lodash'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import TWEEN from '@tweenjs/tween.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js'

import {nextTick, onBeforeUnmount, onMounted, ref} from 'vue'

let scene: Scene
let sceneOrgan:Scene
let camera: Camera
let control: OrbitControls
let renderer: WebGLRenderer
const initScene = () => {
  scene = new Scene()
  sceneOrgan=new Scene()
  scene.background = new Color(0x333333)
  camera = new PerspectiveCamera(45, containerW.value / containerH.value, 0.1, 1000)
  camera.position.set(0, 2.5, 5)
  scene.add(camera)
  sceneOrgan.add(camera)
  const axesHelper = new AxesHelper(50)
  scene.add(axesHelper)
  addLight()
  renderer = new WebGLRenderer({ antialias: true })
  //定义渲染器的阴影类型
  renderer.shadowMap.type = PCFSoftShadowMap
  //开启渲染器的阴影地图
  renderer.shadowMap.enabled = true
  renderer.autoClear = false
  renderer.setSize(containerW.value, containerH.value)
  container.value.appendChild(renderer.domElement)
  control = new OrbitControls(camera, renderer.domElement)
  control.enableDamping = true
  control.maxDistance = 200
  control.minDistance = 0
  control.maxPolarAngle = Math.PI / 2
  control.minPolarAngle = Math.PI / 8
  control.target.set(0, 2, 0);
  initCss3DRender()
  loadModels()
  renderFn()
  window.addEventListener('resize', listenerCallBack)
}

const addLight=()=>{
  //添加环境光
  scene.add(new AmbientLight(0xffffff, 0.6))
  sceneOrgan.add(new AmbientLight(0xffffff, 0.6))
  //添加平行光
  const sunLight = new DirectionalLight(0xffffff, 3)
  sunLight.position.set(20, 20, 20)
  sunLight.castShadow = true
  sunLight.shadow.mapSize.width = 512 // 阴影贴图宽度
  sunLight.shadow.mapSize.height = 512 // 阴影贴图高度
  sunLight.shadow.camera.near = 0.1 // 近裁剪面
  sunLight.shadow.camera.far = 100 // 远裁剪面
  sunLight.shadow.camera.left = -50 // 调整视锥体大小
  sunLight.shadow.camera.right = 50
  sunLight.shadow.camera.top = 50
  sunLight.shadow.camera.bottom = -50
  const sunLight1=sunLight.clone()
  sunLight1.position.set(-20,-20,-20)
  scene.add(sunLight)
  scene.add(sunLight1)
  sceneOrgan.add(sunLight.clone())
  sceneOrgan.add(sunLight1.clone())
}

let composer: EffectComposer
let outlinePass: OutlinePass
const initOutLinePass = () => {
  //效果合成器
  composer = new EffectComposer(renderer)
  const renderPass=new RenderPass(scene, camera)
  composer.addPass(renderPass)
  // 创建伽马校正通道
  const gammaPass = new ShaderPass(GammaCorrectionShader)
  composer.addPass(gammaPass)
  const v2 = new Vector2(containerH.value, containerW.value)
  outlinePass = new OutlinePass(v2, scene, camera)
  outlinePass.visibleEdgeColor.set(0xff0000)//设置模型边缘在“可见”情况下的描边颜色。
  outlinePass.edgeThickness = 2 //描边的“粗细”
  outlinePass.edgeStrength = 1.5 //描边的“强度/亮度”
  outlinePass.pulsePeriod=1.3 //脉冲效果
  outlinePass.edgeGlow = 1.5//外发光
  //设置描边效果使用的渲染分辨率。默认为2，表示使用 主渲染分辨率的 1/2 进行渲染。
  //值越大 → 性能更好，但描边会模糊或失真。
  //值越小（如 1）→ 效果更清晰，但性能开销更大。
  outlinePass.downSampleRatio=2
  outlinePass.hiddenEdgeColor.set(0xff0000)
  //在 three.js 的后处理流程中（基于 EffectComposer），多个后处理步骤（Pass）是串联执行的。
  //每个 Pass 的输出通常是写入一个 Framebuffer（即离屏渲染），只有最后一个 Pass 需要 renderToScreen = true，才能把最终结果显示在屏幕上。
  outlinePass.renderToScreen = true
  composer.addPass(outlinePass)
}

const listenerCallBack = () => {
  initContainer()
  camera.aspect = containerW.value / containerH.value
  camera.updateProjectionMatrix()
  css3DRenderer.setSize(containerW.value, containerH.value)
  renderer.setSize(containerW.value, containerH.value)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

//初始化css3D渲染器
let css3DRenderer: CSS2DRenderer
const initCss3DRender = () => {
  css3DRenderer = new CSS2DRenderer()
  css3DRenderer.setSize(containerW.value, containerH.value)
  document.getElementById('card')?.appendChild(css3DRenderer.domElement)
}

const container = ref()
const containerH = ref()
const containerW = ref()
let rect: any
const initContainer = () => {
  if (!container.value) return
  containerH.value = container.value.offsetHeight
  containerW.value = container.value.offsetWidth
  rect = container.value.getBoundingClientRect()
}

//通知卡片
const noticeCard = ref()
let line:Line
const setCard = (position:Vector3,name:string,data:any) => {
  noticeCard.value && scene.remove(noticeCard.value)
  line && scene.remove(line)
  const card = document.createElement('div')
  card.innerHTML = `
       <div style="position:absolute;left:0;padding:10px">
          <div style="color:#fff">模型id：${data?.uuid}</div>
          <div style="color:#fff">设备：${name}</div>
          <div style="color:red">状态：告警中</div>
       </div>
      `
  card.style.width = '300px'
  card.style.height = '180px'
  card.classList.add('warning')
  card.style.background = 'url(card-body.png) no-repeat center center / 100% 100%'
  noticeCard.value=new CSS2DObject(card)
  scene.add(noticeCard.value)
  noticeCard.value.position.set(position.x,position.y,position.z)
  // 创建连线
  const points = [position, noticeCard.value.position.clone()]
  const geometry = new BufferGeometry().setFromPoints(points)
  const material = new LineBasicMaterial({
    color: 0xff0000,
    linewidth: 50,
    linecap: 'round',
    linejoin:  'round'
  })
  line = new Line(geometry, material)
  scene.add(line)

}



const modelLoader = new GLTFLoader()
let ringMaterial:ShaderMaterial = new ShaderMaterial({
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
//模型加载
const loadModels = () => {
  // 加载人体模型
  modelLoader.load('/models/man2.glb', (glb) => {
    const model = glb.scene
    scene.add(model)
    const bodyMaterial = new MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      depthTest: false ,
    })
    // 设置人体模型的每个 Mesh
    model.traverse((item) => {
      if (item.isMesh) {
        item.material = bodyMaterial
        item.rotation.x = (90 * Math.PI) / 180
        // item.translateZ(-6)
        item.material = bodyMaterial
      }
    })
  })

  // 加载器官模型
  modelLoader.load('/models/InternalOrgans.glb', (glb) => {
    const organModel = glb.scene
    scene.add(organModel)
    organModel.scale.set(0.32, 0.32, 0.32)
    organModel.traverse((item) => {
      if (item.isMesh) {
        item.scale.set(0.32, 0.32, 0.32)
        rayCasterMeshes.push(item)
      }
    })
    // handleRayCaster()
  })

  //光环
  modelLoader.load('/models/range.glb', (glb) => {
    const model = glb.scene
    scene.add(model)
    model.scale.set(4,4,4)
    model.rotation.x = (150 * Math.PI) / 180
    model.material=ringMaterial
    model.traverse((item) => {
      if (item.isMesh) {
        item.rotateY(Math.PI*90/180)
        item.rotateX(Math.PI*180/180)
        item.material = ringMaterial
      }
    })
    model.translateY(-1.2)
  })

  initOutLinePass()
}


//复原视角
const resetView=()=>{
  outlinePass.selectedObjects=[]
  noticeCard.value && scene.remove(noticeCard.value)
  animateCamera(new Vector3(0, 2.5, 5));control.target.set(0, 2, 0)
}

const positionMap={
  head:{position:new Vector3(0,3,3),name:'Icosphere'},
  Lungs:{position:new Vector3(0,2.5,3),name:'Linkerlong_Linkerlong_0'},
  heart:{position:new Vector3(0,2,3),name:'Heart'},
  Liver:{position:new Vector3(0,1.7,3),name:'gangzhan'},
  stomach:{position:new Vector3(0,1.5,3),name:'stomach'},
  Pancreas:{position:new Vector3(0,1.5,3),name:'Spleen_Milt'},

}
const handleAnimate=(key:keyof typeof positionMap)=>{
  resetView()
  nextTick(()=>{
    const item=positionMap[key]
    const p=item.position.clone()

    control.target.set(0,p.y,0)
    animateCamera(p.clone())
    let obj
    outlinePass.selectedObjects = rayCasterMeshes.filter(item=>{
          if(item.name===positionMap[key].name){
            obj=item
            return item
          }
      }
    )
    setCard(new Vector3(0.15,p.y,p.z-0.5), '测试设备', obj)
  })
}


//射线检测
let rayCaster: Raycaster
let mouse: Vector2
const rayCasterMeshes: Mesh[] = []
// const rayCasterEvent = throttle((event: MouseEvent) => {
//   const { left, top, width, height } = rect
//   mouse.x = ((event.clientX - left) / width) * 2 - 1
//   mouse.y = -((event.clientY - top) / height) * 2 + 1
//   rayCaster.setFromCamera(mouse, camera)
//   const intersects = rayCaster.intersectObjects(rayCasterMeshes, true)
//   if (intersects.length > 0) {
//     const obj = intersects[0].object
//     const intersectPoint= intersects[0].point
//     outlinePass.selectedObjects = [obj]
//     setCard(new Vector3(intersectPoint.x, intersectPoint.y, intersectPoint.z), '测试设备', obj)
//   }else{
//     outlinePass.selectedObjects = []
//     noticeCard.value && scene.remove(noticeCard.value)
//     line && scene.remove(line)
//   }
// }, 100)
// const handleRayCaster = () => {
//   rayCaster = new Raycaster()
//   mouse = new Vector2()
//   const domElement = renderer.domElement
//   domElement.addEventListener('mousemove', rayCasterEvent)
// }


const animateCamera=(position:Vector3)=>{
  new TWEEN.Tween(camera.position)
      .to(position, 2000)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start()
}

const renderId = ref()
const clock = new Clock()
const renderFn = () => {
  TWEEN.update()
  control.update()
  //传递uniform变量到着色器材质
  const elapsed = clock.getElapsedTime()
  ringMaterial.uniforms.u_time.value = elapsed
  composer.render();
  css3DRenderer.render(scene, camera);
  renderId.value = requestAnimationFrame(renderFn);
}

onMounted(() => {
  initContainer()
  if (containerH.value && containerW.value) {
    initScene()
  }
})

onBeforeUnmount(()=>{
  cancelAnimationFrame(renderId.value)
  renderer.dispose()
  outlinePass.dispose()
  container.value?.removeChild(renderer.domElement)
  window.removeEventListener('resize', listenerCallBack)
  // window.removeEventListener('mousemove', rayCasterEvent)
  document.getElementById('card')?.removeChild(css3DRenderer.domElement)
})
</script>
<style>
.scene-container {
  width: 100vw;
  height: 100vh;
  position:relative;
  overflow: hidden;
}
.card{
  position:absolute;
  width:100%;
  height:100%;
  z-index:10;
  pointer-events: none;
}
.warning{
  border: 2px solid rgba(255,0,0,.5);
  animation: pulse-border 1s infinite;
  box-sizing: border-box;
  border-radius: 5px;
  font-size: 16px;
  pointer-events: none;
}
@keyframes pulse-border {
  0% {
    box-shadow: 0 0 5px rgba(255,0,0,.5);
    border-color: red;
  }
  50% {
    box-shadow: 0 0 20px red;
    border-color: darkred;
  }
  100% {
    box-shadow: 0 0 5px rgba(255,0,0,.5);
    border-color: rgba(255,0,0,.5);
  }
}
</style>
