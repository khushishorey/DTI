import React, { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { KeyRound, Users } from 'lucide-react-native';
import { PartyCard } from '../../components/party/PartyCard';
import { PartyPage } from '../../components/party/PartyPage';
import { PartyScreenHeader } from '../../components/party/PartyScreenHeader';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';
import { Input } from '../../components/common/Input';
import { ThemedText } from '../../components/common/ThemedText';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import { PartyNotice, PartyOfflineNotice } from '../../components/party/PartyNotice';
import { useJoinParty, useParties } from '../../hooks/useParties';
import { isPartyMember, partyRoute } from '../../services/parties';
import { useAuthStore } from '../../stores/useAuthStore';
import { usePartyStore } from '../../stores/usePartyStore';
import { Party } from '../../types/party';

export default function JoinPartyScreen() {
  const offline = useAuthStore((state) => state.status === 'offline');
  const myUserId = useAuthStore((state) => state.session?.user.id);
  const partiesQuery = useParties();
  const joinParty = useJoinParty();
  const setActivePartyId = usePartyStore((state) => state.setActivePartyId);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const openParties = (partiesQuery.data ?? []).filter((party) => party.visibility === 'public' && party.status !== 'completed' &&
    (party.participants.length < party.maxParticipants || isPartyMember(party, myUserId)));

  const enter = (party: Party) => {
    setActivePartyId(party.id);
    router.replace(partyRoute(party.status));
  };

  // Server errors ('Party is full', 'Party not found', 'Party has ended') go straight into the error slot.
  const join = async (partyCode: string) => {
    setError('');
    try {
      enter(await joinParty.mutateAsync(partyCode));
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Could not join this party.');
    }
  };

  if (offline) {
    return (
      <PartyPage>
        <PartyScreenHeader title="Join a party" subtitle="Enter a code or join an open run." backTo="/parties" />
        <PartyOfflineNotice />
      </PartyPage>
    );
  }

  return (
    <PartyPage>
      <PartyScreenHeader title="Join a party" subtitle="Enter a code or join an open run." backTo="/parties" />

      <View style={styles.codeCard}>
        <View style={styles.codeIcon}><Icon icon={KeyRound} size={20} color={Colors.primary} /></View>
        <ThemedText style={styles.codeTitle}>Have an invite code?</ThemedText>
        <ThemedText style={styles.codeDescription}>Ask your party leader for their six-character code.</ThemedText>
        <Input
          label="Party code"
          value={code}
          onChangeText={(value) => { setCode(value.toUpperCase().replace(/\s/g, '').slice(0, 8)); setError(''); }}
          placeholder="e.g. SUNSET"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          error={error || undefined}
        />
        <Button title="JOIN WITH CODE" size="lg" fullWidth disabled={code.trim().length < 4} loading={joinParty.isPending} onPress={() => void join(code)} style={styles.joinButton} />
      </View>

      <View style={styles.sectionHeading}>
        <View>
          <ThemedText style={styles.sectionTitle}>Open parties</ThemedText>
          <ThemedText style={styles.sectionSubtitle}>Public crews with room to run.</ThemedText>
        </View>
        <Icon icon={Users} size={18} color={Colors.textSecondary} />
      </View>

      {partiesQuery.isPending ? <PartyNotice loading title="Loading parties…" /> : partiesQuery.isError ? (
        <PartyNotice title="Couldn’t load parties" body={partiesQuery.error.message} actionLabel="TRY AGAIN" onAction={() => void partiesQuery.refetch()} />
      ) : openParties.length ? openParties.map((party) => (
        <PartyCard
          key={party.id}
          party={party}
          actionLabel={party.status === 'in_progress' ? 'VIEW LIVE' : 'JOIN PARTY'}
          onPress={() => (isPartyMember(party, myUserId) ? enter(party) : void join(party.code))}
        />
      )) : (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyTitle}>No open parties right now</ThemedText>
          <ThemedText style={styles.emptyDescription}>Create a party or join one with an invite code.</ThemedText>
        </View>
      )}
    </PartyPage>
  );
}

const styles = StyleSheet.create({
  codeCard: { padding: Spacing.lg, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl },
  codeIcon: { width: 42, height: 42, borderRadius: Radius.md, backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  codeTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },
  codeDescription: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, lineHeight: 18, marginTop: 4, marginBottom: Spacing.lg },
  joinButton: { marginTop: Spacing.lg },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xxl, marginBottom: Spacing.md },
  sectionTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold },
  sectionSubtitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 3 },
  emptyState: { alignItems: 'center', padding: Spacing.xl, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  emptyTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, textAlign: 'center' },
  emptyDescription: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, lineHeight: 18, textAlign: 'center', marginTop: Spacing.xs },
});
