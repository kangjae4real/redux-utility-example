import { makeAsyncListStateSelectorMap, makeAsyncStateSelectorMap, makeSubStateSelectorMap } from "@/utils/redux/selector";
import { NOTICE_STATE_KEY_LIST } from "./slice";

export const { getCreateNoticeFetchState, getUpdateNoticeFetchState } = makeSubStateSelectorMap("notice", NOTICE_STATE_KEY_LIST);

export const { getNoticeDetailImageState } = makeAsyncStateSelectorMap("notice", ["noticeDetailImage"]);
export const { getNoticeListState } = makeAsyncListStateSelectorMap("notice", ["noticeList"]);
