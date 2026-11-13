import { useState } from 'react';
import { router } from 'expo-router';
import { AuthScaffold } from '../../components/auth/AuthScaffold';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { authErrorMessage, signUp } from '../../services/auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailError = email.length > 0 && !EMAIL_PATTERN.test(email.trim()) ? 'Enter a valid email.' : undefined;
  const passwordError =
    password.length > 0 && password.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters.` : undefined;
  const canSubmit =
    EMAIL_PATTERN.test(email.trim()) && password.length >= MIN_PASSWORD && !submitting;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { session } = await signUp(email.trim(), password);
      // With email confirmation on, there is no session until the link is clicked.
      if (!session) setNotice('Check your inbox and tap the confirmation link, then log in.');
    } catch (reason) {
      setError(authErrorMessage(reason));
    } finally {
      setSubmitting(false);
    }
  };

  if (notice) {
    return (
      <AuthScaffold title="Confirm your email" subtitle={notice}>
        <Button title="GO TO LOG IN" size="lg" fullWidth onPress={() => router.replace('/login')} />
      </AuthScaffold>
    );
  }

  return (
    <AuthScaffold
      title="Create your account"
      subtitle="Next you’ll pick a runner name and territory colour."
      error={error}
      footer={<Button title="ALREADY RUNNING? LOG IN" variant="ghost" onPress={() => router.replace('/login')} />}
    >
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={emailError}
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
        error={passwordError}
        hint={passwordError ? undefined : `At least ${MIN_PASSWORD} characters.`}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        placeholder="Choose a password"
        onSubmitEditing={() => canSubmit && submit()}
      />
      <Button title="CREATE ACCOUNT" size="lg" fullWidth loading={submitting} disabled={!canSubmit} onPress={submit} />
    </AuthScaffold>
  );
}
