import {
  BadgePercent,
  BarChart3,
  CircleHelp,
  CreditCard,
  Gift,
  MessageSquareText,
  Package,
  PackagePlus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  type LucideIcon,
} from 'lucide-react'

export type HelpCenterTopicKey = 'help-centre' | 'how-to-buy' | 'how-to-sell'

export const paymentMethods = ['KPay', 'AYA Pay', 'WavePay', 'CB Pay']

export type HelpCategoryItem = {
  label: string
  description: string
}

export type HelpCategory = {
  id: string
  label: string
  icon: LucideIcon
  accent: string
  items?: HelpCategoryItem[]
}

export type HelpQuestion = {
  id: string
  label: string
}

export type HelpArticleSection = {
  title?: string
  paragraphs?: string[]
  steps?: string[]
  warning?: boolean
}

export type HelpArticle = {
  title: string
  category: string
  sections: HelpArticleSection[]
  relatedArticles: string[]
}

export const helpCenterContents: Record<HelpCenterTopicKey, { title: string; questions: HelpQuestion[]; categories: HelpCategory[] }> = {
  'help-centre': {
    title: 'Help Centre',
    categories: [
      {
        id: 'shop',
        label: 'Shop with DNI Shop',
        icon: ShoppingBag,
        accent: 'bg-rose-100 text-rose-600',
        items: [
          { label: 'Products on DNI Shop', description: 'Browse products and discover what is available.' },
          { label: 'User Interaction', description: 'Learn how to use the platform and contact support.' },
          { label: 'New to DNI Shop', description: 'Get started with your account and first-time shopping.' },
          { label: 'Checkout', description: 'Review your cart and complete a secure purchase.' },
          { label: 'DNI Shop Mall', description: 'Explore trusted Mall items and premium shopping.' },
          { label: 'Discovery', description: 'Find products faster with search and categories.' },
        ],
      },
      {
        id: 'deals',
        label: 'Deals & Rewards',
        icon: BadgePercent,
        accent: 'bg-orange-100 text-orange-600',
        items: [
          { label: 'Promotions', description: 'Explore deals, vouchers, and limited-time offers.' },
          { label: 'Reward Programmes', description: 'Learn how rewards and incentives are earned.' },
          { label: 'Subscription', description: 'Understand member benefits and exclusive offers.' },
        ],
      },
      {
        id: 'payments',
        label: 'Payments',
        icon: CreditCard,
        accent: 'bg-blue-100 text-blue-600',
        items: [
          { label: 'KPay', description: 'Pay securely using KPay for everyday purchases.' },
          { label: 'AYA Pay', description: 'Use AYA Pay for fast and convenient checkout.' },
          { label: 'WavePay', description: 'Complete transactions securely with WavePay.' },
          { label: 'CB Pay', description: 'Use CB Pay for digital payment convenience.' },
          { label: 'Payment Options', description: 'Compare payment methods available on the platform.' },
          { label: 'DNI Shop Coins', description: 'Learn how coins are used and redeemed at checkout.' },
        ],
      },
      {
        id: 'orders',
        label: 'Orders & Shipping',
        icon: Truck,
        accent: 'bg-emerald-100 text-emerald-600',
        items: [
          { label: 'Shipping Options', description: 'Choose delivery methods and shipping costs.' },
          { label: 'Order Management', description: 'Track order status and important updates.' },
          { label: 'Ratings & Reviews', description: 'Read reviews and share product feedback.' },
          { label: 'Shipping Programmes', description: 'Learn about shipping support and promotions.' },
        ],
      },
      {
        id: 'returns',
        label: 'Returns & Refunds',
        icon: RotateCcw,
        accent: 'bg-red-100 text-red-600',
        items: [
          { label: 'Disputes', description: 'Resolve issues when an order does not meet expectations.' },
          { label: 'Resolution', description: 'Understand how buyer concerns are reviewed.' },
          { label: 'Raising Requests', description: 'Submit a return or refund request correctly.' },
        ],
      },
      {
        id: 'general',
        label: 'General',
        icon: CircleHelp,
        accent: 'bg-sky-100 text-sky-600',
        items: [
          { label: 'DNI Shop Account', description: 'Manage your profile and account settings.' },
          { label: 'DNI Shop App', description: 'Use app features and support tools on mobile.' },
          { label: 'Buying Safely', description: 'Protect your account and purchases online.' },
          { label: 'Resources', description: 'Find guides and helpful support information.' },
          { label: 'DNI Shop Desktop', description: 'Use the web platform and order tools.' },
          { label: 'Guidelines', description: 'Understand platform rules and customer practices.' },
          { label: 'Additional Services', description: 'Explore extra tools and services available.' },
        ],
      },
      {
        id: 'policies',
        label: 'Policies',
        icon: ShieldCheck,
        accent: 'bg-indigo-100 text-indigo-600',
        items: [
          { label: 'DNI Shop Policies', description: 'Review the rules for using the platform.' },
          { label: 'Campaigns and Giveaway Events', description: 'Learn the terms and participation rules.' },
          { label: 'Membership Programmes', description: 'Understand benefits and programme eligibility.' },
          { label: 'Payment Policies', description: 'Review payment procedures and transaction rules.' },
        ],
      },
      {
        id: 'regulations',
        label: 'Regulations, Notices & Advisories',
        icon: MessageSquareText,
        accent: 'bg-violet-100 text-violet-600',
        items: [
          { label: 'Regulations and Notices', description: 'Review official updates and compliance notices.' },
          { label: 'Buyer and Seller Guidance', description: 'Understand operational guidance and best practices.' },
        ],
      },
    ],
    questions: [
      { id: 'acc-verify', label: '[My Account] How do I add/verify my phone number?' },
      { id: 'acc-login', label: '[My Account] Why can’t I log in to my DNI Shop account?' },
      { id: 'new-dni-shop', label: '[New to DNI Shop] Can I change the country of residence for my DNI Shop App?' },
      { id: 'acc-phone', label: '[My Account] How do I change/update my phone number?' },
      { id: 'otp', label: '[My Account] Why did I not receive my verification code/One-Time Password (OTP) via SMS?' },
      { id: 'email', label: '[My Account] How do I add/edit my email address?' },
      { id: 'delivery', label: '[Delivery] Driver Delivery Protocol' },
      { id: 'sign-up', label: '[New to DNI Shop] Why can’t I sign up?' },
      { id: 'return-refund', label: '[Return Refund] Raising Return & Refund request' },
    ],
  },
  'how-to-buy': {
    title: 'How To Buy',
    categories: [
      { id: 'browse', label: 'Browse products', icon: ShoppingBag, accent: 'bg-rose-100 text-rose-600' },
      { id: 'cart', label: 'Add to cart', icon: Package, accent: 'bg-orange-100 text-orange-600' },
      { id: 'payments', label: 'Payment methods', icon: CreditCard, accent: 'bg-blue-100 text-blue-600' },
      { id: 'shipping', label: 'Shipping', icon: Truck, accent: 'bg-emerald-100 text-emerald-600' },
      { id: 'returns', label: 'Returns', icon: RotateCcw, accent: 'bg-red-100 text-red-600' },
      { id: 'rewards', label: 'Coins & rewards', icon: Gift, accent: 'bg-yellow-100 text-yellow-700' },
    ],
    questions: [
      { id: 'add-to-cart', label: '[How to buy] How do I add products to my cart?' },
      { id: 'search', label: '[How to buy] How do I search for products?' },
      { id: 'checkout', label: '[How to buy] What payment methods are available?' },
      { id: 'shipping-fee', label: '[How to buy] How is shipping fee calculated?' },
      { id: 'order-status', label: '[How to buy] How do I check my order status?' },
      { id: 'cancel-order', label: '[How to buy] Can I cancel an order before it ships?' },
    ],
  },
  'how-to-sell': {
    title: 'How To Sell',
    categories: [
      { id: 'shop-setup', label: 'Set up your shop', icon: Store, accent: 'bg-emerald-100 text-emerald-700' },
      { id: 'add-products', label: 'Add your products', icon: PackagePlus, accent: 'bg-blue-100 text-blue-700' },
      { id: 'fulfil-orders', label: 'Fulfil your orders', icon: Truck, accent: 'bg-orange-100 text-orange-700' },
      { id: 'grow-shop', label: 'Grow your shop', icon: BarChart3, accent: 'bg-violet-100 text-violet-700' },
    ],
    questions: [
      { id: 'shop-setup', label: '[How to sell] How do I set up my shop?' },
      { id: 'add-products', label: '[How to sell] How do I add products to my shop?' },
      { id: 'fulfil-orders', label: '[How to sell] How do I fulfil and ship orders?' },
      { id: 'grow-shop', label: '[How to sell] How do I grow my shop with promotions?' },
    ],
  },
}

