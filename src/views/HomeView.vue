<template>
  <div class="container-box w-100vw flex p-8 gap-2">
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
<!--    <BodyScene />-->
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


</script>
<style lang="css">
.container-box{
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: url("../assets/img/bg.jpg") no-repeat;
  background-size: 100% 100%;
  &>div{
     display: flex;
    flex-direction: column;
  }

}
</style>