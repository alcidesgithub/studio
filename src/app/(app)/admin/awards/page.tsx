
"use client";

import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MOCK_AWARD_TIERS } from '@/lib/constants';
import type { AwardTier } from '@/types';
import { Trophy, PlusCircle, Edit, Trash2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
// import type { Metadata } from 'next'; // Metadata cannot be used in client components

// export const metadata: Metadata = {
//   title: 'Award Tier Management - Hiperfarma Business Meeting Manager',
// };

const awardTierSchema = z.object({
  name: z.string().min(3, { message: "Tier name must be at least 3 characters." }),
  rewardName: z.string().min(3, { message: "Reward name must be at least 3 characters." }),
  quantityAvailable: z.coerce.number().int().positive({ message: "Quantity must be a positive number." }),
  positivacoesRequired: z.coerce.number().int().positive({ message: "Required positivacoes must be a positive number." }),
});

type AwardTierFormValues = z.infer<typeof awardTierSchema>;

// This would ideally come from a backend or state management
let currentMockTiers: AwardTier[] = [...MOCK_AWARD_TIERS];


export default function AdminAwardsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<AwardTier | null>(null);
  const [tiers, setTiers] = useState<AwardTier[]>(currentMockTiers); // Local state for tiers
  const { toast } = useToast();

  const form = useForm<AwardTierFormValues>({
    resolver: zodResolver(awardTierSchema),
    defaultValues: {
      name: '',
      rewardName: '',
      quantityAvailable: 1,
      positivacoesRequired: 1,
    },
  });

  const handleAddNew = () => {
    setEditingTier(null);
    form.reset({
      name: '',
      rewardName: '',
      quantityAvailable: 1,
      positivacoesRequired: 1,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (tier: AwardTier) => {
    setEditingTier(tier);
    form.reset({
      name: tier.name,
      rewardName: tier.rewardName,
      quantityAvailable: tier.quantityAvailable,
      positivacoesRequired: tier.positivacoesRequired,
    });
    setIsDialogOpen(true);
  };
  
  const handleDelete = (tierId: string) => {
    // Mock deletion
    currentMockTiers = currentMockTiers.filter(t => t.id !== tierId);
    setTiers(currentMockTiers);
    toast({
      title: "Tier Deleted",
      description: "The award tier has been (mock) deleted.",
      variant: "destructive"
    });
  };

  const onSubmit = (data: AwardTierFormValues) => {
    if (editingTier) {
      // Mock update
      currentMockTiers = currentMockTiers.map(t => 
        t.id === editingTier.id ? { ...editingTier, ...data } : t
      );
      setTiers(currentMockTiers);
      toast({
        title: "Tier Updated!",
        description: `Award tier "${data.name}" has been (mock) updated.`,
      });
    } else {
      // Mock creation
      const newTier: AwardTier = { id: `tier_${Date.now()}`, ...data };
      currentMockTiers = [...currentMockTiers, newTier];
      setTiers(currentMockTiers);
      toast({
        title: "Tier Created!",
        description: `Award tier "${data.name}" has been (mock) created.`,
      });
    }
    form.reset();
    setIsDialogOpen(false);
    setEditingTier(null);
  };


  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Award Tier Management"
        description="Define and manage award tiers for store performance."
        icon={Trophy}
        actions={
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Tier
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild /> {/* Trigger is handled by the Add/Edit buttons */}
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingTier ? 'Edit Award Tier' : 'Add New Award Tier'}</DialogTitle>
            <DialogDescription>
              {editingTier ? 'Update the details for this award tier.' : 'Fill in the details for the new award tier.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tier Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Bronze, Silver, Gold" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rewardName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward Name / Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., R$100 Gift Card, Tablet XYZ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantityAvailable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity Available</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="positivacoesRequired"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Positivações Required</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                 <DialogClose asChild>
                   <Button type="button" variant="outline" onClick={() => { setEditingTier(null); form.reset();}}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                   <Save className="mr-2 h-4 w-4" /> {editingTier ? 'Save Changes' : 'Create Tier'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Configured Award Tiers</CardTitle>
          <CardDescription>List of current award tiers and their criteria.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier Name</TableHead>
                <TableHead>Reward Name</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Positivações Req.</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell className="font-medium">{tier.name}</TableCell>
                  <TableCell>{tier.rewardName}</TableCell>
                  <TableCell className="text-right">{tier.quantityAvailable}</TableCell>
                  <TableCell className="text-right">{tier.positivacoesRequired}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="hover:text-accent" onClick={() => handleEdit(tier)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDelete(tier.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {tiers.length === 0 && (
            <p className="py-4 text-center text-muted-foreground">No award tiers configured yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

