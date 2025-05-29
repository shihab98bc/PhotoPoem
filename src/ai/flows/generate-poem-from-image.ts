
'use server';

/**
 * @fileOverview Generates a poem inspired by an image.
 *
 * - generatePoemFromImage - A function that generates a poem from an image.
 * - GeneratePoemFromImageInput - The input type for the generatePoemFromImage function.
 * - GeneratePoemFromImageOutput - The return type for the generatePoemFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePoemFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to inspire the poem, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  tone: z
    .string()
    .optional()
    .describe('The desired tone of the poem (e.g., romantic, melancholic, humorous).'),
  style: z
    .string()
    .optional()
    .describe('The desired style of the poem.'),
  language: z
    .string()
    .optional()
    .describe('The desired language of the poem (e.g., English, Spanish, French). Defaults to English if not specified.'),
});
export type GeneratePoemFromImageInput = z.infer<typeof GeneratePoemFromImageInputSchema>;

const GeneratePoemFromImageOutputSchema = z.object({
  poem: z.string().describe('The generated poem.'),
});
export type GeneratePoemFromImageOutput = z.infer<typeof GeneratePoemFromImageOutputSchema>;

export async function generatePoemFromImage(
  input: GeneratePoemFromImageInput
): Promise<GeneratePoemFromImageOutput> {
  return generatePoemFromImageFlow(input);
}

const generatePoemFromImagePrompt = ai.definePrompt({
  name: 'generatePoemFromImagePrompt',
  input: {schema: GeneratePoemFromImageInputSchema},
  output: {schema: GeneratePoemFromImageOutputSchema},
  prompt: `You are a poet laureate, skilled at writing poems inspired by images.

You will analyze the image and compose a poem that captures its essence and emotional tone.

Image: {{media url=photoDataUri}}

{{#if tone}}
Tone: {{tone}}
{{/if}}

{{#if style}}
Style: {{style}}
{{/if}}

{{#if language}}
Please write the poem in {{language}}.
{{else}}
Please write the poem in English.
{{/if}}

Compose a poem inspired by the image. The poem should be creative, evocative, and capture the
feeling of the image.
`,
});

const generatePoemFromImageFlow = ai.defineFlow(
  {
    name: 'generatePoemFromImageFlow',
    inputSchema: GeneratePoemFromImageInputSchema,
    outputSchema: GeneratePoemFromImageOutputSchema,
  },
  async input => {
    const {output} = await generatePoemFromImagePrompt(input);
    return output!;
  }
);
