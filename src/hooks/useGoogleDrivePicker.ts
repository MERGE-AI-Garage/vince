// ABOUTME: Custom hook for Google Drive Picker integration with Shared Drive support
// ABOUTME: Handles incremental OAuth authorization and text extraction from Google Docs

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Google API types
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface PickedFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailUrl?: string;
  webViewLink?: string;
  isSharedDrive?: boolean;
  driveId?: string;
}

interface UseGoogleDrivePickerReturn {
  openPicker: () => Promise<void>;
  reset: () => void;
  selectedFile: PickedFile | null;
  extractedText: string | null;
  fileData: string | null;      // base64-encoded binary for non-text files (PDFs, PPTX, etc.)
  fileMimeType: string | null;  // MIME type of the binary file data
  isLoading: boolean;
  error: string | null;
}

// Google Cloud configuration - these should match your OAuth setup
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_APP_ID = import.meta.env.VITE_GOOGLE_APP_ID || '';

const GOOGLE_NATIVE_MIMES: Record<string, string> = {
  'application/vnd.google-apps.document': 'text/plain',
  'application/vnd.google-apps.spreadsheet': 'text/csv',
  'application/vnd.google-apps.presentation': 'text/plain',
};

export function useGoogleDrivePicker(): UseGoogleDrivePickerReturn {
  const { session } = useAuth();
  const [selectedFile, setSelectedFile] = useState<PickedFile | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);

  const loadGoogleApi = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.gapi?.client && window.google?.accounts) {
        resolve();
        return;
      }

      let gapiLoaded = false;
      let gsiLoaded = false;

      const checkBothLoaded = () => {
        if (gapiLoaded && gsiLoaded) {
          resolve();
        }
      };

      // Load Google API (for Picker)
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.onload = () => {
        window.gapi.load('client:picker', async () => {
          await window.gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
          gapiLoaded = true;
          checkBothLoaded();
        });
      };
      gapiScript.onerror = () => reject(new Error('Failed to load Google API'));
      document.body.appendChild(gapiScript);

      // Load Google Identity Services (for OAuth)
      const gsiScript = document.createElement('script');
      gsiScript.src = 'https://accounts.google.com/gsi/client';
      gsiScript.onload = () => {
        gsiLoaded = true;
        checkBothLoaded();
      };
      gsiScript.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.body.appendChild(gsiScript);
    });
  }, []);

  const requestDriveAccess = useCallback(async (): Promise<string | null> => {
    try {
      await loadGoogleApi();

      return new Promise((resolve) => {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file',
          callback: (response: any) => {
            console.log('[requestDriveAccess] OAuth response:', {
              hasError: !!response.error,
              hasToken: !!response.access_token,
              tokenLength: response.access_token?.length,
              scope: response.scope,
              error: response.error
            });

            if (response.error) {
              console.error('OAuth error:', response);
              if (response.error === 'popup_closed_by_user') {
                toast.error('Drive access cancelled. Click "Browse Google Drive" again when ready.');
              } else {
                toast.error('Failed to authorize Google Drive access');
              }
              resolve(null);
              return;
            }
            resolve(response.access_token);
          },
        });

        // Request the token - use empty prompt to allow cached credentials
        console.log('[requestDriveAccess] Requesting token with scopes: drive.readonly, drive.file');
        tokenClient.requestAccessToken({ prompt: '' });
      });
    } catch (err) {
      console.error('Drive authorization error:', err);
      toast.error('Failed to authorize Google Drive access');
      return null;
    }
  }, [loadGoogleApi]);

  // Binary MIME types that should return raw data instead of text extraction
  const BINARY_MIMES = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.ms-word',
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  ]);

  const extractFileContent = useCallback(async (
    fileId: string,
    mimeType: string,
    accessToken: string
  ): Promise<{ text: string | null; data: string | null; dataMimeType: string | null }> => {
    const isNativeGoogle = mimeType in GOOGLE_NATIVE_MIMES;
    const exportMimeType = isNativeGoogle ? GOOGLE_NATIVE_MIMES[mimeType] : null;
    const isBinary = BINARY_MIMES.has(mimeType);

    let response: Response;

    if (isNativeGoogle && exportMimeType) {
      // Export Google Workspace file as text — these always produce text
      response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/export?` +
        new URLSearchParams({
          mimeType: exportMimeType,
          supportsAllDrives: 'true'
        }),
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      return { text: await blob.text(), data: null, dataMimeType: null };
    }

    // Download regular file
    response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?` +
      new URLSearchParams({
        alt: 'media',
        supportsAllDrives: 'true'
      }),
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();

    if (isBinary) {
      // Return base64-encoded binary for PDFs, PPTX, images, etc.
      const buffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
      }
      return { text: null, data: btoa(binary), dataMimeType: mimeType };
    }

    // Plain text files
    return { text: await blob.text(), data: null, dataMimeType: null };
  }, []);

  const openPicker = useCallback(async () => {
    if (!session) {
      toast.error('Please sign in to browse Google Drive files');
      return;
    }

    try {
      console.log('[openPicker] Starting picker flow');
      // Request Drive access (will show popup if needed)
      const accessToken = await requestDriveAccess();

      console.log('[openPicker] Received token:', {
        hasToken: !!accessToken,
        tokenLength: accessToken?.length,
        tokenStart: accessToken?.substring(0, 20) + '...'
      });

      if (!accessToken) {
        // User declined or authorization failed
        console.warn('[openPicker] No token received, aborting');
        return;
      }

      // Store token in both state and ref - ref is immediately available to callback
      accessTokenRef.current = accessToken;
      setDriveAccessToken(accessToken);
      console.log('[openPicker] Stored token in ref and state:', {
        refHasToken: !!accessTokenRef.current,
        refTokenMatches: accessTokenRef.current === accessToken
      });
      await loadGoogleApi();

      // Create the picker callback here with the token in closure
      const pickerCallback = async (data: any) => {
        console.log('[pickerCallback] Called with action:', data.action);

        if (data.action === window.google.picker.Action.PICKED) {
          const file = data.docs[0];
          console.log('[pickerCallback] File selected:', {
            fileId: file.id,
            fileName: file.name,
            mimeType: file.mimeType
          });

          const pickedFile: PickedFile = {
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            thumbnailUrl: file.thumbnailUrl,
            webViewLink: file.url,
            isSharedDrive: !!file.driveId,
            driveId: file.driveId
          };

          setSelectedFile(pickedFile);
          setIsLoading(true);
          setError(null);

          try {
            console.log('[pickerCallback] Using token from closure:', {
              hasToken: !!accessToken,
              tokenLength: accessToken?.length,
              tokenStart: accessToken?.substring(0, 20) + '...'
            });

            const result = await extractFileContent(file.id, file.mimeType, accessToken);
            setExtractedText(result.text);
            setFileData(result.data);
            setFileMimeType(result.dataMimeType);

            if (result.text) {
              toast.success(`Loaded ${file.name} (${result.text.length} characters)`);
            } else if (result.data) {
              const sizeKb = Math.round(result.data.length * 0.75 / 1024);
              toast.success(`Loaded ${file.name} (${sizeKb} KB)`);
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to extract text';
            setError(errorMessage);
            toast.error(errorMessage);
            console.error('Text extraction error:', err);
          } finally {
            setIsLoading(false);
          }
        } else if (data.action === window.google.picker.Action.CANCEL) {
          toast.info('File selection cancelled');
        }
      };

      // Create views for different Drive locations
      // Use ViewId for Recent - this is a special predefined view
      const recentView = new window.google.picker.DocsView(window.google.picker.ViewId.RECENTLY_PICKED)
        .setLabel('Recent');

      // Use ViewId for My Drive - DocsView alone shows all accessible files
      const myDriveView = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
        .setIncludeFolders(true)
        .setOwnedByMe(true)
        .setLabel('My Drive');

      const sharedWithMeView = new window.google.picker.DocsView()
        .setIncludeFolders(true)
        .setOwnedByMe(false)
        .setLabel('Shared with me');

      const starredView = new window.google.picker.DocsView()
        .setStarred(true)
        .setLabel('Starred');

      // Critical: Use plain DocsView with setEnableDrives for Shared Drives
      const sharedDrivesView = new window.google.picker.DocsView()
        .setIncludeFolders(true)
        .setEnableDrives(true)
        .setLabel('Shared drives');

      const picker = new window.google.picker.PickerBuilder()
        .addView(recentView)
        .addView(myDriveView)
        .addView(sharedWithMeView)
        .addView(starredView)
        .addView(sharedDrivesView)
        .enableFeature(window.google.picker.Feature.SUPPORT_DRIVES)
        .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
        .setAppId(GOOGLE_APP_ID)
        .setOAuthToken(accessToken)
        .setCallback(pickerCallback)
        .build();

      console.log('[openPicker] Picker built successfully, showing picker. Token still available:', !!accessToken);
      picker.setVisible(true);

      // Fix z-index after picker is visible - Google Picker uses iframes
      setTimeout(() => {
        // Google Picker creates a div container and iframes
        const pickerElements = [
          document.querySelector('.picker-dialog'),
          document.querySelector('.picker-dialog-bg'),
          ...Array.from(document.querySelectorAll('div[role="dialog"]')),
          ...Array.from(document.querySelectorAll('iframe[src*="picker"]')),
          ...Array.from(document.querySelectorAll('iframe[src*="google"]'))
        ].filter(Boolean);

        pickerElements.forEach((element) => {
          if (element instanceof HTMLElement) {
            element.style.zIndex = '100000';
            console.log('[openPicker] Set z-index for picker element:', element.className || element.tagName);
          }
        });
      }, 100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open Google Drive picker';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Picker error:', err);
    }
  }, [session, requestDriveAccess, loadGoogleApi, extractFileContent]);

  const reset = useCallback(() => {
    setSelectedFile(null);
    setExtractedText(null);
    setFileData(null);
    setFileMimeType(null);
    setError(null);
    accessTokenRef.current = null;
    setDriveAccessToken(null);
  }, []);

  return {
    openPicker,
    reset,
    selectedFile,
    extractedText,
    fileData,
    fileMimeType,
    isLoading,
    error
  };
}
