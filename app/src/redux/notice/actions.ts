import { mergeAsyncAction } from "@/utils/redux/actions";
import { noticeSlice } from "./slice";

const actions = noticeSlice.actions;

export const {
  reset: resetNoticeState,
  resetNoticeCreateState,
  resetNoticeUpdateState,
  resetNoticeListState,
} = actions;

export const fetchNoticeList = mergeAsyncAction(actions, "noticeList");

export const createNotice = mergeAsyncAction(actions, "createNotice");

export const updateNotice = mergeAsyncAction(actions, "updateNotice");

export const fetchNoticeDetailImage = mergeAsyncAction(actions, "noticeDetailImage");
