import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { login } from '@/features/auth/authThunks'

export const LoginPage = () => {
  const dispatch = useAppDispatch();
  const { status } = useAppSelector((state) => state.auth);

  const loading = status === 'loading';

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card>
        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            dispatch(login({ email, password }));
          }}
        >
          <Input
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button loading={loading}>Login</Button>
        </form>
      </Card>
    </div>
  );
}