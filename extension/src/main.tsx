// ABOUTME: Entry point for the AI brand guidelines Chrome extension
// ABOUTME: Mounts BrandApp into the sidepanel DOM root

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrandApp } from './BrandApp';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <BrandApp />
    </React.StrictMode>
  );
}
