// src/atoms/metadataAtom.ts (or wherever it's defined)
import { atom } from 'recoil';

// Define the expected shape of the atom's state (optional but good practice)
interface MetadataState {
  loading: boolean;
  error: Error | null; // Or 'any' if you prefer
  data: any | null; // Replace 'any' with a more specific type if possible
}

export const metadataAtom = atom<MetadataState>({ // Add the type parameter
  key: 'metadataAtom', // Make sure this key is unique within your app
  default: {
    loading: false, // Or true if you typically start in a loading state
    error: null,
    data: null,
  },
});