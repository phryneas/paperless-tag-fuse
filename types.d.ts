export interface Tag {
  id: number;
  slug: string;
  name: string;
}

export interface ApiDocument {
  id: number;
  tags: number[];
  archived_file_name: string;
  created: string;
  modified: string;
  added: string;
}

export interface ApiDocumentMetadata {
  media_filename: string;
  original_filename: string;
}

export interface Document extends ApiDocument, ApiDocumentMetadata {}

export interface File {
  id: string;
  fileName: string;
  realPath: string;
  created: Date;
  added: Date;
  tags: number[];
  displayName: string;
}

export interface EventMap {
  added_tags: [Tag[]];
  updated_all_tag_ids: [number[]];
  added_documents: [Document[]];
  updated_all_document_ids: [number[]];
}
