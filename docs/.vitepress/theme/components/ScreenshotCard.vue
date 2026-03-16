<!-- ABOUTME: Screenshot display component for visual user manual integration -->
<!-- ABOUTME: Shows screenshots with metadata, actions, and key elements from MERGE GUIDE visual manual -->

<template>
  <div class="screenshot-card">
    <div class="screenshot-header">
      <div class="screenshot-title">
        <span class="icon">{{ icon }}</span>
        <h3>{{ title }}</h3>
      </div>
      <div class="screenshot-route" v-if="route">{{ route }}</div>
    </div>

    <div class="screenshot-content">
      <div class="screenshot-image-wrapper">
        <img :src="imagePath" :alt="title" class="screenshot-image" />
      </div>

      <div class="screenshot-details">
        <div class="description" v-if="description">
          {{ description }}
        </div>

        <div class="details-section" v-if="primaryActions && primaryActions.length">
          <h4>Primary Actions</h4>
          <ul>
            <li v-for="(action, index) in primaryActions" :key="index">{{ action }}</li>
          </ul>
        </div>

        <div class="details-section" v-if="keyElements && keyElements.length">
          <h4>Key Elements</h4>
          <ul>
            <li v-for="(element, index) in keyElements" :key="index">{{ element }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  route: {
    type: String,
    default: ''
  },
  imagePath: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  primaryActions: {
    type: Array,
    default: () => []
  },
  keyElements: {
    type: Array,
    default: () => []
  },
  icon: {
    type: String,
    default: '📸'
  }
})
</script>

<style scoped>
.screenshot-card {
  background: var(--vp-c-bg);
  border-radius: 12px;
  margin: 2rem 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border-top: 4px solid var(--vp-c-brand-1);
}

.screenshot-header {
  background: linear-gradient(90deg, #133B34, #00856C);
  color: white;
  padding: 1.5rem 2rem;
}

.screenshot-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.icon {
  font-size: 1.5em;
}

.screenshot-title h3 {
  margin: 0;
  font-size: 1.5em;
  font-weight: 700;
}

.screenshot-route {
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  opacity: 0.9;
}

.screenshot-content {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 2rem;
  padding: 2rem;
}

.screenshot-image-wrapper {
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid var(--vp-c-divider);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: var(--vp-c-bg-soft);
}

.screenshot-image {
  width: 100%;
  height: auto;
  display: block;
}

.screenshot-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.description {
  font-size: 1.05em;
  line-height: 1.7;
  color: var(--vp-c-text-1);
  padding: 1.25rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border-left: 4px solid var(--vp-c-brand-1);
}

.details-section {
  background: var(--vp-c-bg-soft);
  padding: 1.25rem;
  border-radius: 8px;
}

.details-section h4 {
  font-size: 0.9em;
  color: var(--vp-c-brand-1);
  margin: 0 0 0.75rem 0;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.details-section ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.details-section li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
  color: var(--vp-c-text-2);
}

.details-section li:before {
  content: "▸";
  position: absolute;
  left: 0;
  color: var(--vp-c-brand-1);
  font-weight: bold;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .screenshot-content {
    grid-template-columns: 1fr;
  }

  .screenshot-title h3 {
    font-size: 1.25em;
  }
}

/* Print Styles */
@media print {
  .screenshot-card {
    page-break-inside: avoid;
  }
}
</style>
