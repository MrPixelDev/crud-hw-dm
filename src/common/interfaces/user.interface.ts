import { UserFilterDto } from 'src/users/dto/profile.dto';

export type UserFilter = {
  login: string;
};

export type isUserFilter = (obj: unknown) => obj is Partial<UserFilter>;

export interface IGetUsersParams {
  pagination: boolean;
  limit: number;
  page: number;
  filter?: UserFilterDto;
}

export const defaultGetUsersParams: IGetUsersParams = {
  pagination: true,
  page: 1,
  limit: 10,
};
