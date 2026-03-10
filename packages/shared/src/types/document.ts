export interface Document {
  id: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  content: string;
  version_number: number;
  created_at?: string;
}
