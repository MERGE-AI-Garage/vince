<template>
  <div class="feature-card-wrapper">
    <div class="feature-card" :class="variant">
      <div class="feature-icon" v-if="icon">{{ icon }}</div>
      <div class="feature-content">
        <h3 class="feature-title">{{ title }}</h3>
        <p class="feature-description">{{ description }}</p>
        <a v-if="link" :href="link" class="feature-link">
          {{ linkText || 'Learn more' }} →
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ABOUTME: Reusable feature card component for visually appealing content blocks
// ABOUTME: Supports icons, titles, descriptions, and optional links with multiple variants

defineProps<{
  icon?: string
  title: string
  description: string
  link?: string
  linkText?: string
  variant?: 'primary' | 'secondary' | 'accent'
}>()
</script>

<style scoped>
.feature-card-wrapper {
  margin: 1.5rem 0;
}

.feature-card {
  display: flex;
  gap: 1.5rem;
  padding: 2rem;
  border-radius: 16px;
  background: var(--vp-c-bg-soft);
  border: 2px solid var(--vp-c-divider);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: var(--vp-gradient-brand);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--vp-shadow-large);
  border-color: var(--vp-c-brand-1);
}

.feature-card:hover::before {
  opacity: 1;
}

.feature-card.primary {
  background: linear-gradient(135deg, rgba(95, 103, 238, 0.08) 0%, rgba(95, 103, 238, 0.02) 100%);
}

.feature-card.accent {
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.08) 0%, rgba(0, 217, 255, 0.02) 100%);
}

.feature-icon {
  font-size: 3.5rem;
  line-height: 1;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 12px;
  background: var(--vp-c-bg-alt);
}

.feature-content {
  flex: 1;
  min-width: 0;
}

.feature-title {
  margin: 0 0 0.75rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  line-height: 1.3;
}

.feature-description {
  margin: 0 0 1rem 0;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  font-size: 1.0625rem;
}

.feature-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--vp-c-brand-1);
  font-weight: 600;
  text-decoration: none;
  transition: gap 0.3s ease;
}

.feature-link:hover {
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .feature-card {
    flex-direction: column;
    text-align: center;
  }

  .feature-icon {
    margin: 0 auto;
  }
}
</style>
