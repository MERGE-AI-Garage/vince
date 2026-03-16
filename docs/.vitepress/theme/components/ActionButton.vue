<template>
  <a :href="link" class="action-button" :class="[variant, size]" target="_blank" rel="noopener">
    <span class="button-icon" v-if="icon">{{ icon }}</span>
    <span class="button-text">{{ text }}</span>
    <span class="button-arrow">→</span>
  </a>
</template>

<script setup lang="ts">
// ABOUTME: Styled action button component for CTAs and navigation
// ABOUTME: Supports multiple variants and sizes with icons

defineProps<{
  link: string
  text: string
  icon?: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'small' | 'medium' | 'large'
}>()
</script>

<style scoped>
.action-button {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.75rem;
  border-radius: 12px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  margin: 0.5rem 0.5rem 0.5rem 0;
}

.action-button.primary {
  background: var(--vp-gradient-brand);
  color: white;
  box-shadow: var(--vp-shadow-brand);
}

.action-button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(95, 103, 238, 0.35);
}

.action-button.secondary {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-divider);
}

.action-button.secondary:hover {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}

.action-button.outline {
  background: transparent;
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.action-button.outline:hover {
  background: var(--vp-c-brand-soft);
  transform: translateY(-2px);
}

.action-button.small {
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
}

.action-button.large {
  padding: 1.125rem 2rem;
  font-size: 1.125rem;
}

.button-icon {
  font-size: 1.25em;
  line-height: 1;
}

.button-text {
  line-height: 1;
}

.button-arrow {
  transition: transform 0.3s ease;
  line-height: 1;
}

.action-button:hover .button-arrow {
  transform: translateX(4px);
}
</style>
