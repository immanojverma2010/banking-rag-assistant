import type { BankingChunk } from './types';

export const sampleBankingDocs: Omit<BankingChunk, 'id'>[] = [
  {
    policyId: 'POL-ACC-001',
    category: 'Accounts',
    text: `Policy POL-ACC-001: IBAN Letter Generation

1. Purpose and Scope
This policy governs the generation and issuance of official IBAN (International Bank Account Number) confirmation letters for retail and corporate account holders. All IBAN letters must be generated through the Core Banking System (CBS) and bear the bank's official letterhead with a digital signature.

2. Eligibility Requirements
Customers must hold an active account in good standing for a minimum of 30 calendar days before requesting an IBAN letter. The account must not be subject to any freeze, lien, or compliance hold. Joint accounts require authorization from all account holders unless a power of attorney is on file.

3. Required Customer Verification
Before generating an IBAN letter, the following verification steps must be completed:
  a) Identity verification via government-issued photo ID (passport, national ID, or driver's license).
  b) Account ownership confirmation through the CBS account lookup module.
  c) For corporate accounts: verification of authorized signatory status and valid commercial registration certificate dated within the last 12 months.
  d) Two-factor authentication (OTP via registered mobile number) for digital requests.

4. Processing SLA
Standard IBAN letters are processed within 2 business days. Express processing (same-day) is available for premium account tiers (Gold, Platinum, Private Banking) at no additional charge. Corporate accounts with a dedicated relationship manager may request priority processing with a 4-hour SLA during business hours (08:00–17:00 local time, Monday–Friday).

5. Delivery Methods
IBAN letters may be delivered via: (a) secure email to the registered email address on file, (b) in-branch collection with identity verification, or (c) registered mail to the address of record. Digital copies are stored in the customer document vault for 7 years per regulatory retention requirements.

6. Fees
Standard IBAN letter generation is free of charge once per calendar year. Subsequent requests within the same year incur a fee of USD 15 (or local currency equivalent). Express processing for non-premium accounts incurs an additional USD 25 fee.`,
  },
  {
    policyId: 'POL-CARD-104',
    category: 'Cards',
    text: `Policy POL-CARD-104: Credit Card Limit Increase and Chargeback Procedures

1. Credit Card Limit Increase Criteria
Credit limit increase requests are evaluated based on the following criteria:
  a) Minimum account tenure of 6 months with the bank.
  b) No missed payments in the last 12 billing cycles.
  c) Current credit utilization below 70% of existing limit.
  d) Debt-to-income ratio (DTI) not exceeding 40% as verified through income documentation.
  e) Credit bureau score of 680 or above (where applicable).

2. Limit Increase Processing
Automatic limit reviews are conducted quarterly for eligible cardholders. Manual increase requests are processed within 5–7 business days. Temporary limit increases (up to 30 days) may be granted for travel or large purchases with prior notification. Maximum annual limit increase is capped at 50% of the current limit unless approved by the Credit Risk Committee.

3. Required Documentation for Manual Requests
  a) Proof of income: latest 3 months' salary slips or 2 years' tax returns for self-employed customers.
  b) Updated employment verification letter (issued within 30 days).
  c) Completed Limit Increase Application Form (Form CC-LIM-2024).

4. Chargeback Dispute Windows
Customers must report unauthorized or disputed transactions within the following timeframes:
  a) Fraudulent transactions: within 60 days of the statement date on which the transaction appeared.
  b) Billing errors (incorrect amount, duplicate charge): within 60 days of the statement date.
  c) Merchant disputes (goods not received, not as described): within 120 days of the transaction date.
  d) ATM disputes: within 10 business days of the transaction date.

5. Chargeback Documentation Requirements
All chargeback claims must include: transaction date, merchant name, disputed amount, reason code, and supporting evidence (receipts, correspondence with merchant, police report for fraud). Provisional credit of up to USD 500 may be issued within 10 business days while investigation is pending. Full investigation resolution SLA is 45 calendar days per card network rules (Visa/Mastercard).`,
  },
  {
    policyId: 'POL-TRF-302',
    category: 'Transfers',
    text: `Policy POL-TRF-302: International Wire Transfers and SWIFT Routing

1. Scope
This policy applies to all outbound and inbound international wire transfers processed through SWIFT (Society for Worldwide Interbank Financial Telecommunication) messaging. All transfers must comply with local regulatory requirements, FATF recommendations, and the bank's sanctions screening program.

2. International Wire Requirements
Before initiating an international wire transfer, the following information is mandatory:
  a) Beneficiary full legal name (must match account registration exactly).
  b) Beneficiary IBAN or account number.
  c) Beneficiary bank SWIFT/BIC code (8 or 11 characters).
  d) Beneficiary bank name and full address.
  e) Purpose of payment code (regulatory reporting requirement).
  f) Source of funds declaration for transfers exceeding USD 10,000 (or local equivalent).

3. SWIFT Routing and Correspondent Banks
Transfers are routed via the optimal SWIFT corridor based on destination country and currency. Correspondent bank fees (if applicable) are deducted from the transfer amount unless the sender selects "OUR" (sender pays all fees) charging option. Standard routing uses "SHA" (shared fees) unless otherwise specified. Transfers to sanctioned jurisdictions are prohibited regardless of amount.

4. Sanctions Screening
All international transfers undergo real-time sanctions screening against OFAC, EU, UN, and local sanctions lists before release. Transfers flagged for review are held pending Compliance Officer approval (SLA: 24 hours for amounts under USD 50,000; 48 hours for amounts above). Customers will be notified if additional documentation is required.

5. Cut-Off Times and Processing SLAs
  a) USD/EUR/GBP wires: cut-off 15:00 local time (same-day processing if submitted before cut-off).
  b) Other major currencies (AUD, CAD, CHF, JPY): cut-off 14:00 local time.
  c) Exotic currencies: cut-off 12:00 local time; processing may take 2–3 business days.
  d) Wires submitted after cut-off are processed on the next business day.
  e) SWIFT MT103 confirmation is sent to the sender within 2 hours of successful transmission.

6. Fees and Limits
Standard international wire fee: USD 35 (outbound) / USD 15 (inbound). Daily transfer limit for retail customers: USD 50,000. Corporate customers: limits per signed mandate. Transfers exceeding USD 100,000 require dual authorization.`,
  },
  {
    policyId: 'POL-COMP-880',
    category: 'Compliance',
    text: `Policy POL-COMP-880: KYC/AML Renewal Mandates

1. Purpose
This policy establishes mandatory Know Your Customer (KYC) and Anti-Money Laundering (AML) renewal requirements for all customer relationships. Periodic reviews ensure customer information remains accurate, complete, and aligned with the customer's risk profile.

2. KYC Renewal Triggers
KYC renewal is mandatory under the following circumstances:
  a) Scheduled periodic review based on risk rating (see Section 3).
  b) Material change in customer circumstances (change of address, employment, beneficial ownership).
  c) Unusual transaction activity exceeding expected profile by 200% or more.
  d) Expiration of identity documents on file.
  e) Regulatory directive or law enforcement request.

3. Periodic Review Schedule by Risk Rating
  a) Low risk: every 5 years from last KYC completion date.
  b) Medium risk: every 3 years from last KYC completion date.
  c) High risk: every 12 months from last KYC completion date.
  d) Politically Exposed Persons (PEP): every 6 months with enhanced due diligence (EDD).

4. Required Documentation for Renewal
  a) Valid government-issued photo ID (passport, national ID, or driver's license).
  b) Proof of address dated within the last 3 months (utility bill, bank statement, or government correspondence).
  c) Updated source of funds and source of wealth declaration.
  d) For corporate entities: updated beneficial ownership register, board resolution, and audited financial statements.
  e) Completed KYC Renewal Form (Form KYC-REN-2024).

5. PEP and High-Risk Escalation
Customers identified as PEPs or classified as high-risk require:
  a) Senior Management approval for relationship continuation.
  b) Enhanced due diligence including adverse media screening.
  c) Source of wealth verification with supporting documentation.
  d) Transaction monitoring with reduced alert thresholds (50% of standard limits).
  e) Mandatory review by the Compliance Committee every 6 months.

6. Non-Compliance Consequences
Failure to complete KYC renewal within 30 days of notification results in: (a) restriction of non-essential transactions, (b) account freeze after 60 days, (c) relationship termination and SAR filing after 90 days. Customers are notified at 30, 45, and 60 days via registered email and SMS.`,
  },
];
