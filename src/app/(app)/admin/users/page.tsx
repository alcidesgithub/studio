
"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROLES, ROLES_TRANSLATIONS } from '@/lib/constants';
import { loadUsers, saveUsers } from '@/lib/localStorageUtils';
import type { User, UserRole } from '@/types';
import { UserCog, PlusCircle, Edit, Trash2, Save, Loader2 } from 'lucide-react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';

const ASSIGNABLE_ROLES: UserRole[] = ['admin', 'manager'];

const userFormSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "Endereço de email inválido." }),
  role: z.custom<UserRole>(val => ASSIGNABLE_ROLES.includes(val as UserRole), {
    message: "Perfil deve ser 'admin' ou 'manager'.",
  }),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormDialogContentProps {
  form: UseFormReturn<UserFormValues>;
  onSubmit: (data: UserFormValues) => void;
  editingUser: User | null;
  isSubmitting: boolean;
}

const UserFormDialogContentInternal = ({ form, onSubmit, editingUser, isSubmitting }: UserFormDialogContentProps) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{editingUser ? 'Editar Administrador/Gerente' : 'Adicionar Novo Administrador/Gerente'}</DialogTitle>
        <DialogDescription>
          {editingUser ? 'Atualize os detalhes do usuário.' : 'Preencha os detalhes para o novo Administrador ou Gerente.'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 py-4">
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
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Perfil</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={false}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map(role => (
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
          <DialogFooter className="pt-3 sm:pt-4">
            <DialogClose asChild>
               <Button type="button" variant="outline" onClick={() => form.reset() /* Reset handled by parent onOpenChange now */}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
               {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
               {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};

const DynamicUserFormDialogContent = dynamic(() => Promise.resolve(UserFormDialogContentInternal), {
  ssr: false,
  loading: () => <div className="p-8 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /> <p className="mt-2">Carregando formulário...</p></div>,
});


export default function AdminUsersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setUsers(loadUsers());
  }, []);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'manager',
    },
  });

  const handleAddNew = () => {
    setEditingUser(null);
    form.reset({
      name: '',
      email: '',
      role: 'manager', 
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    if (user.role !== 'admin' && user.role !== 'manager') {
        toast({ title: "Ação não permitida", description: `Usuários de ${ROLES_TRANSLATIONS[user.role]} são gerenciados em suas respectivas telas.`, variant: "default"});
        return;
    }
    setEditingUser(user);
    form.reset({
        name: user.name,
        email: user.email,
        role: user.role,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);

    if (!userToDelete || (userToDelete.role !== 'admin' && userToDelete.role !== 'manager')) {
        toast({ title: "Ação não permitida", description: "Este tipo de usuário não pode ser excluído aqui.", variant: "default"});
        return;
    }

    if (userToDelete.role === 'admin' && users.filter(u => u.role === 'admin').length === 1) {
      toast({ title: "Ação não permitida", description: "Não é possível excluir o último administrador.", variant: "destructive"});
      return;
    }

    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    toast({
      title: "Usuário Excluído",
      description: "O usuário foi excluído do armazenamento local.",
      variant: "destructive"
    });
  };

  const onSubmit = (data: UserFormValues) => {
    let updatedUsers;

    if (editingUser) {
        if (editingUser.role !== 'admin' && editingUser.role !== 'manager') {
             toast({ title: "Erro", description: "Não é possível modificar este tipo de usuário aqui.", variant: "destructive" });
            return;
        }

        updatedUsers = users.map(u => {
          if (u.id === editingUser.id) {
            const updatedUserEntry: User = {
              ...editingUser,
              name: data.name,
              email: data.email,
              role: data.role, 
              storeName: undefined, 
            };
            return updatedUserEntry;
          }
          return u;
        });
        toast({
            title: "Usuário Atualizado!",
            description: `Usuário ${data.name} foi atualizado.`,
        });

    } else { 
        if (users.some(u => u.email === data.email)) {
            form.setError("email", { type: "manual", message: "Este email já está em uso." });
            toast({ title: "Erro", description: "Email já cadastrado.", variant: "destructive" });
            return;
        }
        const newUser: User = {
          id: `user_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
          name: data.name,
          email: data.email,
          role: data.role, 
          storeName: undefined,
        };
        updatedUsers = [...users, newUser];
        toast({
          title: "Usuário Criado!",
          description: `Usuário ${ROLES_TRANSLATIONS[data.role]} ${data.name} foi criado.`,
        });
    }

    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    form.reset();
    setIsDialogOpen(false);
    setEditingUser(null);
  };

  const displayUsers = users.filter(user => user.role === 'admin' || user.role === 'manager');

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Admins e Gerentes"
        description="Gerencie contas de Administradores e Gerentes do sistema."
        icon={UserCog}
        iconClassName="text-secondary"
        actions={
          <Button onClick={handleAddNew} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Admin/Gerente
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={(openState) => {
        if (!openState) {
          setEditingUser(null);
          form.reset();
        }
        setIsDialogOpen(openState);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          {isDialogOpen && (
            <DynamicUserFormDialogContent
              form={form}
              onSubmit={onSubmit}
              editingUser={editingUser}
              isSubmitting={form.formState.isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader className="px-4 py-5 sm:p-6">
          <CardTitle>Administradores e Gerentes Cadastrados</CardTitle>
          <CardDescription>Lista de administradores e gerentes no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="px-2 py-4 sm:px-4 md:px-6 sm:py-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Nome</TableHead>
                  <TableHead className="hidden sm:table-cell px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Email</TableHead>
                  <TableHead className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Perfil</TableHead>
                  <TableHead className="text-right px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">{user.name}</TableCell>
                    <TableCell className="hidden sm:table-cell px-1.5 py-3 sm:px-2 md:px-3 lg:px-4 break-words">{user.email}</TableCell>
                    <TableCell className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4"><Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize">{ROLES_TRANSLATIONS[user.role] || user.role}</Badge></TableCell>
                    <TableCell className="text-right px-1.5 py-3 sm:px-2 md:px-3 lg:px-4">
                      <Button variant="ghost" size="icon" className="hover:text-destructive h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleEdit(user)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-destructive h-7 w-7 sm:h-8 sm:w-8"
                        disabled={(user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1 && user.id === users.find(u => u.role === 'admin')?.id)}
                        title={
                          (user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1 ? "Não é possível excluir o último administrador" : "Excluir")
                        }
                        onClick={() => handleDelete(user.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
           {displayUsers.length === 0 && (
            <p className="py-4 text-center text-muted-foreground">Nenhum administrador ou gerente cadastrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

