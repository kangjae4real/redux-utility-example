import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import rootReducer from "./reducer";
import { RootState } from "./types";

const store = configureStore({
  reducer: rootReducer,
  devTools: true,
});

export default store;

export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;
