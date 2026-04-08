export type UserFilter = {
  login: string;
};

export const isUserFilter = (obj: unknown): obj is Partial<UserFilter> => {
  return obj !== null && typeof obj === 'object' && 'login' in obj;
};

export interface IGetUsersParams {
  pagination: boolean;
  limit: number;
  page: number;
  filter?: UserFilter;
}

export const defaultGetUsersParams: IGetUsersParams = {
  pagination: true,
  page: 1,
  limit: 10,
};
