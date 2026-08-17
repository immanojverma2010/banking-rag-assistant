export interface BankingChunk {
  id: string;
  text: string;
  category: 'Accounts' | 'Cards' | 'Transfers' | 'Compliance';
  policyId: string;
}
