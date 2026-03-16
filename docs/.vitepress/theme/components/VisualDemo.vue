<template>
  <div class="visual-demo">
    <div class="demo-header" v-if="title">
      <h4 class="demo-title">{{ title }}</h4>
      <p class="demo-description" v-if="description">{{ description }}</p>
    </div>
    <div class="demo-content">
      <slot />
    </div>
    <div class="demo-footer" v-if="caption">
      <p class="demo-caption">{{ caption }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// ABOUTME: Container for visual demonstrations, screenshots, or videos
// ABOUTME: Provides consistent styling for demo content with optional titles and captions

defineProps<{
  title?: string
  description?: string
  caption?: string
}>()
</script>

<style scoped>
.visual-demo {
  margin: 2rem 0;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  box-shadow: var(--vp-shadow-medium);
  transition: all 0.3s ease;
}

.visual-demo:hover {
  box-shadow: var(--vp-shadow-large);
  border-color: var(--vp-c-brand-1);
}

.demo-header {
  padding: 1.5rem 2rem;
  background: var(--vp-c-bg-alt);
  border-bottom: 1px solid var(--vp-c-divider);
}

.demo-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.demo-description {
  margin: 0;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.demo-content {
  padding: 2rem;
}

.demo-content :deep(img) {
  width: 100%;
  border-radius: 8px;
  box-shadow: var(--vp-shadow-subtle);
}

.demo-content :deep(video) {
  width: 100%;
  border-radius: 8px;
  box-shadow: var(--vp-shadow-subtle);
}

.demo-footer {
  padding: 1rem 2rem;
  background: var(--vp-c-bg-alt);
  border-top: 1px solid var(--vp-c-divider);
}

.demo-caption {
  margin: 0;
  font-size: 0.9375rem;
  font-style: italic;
  color: var(--vp-c-text-2);
  text-align: center;
}
</style>
