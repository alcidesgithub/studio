
"use client";

import { useState, useEffect } from 'react';
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
import { UserCog, PlusCircle, Edit, Trash2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';

// Perfis que podem ser atribuídos/criados nesta página
const ASSIGNABLE_ROLES: UserRole[] = ['admin', 'manager'];

const userFormSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "Endereço de email inválido." }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres." }).optional(), // Opcional para edição
  role: z.custom<UserRole>(val => ROLES.includes(val as UserRole), { 
    message: "Perfil deve ser um dos valores permitidos.",
  }),
});

type UserFormValues = z.infer<typeof userFormSchema>;

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
      password: '',
      role: 'manager', 
    },
  });

  const handleAddNew = () => {
    setEditingUser(null);
    form.reset({
      name: '',
      email: '',
      password: '',
      role: 'manager', // Default para novo usuário (admin ou manager)
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.reset({
        name: user.name,
        email: user.email,
        password: '', 
        role: user.role,
    });
    setIsDialogOpen(true);
  };
  
  const handleDelete = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.role === 'admin' && users.filter(u => u.role === 'admin').length === 1) {
      toast({ title: "Ação não permitida", description: "Não é possível excluir o último administrador.", variant: "destructive"});
      return;
    }
    
    // Deleção de usuários 'store' e 'vendor' já é bloqueada no botão da tabela.
    // Esta verificação é uma segurança adicional.
    if (userToDelete?.role === 'store' || userToDelete?.role === 'vendor') {
        toast({ title: "Ação não permitida", description: `Usuários de ${ROLES_TRANSLATIONS[userToDelete.role]} devem ser gerenciados em suas respectivas telas de cadastro.`, variant: "default"});
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
        // Se editando usuário 'store' ou 'vendor', o 'role' não deve ser alterado aqui.
        // O campo 'role' no formulário estará desabilitado para eles.
        const finalRole = (editingUser.role === 'store' || editingUser.role === 'vendor') ? editingUser.role : data.role;
        const finalStoreName = (finalRole === 'store' || finalRole === 'vendor') ? editingUser.storeName : undefined;

        updatedUsers = users.map(u => u.id === editingUser.id ? {
            ...editingUser, 
            name: data.name,
            email: data.email,
            role: finalRole, 
            storeName: finalStoreName,
        } : u);
        toast({
            title: "Usuário Atualizado!",
            description: `Usuário ${data.name} foi atualizado.`,
        });

    } else { // Criando novo usuário (só pode ser admin ou manager)
        if (users.some(u => u.email === data.email)) {
            form.setError("email", { type: "manual", message: "Este email já está em uso." });
            toast({ title: "Erro", description: "Email já cadastrado.", variant: "destructive" });
            return;
        }
        if (!data.password) { 
             form.setError("password", { type: "manual", message: "Senha é obrigatória para novos usuários." });
             return;
        }
        const newUser: User = {
          id: `user_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
          name: data.name,
          email: data.email,
          role: data.role, // Aqui, data.role será 'admin' ou 'manager'
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

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Gerenciamento de Usuários"
        description="Gerencie contas de Administradores e Gerentes do sistema."
        icon={UserCog}
        actions={
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Administrador/Gerente
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Atualize os detalhes do usuário.' : 'Preencha os detalhes para o novo Administrador ou Gerente.'}
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
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value} 
                      disabled={!!(editingUser && (editingUser.role === 'store' || editingUser.role === 'vendor'))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um perfil" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        { (editingUser && (editingUser.role === 'store' || editingUser.role === 'vendor')) ? (
                            <SelectItem value={editingUser.role} className="capitalize">
                              {ROLES_TRANSLATIONS[editingUser.role]}
                            </SelectItem>
                          ) : (
                            ASSIGNABLE_ROLES.map(role => (
                              <SelectItem key={role} value={role} className="capitalize">
                                {ROLES_TRANSLATIONS[role]}
                              </SelectItem>
                            ))
                          )
                        }
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {editingUser && editingUser.role === 'store' && (
                        <p className="text-xs text-muted-foreground pt-1">O perfil 'Loja' é gerenciado no Cadastro de Lojas.</p>
                    )}
                    {editingUser && editingUser.role === 'vendor' && (
                        <p className="text-xs text-muted-foreground pt-1">O perfil 'Fornecedor' é gerenciado no Gerenciamento de Fornecedores.</p>
                    )}
                  </FormItem>
                )}
              />
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
                <TableHead>Loja / Fornecedor Associado</TableHead>
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
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="hover:text-destructive disabled:text-muted-foreground disabled:cursor-not-allowed" 
                      disabled={(user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1 && user.id === users.find(u => u.role === 'admin')?.id) || user.role === 'store' || user.role === 'vendor'}
                      title={
                        user.role === 'store' ? "Exclua usuários de Loja na tela de Cadastro de Lojas" :
                        user.role === 'vendor' ? "Exclua usuários de Fornecedor na tela de Gerenciamento de Fornecedores" :
                        (user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1 ? "Não é possível excluir o último administrador" : "Excluir")
                      }
                      onClick={() => {
                          if (user.role === 'store') {
                              toast({title: "Ação não permitida", description: "Usuários de Loja devem ser removidos através do Cadastro de Lojas.", variant: "default" });
                          } else if (user.role === 'vendor') {
                              toast({title: "Ação não permitida", description: "Usuários de Fornecedor devem ser removidos através do Gerenciamento de Fornecedores.", variant: "default" });
                          } else {
                              handleDelete(user.id);
                          }
                      }}>
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
