'use server';

/**
 * @fileOverview A flow for suggesting the most relevant dashboard tab based on user role.
 *
 * - suggestDashboardTabs - A function that returns the suggested dashboard tabs for a user role.
 * - SuggestDashboardTabsInput - The input type for the suggestDashboardTabs function.
 * - SuggestDashboardTabsOutput - The return type for the suggestDashboardTabs function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestDashboardTabsInputSchema = z.object({
  userRole: z.enum(['Admin', 'Receptionist', 'Doctor']).describe('The role of the user.'),
});
export type SuggestDashboardTabsInput = z.infer<
  typeof SuggestDashboardTabsInputSchema
>;

const SuggestDashboardTabsOutputSchema = z.object({
  suggestedTabs: z
    .array(z.string())
    .describe(
      'An ordered list of suggested dashboard tabs, with the most relevant tab first.'
    ),
});
export type SuggestDashboardTabsOutput = z.infer<
  typeof SuggestDashboardTabsOutputSchema
>;

export async function suggestDashboardTabs(
  input: SuggestDashboardTabsInput
): Promise<SuggestDashboardTabsOutput> {
  return suggestDashboardTabsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDashboardTabsPrompt',
  input: {schema: SuggestDashboardTabsInputSchema},
  output: {schema: SuggestDashboardTabsOutputSchema},
  prompt: `You are an expert in user interface design for medical center management systems.

  Based on the user's role, suggest an ordered list of dashboard tabs that would be most relevant to them.

  The possible tabs are: Dashboard, Patient Registration, Queue Management, Reports.

  The user role is: {{{userRole}}}  Return the tabs in order of relevance, with the most relevant tab first.
  `,
});

const suggestDashboardTabsFlow = ai.defineFlow(
  {
    name: 'suggestDashboardTabsFlow',
    inputSchema: SuggestDashboardTabsInputSchema,
    outputSchema: SuggestDashboardTabsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

