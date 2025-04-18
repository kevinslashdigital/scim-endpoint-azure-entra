export interface FindOneOption {
  where: {
    id?: string;
    userName?: string;
    displayName?: string;
  };
}

export interface DeleteOption {
  id?: string;
}

export interface DeleteResponse {
  matchedCount: number;
}
