import { dirname } from 'path';
import { fileURLToPath } from 'url';

export const gDirname = importMetaUrl => dirname(fileURLToPath(importMetaUrl));
