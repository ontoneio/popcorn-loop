import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
  createSession: defineAction({ 
     input: z.object({
       email: z.string().email(),
       name: z.string().min(4).max(100),
       bpm: z.number().optional(),
       loopLength: z.number().optional(),
     }),
     handler: async ({ input, env }) => {
       const response = await fetch(`${env.API_BASE_URL}/sessions`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           userId: input.email,
           userName: input.name,
           bpm: input.bpm,
           loopLength: input.loopLength,
         }),
       });

       if (!response.ok) {
         throw new Error('Failed to create session');
       }

       return await response.json();
     }
   }),
}