<template>
  <div class="step-card" :class="{ completed: isCompleted }">
    <div class="step-number">{{ number }}</div>
    <div class="step-content">
      <h4 class="step-title">{{ title }}</h4>
      <p class="step-description"><slot /></p>
    </div>
    <div class="step-checkmark" v-if="isCompleted">✓</div>
  </div>
</template>

<script setup lang="ts">
// ABOUTME: Step-by-step guide card component with visual progression indicators
// ABOUTME: Shows numbered steps with optional completion state for tutorials

defineProps<{
  number: number
  title: string
  isCompleted?: boolean
}>()
</script>

<style scoped>
.step-card {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  padding: 1.5rem;
  margin: 1rem 0;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  border-left: 4px solid var(--vp-c-divider);
  transition: all 0.3s ease;
  position: relative;
}

.step-card:hover {
  border-left-color: var(--vp-c-brand-1);
  box-shadow: var(--vp-shadow-medium);
  transform: translateX(4px);
}

.step-card.completed {
  border-left-color: #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%);
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--vp-gradient-brand);
  color: white;
  font-weight: 700;
  font-size: 1.25rem;
  flex-shrink: 0;
  box-shadow: var(--vp-shadow-subtle);
}

.step-card.completed .step-number {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.step-description {
  margin: 0;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}

.step-checkmark {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #10b981;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .step-card {
    flex-direction: column;
  }

  .step-number {
    margin: 0 auto;
  }
}
</style>
