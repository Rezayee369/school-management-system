'use server';

/**
 * @fileOverview This flow generates a custom report based on a natural language query.
 *
 * - generateCustomReport - A function that generates a custom report.
 * - GenerateCustomReportInput - The input type for the generateCustomReport function.
 * - GenerateCustomReportOutput - The return type for the generateCustomReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCustomReportInputSchema = z.object({
  reportQuery: z.string().describe('The natural language query for the report.'),
});
export type GenerateCustomReportInput = z.infer<
  typeof GenerateCustomReportInputSchema
>;

const GenerateCustomReportOutputSchema = z.object({
  report: z.string().describe('The generated report in a human-readable format.'),
});
export type GenerateCustomReportOutput = z.infer<
  typeof GenerateCustomReportOutputSchema
>;

export async function generateCustomReport(
  input: GenerateCustomReportInput
): Promise<GenerateCustomReportOutput> {
  return generateCustomReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCustomReportPrompt',
  input: {schema: GenerateCustomReportInputSchema},
  output: {schema: GenerateCustomReportOutputSchema},
  prompt: `You are an expert report generator for HealthQueue Pro.
  Based on the user's query, generate a report using the available data.

  Query: {{{reportQuery}}}
  `,
});

const generateCustomReportFlow = ai.defineFlow(
  {
    name: 'generateCustomReportFlow',
    inputSchema: GenerateCustomReportInputSchema,
    outputSchema: GenerateCustomReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
