import {
  Artifact,
  AuditSummary,
  AuditTrailEntry,
  AuditType,
  AuditTypeVersion,
  Certificate,
  EmailTemplate,
  EvidenceSubmission,
  Finding,
  Organisation,
  Payment,
  Profile,
  RuntimeSetting,
  TemplateCategory,
  UploadSummary,
  UserRole,
  DocxTemplate,
  CertificateVerificationResult,
} from "../types/models";

const now = new Date();
const iso = (date: Date) => date.toISOString();

const baseDate = new Date(Date.UTC(2025, 0, 15));

export const organisations: Organisation[] = [
  {
    id: "org-aurora",
    abn: "53004085616",
    legal_name: "Aurora Logistics Pty Ltd",
    trading_name: "Aurora Logistics",
    billing_email: "accounts@auroralogistics.example",
    status: "Active",
    created_at: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 180)),
  },
  {
    id: "org-harbour",
    abn: "83004195220",
    legal_name: "Harbour Manufacturing Group",
    trading_name: "Harbour Manufacturing",
    billing_email: "finance@harbour.example",
    status: "Active",
    created_at: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 90)),
  },
];

const profileBase = (role: UserRole, overrides: Partial<Profile>): Profile => ({
  id: `profile-${overrides.id ?? role.toLowerCase()}`,
  user_id: `user-${overrides.id ?? role.toLowerCase()}`,
  org_id: null,
  role,
  given_name: "",
  family_name: "",
  email: "",
  status: "Active",
  created_at: iso(baseDate),
  ...overrides,
});

export const profiles: Profile[] = [
  profileBase("Admin", {
    id: "admin",
    given_name: "Sasha",
    family_name: "Nguyen",
    email: "sasha.nguyen@castor.example",
  }),
  profileBase("Reviewer", {
    id: "reviewer",
    given_name: "Mina",
    family_name: "Chen",
    email: "mina.chen@castor.example",
  }),
  profileBase("ClientRep", {
    id: "aurora",
    given_name: "Oliver",
    family_name: "Reed",
    email: "oliver.reed@auroralogistics.example",
    org_id: "org-aurora",
  }),
  profileBase("ClientRep", {
    id: "harbour",
    given_name: "Amelia",
    family_name: "Kerr",
    email: "amelia.kerr@harbour.example",
    org_id: "org-harbour",
  }),
];

export const auditTypes: AuditType[] = [
  {
    id: "audit-hvnl",
    key: "hvnl",
    name: "HVNL Chain of Responsibility",
    description: "Heavy Vehicle National Law compliance programme",
    status: "Active",
  },
  {
    id: "audit-whs",
    key: "whs",
    name: "Work Health & Safety",
    description: "Desktop WHS audit",
    status: "Active",
  },
];

export const auditTypeVersions: AuditTypeVersion[] = [
  {
    id: "version-hvnl-2025",
    audit_type_id: "audit-hvnl",
    version: "2025.1",
    criteria_md: "## Chain of Responsibility\n- Fatigue\n- Maintenance",
    form_schema: { title: "HVNL Evidence", type: "object" },
    analysis_prompt_template: "You are an HVNL assessor.",
    price_aud: 3500,
    reminder_days: 30,
    linked_docx_template_ids: ["docx-hvnl-cert"],
    created_by: "profile-admin",
    created_at: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 45)),
  },
  {
    id: "version-whs-2025",
    audit_type_id: "audit-whs",
    version: "2025.2",
    criteria_md: "## WHS Desktop\n- Consultation\n- Incident Management",
    form_schema: { title: "WHS Evidence", type: "object" },
    analysis_prompt_template: "You are a WHS assessor.",
    price_aud: 2800,
    reminder_days: 45,
    linked_docx_template_ids: ["docx-whs-cert"],
    created_by: "profile-admin",
    created_at: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 30)),
  },
];

const certificate: Certificate = {
  id: "cert-aurora-hvnl",
  audit_id: "audit-aurora-hvnl",
  number: "CASTOR-2024-017",
  issued_at: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 20)),
  pdf_path: "certificates/CASTOR-2024-017.pdf",
  verification_token: "token-aurora-hvnl",
  status: "Active",
  revocation_reason: null,
};

