
"use client";

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, Save, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { MOCK_VENDORS, STATES } from '@/lib/constants'; // Assuming STATES is moved to constants
import type { Vendor } from '@/types';

// Schema for Vendor Registration
const vendorSchema = z.object({
  name: z.string().min(3, "Company name must be at least 3 characters."),
  cnpj: z.string().length(14, "CNPJ must be 14 digits."),
  address: z.string().min(5, "Address is required."),
  city: z.string().min(2, "City is required."),
  neighborhood: z.string().min(2, "Neighborhood is required."),
  state: z.string().min(2, "State is required."),
  logoUrl: z.string().url("Must be a valid URL for the logo."),
});
type VendorFormValues = z.infer<typeof vendorSchema>;

// Schema for Salesperson Registration
const salespersonSchema = z.object({
  name: z.string().min(3, "Salesperson name is required."),
  phone: z.string().min(10, "Phone number is required."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  vendorId: z.string({ required_error: "Must link to a vendor." }),
});
type SalespersonFormValues = z.infer<typeof salespersonSchema>;

export default function VendorManagementPage() {
  const { toast } = useToast();

  const vendorForm = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: '',
      cnpj: '',
      address: '',
      city: '',
      neighborhood: '',
      state: '',
      logoUrl: '',
    },
  });

  const salespersonForm = useForm<SalespersonFormValues>({
    resolver: zodResolver(salespersonSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      password: '',
      vendorId: undefined,
    },
  });

  const onVendorSubmit = (data: VendorFormValues) => {
    console.log("New Vendor Data:", data);
    // In a real app, you'd send this to your backend
    // MOCK_VENDORS.push({ id: `vendor_${Date.now()}`, ...data, dataAiHint: "company logo" });
    toast({
      title: "Vendor Registered!",
      description: `${data.name} has been (mock) registered.`,
    });
    vendorForm.reset();
  };

  const onSalespersonSubmit = (data: SalespersonFormValues) => {
    console.log("New Salesperson Data:", data);
    const linkedVendor = MOCK_VENDORS.find(v => v.id === data.vendorId);
    // MOCK_SALESPEOPLE.push({ id: `sp_${Date.now()}`, ...data });
    toast({
      title: "Salesperson Registered!",
      description: `${data.name} has been (mock) registered for ${linkedVendor?.name || 'selected vendor'}.`,
    });
    salespersonForm.reset();
  };

  return (
    <div className="animate-fadeIn space-y-8">
      <PageHeader
        title="Vendor & Salesperson Management"
        description="Register new vendors and their salespeople."
        icon={Briefcase}
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Register New Vendor</CardTitle>
          <CardDescription>Fill in the details for the new vendor company.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...vendorForm}>
            <form onSubmit={vendorForm.handleSubmit(onVendorSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={vendorForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl><Input placeholder="e.g., Pharma Solutions Inc." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={vendorForm.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ (14 digits, no punctuation)</FormLabel>
                      <FormControl><Input placeholder="00000000000000" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={vendorForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Address</FormLabel>
                      <FormControl><Input placeholder="e.g., Rua das Indústrias, 789" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={vendorForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl><Input placeholder="e.g., São Paulo" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={vendorForm.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Neighborhood</FormLabel>
                      <FormControl><Input placeholder="e.g., Pinheiros" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={vendorForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {STATES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={vendorForm.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl><Input type="url" placeholder="https://example.com/logo.png" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={vendorForm.formState.isSubmitting}>
                  <Save className="mr-2 h-4 w-4" /> Register Vendor
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Register New Salesperson</CardTitle>
          <CardDescription>Add a salesperson and link them to an existing vendor.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...salespersonForm}>
            <form onSubmit={salespersonForm.handleSubmit(onSalespersonSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={salespersonForm.control}
                  name="vendorId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Link to Vendor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a vendor" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {MOCK_VENDORS.map((vendor: Vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={salespersonForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salesperson's Name</FormLabel>
                      <FormControl><Input placeholder="e.g., Ana Beatriz" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={salespersonForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl><Input placeholder="(XX) XXXXX-XXXX" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={salespersonForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Login Email</FormLabel>
                      <FormControl><Input type="email" placeholder="sales.login@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={salespersonForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Login Password</FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={salespersonForm.formState.isSubmitting}>
                  <UserPlus className="mr-2 h-4 w-4" /> Register Salesperson
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
