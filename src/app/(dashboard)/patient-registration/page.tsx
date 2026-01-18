'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, getDocs, writeBatch, doc, Timestamp } from 'firebase/firestore';


const PatientSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    phone: z.string().min(10, 'Please enter a valid phone number'),
    service: z.string({ required_error: "Please select a service."}).min(1, 'Please select a service'),
});

type PatientFormValues = z.infer<typeof PatientSchema>;

export default function PatientRegistrationPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(PatientSchema),
    defaultValues: {
        name: '',
        phone: '',
        service: '',
    },
  });

  const onSubmit = async (data: PatientFormValues) => {
    if (!firestore) return;
    setIsSubmitting(true);

    const { name, phone, service } = data;

    try {
      const batch = writeBatch(firestore);

      // 1. Get the latest queue number
      const q = query(collection(firestore, 'queue'), orderBy('queueNumber', 'desc'), limit(1));
      const querySnapshot = await getDocs(q);
      let newQueueNumber = 1;
      if (!querySnapshot.empty) {
        newQueueNumber = querySnapshot.docs[0].data().queueNumber + 1;
      }

      // 2. Create new patient document
      const patientRef = doc(collection(firestore, 'patients'));
      const createdAt = Timestamp.now();
      batch.set(patientRef, {
        name,
        phone,
        service,
        createdAt,
      });

      // 3. Create new queue document
      const queueRef = doc(collection(firestore, 'queue'));
      batch.set(queueRef, {
        queueNumber: newQueueNumber,
        patientId: patientRef.id,
        patientName: name,
        service,
        status: 'Waiting',
        createdAt,
      });
      
      await batch.commit();
      
      toast({
        title: 'Success',
        description: `Successfully registered ${name} with queue number ${newQueueNumber}.`,
      });
      form.reset();

    } catch (error) {
      console.error('Error registering patient:', error);
      toast({
        title: 'Error',
        description: 'Failed to register patient.',
        variant: 'destructive',
      });
    } finally {
        setIsSubmitting(false);
    }
  }


  const serviceTypes = ['General Consultation', 'Follow-up', 'Dental', 'Pediatrics', 'Specialist Visit'];

  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>New Patient Registration</CardTitle>
          <CardDescription>Fill in the details below to add a new patient to the queue.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="name">Full Name</Label>
                    <FormControl>
                      <Input id="name" placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="phone">Phone Number</Label>
                    <FormControl>
                      <Input id="phone" placeholder="+1 234 567 890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="service"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="service">Service Type</Label>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger id="service">
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {serviceTypes.map((service) => (
                          <SelectItem key={service} value={service}>
                            {service}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                  <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                  </>
              ) : (
                  'Register Patient'
              )}
            </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
