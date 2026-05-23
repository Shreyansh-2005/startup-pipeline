import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://coohoqzpvxtdcqflwvaw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvb2hvcXpwdnh0ZGNxZmx3dmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjAwNjgsImV4cCI6MjA5NDY5NjA2OH0.dWUWUlRYdffEVuw7RJoQlHMMI44NGz54KE6owDC961Y'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
