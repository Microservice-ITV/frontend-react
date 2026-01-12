import { useState } from 'react'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAppDispatch } from '../app/hooks'
import { register } from '../features/auth/authThunks'

export const RegisterPage = () => {
  const dispatch = useAppDispatch();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card>
        <h1 className="text-2xl font-bold mb-4 text-center">Register</h1>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            dispatch(register(form));
          }}
        >
          <Input
            label="Name"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Email"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Button>Create Account</Button>
        </form>
      </Card>
    </div>
  );
}
