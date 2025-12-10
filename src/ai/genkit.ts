import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      // Force the use of service account credentials in the deployed environment.
      // This is more robust than relying on an API key for server-side flows.
      authPolicy: 'google',
    }),
  ],
  // Use the user-requested model.
  model: 'googleai/gemini-2.5-pro',
});
