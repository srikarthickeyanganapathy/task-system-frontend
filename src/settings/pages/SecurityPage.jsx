import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Button } from '@/shared/ui/Button'
import { Heading, Text } from '@/shared/ui/Typography'
import { Input } from '@/shared/ui/Input'
import { Form, FormField, FormItem, FormControl, FormMessage } from '@/shared/forms/Form'
import { SettingsRow } from '@/shared/ui/SettingsRow'
import { Switch } from '@/shared/ui/Switch'
import { useChangePassword } from '@/identity'
import { PageShell, PageHero, PageContent } from '@/shared/ui/PageShell'
import { toast } from 'sonner'
import { InteractiveCard } from '@/shared/ui/InteractiveCard'


export function SecurityPage() {
  const changePassword = useChangePassword()


  const form = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  })

  const newPasswordValue = form.watch('newPassword')

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-gray-400' }
    let scoreStrength = 0
    if (pwd.length >= 8) scoreStrength += 1
    if (/[A-Z]/.test(pwd)) scoreStrength += 1
    if (/[0-9]/.test(pwd)) scoreStrength += 1
    if (/[^A-Za-z0-9]/.test(pwd)) scoreStrength += 1

    if (scoreStrength <= 1) return { score: 25, label: 'Weak', color: 'bg-rose-500' }
    if (scoreStrength === 2) return { score: 50, label: 'Fair', color: 'bg-amber-500' }
    if (scoreStrength === 3) return { score: 75, label: 'Good', color: 'bg-blue-500' }
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' }
  }

  const strength = getPasswordStrength(newPasswordValue)

  const onSubmit = (data) => {
    changePassword.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    }, {
      onSuccess: () => {
        form.reset()
      }
    })
  }

  const fadeUp = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.25, ease: 'easeOut' }
  }

  return (
    <PageShell maxWidth="narrow">
      <PageHero
        eyebrow="Security"
        meta="Authentication & Safety"
        title="Security Settings"
        subtitle="Update password credentials, view password strength, and configure multi-factor authentication."
      />

      <PageContent>
        <div className="space-y-8">
          {/*    PASSWORD FORM */}
          <motion.div {...fadeUp}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-3">
                  <Heading level={4} className="text-sm font-bold text-[var(--text-primary)]">
                    Password & Credentials
                  </Heading>
                  <InteractiveCard padding={false} className="overflow-hidden">
                    <div className="px-6 divide-y divide-[var(--border-subtle)]">
                      
                      <FormField
                        control={form.control}
                        name="currentPassword"
                        rules={{ required: 'Current password is required' }}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <SettingsRow label="Current Password" description="Enter your existing account password">
                              <FormControl>
                                <Input type="password" placeholder="************" className="w-full max-w-[320px] text-xs h-9" {...field} />
                              </FormControl>
                              <FormMessage />
                            </SettingsRow>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="newPassword"
                        rules={{ 
                          required: 'New password is required',
                          minLength: { value: 8, message: 'Password must be at least 8 characters' }
                        }}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <SettingsRow 
                              label="New Password" 
                              description={
                                <div className="space-y-1 mt-1">
                                  <span>Must be at least 8 characters with numbers & symbols</span>
                                  {newPasswordValue && (
                                    <div className="flex items-center gap-2 pt-1">
                                      <div className="h-1.5 w-24 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                                        <motion.div 
                                          className={`h-full ${strength.color}`}
                                          initial={{ width: 0 }}
                                          animate={{ width: `${strength.score}%` }}
                                          transition={{ duration: 0.3, ease: 'easeOut' }}
                                        />
                                      </div>
                                      <span className="text-[10px] font-semibold text-[var(--text-secondary)]">{strength.label}</span>
                                    </div>
                                  )}
                                </div>
                              }
                            >
                              <FormControl>
                                <Input type="password" placeholder="Enter new password" className="w-full max-w-[320px] text-xs h-9" {...field} />
                              </FormControl>
                              <FormMessage />
                            </SettingsRow>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        rules={{ 
                          required: 'Please confirm your new password',
                          validate: value => value === form.getValues('newPassword') || 'Passwords do not match'
                        }}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <SettingsRow label="Confirm Password" description="Re-type your new password to confirm">
                              <FormControl>
                                <Input type="password" placeholder="Confirm new password" className="w-full max-w-[320px] text-xs h-9" {...field} />
                              </FormControl>
                              <FormMessage />
                            </SettingsRow>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="border-t border-[var(--border-subtle)] px-6 py-3.5 flex justify-end bg-[var(--bg-subtle)]">
                      <Button 
                        type="submit" 
                        size="sm"
                        isLoading={changePassword.isPending}
                        className="rounded-xl px-4"
                      >
                        Update Password
                      </Button>
                    </div>
                  </InteractiveCard>
                </div>
              </form>
            </Form>
          </motion.div>

          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }}>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Heading level={4} className="text-sm font-bold text-[var(--text-primary)]">
                  Two-Factor Authentication (2FA)
                </Heading>
                <div className="inline-flex items-center rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2 py-0.5 text-[10px] font-mono text-[var(--text-secondary)]">Coming Soon</div>
              </div>
              <InteractiveCard padding={false} className="overflow-hidden">
                <div className="px-6">
                  <SettingsRow label="Authenticator App (TOTP)" description="This feature is not yet available">
                    <Switch
                      checked={false}
                      onCheckedChange={() => {}}
                      disabled={true}
                    />
                  </SettingsRow>
                </div>
              </InteractiveCard>
            </div>
          </motion.div>
        </div>
      </PageContent>
    </PageShell>
  )
}