export const audits: AuditSummary[] = [
  {
    id: "audit-aurora-hvnl",
    org_id: "org-aurora",
    audit_type_version_id: "version-hvnl-2025",
    status: "Issued",
    open_date: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 60)),
    due_date: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 45)),
    expiry_date: iso(new Date(baseDate.getTime() + 1000 * 60 * 60 * 24 * 305)),
    reviewer_id: "profile-reviewer",
    decision_log_ref: "log-aurora-hvnl",
    created_at: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 65)),
    organisation: organisations[0],
    audit_type: auditTypes[0],
    version: auditTypeVersions[0],
    reviewer: profiles[1],
    certificate,
  },
  {
    id: "audit-harbour-whs",
    org_id: "org-harbour",
    audit_type_version_id: "version-whs-2025",
    status: "InReview",
    open_date: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 10)),
    due_date: iso(new Date(baseDate.getTime() + 1000 * 60 * 60 * 24 * 14)),
    expiry_date: null,
    reviewer_id: "profile-reviewer",
    decision_log_ref: "log-harbour-whs",
    created_at: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 12)),
    organisation: organisations[1],
    audit_type: auditTypes[1],
    version: auditTypeVersions[1],
    reviewer: profiles[1],
    certificate: null,
  },
  {
    id: "audit-aurora-whs",
    org_id: "org-aurora",
    audit_type_version_id: "version-whs-2025",
    status: "AwaitingEvidence",
    open_date: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 5)),
    due_date: iso(new Date(baseDate.getTime() + 1000 * 60 * 60 * 24 * 25)),
    expiry_date: null,
    reviewer_id: null,
    decision_log_ref: null,
    created_at: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 7)),
    organisation: organisations[0],
    audit_type: auditTypes[1],
    version: auditTypeVersions[1],
    reviewer: null,
    certificate: null,
  },
];

export const evidenceSubmissions: EvidenceSubmission[] = [
  {
    id: "sub-1",
    audit_id: "audit-harbour-whs",
    submitted_by: "profile-harbour",
    submitted_at: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 2)),
    notes: "Initial upload of WHS documents",
  },
  {
    id: "sub-2",
    audit_id: "audit-aurora-whs",
    submitted_by: "profile-aurora",
    submitted_at: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 1)),
    notes: "Training records uploaded",
  },
];

export const artifacts: Artifact[] = [
  {
    id: "artifact-1",
    audit_id: "audit-harbour-whs",
    submission_id: "sub-1",
    parent_artifact_id: null,
    kind: "original",
    storage_path: "evidence/audit-harbour-whs/harbour-whs.zip",
    size_bytes: 2_500_000,
    sha256: "sha256-harbour",
    page_ranges: null,
    text_indexed: true,
    created_at: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 2)),
  },
  {
    id: "artifact-1-ocr",
    audit_id: "audit-harbour-whs",
    submission_id: "sub-1",
    parent_artifact_id: "artifact-1",
    kind: "ocr_text",
    storage_path: "derived/audit-harbour-whs/harbour-whs.txt",
    size_bytes: 54_000,
    sha256: "sha256-harbour-ocr",
    page_ranges: null,
    text_indexed: true,
    created_at: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 2 + 45 * 60 * 1000)),
  },
];

export const findings: Finding[] = [
  {
    id: "finding-1",
    audit_id: "audit-harbour-whs",
    criterion_key: "incident_management",
    level: "MinorNC",
    rationale: "Incident registers missing for two quarters.",
    citations: [{ artifactId: "artifact-1", page: 4 }],
    created_by: "profile-reviewer",
    updated_by: "profile-reviewer",
    created_at: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24)),
    updated_at: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24)),
  },
  {
    id: "finding-2",
    audit_id: "audit-aurora-hvnl",
    criterion_key: "fatigue",
    level: "Compliant",
    rationale: "Driver rosters meet fatigue requirements.",
    citations: [{ artifactId: "artifact-1", page: 2 }],
    created_by: "profile-reviewer",
    updated_by: "profile-reviewer",
    created_at: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 18)),
    updated_at: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 18)),
  },
];

