import { FetchState } from "@/interfaces/fetch";

export interface ListFetchSuccessPayload<ResponseType> {
  list: ResponseType[];
  totalCount: number;
}

export interface ListRequestSuccessPayload<ItemType> {
  list: ItemType[];
}

export type CommonAsyncState<Key extends string | number, ResponseType> = {
  [ResponseKey in Key]: ResponseType | null;
} &
  {
    [FetchStateKey in Key as `${Key}FetchState`]: FetchState;
  };

export type CommonListAsyncState<Key extends string | number, ResponseType> = CommonAsyncState<Key, ResponseType> &
  {
    [FetchStateKey in Key as `${Key}Page`]: number | null;
  } &
  {
    [FetchStateKey in Key as `${Key}TotalPage`]: number | null;
  } &
  {
    [FetchStateKey in Key as `${Key}TotalCount`]: number | null;
  };

export type WithString<T> = T | string;

export type ArrayElement<ArrayType extends unknown[]> = ArrayType extends Array<infer ElementType>
  ? ElementType
  : never;

export type ReadonlyArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends ReadonlyArray<
  infer ElementType
>
  ? ElementType
  : never;