export const helpArticles: Record<string, HelpArticle> = {
  'how-to-buy': {
    title: '[New to DNI Shop] How do I buy a product on DNI Shop?',
    category: 'Shop with DNI Shop',
    sections: [
      {
        paragraphs: ['You can easily purchase a product through the DNI Shop website or the DNI Shop app.'],
      },
      {
        paragraphs: [
          'Before doing so, make sure you have **signed up for a DNI Shop account** and **added a local shipping address**.',
          'After you have **searched for a product** and decided on a product, you can make the purchase in the following 3 ways:',
        ],
        steps: ['**Buy now and proceed to checkout.**'],
      },
      {
        paragraphs: ['On the product page, select **Buy Now** > Select preferred variation option (if applicable) > select **Buy Now** > Select preferred **Shipping Option** (if necessary) > Use **DNI Shop Voucher** and **DNI Shop Coins** > Select preferred **Payment Option** > **Place Order**.'],
      },
      {
        steps: ['**Add to cart and checkout with other items.**'],
      },
      {
        paragraphs: ['On the product page, select **Add to Cart** > Select preferred variation option (if applicable) > select **Add to Cart** > Select products to purchase > Use **DNI Shop Voucher** and **DNI Shop Coins** > Select **Check Out** > **Place Order**.'],
      },
      {
        steps: ['**Buy again from your completed orders.**'],
      },
      {
        paragraphs: ['Select **My Purchases** from the **Me** tab and select the products you wish to re-purchase from the **Completed** section > Select **Buy Again** > Proceed to change the quantity or variations as needed > Select **Check Out** > **Place Order**.'],
      },
      {
        title: 'Payment methods',
        paragraphs: ['Choose the payment method that is most convenient for you at checkout. DNI Shop supports the following local payment options:'],
        steps: ['KPay', 'AYA Pay', 'WavePay', 'CB Pay'],
      },
      {
        title: 'Note',
        paragraphs: ['To re-purchase previous orders, select **My Purchases** from the **Me** tab and select the products you wish to re-purchase from the **Completed** section.'],
        warning: true,
      },
    ],
    relatedArticles: [
      '[Vouchers] How do I claim Free Shipping Vouchers?',
      '[Vouchers] What are Free Shipping Vouchers?',
    ],
  },
  'how-to-sell': {
    title: '[New to DNI Shop] How do I start selling on DNI Shop?',
    category: 'Shop with DNI Shop',
    sections: [
      {
        paragraphs: ['You can easily start selling products through the DNI Shop Seller Centre.'],
      },
      {
        paragraphs: [
          'Before getting started, make sure you have **registered as a DNI Shop seller** and completed your **shop information**.',
          'After your seller account is ready, you can start selling in the following steps:',
        ],
        steps: ['**Set up your shop.**'],
      },
      {
        paragraphs: ['Open Seller Centre > Complete your shop profile > Add your shop name, logo, description, and contact information > Save your shop details.'],
      },
      {
        steps: ['**Add your products.**'],
      },
      {
        paragraphs: ['Select Add New Product > Upload clear product images > Add the product name, description, category, price, stock, and shipping information > Select Publish.'],
      },
      {
        steps: ['**Manage and fulfil orders.**'],
      },
      {
        paragraphs: ['Check your new orders in Seller Centre > Confirm the order details > Pack the products carefully > Arrange shipment with the available delivery option > Update the order status after handing over the parcel.'],
      },
      {
        title: 'Note',
        paragraphs: ['Keep your product information, stock, prices, and shipping details accurate so customers can place orders confidently.'],
        warning: true,
      },
    ],
    relatedArticles: [
      '[Seller Centre] How do I add a new product?',
      '[Orders] How do I fulfil a customer order?',
    ],
  },
  'payment-methods': {
    title: 'Payment Methods',
    category: 'Payments',
    sections: [
      {
        paragraphs: ['Choose the payment method that is most convenient for you at checkout. DNI Shop supports the following local payment options:'],
        title: 'Payment methods',
        steps: ['KPay', 'AYA Pay', 'WavePay', 'CB Pay'],
      },
      {
        title: 'How to pay',
        paragraphs: ['At checkout, select your preferred payment method and follow the instructions shown on screen to complete your order securely.'],
      },
    ],
    relatedArticles: [
      '[How to buy] How do I buy a product on DNI Shop?',
      '[Payments] How do I use DNI Shop Coins?',
    ],
  },
  'ecommerce-coins': {
    title: 'Ecommerce Coins',
    category: 'Deals & Rewards',
    sections: [
      { paragraphs: ['DNI Shop Coins are reward points that you can earn through purchases and selected activities on DNI Shop.'] },
      { title: 'How to use Coins', paragraphs: ['Enable the **Redeem DNI Shop Coins** option at checkout to offset part of your transaction amount.'] },
      { title: 'Note', paragraphs: ['Coins cannot be exchanged for cash and may be subject to earning and usage limits.'], warning: true },
    ],
    relatedArticles: ['[How to buy] How do I buy a product on DNI Shop?', '[Deals & Rewards] How do I earn rewards?'],
  },
  'ecommerce-guarantee': {
    title: 'Ecommerce Guarantee',
    category: 'Orders & Shipping',
    sections: [
      { paragraphs: ['DNI Shop Guarantee helps protect your purchase while your order is being delivered.'] },
      { title: 'How it works', paragraphs: ['Check your order status and delivery information in **My Purchases**. Contact Customer Service if an order does not arrive as expected.'] },
      { title: 'Note', paragraphs: ['Keep your order information and delivery records until the order is completed.'], warning: true },
    ],
    relatedArticles: ['[Orders] How do I check my order status?', '[Return & Refund] How do I request a return?'],
  },
  'return-refund': {
    title: 'Return & Refund',
    category: 'Returns & Refunds',
    sections: [
      { paragraphs: ['You can request a return or refund when your order meets the applicable DNI Shop return conditions.'] },
      { title: 'Submit a request', steps: ['Open **My Purchases**.', 'Select the order and choose **Return/Refund**.', 'Select the reason, add supporting details, and submit the request.', 'Follow the return instructions and monitor the request status.'] },
      { title: 'Note', paragraphs: ['Return windows, eligible reasons, and required evidence may vary by order.'], warning: true },
    ],
    relatedArticles: ['[Returns] Raising Return & Refund request', '[Orders] How do I check my order status?'],
  },
  'mall-return-refund': {
    title: 'Ecommerce Mall Return & Refund',
    category: 'Returns & Refunds',
    sections: [
      { paragraphs: ['DNI Shop Mall orders may have additional return and refund conditions based on the seller and product category.'] },
      { title: 'Before returning an item', paragraphs: ['Check the item condition, return window, and instructions shown in the order details before sending the item back.'] },
      { title: 'Note', paragraphs: ['Return the item with its original packaging, accessories, and included items when required.'], warning: true },
    ],
    relatedArticles: ['[Return & Refund] How do I request a return?', '[DNI Shop Mall] Mall order policies'],
  },
  'contact-us': {
    title: 'Contact Us',
    category: 'General',
    sections: [
      { paragraphs: ['Need help with your order, account, or payment? Our DNI Shop Customer Service team is here to assist you.'] },
      { title: 'Live Chat', steps: ['Open the **DNI Shop App**.', 'Tap the **Me** icon.', 'Select **Chat with DNI Shop** and choose your topic.', 'Follow the agent instructions to resolve your issue.'] },
      { title: 'Internet Call', steps: ['Open the **DNI Shop App**.', 'Open **Help Centre** from the Me tab.', 'Select **Internet Call** and choose your inquiry type.', 'Tap **Speak with an Agent**.'] },
      { title: 'Shop Address', paragraphs: ['No. 9A, Maha Boga Street, Ward 3, Kamayut, Yangon', 'Phone - Viber 09961175435'] },
      { title: 'Note', paragraphs: ['Prepare your order number, screenshots, and account details before contacting Customer Service.'], warning: true },
    ],
    relatedArticles: ['[General] DNI Shop Account help', '[Orders] Order and delivery support'],
  },
}

