
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

const ASSIGNABLE_ROLES: UserRole[] = ['admin', 'manager', 'equipe'];

const userFormSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "Endereço de email inválido." }),
  role: z.custom<UserRole>(val => ASSIGNABLE_ROLES.includes(val as UserRole), {
    message: "Perfil deve ser 'admin', 'manager' ou 'equipe'.",
  }),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).superRefine((data, ctx) => {
  // Validate password and confirmPassword only if password field is filled
  if (data.password && data.password.length > 0) {
    if (data.password.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nova senha deve ter pelo menos 6 caracteres.",
        path: ["password"],
      });
    }
    if (!data.confirmPassword || data.confirmPassword.length === 0) {
       ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Confirmação de senha é obrigatória se nova senha for preenchida.",
        path: ["confirmPassword"],
      });
    } else if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "As senhas não coincidem.",
        path: ["confirmPassword"],
      });
    }
  }
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
        <DialogTitle>{editingUser ? 'Editar Usuário Interno' : 'Adicionar Novo Usuário Interno'}</DialogTitle>
        <DialogDescription>
          {editingUser ? 'Atualize os detalhes do usuário. Deixe os campos de senha em branco para não alterá-la.' : 'Preencha os detalhes para o novo Administrador, Gerente ou membro da Equipe.'}
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
                  <Input type="email" placeholder="usuario@example.com" {...field} disabled={!!editingUser} />
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
          <>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova Senha {editingUser && <span className="text-xs text-muted-foreground">(Deixe em branco para não alterar)</span>}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={editingUser ? "Nova senha (opcional)" : "Mínimo 6 caracteres"} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Nova Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Repita a nova senha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
          <DialogFooter className="pt-3 sm:pt-4">
            <DialogClose asChild>
               <Button type="button" variant="outline" onClick={() => form.reset() }>Cancelar</Button>
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
  loading: () => (
    <>
      <DialogHeader>
        <DialogTitle>Carregando...</DialogTitle>
      </DialogHeader>
      <div className="p-8 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-2">Carregando formulário...</p>
      </div>
      <DialogFooter>
        <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
      </DialogFooter>
    </>
  ),
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
      role: 'equipe',
      password: '',
      confirmPassword: '',
    },
  });

  const handleAddNew = () => {
    setEditingUser(null);
    form.reset({
      name: '',
      email: '',
      role: 'equipe', 
      password: '',
      confirmPassword: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    if (!ASSIGNABLE_ROLES.includes(user.role)) {
        toast({ title: "Ação não permitida", description: `Usuários de ${ROLES_TRANSLATIONS[user.role]} são gerenciados em suas respectivas telas.`, variant: "default"});
        return;
    }
    setEditingUser(user);
    form.reset({ 
        name: user.name,
        email: user.email,
        role: user.role,
        password: '', 
        confirmPassword: '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);

    if (!userToDelete || !ASSIGNABLE_ROLES.includes(userToDelete.role)) {
        toast({ title: "Ação não permitida", description: "Este tipo de usuário não pode ser excluído aqui.", variant: "default"});
        return;
    }

    const adminUsers = users.filter(u => u.role === 'admin');
    if (userToDelete.role === 'admin' && adminUsers.length === 1 && adminUsers[0].id === userToDelete.id) {
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
    let passwordChangedMessage = "";

    if (editingUser) {
        if (!ASSIGNABLE_ROLES.includes(editingUser.role)) {
             toast({ title: "Erro", description: "Não é possível modificar este tipo de usuário aqui.", variant: "destructive" });
            return;
        }

        updatedUsers = users.map(u => {
          if (u.id === editingUser.id) {
            const updatedUserEntry: User = {
              ...editingUser,
              name: data.name,
              role: data.role, 
              storeName: undefined, 
            };
            if (data.password && data.password.length > 0) {
              // Schema validation handles length and match if password is provided
              updatedUserEntry.password = data.password;
              passwordChangedMessage = " A senha também foi atualizada.";
            }
            return updatedUserEntry;
          }
          return u;
        });
        toast({
            title: "Usuário Atualizado!",
            description: `Usuário ${data.name} foi atualizado.${passwordChangedMessage}`,
            variant: "success",
        });

    } else { 
        if (!data.password || data.password.length === 0) {
            form.setError("password", { type: "manual", message: "Senha é obrigatória para novo usuário." });
            toast({ title: "Erro de Validação", description: "Senha é obrigatória para novo usuário.", variant: "destructive" });
            return;
        }
        // Additional check for password length for new user, though Zod should catch it
        if (data.password.length < 6) {
           form.setError("password", { type: "manual", message: "Senha deve ter pelo menos 6 caracteres." });
           toast({ title: "Erro de Validação", description: "Senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
           return;
        }
        if (data.password !== data.confirmPassword) {
            form.setError("confirmPassword", { type: "manual", message: "As senhas não coincidem." });
            toast({ title: "Erro de Validação", description: "As senhas não coincidem.", variant: "destructive" });
            return;
        }
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
          password: data.password, 
          storeName: undefined,
        };
        updatedUsers = [...users, newUser];
        toast({
          title: "Usuário Criado!",
          description: `Usuário ${ROLES_TRANSLATIONS[data.role]} ${data.name} foi criado.`,
          variant: "success",
        });
    }

    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    form.reset();
    setIsDialogOpen(false);
    setEditingUser(null);
  };

  const displayUsers = users.filter(user => ASSIGNABLE_ROLES.includes(user.role));

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'secondary';
      case 'equipe':
        return 'default';
      default:
        return 'outline';
    }
  };


  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Usuários Internos"
        description="Gerencie contas de Administradores, Gerentes e Equipe do sistema."
        icon={UserCog}
        iconClassName="text-secondary"
        actions={
          <Button onClick={handleAddNew} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Usuário
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
          <CardTitle>Usuários Internos Cadastrados</CardTitle>
          <CardDescription>Lista de administradores, gerentes e equipe no sistema.</CardDescription>
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
                    <TableCell className="px-1.5 py-3 sm:px-2 md:px-3 lg:px-4"><Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">{ROLES_TRANSLATIONS[user.role] || user.role}</Badge></TableCell>
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
            <p className="py-4 text-center text-muted-foreground">Nenhum usuário interno cadastrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
