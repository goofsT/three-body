<template>
  <div class="scene-container" ref="container">
    <div id="card" class="card"></div>
  </div>
</template>
<script setup lang="ts">
import {Layers,Scene, Color,AdditiveBlending, PerspectiveCamera, Mesh, MeshBasicMaterial, AxesHelper, GridHelper, AmbientLight, DirectionalLight, WebGLRenderer, PCFSoftShadowMap, Camera, Vector2, MeshStandardMaterial, Raycaster, Object3D, Vector3,} from 'three'
import { throttle } from 'lodash'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js'

import {onBeforeUnmount, onMounted, ref} from 'vue'

let scene: Scene
let sceneOrgan:Scene
let camera: Camera
let control: OrbitControls
let renderer: WebGLRenderer
const initScene = () => {
  scene = new Scene()
  sceneOrgan=new Scene()
  scene.background = new Color(0x444444)
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
  const renderPass=new RenderPass(sceneOrgan, camera)
  const bodyPass=new RenderPass(scene, camera)
  bodyPass.clearDepth =false//保留深度
  composer.addPass(renderPass)
  composer.addPass(bodyPass)
  const v2 = new Vector2(containerH.value, containerW.value)
  outlinePass = new OutlinePass(v2, sceneOrgan, camera)
  outlinePass.visibleEdgeColor.set(0x00ffff)
  outlinePass.edgeThickness = 4
  outlinePass.edgeStrength = 6
  outlinePass.edgeGlow = 0
  outlinePass.renderToScreen = true
  composer.addPass(outlinePass)
  // 创建伽马校正通道
  const gammaPass = new ShaderPass(GammaCorrectionShader)
  composer.addPass(gammaPass)
  // const pixelRatio = renderer.getPixelRatio()
  // const smaaPass = new SMAAPass(containerW.value * pixelRatio, containerH.value * pixelRatio)
  // composer.addPass(smaaPass)
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
const setCard = (position:Vector3,name:string,data:any) => {
  noticeCard.value && scene.remove(noticeCard.value)
  const card = document.createElement('div')
  card.innerHTML = `
       <div style="position:absolute;left:0;padding:10px">
          <div>模型id：${data?.uuid}</div>
          <div>设备：${name}</div>
          <div style="color:red">状态：告警中</div>
       </div>
      `
  card.style.fontSize = '16px'
  card.style.width = '300px'
  // card.style.padding = '1px'
  card.style.height = '180px'
  card.style.pointerEvents = 'none'
  card.style.background = 'url(card-body.png) no-repeat center center / 100% 100%'
  noticeCard.value=new CSS2DObject(card)
  scene.add(noticeCard.value)
  noticeCard.value.position.set(-2,2,0);
}



const modelLoader = new GLTFLoader()
//模型加载
const loadModels = () => {

  // 加载器官模型
  modelLoader.load('/models/InternalOrgans.glb', (glb) => {
    const organModel = glb.scene
    sceneOrgan.add(organModel)
    organModel.scale.set(0.3201, 0.3201, 0.3201)
    organModel.traverse((item) => {
      if (item.isMesh) {
        if(item.material){
          item.material.transparent=true
          item.material.depthTest=true
          item.material.opacity=.8
        }
        item.scale.set(0.3208, 0.3208, 0.3208)
        rayCasterMeshes.push(item)
      }
    })
    handleRayCaster()
  })

  // 加载人体模型
  modelLoader.load('/models/man2.glb', (glb) => {
    const model = glb.scene
    scene.add(model)
    // 创建透明材质
    const bodyMaterial = new MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,  // 启用深度写入
      depthTest: false ,  // 启用深度测试
    })
    // 设置人体模型的每个 Mesh
    model.traverse((item) => {
      if (item.isMesh) {
        item.material = bodyMaterial
        item.rotation.x = (90 * Math.PI) / 180
        item.material = bodyMaterial
      }
    })
  })
  initOutLinePass()
}

//射线检测
let rayCaster: Raycaster
let mouse: Vector2
const rayCasterMeshes: Mesh = []
const rayCasterEvent = throttle((event: MouseEvent) => {
  const { left, top, width, height } = rect
  mouse.x = ((event.clientX - left) / width) * 2 - 1
  mouse.y = -((event.clientY - top) / height) * 2 + 1
  rayCaster.setFromCamera(mouse, camera)
  const intersects = rayCaster.intersectObjects(rayCasterMeshes, true)
  if (intersects.length > 0) {
    const obj = intersects[0].object
    outlinePass.selectedObjects = [obj]
    setCard(new Vector3(obj.position.x, obj.position.y, obj.position.z), '测试设备', obj)

  }else{
    outlinePass.selectedObjects = []
  }
}, 0)
const handleRayCaster = () => {
  rayCaster = new Raycaster()
  mouse = new Vector2()
  const domElement = renderer.domElement
  domElement.addEventListener('mousemove', rayCasterEvent)
}

const renderId = ref()
const renderFn = () => {

  control.update()
  renderer.render(scene, camera);
  renderer.clearDepth();


  // 2. 渲染器官场景（不透明）
  composer.render()


  renderer.render(sceneOrgan, camera);

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
  window.removeEventListener('mousemove', rayCasterEvent)
  document.getElementById('card')?.removeChild(css3DRenderer.domElement)
})
</script>
<style>
.scene-container {
  width: 100vw;
  height: 100vh;
  position:relative;
}
.card{
  position:absolute;
  width:100%;
  height:100%;
  z-index:10;
  pointer-events: none;
}
</style>
