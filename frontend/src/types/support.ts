export type WorkflowStage =
  | 'find-purchase'
  | 'verify-details'
  | 'analyse-issue'
  | 'resolution';

export type IssueType =
  | 'refund'
  | 'replacement'
  | 'wrong-item'
  | 'product-issue'
  | 'payment-issue'
  | 'other';

export interface Purchase {
  id: string;
  merchant: 'Zomato' | 'Amazon' | 'eBay';
  item: string;
  orderId: string;
  transactionId: string;
  amount: number;
  currency: 'INR' | 'USD';
  date: string;
  status: 'paid' | 'refunded' | 'pending';
  confidence: number;
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user' | 'system';
  kind: 'text' | 'progress' | 'purchase-card' | 'resolution-card';
  text?: string;
  timestamp: string;
}

export interface SearchProgressItem {
  id: string;
  label: string;
  state: 'pending' | 'active' | 'complete' | 'error';
}
