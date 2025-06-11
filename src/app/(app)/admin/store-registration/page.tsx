
"use client";

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardPlus, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const storeRegistrationSchema = z.object({
  code: z.string().min(1, "Store code is required."),
  cnpj: z.string().min(14, "CNPJ must be 14 digits.").max(14, "CNPJ must be 14 digits."), // Simplified, consider a specific CNPJ validator
  address: z.string().min(5, "Address is required."),
  city: z.string().min(2, "City is required."),
  neighborhood: z.string().min(2, "Neighborhood is required."),
  state: z.enum(["PR", "SC"], { required_error: "State is required." }),
  phone: z.string().min(10, "Phone number is required."),
  ownerName: z.string().min(3, "Owner name is required."),
  responsibleName: z.string().min(3, "Responsible person's name is required."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type StoreRegistrationFormValues = z.infer<typeof storeRegistrationSchema>;

const STATES = [
  { value: "PR", label: "Paraná (PR)" },
  { value: "SC", label: "Santa Catarina (SC)" },
];

export default function StoreRegistrationPage() {
  const { toast } = useToast();
  const form = useForm<StoreRegistrationFormValues>({
    resolver: zodResolver(storeRegistrationSchema),
    defaultValues: {
      code: '',
      cnpj: '',
      address: '',
      city: '',
      neighborhood: '',
      phone: '',
      ownerName: '',
      responsibleName: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: StoreRegistrationFormValues) => {
    // Mock submission
    console.log("Store Registration Data:", data);
    toast({
      title: "Store Registered!",
      description: `Store ${data.code} - ${data.ownerName} has been (mock) registered.`,
    });
    form.reset(); // Reset form after successful mock submission
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Register New Store"
        description="Fill in the details to add a new participating store."
        icon={ClipboardPlus}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>Provide the main details for the store.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ST001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0000-00" {...field} />
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
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Rua Principal, 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Curitiba" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Neighborhood</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Centro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Contact & Login Information</CardTitle>
              <CardDescription>Details for the store owner/responsible and login credentials.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner's Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., João da Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="responsibleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsible Person's Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Maria Oliveira" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Login Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="store.login@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Login Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
              <Save className="mr-2 h-4 w-4" /> Register Store
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

