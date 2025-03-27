import { atom } from 'recoil';
import { AxiosResponse } from 'axios';

export const metadataAtom = atom<AxiosResponse<any, any> | null>({
  key: 'metadataAtom', // Unique ID
  default: null,       // Default value
});
