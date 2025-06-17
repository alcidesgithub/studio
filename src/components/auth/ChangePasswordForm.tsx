
"use client";

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Save } from 'lucide-react'; // KeyRound removed

// For Supabase, we only need the new password and confirmation. Old password is not sent.
const changePasswordSchema = z.object({
  newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres."),
  confirmPassword: z.string().min(6, "Confirmação de senha deve ter pelo menos 6 caracteres."),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const { changePassword, user } = useAuth(); // Get user to ensure one is logged in
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit: SubmitHandler<ChangePasswordFormValues> = async (data) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para alterar a senha.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    // The oldPassword is not needed for Supabase's updateUser method for password change
    const result = await changePassword(data.newPassword);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "Sucesso!",
        description: result.message,
        variant: "success",
      });
      form.reset();
      if (onSuccess) onSuccess();
    } else {
      toast({
        title: "Erro ao Alterar Senha",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
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
        <Button
          type="submit"
          className="w-full font-semibold"
          disabled={isLoading || !user} // Disable if no user is logged in
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Alterar Senha
        </Button>
      </form>
    </Form>
  );
}
