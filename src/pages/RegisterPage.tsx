import { useState } from 'react'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAppDispatch } from '../app/hooks'
import { register } from '../features/auth/authThunks'
import { getRecaptchaToken } from '@/utils/recaptcha'

export const RegisterPage = () => {
  const dispatch = useAppDispatch()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const recaptchaToken = await getRecaptchaToken('register')

    dispatch(
      register({
        ...form,
        recaptchaToken,
      })
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card>
        <h1 className="text-2xl font-bold mb-4 text-center">Register</h1>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input label="Name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input
            label="Password"
            type="password"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          {/* Security block */}
          <div className="flex gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="text-blue-600 text-lg">🛡️</div>
            <div className="text-xs text-gray-600">
              <p className="font-semibold text-gray-700">Protected by Google reCAPTCHA</p>
              <p>We use reCAPTCHA to prevent spam and abuse.</p>
            </div>
          </div>

          <Button>Create Account</Button>

          <p className="text-[10px] text-center text-gray-400">
            This site is protected by reCAPTCHA and the Google
            <a href="https://policies.google.com/privacy" target="_blank" className="underline mx-1">
              Privacy Policy
            </a>
            and
            <a href="https://policies.google.com/terms" target="_blank" className="underline ml-1">
              Terms of Service
            </a>
            apply.
          </p>
        </form>
      </Card>
    </div>
  )
}
