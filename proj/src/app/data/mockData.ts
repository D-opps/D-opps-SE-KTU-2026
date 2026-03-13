// Mock data for the DormLife application

export interface Machine {
  id: string;
  name: string;
  type: 'washer' | 'dryer';
  status: 'available' | 'busy' | 'finishing';
  timeRemaining?: number; // in minutes
}

export interface MarketplaceItem {
  id: string;
  name: string;
  price: number;
  image: string;
  seller: string;
  category: string;
  description: string;
  sellerRoom?: string;
}

export interface ChatMessage {
  id: string;
  room: string;
  sender: string;
  message: string;
  timestamp: Date;
  isOwn?: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  unread: number;
}

export const machines: Machine[] = [
  { id: '1', name: 'Washer 1', type: 'washer', status: 'available' },
  { id: '2', name: 'Washer 2', type: 'washer', status: 'busy', timeRemaining: 25 },
  { id: '3', name: 'Washer 3', type: 'washer', status: 'finishing', timeRemaining: 5 },
  { id: '4', name: 'Washer 4', type: 'washer', status: 'available' },
  { id: '5', name: 'Dryer 1', type: 'dryer', status: 'busy', timeRemaining: 40 },
  { id: '6', name: 'Dryer 2', type: 'dryer', status: 'available' },
  { id: '7', name: 'Dryer 3', type: 'dryer', status: 'finishing', timeRemaining: 3 },
  { id: '8', name: 'Dryer 4', type: 'dryer', status: 'available' },
];

export const marketplaceItems: MarketplaceItem[] = [
  {
    id: '1',
    name: 'Vintage Bicycle',
    price: 150,
    image: 'https://images.unsplash.com/photo-1760141993036-4e62095fe0f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwYmljeWNsZSUyMHNhbGV8ZW58MXx8fHwxNzcyODAwMTAxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    seller: 'Alex Johnson',
    category: 'Transportation',
    description: 'Great condition vintage bicycle. Perfect for campus commuting. Includes lock and basket.',
    sellerRoom: 'Room 305',
  },
  {
    id: '2',
    name: 'Desk Lamp',
    price: 25,
    image: 'https://images.unsplash.com/photo-1753932847231-7949af383b98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNrJTIwbGFtcCUyMGJlZHJvb218ZW58MXx8fHwxNzcyODAwMTAxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    seller: 'Emma Davis',
    category: 'Furniture',
    description: 'Modern LED desk lamp with adjustable brightness. Works perfectly, just upgrading.',
    sellerRoom: 'Room 212',
  },
  {
    id: '3',
    name: 'Calculus Textbook',
    price: 40,
    image: 'https://images.unsplash.com/photo-1741795822013-570c944ac5bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXh0Ym9vayUyMHN0YWNrJTIwY29sbGVnZXxlbnwxfHx8fDE3NzI4MDAxMDJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    seller: 'Michael Chen',
    category: 'Books',
    description: 'Calculus textbook for Math 101. Like new condition, barely used. No highlighting.',
    sellerRoom: 'Room 418',
  },
  {
    id: '4',
    name: 'Mini Fridge',
    price: 80,
    image: 'https://images.unsplash.com/photo-1759772238095-d1ed3f036ad5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pJTIwZnJpZGdlJTIwYXBwbGlhbmNlfGVufDF8fHx8MTc3Mjc2NjA2NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    seller: 'Sarah Williams',
    category: 'Appliances',
    description: 'Compact mini fridge in excellent condition. Great for storing snacks and drinks.',
    sellerRoom: 'Room 104',
  },
  {
    id: '5',
    name: 'Backpack',
    price: 35,
    image: 'https://images.unsplash.com/photo-1515590573546-cd05dc8557c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWNrcGFjayUyMHN0dWRlbnQlMjBzY2hvb2x8ZW58MXx8fHwxNzcyNzYxMjYwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    seller: 'David Lee',
    category: 'Accessories',
    description: 'Durable student backpack with laptop compartment. Barely used for one semester.',
    sellerRoom: 'Room 507',
  },
  {
    id: '6',
    name: 'Coffee Maker',
    price: 30,
    image: 'https://images.unsplash.com/photo-1614715661635-abb0547c125c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkb3JtJTIwcm9vbSUyMGludGVyaW9yfGVufDF8fHx8MTc3MjgwMDEwMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    seller: 'Jessica Martinez',
    category: 'Appliances',
    description: 'Single-serve coffee maker. Perfect for early morning classes!',
    sellerRoom: 'Room 309',
  },
];

export const chatRooms: ChatRoom[] = [
  { id: 'general', name: 'General', unread: 3 },
  { id: 'laundry', name: 'Laundry', unread: 0 },
  { id: 'marketplace', name: 'Marketplace', unread: 1 },
];

export const chatMessages: ChatMessage[] = [
  {
    id: '1',
    room: 'general',
    sender: 'Alex Johnson',
    message: 'Hey everyone! Anyone up for a study session tonight?',
    timestamp: new Date('2026-03-06T14:30:00'),
  },
  {
    id: '2',
    room: 'general',
    sender: 'Emma Davis',
    message: "I'm down! What subject?",
    timestamp: new Date('2026-03-06T14:32:00'),
  },
  {
    id: '3',
    room: 'general',
    sender: 'You',
    message: 'Count me in for calculus review!',
    timestamp: new Date('2026-03-06T14:35:00'),
    isOwn: true,
  },
  {
    id: '4',
    room: 'general',
    sender: 'Michael Chen',
    message: 'Library at 7pm?',
    timestamp: new Date('2026-03-06T14:40:00'),
  },
  {
    id: '5',
    room: 'laundry',
    sender: 'Sarah Williams',
    message: 'Dryer 2 is free now if anyone needs it',
    timestamp: new Date('2026-03-06T13:15:00'),
  },
  {
    id: '6',
    room: 'marketplace',
    sender: 'David Lee',
    message: 'Still selling that bike! Great deal at $150',
    timestamp: new Date('2026-03-06T12:00:00'),
  },
];
