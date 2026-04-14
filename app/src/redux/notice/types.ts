import { FetchState } from "@/interfaces/fetch";
import { CommonAsyncState, CommonListAsyncState } from "@/utils/redux/types";
import { NoticeRequest, NoticeResponse } from "@witu/api-client";

export interface NoticeState
  extends CommonListAsyncState<"noticeList", NoticeResponse[]>,
    CommonAsyncState<"noticeDetailImage", string> {
  createNoticeFetchState: FetchState | null;
  updateNoticeFetchState: FetchState | null;
}

export interface NoticeListRequestPayload {
  isPublic: boolean;
  page: number;
  pageSize: number;
  title?: string;
  isReleased?: boolean;
  createdDateStart?: string;
  createdDateEnd?: string;
}