export const getHelpArticle = (categoryId: string, itemIndex: string): HelpArticle | undefined => {
  const category = helpCenterContents['help-centre'].categories.find(({ id }) => id === categoryId)
  const item = category?.items?.[Number(itemIndex)]

  if (!category || !item) return undefined

  const isPayment = categoryId === 'payments'

  const descriptiveIntro = item.description
    ? `${item.description} This article explains how ${item.label} works and what customers should know when using it on DNI Shop.`
    : isPayment
      ? `${item.label} is available as a payment option during checkout. Select ${item.label} and follow the on-screen steps to complete your order.`
      : `Learn more about ${item.label} and how it works on DNI Shop.`

  const supportingParagraph = isPayment
    ? `At checkout, customers can choose ${item.label} as a secure and convenient payment method. The platform guides them through the steps needed to complete the transaction safely.`
    : `Understanding ${item.label.toLowerCase()} helps customers browse, compare, and complete purchases with more confidence.`

  return {
    title: `[${category.label}] ${item.label}`,
    category: category.label,
    sections: [
      {
        paragraphs: [
          descriptiveIntro,
          supportingParagraph,
        ],
      },
      ...(isPayment
        ? [{
            title: 'Available payment methods',
            paragraphs: ['DNI Shop supports these local payment options:'],
            steps: paymentMethods,
          }]
        : []),
    ],
    relatedArticles: [
      '[How to buy] How do I add products to my cart?',
      '[How to buy] What payment methods are available?',
    ],
  }
}
