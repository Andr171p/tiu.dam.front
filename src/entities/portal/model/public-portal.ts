import { publicApi, type Schemas } from '@shared/api';
import type { PublicPortal } from './types';

const tokenKey = (slug: string) => `tiu-dam.portal-token.${slug}`;

/** Токен закрытого паролем портала живёт до закрытия вкладки. */
function readToken(slug: string): string | null {
  try {
    return sessionStorage.getItem(tokenKey(slug));
  } catch {
    return null;
  }
}

function portalHeaders(slug: string): Record<string, string> {
  const token = readToken(slug);
  return token ? { 'X-Portal-Token': token } : {};
}

export function fetchPublicPortal(
  slug: string,
  signal?: AbortSignal,
): Promise<PublicPortal> {
  return publicApi.get<PublicPortal>(`/portals/${slug}`, {
    headers: portalHeaders(slug),
    signal,
  });
}

export async function unlockPortal(slug: string, password: string) {
  const { token } = await publicApi.post<Schemas['PortalToken']>(
    `/portals/${slug}/unlock`,
    {
      body: { password },
    },
  );
  try {
    sessionStorage.setItem(tokenKey(slug), token);
  } catch {
    // Без хранилища пароль придётся ввести снова после перезагрузки
  }
}

export async function downloadPublicAsset(slug: string, assetId: string) {
  const { url } = await publicApi.get<Schemas['DownloadResponse']>(
    `/portals/${slug}/assets/${assetId}/download`,
    { headers: portalHeaders(slug) },
  );
  const link = document.createElement('a');
  link.href = url;
  link.rel = 'noopener';
  link.click();
}