export const payments: Payment[] = [
  {
    id: "payment-aurora-renewal",
    org_id: "org-aurora",
    audit_id: "audit-aurora-whs",
    stripe_payment_intent_id: "pi_aurora_whs",
    amount_aud: 2800,
    status: "Succeeded",
    receipt_url: "https://pay.stripe.example/receipt/aurora",
    created_at: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 3)),
  },
  {
    id: "payment-harbour-hvnl",
    org_id: "org-harbour",
    audit_id: null,
    stripe_payment_intent_id: "pi_harbour_hvnl",
    amount_aud: 3500,
    status: "RequiresPaymentMethod",
    receipt_url: "",
    created_at: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 1)),
  },
];

export const emailTemplates: EmailTemplate[] = [
  {
    id: "email-renewal",
    key: "renewal_notice",
    name: "Renewal reminder",
    version: "2025.1",
    mode: "HTML",
    html: "<p>Hi {{user.firstName}}, your certificate expires on {{certificate.expiryDate}}.</p>",
    text: null,
    variables: [
      "user.firstName",
      "certificate.expiryDate",
      "audit.typeName",
    ],
    status: "Active",
  },
  {
    id: "email-analysis",
    key: "analysis_ready",
    name: "Analysis ready",
    version: "2025.1",
    mode: "HTML",
    html: "<p>Automated analysis completed for {{audit.typeName}}.</p>",
    text: null,
    variables: ["audit.typeName", "today"],
    status: "Active",
  },
];

export const docxTemplates: DocxTemplate[] = [
  {
    id: "docx-hvnl-cert",
    name: "HVNL Certificate",
    version: "2025.1",
    storage_path: "templates/hvnl-cert.docx",
    placeholder_summary: "Certificate template with QR placeholder",
    status: "Active",
    audit_type_id: "audit-hvnl",
  },
  {
    id: "docx-whs-cert",
    name: "WHS Certificate",
    version: "2025.1",
    storage_path: "templates/whs-cert.docx",
    placeholder_summary: "WHS certificate with metadata table",
    status: "Active",
    audit_type_id: "audit-whs",
  },
];

export const auditTrail: AuditTrailEntry[] = [
  {
    id: "trail-1",
    actor_user_id: "profile-reviewer",
    action: "status.update",
    entity: "audits",
    entity_id: "audit-harbour-whs",
    before: { status: "AwaitingEvidence" },
    after: { status: "InReview" },
    created_at: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 2)),
  },
  {
    id: "trail-2",
    actor_user_id: "profile-reviewer",
    action: "certificate.issue",
    entity: "audits",
    entity_id: "audit-aurora-hvnl",
    before: null,
    after: { certificate_number: certificate.number },
    created_at: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 20)),
  },
];

export const uploads: UploadSummary[] = [
  {
    id: "upload-1",
    filename: "aurora-fatigue-register.pdf",
    status: "Completed",
    uploaded_at: iso(new Date(baseDate.getTime() - 1000 * 60 * 60 * 24 * 1)),
    notes: "Processed by OCR pipeline",
  },
  {
    id: "upload-2",
    filename: "harbour-safety.zip",
    status: "Processing",
    uploaded_at: iso(now),
    notes: "Awaiting AV scan",
  },
];

export const runtimeSettings: RuntimeSetting[] = [
  {
    key: "renewal.defaultReminderDays",
    value: "30",
    description: "Default days before expiry for renewal reminder",
  },
  {
    key: "uploads.maxFileSizeGb",
    value: "2",
    description: "Maximum single file size in gigabytes",
  },
];

export const templateCategories: TemplateCategory[] = [
  {
    key: "renewals",
    label: "Renewals",
    description: "Client facing communications for certificate renewals",
  },
  {
    key: "analysis",
    label: "Analysis",
    description: "Notifications triggered after automated analysis",
  },
];

export const verificationResults: Record<string, CertificateVerificationResult> = {
  "token-aurora-hvnl": {
    number: certificate.number,
    status: certificate.status,
    issued_at: certificate.issued_at,
    organisation_name: organisations[0].legal_name,
    audit_type_name: auditTypes[0].name,
    expiry_date: audits[0].expiry_date,
  },
};
