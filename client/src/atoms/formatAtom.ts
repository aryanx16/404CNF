import { atom } from 'recoil';
import { AxiosResponse } from 'axios';

export const formatAtom = atom<AxiosResponse<any, any> | null>({
  key: 'formatAtom', // Unique ID
  default: null,       // Default value
});
