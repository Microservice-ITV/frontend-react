// ─────────────────────────────────────────────
// Backend GraphQL types (mirror ecommerce-read-service schema)
// ─────────────────────────────────────────────
export interface FlashDealProduct {
  id: string
  name: string
  image: string
  originalPrice: number
  dealPrice: number
  discountPercent: number
  soldCount: number
  totalStock: number
  slotId: string
  shopName: string
}

export interface FlashDealTimeSlot {
  id: string
  label: string
  time: string
  status: 'ongoing' | 'coming_soon' | 'ended'
  startTime: Date
  endTime: Date
}

/** Raw product shape returned by GraphQL `getFlashDeals` */
export interface GqlFlashDealProduct {
  productId: string
  variantId: string
  flashDealItemId: string
  originalPrice: number
  dealPrice: number
  discountPercent: number
  allocatedStock: number
  remainingStock: number
  soldStock: number
  soldPercent: number
  maxPerUser: number
  imageUrl: string
  title: string
  shopId: string
  shopName: string
  status: string
}

/** Raw slot shape returned by GraphQL */
export interface GqlFlashDealTimeSlot {
  slotId: string
  slotTime: string
  startTime: string
  endTime: string
  status: string
}

/** Full slot shape from `getFlashDealCampaigns` (includes products + totals) */
export interface GqlFlashDealSlot extends GqlFlashDealTimeSlot {
  products: GqlFlashDealProduct[]
  totalProducts: number
  totalRemainingStock: number
  totalAllocatedStock: number
}

/** Campaign shape from `getFlashDealCampaigns` */
export interface GqlFlashDealCampaign {
  campaignId: string
  title: string
  description: string
  startTime: string
  endTime: string
  status: string
  slots: GqlFlashDealSlot[]
  createdAt: string | null
  updatedAt: string | null
}

/** Normalised product used by UI components (maps Gql fields → existing component contract) */
export interface NormalisedFlashDealProduct {
  id: string
  name: string
  image: string
  originalPrice: number
  dealPrice: number
  discountPercent: number
  soldCount: number
  totalStock: number
  slotId: string
  shopName: string
}

/** Normalised time-slot used by UI components */
export interface NormalisedFlashDealTimeSlot {
  id: string
  label: string
  time: string
  status: 'ongoing' | 'coming_soon' | 'ended'
  startTime: Date
  endTime: Date
  /** Count of products in this slot (for auto-selecting a slot with deals) */
  totalProducts?: number
}

/** GraphQL response wrappers */
export interface GqlGetActiveTimeSlotsData {
  getActiveTimeSlots: GqlFlashDealTimeSlot[]
}

export interface GqlGetFlashDealsData {
  getFlashDeals: {
    items: GqlFlashDealProduct[]
    page: number
    limit: number
    total: number
    slot: GqlFlashDealTimeSlot | null
  } | null
}

export interface GqlGetFlashDealCampaignsData {
  getFlashDealCampaigns: GqlFlashDealCampaign[]
}

