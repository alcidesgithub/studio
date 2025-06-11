
"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROLES, ROLES_TRANSLATIONS } from '@/lib/constants'; // ROLES, ROLES_TRANSLATIONS can remain from constants
import { loadUsers, saveUsers, loadStores } from '@/lib/localStorageUtils';
import type { User, UserRole, Store } from '@/types';
import { UserCog, PlusCircle, Edit, Trash2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';

const userFormSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "Endereço de email inválido." }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres." }),
  role: z.custom<UserRole>(val => ROLES.includes(val as UserRole), {
    message: "Perfil deve ser um dos valores permitidos.",
  }),
  storeId: z.string().optional(), // For store users, their store's ID
});

type UserFormValues = z.infer<typeof userFormSchema>;

const privilegedRoles: UserRole[] = ['admin', 'manager']; // For creating new privileged users
const allUserCreatableRoles: UserRole[] = ['admin', 'manager', 'vendor', 'store'];


export default function AdminUsersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null); // For future edit functionality
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setUsers(loadUsers());
    setStores(loadStores());
  }, []);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'manager', 
      storeId: undefined,
    },
  });

  const selectedRole = form.watch('role');

  const handleAddNew = () => {
    setEditingUser(null);
    form.reset({
      name: '',
      email: '',
      password: '',
      role: 'manager',
      storeId: undefined,
    });
    setIsDialogOpen(true);
  };

  // Basic edit handler - can be expanded
  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.reset({
        name: user.name,
        email: user.email,
        password: '', // Typically don't repopulate password
        role: user.role,
        storeId: users.find(u => u.id === user.id && u.role === 'store')?.storeName // This logic might need refinement if storeId is directly on User
    });
    setIsDialogOpen(true);
  };
  
  const handleDelete = (userId: string) => {
    // Prevent deleting the last admin
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.role === 'admin' && users.filter(u => u.role === 'admin').length === 1) {
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
    const userStore = data.role === 'store' && data.storeId ? stores.find(s => s.id === data.storeId) : null;

    if (editingUser) {
        updatedUsers = users.map(u => u.id === editingUser.id ? {
            ...editingUser,
            name: data.name,
            email: data.email,
            role: data.role,
            // Password update logic would be more complex (e.g., only if field is filled)
            storeName: data.role === 'store' && userStore ? userStore.name : undefined,
        } : u);
        toast({
            title: "Usuário Atualizado!",
            description: `Usuário ${data.name} foi atualizado.`,
        });

    } else {
        const newUser: User = {
          id: `user_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
          name: data.name,
          email: data.email,
          role: data.role,
          // storeName is primarily for display; actual linkage might be via storeId if User type changes
          storeName: data.role === 'store' && userStore ? userStore.name : undefined,
          // Password would be hashed and stored securely in a real app
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

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Gerenciamento de Usuários"
        description="Gerencie contas de usuários do sistema."
        icon={UserCog}
        actions={
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Usuário
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {/* <DialogTrigger asChild /> */}
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Atualize os detalhes do usuário.' : 'Preencha os detalhes para o novo usuário.'}
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
                    <FormLabel>Senha {editingUser ? '(Deixe em branco para não alterar)' : ''}</FormLabel>
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
                        {allUserCreatableRoles.map(role => (
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
              {selectedRole === 'store' && (
                <FormField
                  control={form.control}
                  name="storeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vincular à Loja</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma loja" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stores.map(store => (
                            <SelectItem key={store.id} value={store.id}>
                              {store.code} - {store.name}
                            </SelectItem>
                          ))}
                          {stores.length === 0 && <SelectItem value="no-stores" disabled>Nenhuma loja cadastrada</SelectItem>}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <DialogFooter className="pt-4">
                <DialogClose asChild>
                   <Button type="button" variant="outline" onClick={() => { setEditingUser(null); form.reset(); setIsDialogOpen(false); }}>Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                   <Save className="mr-2 h-4 w-4" /> {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
          <CardDescription>Lista de todos os usuários no sistema (do armazenamento local).</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Loja / Fornecedor (se aplicável)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize">{ROLES_TRANSLATIONS[user.role] || user.role}</Badge></TableCell>
                  <TableCell>{user.storeName || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="hover:text-accent" onClick={() => handleEdit(user)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-destructive disabled:text-muted-foreground" 
                            disabled={user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1 && user.id === users.find(u => u.role === 'admin')?.id }
                            onClick={() => handleDelete(user.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {users.length === 0 && (
            <p className="py-4 text-center text-muted-foreground">Nenhum usuário cadastrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
