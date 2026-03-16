<!-- ABOUTME: Screenshot display component for visual documentation -->
<!-- ABOUTME: Shows app screenshots with route and description, used inline in guide pages -->

<template>
  <div class="screenshot-card">
    <div class="screenshot-header">
      <span class="screenshot-title">{{ title }}</span>
      <code v-if="route" class="screenshot-route">{{ route }}</code>
    </div>
    <div class="screenshot-body">
      <img :src="resolvedPath" :alt="title" class="screenshot-image" />
      <p v-if="description" class="screenshot-desc">{{ description }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { withBase } from 'vitepress'

const props = defineProps({
  title: { type: String, required: true },
  route: { type: String, default: '' },
  imagePath: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
  primaryActions: { type: Array, default: () => [] },
  keyElements: { type: Array, default: () => [] }
})

const resolvedPath = computed(() => withBase(props.imagePath))
</script>

<style scoped>
.screenshot-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  margin: 1.5rem 0;
}

.screenshot-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.875rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.screenshot-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.screenshot-route {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  background: transparent;
  padding: 0;
}

.screenshot-body {
  background: var(--vp-c-bg);
}

.screenshot-image {
  width: 100%;
  height: auto;
  display: block;
}

.screenshot-desc {
  margin: 0;
  padding: 0.625rem 0.875rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  border-top: 1px solid var(--vp-c-divider);
}
</style>
