import { ActionCreatorWithPayload, AnyAction, ThunkDispatch } from "@reduxjs/toolkit";
import { RootState } from "./types";

export function handleAxiosError(
  e: unknown,
  dispatch: ThunkDispatch<RootState, unknown, AnyAction>,
  failureAction: ActionCreatorWithPayload<Error, string>,
) {
  if (e instanceof Error) {
    dispatch(failureAction(e));
  } else {
    throw e;
  }
}
