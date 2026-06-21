export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          logo_url: string | null
          currency: string
          default_lang: string
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['restaurants']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['restaurants']['Insert']>
      }
      categories: {
        Row: {
          id: string
          restaurant_id: string
          name_ar: string | null
          name_fr: string | null
          name_en: string | null
          position: number
          is_visible: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      items: {
        Row: {
          id: string
          restaurant_id: string
          category_id: string
          name_ar: string | null
          name_fr: string | null
          name_en: string | null
          description_ar: string | null
          description_fr: string | null
          description_en: string | null
          price: number
          image_url: string | null
          is_available: boolean
          is_visible: boolean
          position: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['items']['Insert']>
      }
      tables: {
        Row: {
          id: string
          restaurant_id: string
          label: string
          qr_token: string
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['tables']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['tables']['Insert']>
      }
      orders: {
        Row: {
          id: string
          restaurant_id: string
          table_id: string
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled'
          note: string | null
          total: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          item_id: string
          quantity: number
          unit_price: number
          note: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>
      }
    }
  }
}

export type Restaurant = Database['public']['Tables']['restaurants']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Item = Database['public']['Tables']['items']['Row']
export type Table = Database['public']['Tables']['tables']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']

export type OrderWithItems = Order & {
  order_items: (OrderItem & { items: Item })[]
  tables: Table
}

export type CategoryWithItems = Category & { items: Item[] }
