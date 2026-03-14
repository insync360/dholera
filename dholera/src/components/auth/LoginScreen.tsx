import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { ArrowLeft } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => void;
  onBack: () => void;
}

export function LoginScreen({ onLogin, onBack }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Map
        </Button>

        <Card className="p-6 md:p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary mx-auto mb-4">
              <span className="text-white text-2xl font-bold">GAP</span>
            </div>
            <h2 className="mb-2">Admin Login</h2>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access the admin panel
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@gapgroup.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg">
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Demo Credentials:
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs bg-muted p-2 rounded">
                <div>
                  <span className="text-muted-foreground">Admin:</span> admin@gapgroup.com
                </div>
                <Badge variant="secondary" className="text-xs">Admin</Badge>
              </div>
              <div className="flex items-center justify-between text-xs bg-muted p-2 rounded">
                <div>
                  <span className="text-muted-foreground">Editor:</span> editor@gapgroup.com
                </div>
                <Badge variant="secondary" className="text-xs">Editor</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Password: <span className="font-mono">demo123</span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
