// types.ts

// Enum para a condição do produto
export enum Condition {
  ALL = 'all',
  NEW = 'new',
  USED = 'used',
}

// Enum para o status do rastreador
export enum TrackerStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
}

// Interface para um rastreador (tracker)
export interface Tracker {
  id: string;
  searchTerm: string;
  minPrice: number;
  maxPrice: number;
  condition: Condition;
  location: string;
  whatsappNumber: string;
  createdAt: Date;
  status: TrackerStatus; // Adicionado status
  confirmationCode?: string; // Adicionado código de confirmação (opcional no frontend)
}

// Interface para os dados de um novo rastreador a ser criado
export type NewTrackerData = Omit<Tracker, 'id' | 'createdAt' | 'status' | 'confirmationCode'>;

// Interface para um produto encontrado
export interface Product {
  id: string;
  title: string;
  price: number;
  link: string;
  thumbnail: string;
  foundAt: Date;
}
