import { Draft, PayloadAction } from "@reduxjs/toolkit";
import { ReadonlyArrayElement, ListFetchSuccessPayload } from "./types";
import { FetchState } from "@/interfaces/fetch";
import { capitalize } from "@/utils/text";

export function setValueReducer<StateType, Key extends keyof StateType>(
  key: Key,
): (state: StateType, { payload }: PayloadAction<StateType[Key]>) => void {
  return (state, { payload }) => {
    state[key] = payload;
  };
}

type PartialReducer<StateType, KeyArray extends Array<keyof StateType> = []> = {
  [Key in ReadonlyArrayElement<KeyArray> as `set${Capitalize<string & Key>}`]: (
    state: Draft<StateType>,
    action: PayloadAction<StateType[Key]>,
  ) => void;
};

export function setValueReducerList<StateType, KeyList extends Array<keyof StateType> = []>(
  keyList: KeyList,
  _state?: StateType,
): PartialReducer<StateType, KeyList> {
  return keyList.reduce((prev, key) => {
    const reducerKey = `set${capitalize(key.toString())}`;
    return {
      ...prev,
      [reducerKey]: setValueReducer<StateType, typeof key>(key),
    };
  }, {} as PartialReducer<StateType, KeyList>);
}

type AsyncReducerMap<Key extends string, RequestReducer, SuccessReducer, FailureReducer> = {
  [RequestKey in Key as `${Key}FetchRequest`]: RequestReducer;
} &
  { [SuccessKey in Key as `${Key}FetchSuccess`]: SuccessReducer } &
  {
    [FailureKey in Key as `${Key}FetchFailure`]: FailureReducer;
  };

type ActionReducer<StateType> = (state: Draft<StateType>) => void;

export function AsyncActionReducer<Key extends string, StateType, Reducer = ActionReducer<StateType>>(
  key: Key,
  requestReducer: Reducer,
  successReducer: Reducer,
  failureReducer: Reducer,
) {
  return {
    [`${key}FetchRequest`]: requestReducer,
    [`${key}FetchSuccess`]: successReducer,
    [`${key}FetchFailure`]: failureReducer,
  } as AsyncReducerMap<Key, Reducer, Reducer, Reducer>;
}

function getFetchStateReducer<StateType, Key extends string>(key: Key, fetchState: FetchState) {
  return (state: Draft<StateType>) => {
    (state[`${key}FetchState` as keyof Draft<StateType>] as FetchState) = fetchState;
  };
}

function CheckStateAndSetValue<StateType, Key extends keyof StateType, Value = StateType[Key]>(
  state: Draft<StateType>,
  key: Key,
  value: Value,
  warn?: boolean,
) {
  if (typeof state[`key` as keyof Draft<StateType>] !== "undefined" && process.env.NODE_ENV === "development") {
    if (warn) {
      // eslint-disable-next-line no-console
      console.warn(`${String(key)} state is not defined`);

      return;
    }
    throw Error(`${String(key)} state is not defined`);
  }

  (state[`${String(key)}` as keyof Draft<StateType>] as any) = value;
}

function getFetchSuccessReducer<StateType, Key extends string, PayloadType>(key: Key, onlyFetchState?: boolean) {
  return (state: Draft<StateType>, { payload }: PayloadAction<PayloadType>) => {
    if (!onlyFetchState) {
      CheckStateAndSetValue(state, `${key}` as keyof StateType, payload, true);
    }
    CheckStateAndSetValue(state, `${key}FetchState` as keyof StateType, "SUCCESS");
  };
}

function getListFetchSuccessReducer<
  StateType,
  Key extends string,
  ResponseType,
  PayloadType extends ListFetchSuccessPayload<ResponseType>,
>(key: Key) {
  return (state: Draft<StateType>, { payload }: PayloadAction<PayloadType>) => {
    CheckStateAndSetValue(state, `${key}` as keyof StateType, payload.list);
    CheckStateAndSetValue(state, `${key}FetchState` as keyof StateType, "SUCCESS");
    CheckStateAndSetValue(state, `${key}TotalCount` as keyof StateType, payload.totalCount);
  };
}

type PayloadActionReducer<StateType, PayloadType> = (
  state: Draft<StateType>,
  payloadAction: PayloadAction<PayloadType>,
) => void;

