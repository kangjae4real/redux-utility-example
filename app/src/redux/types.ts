import { AnyAction, StateFromReducersMapObject, ThunkAction } from "@reduxjs/toolkit";
import rootReducer, { rootReducerMap } from "./reducer";

export type RootState = StateFromReducersMapObject<typeof rootReducerMap>;

export type Dependencies = {};

export type RootReducer = typeof rootReducer;

export type CommonThunkAction = ThunkAction<void, RootState, undefined, AnyAction>;
