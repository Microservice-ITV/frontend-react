import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCart } from '@/features/cart/hooks/useCart'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCheckout } from '../hooks/useCheckout'
import { SagaStatusDisplay } from './SagaStatusDisplay'
import { useState } from 'react'
import { CreditCard, Truck, Package } from 'lucide-react'

export const SagaCheckoutForm = () => {
  const { items, selectedItems, getTotalPrice } = useCart()
  const { user } = useAuth()
  const { 
    checkoutCart, 
    currentCheckout, 
    loading, 
    error, 
    clearCheckout 
  } = useCheckout()
  
  const [showSagaStatus, setShowSagaStatus] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState({
    full_name: '',
    phone_no: '',
    email: '',
    country_code: '+1',
    country: 'United States',
    state: '',
    city: '',
    district: '',
    ward: '',
    address_line_1: '',
    address_line_2: '',
    postal_code: '',
    latitude: null,
    longitude: null,
    delivery_note: '',
    shipping_total: 0,
    shop_shippings: []
  })

  const handleCheckout = async () => {
    if (!user) return

    try {
      await checkoutCart()
      if (currentCheckout?.saga_id) {
        setShowSagaStatus(true)
      }
    } catch (error) {
      console.error('Checkout failed:', error)
    }
  }

  const handleCompleteCheckout = async () => {
    if (!currentCheckout) return

    try {
      // This would be called when payment is completed
      // await completeCheckout({
      //   checkoutId: currentCheckout.checkout_id,
      //   paymentData: { payment_method: 'credit_card', token: 'token_123' }
      // })
    } catch (error) {
      console.error('Complete checkout failed:', error)
    }
  }

  if (showSagaStatus && currentCheckout?.saga_id) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Order Processing</h2>
          <Button variant="outline" onClick={() => setShowSagaStatus(false)}>
            Back to Checkout
          </Button>
        </div>
        <SagaStatusDisplay sagaId={currentCheckout.saga_id} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Checkout</h2>
        {currentCheckout && (
          <Button variant="outline" onClick={clearCheckout}>
            New Checkout
          </Button>
        )}
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    {item.quantity} × ${item.price}
                  </p>
                </div>
                <p className="font-medium">
                  ${(item.quantity * item.price).toFixed(2)}
                </p>
              </div>
            ))}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total</span>
                <span className="text-xl font-bold">
                  ${getTotalPrice().toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Delivery Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={deliveryAddress.full_name}
                onChange={(e) => setDeliveryAddress(prev => ({
                  ...prev,
                  full_name: e.target.value
                }))}
              />
            </div>
            <div>
              <Label htmlFor="phone_no">Phone Number</Label>
              <Input
                id="phone_no"
                value={deliveryAddress.phone_no}
                onChange={(e) => setDeliveryAddress(prev => ({
                  ...prev,
                  phone_no: e.target.value
                }))}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={deliveryAddress.email}
                onChange={(e) => setDeliveryAddress(prev => ({
                  ...prev,
                  email: e.target.value
                }))}
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={deliveryAddress.state}
                onChange={(e) => setDeliveryAddress(prev => ({
                  ...prev,
                  state: e.target.value
                }))}
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={deliveryAddress.city}
                onChange={(e) => setDeliveryAddress(prev => ({
                  ...prev,
                  city: e.target.value
                }))}
              />
            </div>
            <div>
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={deliveryAddress.postal_code}
                onChange={(e) => setDeliveryAddress(prev => ({
                  ...prev,
                  postal_code: e.target.value
                }))}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address_line_1">Address Line 1</Label>
              <Input
                id="address_line_1"
                value={deliveryAddress.address_line_1}
                onChange={(e) => setDeliveryAddress(prev => ({
                  ...prev,
                  address_line_1: e.target.value
                }))}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="delivery_note">Delivery Notes (Optional)</Label>
              <Textarea
                id="delivery_note"
                value={deliveryAddress.delivery_note}
                onChange={(e) => setDeliveryAddress(prev => ({
                  ...prev,
                  delivery_note: e.target.value
                }))}
                placeholder="Any special delivery instructions..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Credit Card</p>
                  <p className="text-sm text-gray-600">Secure payment processing</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Button */}
      <div className="flex flex-col gap-4">
        <Button 
          onClick={handleCheckout} 
          disabled={loading || selectedItems.length === 0}
          className="w-full"
          size="lg"
        >
          {loading ? 'Processing...' : 'Complete Order'}
        </Button>
        
        {currentCheckout && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Order ID: {currentCheckout.checkout_id}
            </p>
            {currentCheckout.saga_id && (
              <p className="text-sm text-blue-600">
                Saga ID: {currentCheckout.saga_id}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}