import { env } from '../config/env';
import { BackendCaller } from './backend-caller';

/** API медиатеки для сотрудников: `/api/v1` */
export const api = new BackendCaller(`${env.apiOrigin}/api/v1`);

/** Публичные страницы контент-порталов: `/api/public/v1` */
export const publicApi = new BackendCaller(`${env.apiOrigin}/api/public/v1`);
