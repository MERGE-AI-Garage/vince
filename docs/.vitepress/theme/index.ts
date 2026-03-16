// ABOUTME: Custom theme configuration extending VitePress default theme
// ABOUTME: Imports custom styles and components for enhanced visual design

import DefaultTheme from 'vitepress/theme'
import './custom.css'
import type { Theme } from 'vitepress'

import FeatureCard from './components/FeatureCard.vue'
import StepCard from './components/StepCard.vue'
import QuickTip from './components/QuickTip.vue'
import ActionButton from './components/ActionButton.vue'
import VisualDemo from './components/VisualDemo.vue'
import DiagramViewer from './components/DiagramViewer.vue'
import ScreenshotCard from './components/ScreenshotCard.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router, siteData }) {
    // Register custom global components for use in markdown
    app.component('FeatureCard', FeatureCard)
    app.component('StepCard', StepCard)
    app.component('QuickTip', QuickTip)
    app.component('ActionButton', ActionButton)
    app.component('VisualDemo', VisualDemo)
    app.component('DiagramViewer', DiagramViewer)
    app.component('ScreenshotCard', ScreenshotCard)
  }
} satisfies Theme
