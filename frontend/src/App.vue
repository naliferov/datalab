<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <!-- src="@/assets/logo.svg" -->
    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/about">About</RouterLink>
      <RouterLink to="/other">Other</RouterLink>
    </nav>
  </header>

  <RouterView />
</template>

<style scoped></style>
