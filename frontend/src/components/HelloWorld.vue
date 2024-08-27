<template>
  <div>
    <h1>{{ title }}</h1>
    <p>Current count: {{ count }}</p>
    <button @click="increment">Increment</button>
    <button @click="decrement">Decrement</button>
    <button @click="reset">Reset</button>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
  name: 'CounterComponent',
  setup() {
    const count = ref(0)
    const title = ref('Counter Example')

    const increment = () => {
      count.value++
    }
    const decrement = () => {
      if (count.value > 0) {
        count.value--
      }
    }

    const reset = () => {
      count.value = 0
    }

    const isZero = computed(() => count.value === 0)

    onMounted(() => {
      console.log('Component has been mounted')
    })

    return {
      count,
      title,
      increment,
      decrement,
      reset,
      isZero
    }
  }
}
</script>

<style scoped>
.counter-component {
  text-align: center;
}

button {
  margin: 5px;
  padding: 10px;
  font-size: 16px;
  cursor: pointer;
}
</style>
