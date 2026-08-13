<script setup lang="ts">
</script>

<template>
  <div class="relative w-3.75 h-3.75">
    <div class="star"></div>
    <div class="leaves"></div>
    <div class="trunk"></div>
  </div>
</template>

<style scoped>
/* 星星 */
.star {
  position: absolute;
  top: 0;
  left: 4px;
  width: 7px;
  height: 7px;
  background-color: yellow;
  clip-path: polygon(50% 0%, 61% 38%, 98% 38%, 68% 59%, 79% 95%, 50% 75%, 21% 95%, 32% 59%, 2% 38%, 39% 38%);
  z-index: 1000;
}
/* 树叶 */
.leaves {
  position: absolute;
  bottom: 3px;
  left: 0;
  width: 15px;
  height: 12px;
  background-color: green;
  clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
}
/* 树干 */
.trunk {
  position: absolute;
  bottom: 0;
  left: 6px;
  width: 3px;
  height: 3px;
  background-color: brown;
}
</style>