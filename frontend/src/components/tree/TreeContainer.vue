<script setup lang="ts">
import { useTreeStore } from '@/stores/tree/TreeStore'
import TreeNode from './TreeNode.vue'

const treeStore = useTreeStore()
const root = treeStore.root
</script>

<template>
  <h2>Varcraft Tree</h2>
  <TreeNode :node="root" />
</template>
