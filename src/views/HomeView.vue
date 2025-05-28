<template>
  <!-- <div class="container-box w-100vw flex p-8 gap-2">
    <div class="w-3/10 flex m-t-12 justify-around gap-2">
      <left-top class="flex-1"/>
      <left-center class="flex-1"/>
      <left-bottom class="flex-1"/>
    </div>
    <div class="flex-1 m-t-12 gap-1">
      <center-top class="h-3/5"/>
      <center-bottom class="flex-1"/>
    </div>
    <div class="w-3/10 justify-around gap-2">
      <right-top class="flex-1"/>
      <right-center class="flex-1"/>
      <right-bottom class="flex-1"/>
    </div>
  </div> -->
  <div class="w-100vw h-100vh scene-box bg-red">
    <div class="content p-10">
      <BodyScene />
    </div>
  </div>
</template>
<script setup lang="ts">
import LeftTop from "@/components/HomeView/leftTop.vue";
import LeftCenter from "@/components/HomeView/leftCenter.vue";
import LeftBottom from "@/components/HomeView/leftBottom.vue";
import CenterTop from "@/components/HomeView/centerTop.vue";
import CenterBottom from "@/components/HomeView/centerBottom.vue";
import RightTop from "@/components/HomeView/rightTop.vue";
import RightCenter from "@/components/HomeView/rightCenter.vue";
import RightBottom from "@/components/HomeView/rightBottom.vue";
import BodyScene from "@/views/bodyScene.vue"


</script>
<style lang="css">
.container-box {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: url("../assets/img/bg.jpg") no-repeat;
  background-size: 100% 100%;

  &>div {
    display: flex;
    flex-direction: column;
  }

}

.scene-box {
  position: relative;
  padding: 3px;
  /* 这个就是边框的宽度 */
  border-radius: 10px;
  overflow: hidden;
  background: transparent;
}

.scene-box::before {
  content: '';
  position: absolute;
  inset: 0;
  background: conic-gradient(from 0deg,
      #006873 0%,
      #003f44 50%,
      #000000 100%);
  animation: rotate 5s linear infinite;
  filter: blur(20px);
  z-index: 0;
}

.content {
  height: 100%;
  width: 100%;
  position: relative;
  background: #000;
  border-radius: 17px;
  /* 边框宽度 3px 的话就 -3 */
  padding: 20px;
  color: #fff;
  z-index: 100;
}

@keyframes rotate {
  to {
    transform: rotate(1turn);
  }
}
</style>