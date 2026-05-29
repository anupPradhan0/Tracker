export interface PaginationInput {
  page: number;
  limit: number;
}

export function getPaginationSkip({ page, limit }: PaginationInput): number {
  return (page - 1) * limit;
}

export function getTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit) || 1;
}
