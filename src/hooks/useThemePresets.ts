// ABOUTME: React Query hooks for managing theme presets (MERGE, AI Garage, custom themes)
// ABOUTME: Provides enterprise-grade multi-theme support with light/dark mode per theme

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface ThemePreset {
  id: string
  name: string
  display_name: string
  description: string | null
  is_active: boolean
  is_system: boolean
  theme_data: Record<string, string>
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

// Fetch all theme presets
export const useThemePresets = () => {
  return useQuery({
    queryKey: ['theme-presets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('theme_presets')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as ThemePreset[]
    },
  })
}

// Fetch active theme preset
export const useActiveThemePreset = () => {
  return useQuery({
    queryKey: ['theme-presets', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('theme_presets')
        .select('*')
        .eq('is_active', true)
        .maybeSingle()

      if (error) {
        console.error('[Theme] Error fetching active preset:', error)
        throw error
      }

      // If no active theme, return null (app will use CSS defaults)
      return data as ThemePreset | null
    },
  })
}

// Fetch specific theme preset by name
export const useThemePreset = (name: string) => {
  return useQuery({
    queryKey: ['theme-presets', name],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('theme_presets')
        .select('*')
        .eq('name', name)
        .single()

      if (error) throw error
      return data as ThemePreset
    },
    enabled: !!name,
  })
}

// Set active theme (switch themes)
export const useSetActiveTheme = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (themeId: string) => {
      // First, deactivate all themes
      const { error: deactivateError } = await supabase
        .from('theme_presets')
        .update({ is_active: false })
        .neq('id', themeId)

      if (deactivateError) throw deactivateError

      // Then activate the selected theme
      const { data, error } = await supabase
        .from('theme_presets')
        .update({ is_active: true })
        .eq('id', themeId)
        .select()
        .single()

      if (error) throw error
      return data as ThemePreset
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['theme-presets'] })
      toast.success(`Switched to ${data.display_name} theme`)
    },
    onError: (error) => {
      console.error('Failed to set active theme:', error)
      toast.error('Failed to switch theme')
    },
  })
}

// Update theme preset data (modify colors and/or display name)
export const useUpdateThemePreset = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, theme_data, display_name }: { id: string; theme_data?: Record<string, string>; display_name?: string }) => {
      const updateData: { theme_data?: Record<string, string>; display_name?: string } = {}
      if (theme_data !== undefined) updateData.theme_data = theme_data
      if (display_name !== undefined) updateData.display_name = display_name

      const { data, error } = await supabase
        .from('theme_presets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as ThemePreset
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['theme-presets'] })
      toast.success(`Updated ${data.display_name} theme`)
    },
    onError: (error) => {
      console.error('Failed to update theme preset:', error)
      toast.error('Failed to update theme')
    },
  })
}

// Create new custom theme preset
export const useCreateThemePreset = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (preset: Omit<ThemePreset, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>) => {
      console.log('useCreateThemePreset: mutationFn called with:', preset.name)

      console.log('useCreateThemePreset: About to call supabase.insert...')
      const { data, error } = await supabase
        .from('theme_presets')
        .insert([preset])
        .select()
        .single()

      console.log('useCreateThemePreset: Supabase response:', { data, error })

      if (error) throw error
      return data as ThemePreset
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['theme-presets'] })
      toast.success(`Created ${data.display_name} theme`)
    },
    onError: (error: { code?: string; message?: string }) => {
      console.error('Failed to create theme preset:', error)
      if (error.code === '23505') {
        toast.error('A theme with this name already exists. Please choose a different name.')
      } else {
        toast.error('Failed to create theme')
      }
    },
  })
}

// Delete theme preset (cannot delete system themes)
export const useDeleteThemePreset = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('theme_presets')
        .delete()
        .eq('id', id)
        .eq('is_system', false) // Safety: can only delete non-system themes

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme-presets'] })
      toast.success('Theme deleted')
    },
    onError: (error) => {
      console.error('Failed to delete theme preset:', error)
      toast.error('Failed to delete theme')
    },
  })
}

// Reset theme preset to defaults (for system themes)
export const useResetThemePreset = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, defaultData }: { id: string; defaultData: Record<string, string> }) => {
      const { data, error } = await supabase
        .from('theme_presets')
        .update({ theme_data: defaultData })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as ThemePreset
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['theme-presets'] })
      toast.success(`Reset ${data.display_name} to defaults`)
    },
    onError: (error) => {
      console.error('Failed to reset theme preset:', error)
      toast.error('Failed to reset theme')
    },
  })
}
