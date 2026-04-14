import { Slice, SliceCaseReducers } from "@reduxjs/toolkit";
import { CommonAsyncState, CommonListAsyncState } from "./types";

export function getStateKeysFromSlice<StateType>(slice: Slice<StateType, SliceCaseReducers<StateType>>) {
  return Object.keys(slice.caseReducers) as Array<keyof StateType>;
}

export function getKeyListFromState<StateType extends {}>(state: StateType) {
  return Object.keys(state) as Array<keyof StateType>;
}

export function getAsyncInitialState<InferState, Key extends Extract<keyof InferState, string>>(
  key: Key,
): CommonAsyncState<Key, InferState[Key]> {
  return {
    [key]: null,
    [`${key}FetchState`]: "READY",
  } as CommonAsyncState<Key, InferState[Key]>;
}

export function getTypedAsyncInitialState<InferState>() {
  return <Key extends Extract<keyof InferState, string>>(key: Key) => getAsyncInitialState<InferState, Key>(key);
}

export function getAsyncListInitialState<InferState, Key extends Extract<keyof InferState, string>>(
  key: Key,
): CommonListAsyncState<Key, InferState[Key]> {
  return {
    [key]: null,
    [`${key}FetchState`]: "READY",
    [`${key}TotalCount`]: null,
  } as CommonListAsyncState<Key, InferState[Key]>;
}

export function getTypedAsyncListInitialState<InferState>() {
  return <Key extends Extract<keyof InferState, string>>(key: Key) => getAsyncListInitialState<InferState, Key>(key);
}
