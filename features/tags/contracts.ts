export interface Tag {
  readonly id: string;
  readonly name: string;
  readonly color: string | null;
  readonly icon: string | null;
}

export interface TagListResponse {
  readonly tags: readonly Tag[];
}

export interface CreateTagCommand {
  readonly name: string;
  readonly color?: string | null;
  readonly icon?: string | null;
}

export interface UpdateTagCommand {
  readonly tagId: string;
  readonly name: string;
  readonly color?: string | null;
  readonly icon?: string | null;
}