interface AsyncReducerOptions<RequestReducer, SuccessReducer, FailureReducer> {
  requestReducer?: RequestReducer;
  successReducer?: SuccessReducer;
  failureReducer?: FailureReducer;
  useListSuccessReducer?: boolean;
  onlyFetchState?: boolean;
}

export function makeAsyncReducer<
  StateType,
  Key extends string,
  RequestActionPayload = void,
  SuccessActionPayload = void,
  FailureActionPayload = Error,
  RequestReducer = PayloadActionReducer<StateType, RequestActionPayload>,
  SuccessReducer = PayloadActionReducer<StateType, SuccessActionPayload>,
  FailureReducer = PayloadActionReducer<StateType, FailureActionPayload>,
>(
  key: Key,
  {
    requestReducer,
    successReducer,
    useListSuccessReducer,
    failureReducer,
    onlyFetchState,
  }: AsyncReducerOptions<RequestReducer, SuccessReducer, FailureReducer> = {},
) {
  const fetchStateReducer = (fetchState: FetchState) => getFetchStateReducer<StateType, Key>(key, fetchState);

  const fetchSuccessReducer = useListSuccessReducer
    ? getListFetchSuccessReducer(key)
    : getFetchSuccessReducer<StateType, Key, SuccessActionPayload>(key, onlyFetchState);

  return {
    [`${key}FetchRequest`]: requestReducer ?? fetchStateReducer("FETCHING"),
    [`${key}FetchSuccess`]: successReducer ?? fetchSuccessReducer,
    [`${key}FetchFailure`]: failureReducer ?? fetchStateReducer("FAILURE"),
  } as AsyncReducerMap<Key, RequestReducer, SuccessReducer, FailureReducer>;
}

export function makeTypedAsyncReducer<StateType>() {
  return <
    Key extends string,
    RequestActionPayload = void,
    SuccessActionPayload = void,
    FailureActionPayload = Error,
    RequestReducer = PayloadActionReducer<StateType, RequestActionPayload>,
    SuccessReducer = PayloadActionReducer<StateType, SuccessActionPayload>,
    FailureReducer = PayloadActionReducer<StateType, FailureActionPayload>,
  >(
    key: Key,
    options: AsyncReducerOptions<RequestReducer, SuccessReducer, FailureReducer> = {},
  ) =>
    makeAsyncReducer<
      StateType,
      Key,
      RequestActionPayload,
      SuccessActionPayload,
      FailureActionPayload,
      RequestReducer,
      SuccessReducer,
      FailureReducer
    >(key, options);
}

export function makeStateResetReducer<StateType, DraftState extends Draft<StateType>>(
  initialState: DraftState,
  stateKey: keyof DraftState | Array<keyof DraftState>,
) {
  return (state: DraftState) => {
    const stateKeyList = typeof stateKey === "object" ? stateKey : [stateKey];

    for (const key of stateKeyList) {
      state[key] = initialState[key];
    }
  };
}

interface MakeAsyncStateResetReducerOptions<StateType> {
  isList?: boolean;
  valueSuffix?: string;
  extraStateKey?: keyof StateType | Array<keyof StateType>;
}

export function makeAsyncStateResetReducer<
  StateType,
  DraftState extends Draft<StateType>,
  StateKey extends keyof DraftState,
>(
  initialState: DraftState,
  stateKey: keyof DraftState | Array<keyof DraftState>,
  options?: MakeAsyncStateResetReducerOptions<DraftState>,
) {
  const { isList = false, valueSuffix = "", extraStateKey = [] } = options ?? {};
  const extraStateKeyList = typeof extraStateKey === "object" ? extraStateKey : [extraStateKey];
  const valueStateKeyList = typeof stateKey === "object" ? stateKey : [stateKey];

  return (state: DraftState) => {
    const stateKeyList = valueStateKeyList.reduce<Array<keyof DraftState>>((prevKeyList, key) => {
      const stringKey = key.toString();

      let keyList = [`${stringKey}${valueSuffix}`, `${stringKey}FetchState`];

      if (isList) {
        keyList = [...keyList, `${stringKey}Page`, `${stringKey}TotalPage`, `${stringKey}Count`];
      }

      return [...prevKeyList, ...keyList] as Array<keyof DraftState>;
    }, extraStateKeyList);

    for (const key of stateKeyList) {
      state[key as StateKey] = initialState[key as StateKey];
    }
  };
}
