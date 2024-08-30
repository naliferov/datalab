import { defineStore } from 'pinia'
import { ref } from 'vue'

interface TreeNode {
  id: string
  m: {}
  //additionalInfo?: string
}

export const useTreeStore = defineStore('tree', () => {
  const root = ref<TreeNode>({
    id: 'root',
    name: 'Root node'
  })

  return { root }
})