/** Redux state shape */
export interface FlashDealsState {
  /** All campaigns loaded (includes nested slots + products) */
  campaigns: GqlFlashDealCampaign[]
  /** Products currently displayed for the active slot */
  products: NormalisedFlashDealProduct[]
  /** Available time slots (normalised) */
  timeSlots: NormalisedFlashDealTimeSlot[]
  /** Currently selected slot id */
  activeSlotId: string | null
  /** Currently selected category tab */
  activeCategory: string
  /** Pagination */
  page: number
  limit: number
  total: number
  /** Loading / error */
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

// ─────────────────────────────────────────────
// Legacy mock data (kept as fallback / dev seed)
// ─────────────────────────────────────────────
export const FLASH_DEAL_TIME_SLOTS: FlashDealTimeSlot[] = [
  {
    id: '10:30',
    label: '10:30',
    time: '10:30',
    status: 'ongoing',
    startTime: new Date(new Date().setHours(10, 30, 0, 0)),
    endTime: new Date(new Date().setHours(12, 0, 0, 0)),
  },
  {
    id: '12:30',
    label: '12:30',
    time: '12:30',
    status: 'coming_soon',
    startTime: new Date(new Date().setHours(12, 30, 0, 0)),
    endTime: new Date(new Date().setHours(14, 0, 0, 0)),
  },
  {
    id: '16:30',
    label: '16:30',
    time: '16:30',
    status: 'coming_soon',
    startTime: new Date(new Date().setHours(16, 30, 0, 0)),
    endTime: new Date(new Date().setHours(18, 0, 0, 0)),
  },
  {
    id: '18:30',
    label: '18:30',
    time: '18:30',
    status: 'coming_soon',
    startTime: new Date(new Date().setHours(18, 30, 0, 0)),
    endTime: new Date(new Date().setHours(20, 0, 0, 0)),
  },
  {
    id: '20:30',
    label: '20:30',
    time: '20:30',
    status: 'coming_soon',
    startTime: new Date(new Date().setHours(20, 30, 0, 0)),
    endTime: new Date(new Date().setHours(22, 0, 0, 0)),
  },
  {
    id: '22:30',
    label: '22:30',
    time: '22:30',
    status: 'coming_soon',
    startTime: new Date(new Date().setHours(22, 30, 0, 0)),
    endTime: new Date(new Date().setHours(23, 59, 0, 0)),
  },
]

export const MOCK_FLASH_DEAL_PRODUCTS: FlashDealProduct[] = [
  {
    id: 'fd-1',
    name: 'Wireless Bluetooth Earbuds Pro',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80',
    originalPrice: 45.99,
    dealPrice: 15.28,
    discountPercent: 67,
    soldCount: 1240,
    totalStock: 2000,
    slotId: '10:30',
    shopName: 'TechHub Official',
  },
  {
    id: 'fd-2',
    name: 'Portable Mini Fan USB Rechargeable',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80',
    originalPrice: 28.99,
    dealPrice: 9.99,
    discountPercent: 66,
    soldCount: 856,
    totalStock: 1500,
    slotId: '10:30',
    shopName: 'HomeEssentials',
  },
  {
    id: 'fd-3',
    name: 'LED Desk Lamp Touch Control',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80',
    originalPrice: 35.99,
    dealPrice: 12.50,
    discountPercent: 65,
    soldCount: 634,
    totalStock: 1000,
    slotId: '10:30',
    shopName: 'LightingPro',
  },
  {
    id: 'fd-4',
    name: 'Stainless Steel Water Bottle 500ml',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80',
    originalPrice: 22.99,
    dealPrice: 8.99,
    discountPercent: 61,
    soldCount: 1100,
    totalStock: 1800,
    slotId: '10:30',
    shopName: 'EcoLife Store',
  },
  {
    id: 'fd-5',
    name: 'Wireless Charger Fast Charge 15W',
    image: 'https://images.unsplash.com/photo-1586717791821-3f9d8e5d8f8e?w=500&q=80',
    originalPrice: 39.99,
    dealPrice: 14.99,
    discountPercent: 63,
    soldCount: 789,
    totalStock: 1200,
    slotId: '10:30',
    shopName: 'TechHub Official',
  },
  {
    id: 'fd-6',
    name: 'Memory Foam Neck Pillow Travel',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&q=80',
    originalPrice: 29.99,
    dealPrice: 11.99,
    discountPercent: 60,
    soldCount: 567,
    totalStock: 900,
    slotId: '10:30',
    shopName: 'ComfortZone',
  },
  {
    id: 'fd-7',
    name: 'Silicone Kitchen Utensil Set 12pcs',
    image: 'https://images.unsplash.com/photo-1584990347449-951f5c6e8e8e?w=500&q=80',
    originalPrice: 42.99,
    dealPrice: 16.99,
    discountPercent: 61,
    soldCount: 923,
    totalStock: 1400,
    slotId: '10:30',
    shopName: 'KitchenMaster',
  },
  {
    id: 'fd-8',
    name: 'Adjustable Phone Stand Desktop',
    image: 'https://images.unsplash.com/photo-1586717791821-3f9d8e5d8f8e?w=500&q=80',
    originalPrice: 18.99,
    dealPrice: 6.99,
    discountPercent: 63,
    soldCount: 1345,
    totalStock: 2000,
    slotId: '10:30',
    shopName: 'MobileAccessories',
  },
  {
    id: 'fd-9',
    name: 'Smart Watch Fitness Tracker',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
    originalPrice: 89.99,
    dealPrice: 29.99,
    discountPercent: 67,
    soldCount: 0,
    totalStock: 500,
    slotId: '12:30',
    shopName: 'WearableTech',
  },
  {
    id: 'fd-10',
    name: 'Electric Toothbrush Sonic 40000',
    image: 'https://images.unsplash.com/photo-1559592783-43031f164f9f?w=500&q=80',
    originalPrice: 59.99,
    dealPrice: 19.99,
    discountPercent: 67,
    soldCount: 0,
    totalStock: 800,
    slotId: '12:30',
    shopName: 'OralCare Pro',
  },
  {
    id: 'fd-11',
    name: 'Hair Dryer Ionic 2000W',
    image: 'https://images.unsplash.com/photo-1586717791821-3f9d8e5d8f8e?w=500&q=80',
    originalPrice: 49.99,
    dealPrice: 16.99,
    discountPercent: 66,
    soldCount: 0,
    totalStock: 600,
    slotId: '12:30',
    shopName: 'BeautyGlow',
  },
  {
    id: 'fd-12',
    name: 'Robot Vacuum Cleaner Slim',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80',
    originalPrice: 299.99,
    dealPrice: 99.99,
    discountPercent: 67,
    soldCount: 0,
    totalStock: 200,
    slotId: '12:30',
    shopName: 'SmartHome Official',
  },
  {
    id: 'fd-13',
    name: 'Gaming Mechanical Keyboard RGB',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80',
    originalPrice: 79.99,
    dealPrice: 25.99,
    discountPercent: 68,
    soldCount: 0,
    totalStock: 400,
    slotId: '16:30',
    shopName: 'GameGear',
  },
  {
    id: 'fd-14',
    name: 'Gaming Mouse Wireless 16000 DPI',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80',
    originalPrice: 59.99,
    dealPrice: 18.99,
    discountPercent: 68,
    soldCount: 0,
    totalStock: 600,
    slotId: '16:30',
    shopName: 'GameGear',
  },
  {
    id: 'fd-15',
    name: 'Monitor Arm Desk Mount Dual',
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=500&q=80',
    originalPrice: 89.99,
    dealPrice: 29.99,
    discountPercent: 67,
    soldCount: 0,
    totalStock: 300,
    slotId: '16:30',
    shopName: 'ErgoWork',
  },
  {
    id: 'fd-16',
    name: 'Air Fryer 5.5L Digital Touch',
    image: 'https://images.unsplash.com/photo-1585515656692-2d28f85e25e3?w=500&q=80',
    originalPrice: 129.99,
    dealPrice: 42.99,
    discountPercent: 67,
    soldCount: 0,
    totalStock: 300,
    slotId: '18:30',
    shopName: 'KitchenMaster',
  },
  {
    id: 'fd-17',
    name: 'Blender Portable USB Rechargeable',
    image: 'https://images.unsplash.com/photo-1584990347449-951f5c6e8e8e?w=500&q=80',
    originalPrice: 39.99,
    dealPrice: 13.99,
    discountPercent: 65,
    soldCount: 0,
    totalStock: 700,
    slotId: '18:30',
    shopName: 'BlendFresh',
  },
  {
    id: 'fd-18',
    name: 'Electric Kettle Temperature Control',
    image: 'https://images.unsplash.com/photo-1571954437177-3696c7c9c8e7?w=500&q=80',
    originalPrice: 45.99,
    dealPrice: 15.99,
    discountPercent: 65,
    soldCount: 0,
    totalStock: 500,
    slotId: '18:30',
    shopName: 'BrewMaster',
  },
]
