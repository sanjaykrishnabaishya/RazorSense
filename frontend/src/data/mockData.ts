import { Purchase, ChatMessage } from '../types/support';

export const mockPurchases: Purchase[] = [
  {
    id: 'p1',
    merchant: 'Zomato',
    item: 'Wireless Earphones',
    orderId: 'ZOM-882910',
    transactionId: 'pay_ABC123456',
    amount: 499.00,
    currency: 'INR',
    date: 'Today, 2:30 PM',
    status: 'paid',
    confidence: 0.98,
  },
  {
    id: 'p2',
    merchant: 'Amazon',
    item: 'Mechanical Keyboard',
    orderId: 'AMZ-492102',
    transactionId: 'pay_XYZ987654',
    amount: 2500.00,
    currency: 'INR',
    date: 'Yesterday, 10:15 AM',
    status: 'paid',
    confidence: 0.85,
  },
  {
    id: 'p3',
    merchant: 'eBay',
    item: 'Vintage Camera Lens',
    orderId: 'EBY-110293',
    transactionId: 'pay_DEF345678',
    amount: 120.00,
    currency: 'USD',
    date: 'Oct 12, 2023',
    status: 'paid',
    confidence: 0.65,
  }
];

export const initialMessages: ChatMessage[] = [
  {
    id: 'm1',
    role: 'assistant',
    kind: 'text',
    text: 'Hi! I’m Krish 👋\nI’m here to help you sort things out. Tell me what happened, and I’ll look into it for you.',
    timestamp: '10:00 AM',
  }
];
