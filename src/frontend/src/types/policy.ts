export type PolicyType = 'access_privacy' | 'data_quality' | 'retention_lifecycle' | 'usage_purpose' | 'custom';
export type PolicyStatus = 'draft' | 'active' | 'deprecated' | 'archived';
export type EnforcementLevel = 'advisory' | 'mandatory' | 'automated';

export interface PolicyAttachment {
  id: string;
  policy_id: string;
  target_type: string;
  target_id: string;
  target_name?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface PolicyRead {
  id: string;
  name: string;
  description?: string | null;
  policy_type: PolicyType;
  status: PolicyStatus;
  content?: string | null;
  enforcement_level: EnforcementLevel;
  version?: string | null;
  metadata?: Record<string, any> | null;
  is_system: boolean;
  attachments: PolicyAttachment[];
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PolicyCreate {
  name: string;
  description?: string | null;
  policy_type: PolicyType;
  status?: PolicyStatus;
  content?: string | null;
  enforcement_level?: EnforcementLevel;
  version?: string | null;
  metadata?: Record<string, any> | null;
  is_system?: boolean;
  attachments?: { target_type: string; target_id: string; target_name?: string; notes?: string }[];
}

export interface PolicyUpdate {
  name?: string | null;
  description?: string | null;
  policy_type?: PolicyType | null;
  status?: PolicyStatus | null;
  content?: string | null;
  enforcement_level?: EnforcementLevel | null;
  version?: string | null;
  metadata?: Record<string, any> | null;
  is_system?: boolean | null;
}
