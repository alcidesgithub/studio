
"use client";

import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MOCK_USERS, ROLES, ROLES_TRANSLATIONS } from '@/lib/constants';
import type { User, UserRole } from '@/types';
import { UserCog, PlusCircle, Edit, Trash2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';

const userFormSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "Endereço de email inválido." }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres." }),
  role: z.custom<UserRole>(val => ['admin', 'manager'].includes(val as UserRole), {
    message: "Perfil deve ser 'admin' ou 'manager'.",
  }),
});

type UserFormValues = z.infer<typeof userFormSchema>;

const privilegedRoles: UserRole[] = ['admin', 'manager'];

export default function AdminUsersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'manager', 
    },
  });

  const onSubmit = (data: UserFormValues) => {
    console.log("Dados do Novo Usuário:", data);
    toast({
      title: "Usuário Criado!",
      description: `Usuário ${ROLES_TRANSLATIONS[data.role]} ${data.name} foi (simuladamente) criado.`,
    });
    form.reset();
    setIsDialogOpen(false);
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Gerenciamento de Usuários"
        description="Gerencie contas de administrador e gerente."
        icon={UserCog}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { form.reset(); setIsDialogOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Usuário Privilegiado</DialogTitle>
                <DialogDescription>
                  Crie um novo administrador ou gerente. Clique em salvar quando terminar.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome Completo" {...field} />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="usuario@example.com" {...field} />
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
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Perfil</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um perfil" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {privilegedRoles.map(role => (
                              <SelectItem key={role} value={role} className="capitalize">
                                {ROLES_TRANSLATIONS[role]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="pt-4">
                    <DialogClose asChild>
                       <Button type="button" variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                       <Save className="mr-2 h-4 w-4" /> Salvar Usuário
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
          <CardDescription>Lista de todos os usuários no sistema (dados de demonstração).</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Loja (se aplicável)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_USERS.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize">{ROLES_TRANSLATIONS[user.role] || user.role}</Badge></TableCell>
                  <TableCell>{user.storeName || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="hover:text-accent disabled:text-muted-foreground" disabled={user.role === 'admin' && MOCK_USERS.filter(u => u.role === 'admin').length === 1 && user.id === MOCK_USERS.find(u => u.role === 'admin')?.id }>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-destructive disabled:text-muted-foreground" disabled={user.role === 'admin' && MOCK_USERS.filter(u => u.role === 'admin').length === 1 && user.id === MOCK_USERS.find(u => u.role === 'admin')?.id}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Excluir</span>
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
