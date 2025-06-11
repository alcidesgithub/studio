// src/app/(app)/admin/event-management/page.tsx
"use client";

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MOCK_EVENT, MOCK_VENDORS } from '@/lib/constants';
import { Edit3, CalendarIcon, Save, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { Metadata } from 'next'; // Will be commented out as this is a client component

// Cannot set metadata in client component directly
// export const metadata: Metadata = {
//   title: 'Event Management - Hiperfarma Business Meeting Manager',
// };

const eventFormSchema = z.object({
  name: z.string().min(5, { message: "Event name must be at least 5 characters." }),
  date: z.date({ required_error: "Event date is required." }),
  time: z.string().min(1, { message: "Event time is required." }),
  location: z.string().min(5, { message: "Location must be at least 5 characters." }),
  address: z.string().min(10, { message: "Address must be at least 10 characters." }),
  mapEmbedUrl: z.string().url({ message: "Please enter a valid URL for the map embed." }),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export default function AdminEventManagementPage() {
  const { toast } = useToast();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: MOCK_EVENT.name,
      date: MOCK_EVENT.date ? parseISO(MOCK_EVENT.date) : new Date(),
      time: MOCK_EVENT.time,
      location: MOCK_EVENT.location,
      address: MOCK_EVENT.address,
      mapEmbedUrl: MOCK_EVENT.mapEmbedUrl,
    },
  });

  const onSubmit = (data: EventFormValues) => {
    // In a real app, you would send this data to your backend to update the event.
    // For this mock, we'll just log it and show a toast.
    console.log("Event data submitted:", {
      ...data,
      date: format(data.date, 'yyyy-MM-dd'), // Format date back to string if needed
    });
    toast({
      title: "Event Settings Saved!",
      description: "The event details have been (mock) updated successfully.",
    });
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Event Management"
        description="Edit the core details of the business meeting event."
        icon={Edit3}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>Update the information that appears on the public landing page.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Hiperfarma Annual Meeting" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Event Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Time</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 09:00 AM - 06:00 PM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Expo Center Norte" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Full Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., R. José Bernardo Pinto, 333 - Vila Guilherme, São Paulo - SP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mapEmbedUrl"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Google Maps Embed URL</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Paste the iframe src URL from Google Maps" {...field} className="min-h-[100px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users /> Participating Vendors</CardTitle>
              <CardDescription>This list is managed via vendor registration (currently mock data).</CardDescription>
            </CardHeader>
            <CardContent>
              {MOCK_VENDORS.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Logo</TableHead>
                      <TableHead>Vendor Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_VENDORS.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell>
                          <Image
                            src={vendor.logoUrl}
                            alt={`${vendor.name} logo`}
                            width={60}
                            height={30}
                            className="object-contain rounded"
                            data-ai-hint={vendor.dataAiHint || "company logo"}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{vendor.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No vendors currently registered.</p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
