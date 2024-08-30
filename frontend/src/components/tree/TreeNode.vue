<script setup lang="ts">
const props = defineProps({
  node: Object
})

console.log(props.node)
</script>

<template>
  <div>
    <div class="name">node name</div>
    <div class="nodes">nodes</div>
  </div>
</template>
