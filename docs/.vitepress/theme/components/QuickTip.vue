<template>
  <div class="quick-tip" :class="type">
    <div class="tip-icon">{{ getIcon }}</div>
    <div class="tip-content">
      <div class="tip-title" v-if="title">{{ title }}</div>
      <div class="tip-body"><slot /></div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ABOUTME: Visual tip/hint component for highlighting important information
// ABOUTME: Supports multiple types (tip, warning, info, success) with distinct styling

import { computed } from 'vue'

const props = defineProps<{
  type?: 'tip' | 'warning' | 'info' | 'success'
  title?: string
}>()

const getIcon = computed(() => {
  switch (props.type) {
    case 'warning': return '⚠️'
    case 'info': return 'ℹ️'
    case 'success': return '✅'
    default: return '💡'
  }
})
</script>

<style scoped>
.quick-tip {
  display: flex;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  margin: 1.5rem 0;
  border-radius: 12px;
  border: 2px solid;
  position: relative;
  overflow: hidden;
}

.quick-tip::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  opacity: 0.5;
}

.quick-tip.tip {
  background: linear-gradient(135deg, rgba(95, 103, 238, 0.08) 0%, rgba(95, 103, 238, 0.02) 100%);
  border-color: var(--vp-c-brand-1);
}

.quick-tip.tip::before {
  background: var(--vp-c-brand-1);
}

.quick-tip.warning {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.08) 0%, rgba(255, 193, 7, 0.02) 100%);
  border-color: #ffc107;
}

.quick-tip.warning::before {
  background: #ffc107;
}

.quick-tip.info {
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.08) 0%, rgba(0, 217, 255, 0.02) 100%);
  border-color: #00d9ff;
}

.quick-tip.info::before {
  background: #00d9ff;
}

.quick-tip.success {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%);
  border-color: #10b981;
}

.quick-tip.success::before {
  background: #10b981;
}

.tip-icon {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
}

.tip-content {
  flex: 1;
  min-width: 0;
}

.tip-title {
  font-weight: 700;
  font-size: 1.0625rem;
  margin-bottom: 0.5rem;
  color: var(--vp-c-text-1);
}

.tip-body {
  line-height: 1.7;
  color: var(--vp-c-text-2);
}

@media (max-width: 768px) {
  .quick-tip {
    flex-direction: column;
    text-align: center;
  }

  .tip-icon {
    margin: 0 auto;
  }
}
</style>
