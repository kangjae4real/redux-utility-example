import { CaseReducerActions, SliceCaseReducers } from "@reduxjs/toolkit";
import { ArrayElement } from "./types";

export interface MergedAsyncAction<
  ReducerType extends string,
  ActionType extends CaseReducerActions<SliceCaseReducers<ReducerType>, ReducerType>,
  ActionKeyType extends string,
> {
  fetchRequest: ActionType[`${ActionKeyType}FetchRequest`];
  fetchSuccess: ActionType[`${ActionKeyType}FetchSuccess`];
  fetchFailure: ActionType[`${ActionKeyType}FetchFailure`];
}

export function mergeAsyncAction<
  ReducerType extends string,
  ActionType extends CaseReducerActions<SliceCaseReducers<ReducerType>, ReducerType>,
  ActionKeyType extends string,
>(actions: ActionType, asyncActionName: ActionKeyType): MergedAsyncAction<ReducerType, ActionType, ActionKeyType> {
  return {
    fetchRequest: actions[`${asyncActionName}FetchRequest`],
    fetchSuccess: actions[`${asyncActionName}FetchSuccess`],
    fetchFailure: actions[`${asyncActionName}FetchFailure`],
  };
}

export function mergeAsyncActionList<
  ReducerType extends string,
  ActionType extends CaseReducerActions<SliceCaseReducers<ReducerType>, ReducerType>,
  ActionKeyTypeList extends string[],
>(actions: ActionType, asyncActionNameList: ActionKeyTypeList) {
  const result = asyncActionNameList.reduce(
    (prev, key) => {
      return {
        ...prev,
        [key]: mergeAsyncAction(actions, key),
      };
    },
    {} as {
      [ActionKey in ArrayElement<ActionKeyTypeList>]: MergedAsyncAction<ReducerType, ActionType, ActionKey>;
    },
  );

  return result;
}
