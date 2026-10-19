import { AppState, GOOGLE_CLIENT_ID } from './storage';

declare global {
  interface Window {
    google?: any;
  }
}

const DRIVE_FILE_NAME = 'flowbudget_vault.json';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const DRIVE_TOKEN_STORAGE_KEY = 'flowbudget_drive_token_meta';

export interface DriveSyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error: string | null;
}

let inMemoryAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

// Try to recover token from sessionStorage if valid
try {
  const cachedMeta = sessionStorage.getItem(DRIVE_TOKEN_STORAGE_KEY);
  if (cachedMeta) {
    const parsed = JSON.parse(cachedMeta);
    if (parsed.token && parsed.expiresAt > Date.now()) {
      inMemoryAccessToken = parsed.token;
      tokenExpiresAt = parsed.expiresAt;
    }
  }
} catch {
  // Ignore session storage errors
}

export function isDriveConnected(): boolean {
  return inMemoryAccessToken !== null && Date.now() < tokenExpiresAt;
}

export function getDriveAccessToken(): string | null {
  if (inMemoryAccessToken && Date.now() < tokenExpiresAt) {
    return inMemoryAccessToken;
  }
  return null;
}

export function storeDriveAccessToken(token: string, expiresInSeconds: number = 3599) {
  inMemoryAccessToken = token;
  tokenExpiresAt = Date.now() + expiresInSeconds * 1000 - 60000; // 1 min buffer
  try {
    sessionStorage.setItem(
      DRIVE_TOKEN_STORAGE_KEY,
      JSON.stringify({ token, expiresAt: tokenExpiresAt })
    );
  } catch {
    // Ignore
  }
}

export function clearDriveAccessToken() {
  inMemoryAccessToken = null;
  tokenExpiresAt = 0;
  try {
    sessionStorage.removeItem(DRIVE_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Request OAuth 2.0 Access Token with Google Drive AppData scope
 */
export async function requestDriveAccessToken(): Promise<string> {
  const existing = getDriveAccessToken();
  if (existing) return existing;

  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services script is not loaded yet.'));
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: DRIVE_SCOPE,
        callback: (resp: any) => {
          if (resp.error) {
            reject(new Error(resp.error_description || resp.error || 'User cancelled Google Drive access'));
            return;
          }
          if (resp.access_token) {
            const expiresIn = resp.expires_in ? parseInt(resp.expires_in) : 3599;
            storeDriveAccessToken(resp.access_token, expiresIn);
            resolve(resp.access_token);
          } else {
            reject(new Error('No access token returned from Google'));
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * Find the file ID of flowbudget_vault.json in the user's hidden appDataFolder
 */
async function findVaultFileId(accessToken: string): Promise<string | null> {
  const query = encodeURIComponent(`'appDataFolder' in parents and name = '${DRIVE_FILE_NAME}' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${query}&fields=files(id,name,modifiedTime)`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to query Google Drive (HTTP ${response.status})`);
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

/**
 * Download the vault JSON from Google Drive appDataFolder
 */
export async function loadFromGoogleDrive(accessToken: string): Promise<AppState | null> {
  const fileId = await findVaultFileId(accessToken);
  if (!fileId) {
    return null; // File doesn't exist yet in Drive
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download vault from Google Drive (HTTP ${response.status})`);
  }

  const data = await response.json();
  return data as AppState;
}

/**
 * Save the vault JSON to Google Drive appDataFolder (create or update)
 */
export async function saveToGoogleDrive(accessToken: string, appState: AppState): Promise<string> {
  const fileId = await findVaultFileId(accessToken);
  const jsonContent = JSON.stringify(appState, null, 2);

  if (fileId) {
    // File already exists -> update contents
    const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
    const response = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: jsonContent,
    });

    if (!response.ok) {
      throw new Error(`Failed to update vault file in Google Drive (HTTP ${response.status})`);
    }

    return fileId;
  } else {
    // File does not exist -> 1. Create file metadata with parent 'appDataFolder'
    const createMetaUrl = 'https://www.googleapis.com/drive/v3/files';
    const metaResponse = await fetch(createMetaUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: DRIVE_FILE_NAME,
        parents: ['appDataFolder'],
      }),
    });

    if (!metaResponse.ok) {
      throw new Error(`Failed to initialize vault file in Google Drive (HTTP ${metaResponse.status})`);
    }

    const metaData = await metaResponse.json();
    const newFileId = metaData.id;

    // 2. Upload file content
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${newFileId}?uploadType=media`;
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: jsonContent,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to write vault data in Google Drive (HTTP ${uploadResponse.status})`);
    }

    return newFileId;
  }
}
