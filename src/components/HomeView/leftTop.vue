<template>
  <div class="box-container car-bg">
    <svg width="300" height="150" viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
      <!--      路径：三次贝塞尔曲线-->
      <!--      C75,0 225,200 300,100-->
      <path
          id="curve"
          d="M0,100 C75,0 225,200 300,100"
          fill="none"
          stroke="#ccc"
      />
      <!-- 沿路径移动的文字 -->
      <text font-size="16" fill="#fff">
        <!-- 定义动画，控制fill，从红色到绿色到紫色，持续6秒，重复无限次-->
        <animate
            attributeName="fill"
            values="#ff0000; #00ff00; #ff00ff"
            dur="6s"
            repeatCount="indefinite"
        />
        <!-- href="#curve"：表示文字将贴合名为 "curve" 的路径-->
        <textPath href="#curve" startOffset="0%">
          <!-- 定义动画，控制startOffset，从0%开始，到100%结束，持续6秒，重复无限次-->
          <animate
              attributeName="startOffset"
              from="0%"
              to="100%"
              dur="6s"
              repeatCount="indefinite"
          />
          哎哟你干嘛~
        </textPath>
      </text>
    </svg>
  </div>

</template>
<script setup lang="ts">

</script>
<style scoped>

.container {
  width: 200px;
  height: 200px;
  background: #f0f0f0;
  position: relative;
  overflow: hidden;
}

.moving-text {
  position: absolute;
  offset-path: path("M0,100 C66.7,33.3 133.3,166.7 200,100");
  offset-rotate: auto;
  animation: move 5s linear infinite;
  font-size: 24px;
  white-space: nowrap;
}

@keyframes move {
  from {
    offset-distance: 0%;
  }
  to {
    offset-distance: 100%;
  }
}



</style>