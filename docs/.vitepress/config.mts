// ABOUTME: VitePress configuration for Vince documentation site
// ABOUTME: Defines site structure, navigation, branding, and build settings

import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
  title: 'Vince Documentation',
  description: 'Documentation for Vince — AI-Powered Creative Director',

  base: '/docs/',
  cleanUrls: true,
  ignoreDeadLinks: true,

  themeConfig: {
    siteTitle: 'Vince',
    logo: '/logo.svg',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'User Guide', link: '/user/01-welcome' },
      { text: 'Creator Guide', link: '/creator/01-getting-started' },
      { text: 'Developer', link: '/developer/01-getting-started' },
      { text: 'Operations', link: '/admin/01-deployment-guide' },
      { text: 'Architecture', link: '/architecture/01-system-overview' },
      { text: 'Visual Manual', link: '/visual-manual/' }
    ],

    sidebar: {
      '/user/': [
        {
          text: 'User Guide',
          items: [
            { text: 'Welcome', link: '/user/01-welcome' },
            { text: 'Feature Guides', link: '/user/02-feature-guides' },
            { text: 'FAQ', link: '/user/03-faq' },
            { text: 'Troubleshooting', link: '/user/04-troubleshooting' },
            { text: 'Glossary', link: '/user/05-glossary' }
          ]
        }
      ],

      '/creator/': [
        {
          text: 'Creator Guide',
          items: [
            { text: 'Getting Started', link: '/creator/01-getting-started' },
            { text: 'Generation Workflows', link: '/creator/02-generation-workflows' },
            { text: 'Prompt Templates', link: '/creator/03-prompt-templates' },
            { text: 'Media Management', link: '/creator/04-media-management' },
            { text: 'Troubleshooting', link: '/creator/05-troubleshooting' }
          ]
        }
      ],

      '/developer/': [
        {
          text: 'Developer Documentation',
          items: [
            { text: 'Getting Started', link: '/developer/01-getting-started' },
            { text: 'Architecture Guide', link: '/developer/02-architecture-guide' },
            { text: 'API Reference', link: '/developer/03-api-reference' },
            { text: 'Contributing', link: '/developer/04-contributing' },
            { text: 'Testing Guide', link: '/developer/05-testing-guide' },
            { text: 'Common Tasks', link: '/developer/06-common-tasks' },
            { text: 'Code Patterns', link: '/developer/07-code-patterns' }
          ]
        }
      ],

      '/admin/': [
        {
          text: 'Operations',
          items: [
            { text: 'Deployment Guide', link: '/admin/01-deployment-guide' },
            { text: 'Configuration Reference', link: '/admin/02-configuration-reference' },
            { text: 'Monitoring & Alerting', link: '/admin/03-monitoring-alerting' },
            { text: 'Disaster Recovery', link: '/admin/04-disaster-recovery' },
            { text: 'Troubleshooting', link: '/admin/05-troubleshooting' },
            { text: 'Operations Runbooks', link: '/admin/06-operations-runbooks' },
            { text: 'System Administration', link: '/admin/07-system-administration' }
          ]
        }
      ],

      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'System Overview', link: '/architecture/01-system-overview' },
            { text: 'C4 Diagrams', link: '/architecture/02-architecture-c4' },
            { text: 'Integrations', link: '/architecture/03-integrations' },
            { text: 'Data Architecture', link: '/architecture/04-data-architecture' },
            { text: 'Security & Compliance', link: '/architecture/05-security-compliance' },
            { text: 'Architecture Decisions', link: '/architecture/06-decisions-adr' }
          ]
        }
      ],

      '/visual-manual/': [
        {
          text: 'Visual Manual',
          items: [
            { text: 'All Screens', link: '/visual-manual/' }
          ]
        }
      ]
    },

    footer: {
      copyright: 'Copyright © 2026 MERGE'
    },

    search: {
      provider: 'local',
      options: {
        detailedView: true
      }
    },

    lastUpdated: {
      text: 'Updated at',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium'
      }
    }
  },

  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  },

  mermaid: {
    theme: 'default'
  },

  vite: {
    optimizeDeps: {
      exclude: ['langium']
    },
    ssr: {
      noExternal: ['mermaid']
    }
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#10b981' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en' }],
    ['meta', { property: 'og:title', content: 'Vince Documentation' }],
    ['meta', { property: 'og:site_name', content: 'Vince Docs' }]
  ]
}))
