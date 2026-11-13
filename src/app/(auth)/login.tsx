import { useState } from 'react';
import { router } from 'expo-router';
import { AuthScaffold } from '../../components/auth/AuthScaffold';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { authErrorMessage, signIn } from '../../services/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      // The root layout's auth guard moves us to the app once the session lands.
    } catch (reason) {
      setError(authErrorMessage(reason));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScaffold
      title="Welcome back"
      subtitle="Log in to defend your territory."
      error={error}
      footer={<Button title="NEW HERE? CREATE AN ACCOUNT" variant="ghost" onPress={() => router.replace('/register')} />}
    >
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="you@example.com"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        placeholder="Your password"
        onSubmitEditing={() => canSubmit && submit()}
      />
      <Button title="LOG IN" size="lg" fullWidth loading={submitting} disabled={!canSubmit} onPress={submit} />
    </AuthScaffold>
  );
}
