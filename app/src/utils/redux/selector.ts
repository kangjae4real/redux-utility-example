import { ArrayElement } from "./types";
import { FetchState } from "@/interfaces/fetch";
import { RootState } from "@/redux/types";
import { capitalize } from "@/utils/text";

type SubStateSelectorMap<
  SubStateKey extends keyof RootState,
  SubState extends RootState[SubStateKey] = RootState[SubStateKey],
> = {
  [Key in keyof SubState as `get${Capitalize<string & Key>}`]: (rootState: RootState) => SubState[Key];
};

export function makeSubStateSelectorMap<SubStateKey extends keyof RootState, SubState extends RootState[SubStateKey]>(
  subStateKey: SubStateKey,
  singleStateKeyList: Array<keyof SubState>,
) {
  const result = singleStateKeyList.reduce((prev, key) => {
    return {
      ...prev,
      [`get${capitalize(key.toString())}`]: ({ [subStateKey]: { [key]: state } }: RootState) => state,
    };
  }, {} as SubStateSelectorMap<SubStateKey>);

  return result;
}

interface CommonAsyncState<ValueType> {
  value: ValueType;
  fetchState: FetchState;
}

interface CommonAsyncListState<ValueType> extends CommonAsyncState<ValueType> {
  page: number | null;
  totalCount: number | null;
  totalPage: number | null;
}

export function makeAsyncStateSelector<
  SubStateKey extends keyof RootState,
  SubState extends RootState[SubStateKey],
  SingleStateKey extends keyof SubState,
  SingleState extends SubState[SingleStateKey],
>(subStateKey: SubStateKey, singleStateKey: SingleStateKey) {
  return ({
    [subStateKey]: {
      [singleStateKey]: value,
      [`${singleStateKey.toString()}FetchState` as keyof SubState]: fetchState,
    },
  }: RootState) =>
    ({
      value,
      fetchState,
    } as unknown as CommonAsyncState<SingleState>);
}

export function makeAsyncListStateSelector<
  SubStateKey extends keyof RootState,
  SubState extends RootState[SubStateKey],
  SingleStateKey extends keyof SubState,
  SingleState extends SubState[SingleStateKey],
>(subStateKey: SubStateKey, singleStateKey: SingleStateKey) {
  return ({
    [subStateKey]: {
      [singleStateKey]: value,
      [`${singleStateKey.toString()}FetchState` as keyof SubState]: fetchState,
      [`${singleStateKey.toString()}TotalCount` as keyof SubState]: totalCount,
    },
  }: RootState) =>
    ({
      value,
      fetchState,
      totalCount,
    } as unknown as CommonAsyncListState<SingleState>);
}

export function makeAsyncStateSelectorMap<
  SubStateKey extends keyof RootState,
  SubState extends RootState[SubStateKey],
  SingleStateKeyList extends Array<keyof SubState>,
>(subStateKey: SubStateKey, singleStateKeyList: SingleStateKeyList) {
  const result = singleStateKeyList.reduce((prev, key) => {
    return {
      ...prev,
      [`get${capitalize(key.toString())}State`]: makeAsyncStateSelector(subStateKey, key as any),
    };
  }, {} as { [Key in ArrayElement<SingleStateKeyList> as `get${Capitalize<string & Key>}State`]: (rootState: RootState) => CommonAsyncState<SubState[Key]> });

  return result;
}

export function makeAsyncListStateSelectorMap<
  SubStateKey extends keyof RootState,
  SubState extends RootState[SubStateKey],
  SingleStateKeyList extends Array<keyof SubState>,
>(subStateKey: SubStateKey, singleStateKeyList: SingleStateKeyList) {
  const result = singleStateKeyList.reduce((prev, key) => {
    return {
      ...prev,
      [`get${capitalize(key.toString())}State`]: makeAsyncListStateSelector(subStateKey, key as any),
    };
  }, {} as { [Key in ArrayElement<SingleStateKeyList> as `get${Capitalize<string & Key>}State`]: (rootState: RootState) => CommonAsyncListState<SubState[Key]> });

  return result;
}
