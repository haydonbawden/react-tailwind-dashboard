export type UserRole = "Admin" | "Reviewer" | "ClientRep";

type BaseModel = Record<string, unknown>;

export interface Organisation extends BaseModel {
  id: string;
  abn: string;
  legal_name: string;
  trading_name?: string | null;
  billing_email: string;
  status: "Active" | "Suspended" | "Archived";
  created_at: string;
}

export interface Profile extends BaseModel {
  id: string;
  user_id: string;
  org_id: string | null;
  role: UserRole;
  given_name: string;
  family_name: string;
  phone?: string | null;
  status: "Pending" | "Active" | "Inactive";
  email: string;
  created_at: string;
}

export type AuditStatus =
  | "Draft"
  | "AwaitingEvidence"
  | "InReview"
  | "ChangesRequested"
  | "Approved"
  | "Failed"
  | "Issued"
  | "Expired";

export interface AuditType extends BaseModel {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  status: "Active" | "Inactive";
}

export interface AuditTypeVersion extends BaseModel {
  id: string;
  audit_type_id: string;
  version: string;
  criteria_md: string;
  form_schema: unknown;
  analysis_prompt_template: string;
  price_aud: number;
  reminder_days: number;
  linked_docx_template_ids: string[];
  created_by: string | null;
  created_at: string;
}

export interface AuditSummary extends BaseModel {
  id: string;
  org_id: string;
  audit_type_version_id: string;
  status: AuditStatus;
  open_date: string | null;
  due_date: string | null;
  expiry_date: string | null;
  reviewer_id: string | null;
  decision_log_ref: string | null;
  created_at: string;
  organisation?: Organisation;
  audit_type?: AuditType;
  version?: AuditTypeVersion;
  reviewer?: Profile | null;
  certificate?: Certificate | null;
}

export interface EvidenceSubmission extends BaseModel {
  id: string;
  audit_id: string;
  submitted_by: string;
  submitted_at: string;
  notes?: string | null;
}

export type ArtifactKind = "original" | "ocr_text" | "split_pdf" | "page_text";

export interface Artifact extends BaseModel {
  id: string;
  audit_id: string;
  submission_id: string | null;
  parent_artifact_id: string | null;
  kind: ArtifactKind;
  storage_path: string;
  size_bytes: number;
  sha256: string;
  page_ranges: [number, number][] | null;
  text_indexed: boolean;
  created_at: string;
}

export type FindingLevel = "Compliant" | "OFI" | "MinorNC" | "MajorNC";

export interface Finding extends BaseModel {
  id: string;
  audit_id: string;
  criterion_key: string;
  level: FindingLevel;
  rationale: string;
  citations: Array<{ artifactId: string; page: number }>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Certificate extends BaseModel {
  id: string;
  audit_id: string;
  number: string;
  issued_at: string;
  pdf_path: string;
  verification_token: string;
  status: "Active" | "Revoked" | "Replaced";
  revocation_reason: string | null;
}

export interface Payment extends BaseModel {
  id: string;
  org_id: string;
  audit_id: string | null;
  stripe_payment_intent_id: string | null;
  amount_aud: number;
  status: string;
  receipt_url: string | null;
  created_at: string;
}

export interface EmailTemplate extends BaseModel {
  id: string;
  key: string;
  name: string;
  version: string;
  mode: "WYSIWYG" | "DragDrop" | "HTML";
  html: string;
  text: string | null;
  variables: string[];
  status: "Active" | "Inactive";
}

export interface DocxTemplate extends BaseModel {
  id: string;
  name: string;
  version: string;
  storage_path: string;
  placeholder_summary: string;
  status: "Active" | "Inactive";
  audit_type_id?: string | null;
}

export interface AuditTrailEntry extends BaseModel {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity: string;
  entity_id: string;
  before: unknown;
  after: unknown;
  created_at: string;
}

export interface CertificateVerificationResult extends BaseModel {
  number: string;
  status: string;
  issued_at: string;
  organisation_name: string;
  audit_type_name: string;
  expiry_date: string | null;
}

export interface UploadSummary extends BaseModel {
  id: string;
  filename: string;
  status: "Processing" | "Completed" | "Failed";
  uploaded_at: string;
  notes?: string;
}

export type RuntimeSetting = BaseModel & {
  key: string;
  value: string;
  description?: string;
};

export interface TemplateCategory extends BaseModel {
  key: string;
  label: string;
  description: string;
}
