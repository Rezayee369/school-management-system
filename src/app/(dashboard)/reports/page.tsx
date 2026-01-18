'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateCustomReport } from '@/ai/flows/generate-custom-report';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const reportSchema = z.object({
  query: z.string().min(10, {
    message: 'Please describe the report you need in at least 10 characters.',
  }),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
  });

  async function onSubmit(data: ReportFormValues) {
    setLoading(true);
    setReport(null);
    try {
      const result = await generateCustomReport({ reportQuery: data.query });
      setReport(result.report);
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast({
        variant: 'destructive',
        title: 'Report Generation Failed',
        description: 'Could not generate the custom report. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Custom Report Generator</CardTitle>
          <CardDescription>
            Use natural language to ask for the data you need. The AI will generate a report for you.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What report do you need?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'Show me a summary of all pediatric patients from last week' or 'What was our busiest day this month?'"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Generate Report
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Generated Report</CardTitle>
          <CardDescription>Your custom report will appear below.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <ScrollArea className="h-full max-h-[400px] w-full rounded-md border p-4 bg-secondary/50">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Generating your report...</p>
                </div>
              </div>
            ) : report ? (
              <pre className="whitespace-pre-wrap text-sm font-mono">{report}</pre>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Your report will be displayed here.</p>
                </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
