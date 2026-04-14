import { getKeyListFromState, getTypedAsyncInitialState, getTypedAsyncListInitialState } from "@/utils/redux/state";
import { makeAsyncStateResetReducer, makeTypedAsyncReducer } from "@/utils/redux/reducer";
import { createSlice } from "@reduxjs/toolkit";
import { NoticeRequest, NoticeResponse } from "@witu/api-client";
import { NoticeState } from "./types";
import { ListFetchSuccessPayload } from "@/utils/redux/types";

const getAsyncInitialState = getTypedAsyncInitialState<NoticeState>();
const getAsyncListInitialState = getTypedAsyncListInitialState<NoticeState>();
const makeAsyncReducer = makeTypedAsyncReducer<NoticeState>();

const initialState: NoticeState = {
  ...getAsyncListInitialState("noticeList"),
  ...getAsyncInitialState("noticeDetailImage"),
  createNoticeFetchState: null,
  updateNoticeFetchState: null,
};

export const NOTICE_STATE_KEY_LIST = getKeyListFromState(initialState);

export const noticeSlice = createSlice({
  name: "notice",
  initialState,
  reducers: {
    reset: () => initialState,
    resetNoticeCreateState: (state) => { state.createNoticeFetchState = "READY" },
    resetNoticeUpdateState: (state) => { state.updateNoticeFetchState = "READY" },
    resetNoticeListState: makeAsyncStateResetReducer(initialState, "noticeList"),
    ...makeAsyncReducer<"noticeList", void, ListFetchSuccessPayload<NoticeResponse>>("noticeList", { useListSuccessReducer: true }),
    ...makeAsyncReducer("createNotice"),
    ...makeAsyncReducer("updateNotice"),
    ...makeAsyncReducer<"noticeDetailImage", void, string>("noticeDetailImage"),
  },
});

export const noticeReducer = noticeSlice.reducer;
