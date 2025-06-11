import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MOCK_AWARD_TIERS } from '@/lib/constants';
import { Trophy, PlusCircle, Edit, Trash2 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Award Tier Management - Hiperfarma Business Meeting Manager',
};

export default function AdminAwardsPage() {
  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Award Tier Management"
        description="Define and manage award tiers for store performance."
        icon={Trophy}
        actions={
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Tier
          </Button>
        }
      />
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
                <TableHead>Qualification Criteria</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_AWARD_TIERS.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell className="font-medium">{tier.name}</TableCell>
                  <TableCell>{tier.qualificationCriteria}</TableCell>
                  <TableCell>{tier.reward}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="hover:text-accent">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
