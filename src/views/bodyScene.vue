<template>
  <div class="scene-container" ref="container">
<!--    <div id="card" class="card"></div>-->
    <div v-if="showCard" class="domCard">
      <div style="color:#fff">床位号：{{data?.bedNumber}}</div>
      <div style="color:#fff">设备名称：{{data?.deviceName}}</div>
      <div style="color:red">心率告警：{{data?.heartRate}} bpm（{{data?.heartRateStatus}}）</div>
      <div style="color:red">血压告警：{{data?.bloodPressure}} mmHg（{{data?.bpStatus}}）</div>
      <div style="color:red">血氧告警：{{data?.spo2 + '%（'+data?.spo2Status}}）</div>
      <div style="color:red">呼吸率告警：{{data?.respRate}} 次/分（{{data?.respStatus}}）</div>
      <div style="color:#ffcc00">状态：{{data?.alarmLevel === 'high' ? '高级告警' : '普通告警'}}</div>
    </div>
    <div class="flex flex-col" style="background-color:#ccc;position:absolute;z-index: 99;height:100px;width:100px;right:0;top:0">
      <button @click="handleAnimate('head')">大脑</button>
      <button @click="handleAnimate('Lungs')">肺部</button>
      <button @click="handleAnimate('heart')">心脏</button>
      <button @click="handleAnimate('stomach')">肠胃</button>
      <button @click="handleAnimate('Pancreas')">胰脏</button>
      <button @click="resetView">复原</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import {Layers,Scene, Color,Line, PerspectiveCamera, Mesh, Clock,DoubleSide,LinearFilter,PlaneGeometry,MeshBasicMaterial,
  BufferGeometry,BufferAttribute, AxesHelper,LineBasicMaterial, ShaderMaterial, AmbientLight, DirectionalLight,
  WebGLRenderer, PCFSoftShadowMap, Camera, Vector2, MeshStandardMaterial, Raycaster, TextureLoader, Vector3,EdgesGeometry,LineSegments,CylinderGeometry,Group
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
import {ringMaterial,bodyMaterial,bodyLineMaterial,scanMaterial} from '@/material/material'
import {nextTick, onBeforeUnmount, onMounted, ref} from 'vue'

const showCard=ref(false)
const data = ref({
  patientId: 'P123456',
  bedNumber: '12A',
  deviceName: '迈瑞T5监护仪',
  timestamp: '2025-05-26 10:30:00',
  heartRate: 135,
  heartRateStatus: '过高',
  bloodPressure: '180/110',
  bpStatus: '高压',
  spo2: 88,
  spo2Status: '偏低',
  respRate: 30,
  respStatus: '快呼吸',
  temperature: 38.9,
  tempStatus: '发热',
  alarmLevel: 'high'
})

let scene: Scene

let camera: Camera
let control: OrbitControls
let renderer: WebGLRenderer
const cameraPosition={
  x:0,y:-3,z:2
}
const initScene = () => {
  scene = new Scene()
  // scene.background = new Color(0x111111)
  camera = new PerspectiveCamera(45, containerW.value / containerH.value, 0.1, 10)
  camera.position.set(cameraPosition.x,cameraPosition.y,cameraPosition.z)
  scene.add(camera)
  // const axesHelper = new AxesHelper(50)
  // scene.add(axesHelper)
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
  outlinePass.edgeThickness = 5 //描边的“粗细”
  outlinePass.edgeStrength = 1.5 //描边的“强度/亮度”
  outlinePass.pulsePeriod=1.3 //脉冲效果
  outlinePass.edgeGlow = 5//外发光
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
  <div style="color:#fff">患者ID：${data?.patientId}</div>
  <div style="color:#fff">床位号：${data?.bedNumber}</div>
  <div style="color:#fff">设备名称：${data?.deviceName}</div>
  <div style="color:#fff">采集时间：${data?.timestamp}</div>
  <div style="color:red">心率告警：${data?.heartRate} bpm（${data?.heartRateStatus}）</div>
  <div style="color:red">血压告警：${data?.bloodPressure} mmHg（${data?.bpStatus}）</div>
  <div style="color:red">血氧告警：${data?.spo2}%（${data?.spo2Status}）</div>
  <div style="color:red">呼吸率告警：${data?.respRate} 次/分（${data?.respStatus}）</div>
  <div style="color:red">体温告警：${data?.temperature} ℃（${data?.tempStatus}）</div>
  <div style="color:#ffcc00">状态：${data?.alarmLevel === 'high' ? '高级告警' : '普通告警'}</div>
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

//扫描线
let scanY = -1;
let direction = 1; // 1 向上，-1 向下
const speed = 0.02;
let scanPlane:Mesh
const showScanLine=ref(true)
const initScanLine=()=>{
  scanPlane = new Mesh(new PlaneGeometry(8, .03), scanMaterial)
  scanPlane.rotation.x = -(Math.PI * 180)/ 180
  scanPlane.position.set(0,scanY,0)
  scene.add(scanPlane)
}
const updateLine=()=>{
  if(!showScanLine.value)return
  // 来回扫描
  scanY += speed * direction;
  if (scanY >= 3.5 || scanY <= -1) {
    direction *= -1; // 反向
  }
  if(scanPlane){
    scanPlane.position.set(0,scanY,0)
  }
  scanMaterial.uniforms.uScanY.value = scanY;
}

const pauseScanLine=()=>{
  showScanLine.value=false//扫描线
  scanPlane.position.set(0,-1,0)
}


//模型加载
const modelLoader = new GLTFLoader()
const group=new Group()
const loadModels = () => {
  // 加载人体模型
  modelLoader.load('/models/man2.glb', (glb) => {
    const model = glb.scene
    scene.add(model)
    // 设置人体模型的每个 Mesh
    model.traverse((item) => {
      if (item.isMesh) {
        item.material =bodyLineMaterial
        const edges = new EdgesGeometry(item.geometry);
        const line = new LineSegments(edges, bodyLineMaterial);
        edges.rotateX(-90 * Math.PI / 180)
        item.rotation.x = (90 * Math.PI) / 180
        line.position.copy(item.position);
        line.rotation.copy(item.rotation);
        line.scale.set(0.1,0.1,0.1);
        line.rotation.x = (90 * Math.PI)/180
        scene.add(line);
        group.add(line)

      }
    })
    group.add(model)
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
    group.add(organModel)
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
    model.translateY(-0.5)
  })
  scene.add(group)
  initScanLine()
  initOutLinePass()
}


//复原视角
const resetView=()=>{
  outlinePass.selectedObjects=[]
  noticeCard.value && scene.remove(noticeCard.value)
  animateCamera(new Vector3(cameraPosition.x, cameraPosition.y, cameraPosition.z));
  control.target.set(0, 2, 0)
  showCard.value=false
  showScanLine.value=true
}

const positionMap={
  head:{position:new Vector3(0,3,3),name:'Icosphere'},
  Lungs:{position:new Vector3(0,2.5,3),name:'Linkerlong_Linkerlong_0'},
  heart:{position:new Vector3(0,2,3),name:'Heart'},
  Liver:{position:new Vector3(0,1.7,3),name:'gangzhan'},
  stomach:{position:new Vector3(0,1.5,3),name:'stomach'},
  Pancreas:{position:new Vector3(0,1.5,3),name:'Spleen_Milt'},
}

//切换动画
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
    showCard.value=true//dom卡片
    pauseScanLine()
    // setCard(new Vector3(0.15,p.y,p.z-0.5), '测试设备', obj)//场景卡片
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
  TWEEN.update();
  control.update();
  //传递uniform变量到着色器材质
  updateLine();
  group.rotation.y += 0.005
  ringMaterial.uniforms.u_time.value = clock.getElapsedTime();
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
  width: 100%;
  height: 100%;
  position:relative;
  overflow: hidden;
}
.domCard{
  position:absolute;
  left:0;
  padding:5px;
  background: url('/card-body.png') no-repeat center center / 100% 100%;
}
.card{
  position:absolute;
  width:100%;
  height:100%;
  z-index:10;
  pointer-events: none;
}
.warning{
  color: #00e6ff;
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
