import { ActionCreatorWithoutPayload, ActionCreatorWithPayload } from "@reduxjs/toolkit";
import { AxiosResponse } from "axios";
import { AnyAction } from "redux";
import { ThunkAction, ThunkDispatch } from "redux-thunk";
import { ListFetchSuccessPayload, ListRequestSuccessPayload } from "./types";
import { RootState } from "@/redux/types";
import { handleAxiosError } from "@/redux/util";

const DEFAULT_POLLING_DELAY = 3_000;

interface CommonAsyncAction {
  fetchRequest: ActionCreatorWithoutPayload<string>;
  fetchFailure: ActionCreatorWithPayload<Error, string>;
}

type PayloadValidationFunction<Payload> = (payload: Payload) => boolean;

interface CommonMakeThunkActionProps<PayloadType> {
  payloadValidationFunction?: PayloadValidationFunction<PayloadType>;
  useApiPolling?: boolean;
  getKeepPollingFunction?: (state: RootState, payload: PayloadType) => boolean;
  minPollingInterval?: number;
}

export type GenericThunkAction = ThunkAction<void, RootState, unknown, AnyAction>;

async function makeApiCallAndFetchActions<PayloadType, ResponseType, ActionResponseType>({
  useApiPolling,
  handleApiCall,
  getKeepPollingFunction,
  getDataFromApiResponse,
  actions: { fetchSuccess, fetchFailure },
  payload,
  dispatch,
  getState,
  minPollingInterval,
}: Pick<
  CommonMakeThunkActionProps<PayloadType>,
  | "useApiPolling"
  | "getKeepPollingFunction"
  | "minPollingInterval"
> & {
  handleApiCall: () => Promise<AxiosResponse<ResponseType>>;
  getDataFromApiResponse: (apiResponse: AxiosResponse<ResponseType>) => ActionResponseType;
  actions: {
    fetchSuccess: ActionCreatorWithPayload<ActionResponseType, string>;
    fetchFailure: ActionCreatorWithPayload<Error, string>;
  };
  payload: PayloadType;
  dispatch: ThunkDispatch<RootState, unknown, AnyAction>;
  getState: () => RootState;
}) {
  try {
    const handleCheckKeepPolling = (state: RootState) =>
      getKeepPollingFunction ? getKeepPollingFunction(state, payload!) : true;

    const response = await (useApiPolling
      ? getApiPollingResponse({
        getResponseFunction: handleApiCall,
        getKeepPollingFunction: handleCheckKeepPolling,
        getState,
        minPollingInterval,
      })
      : getApiResponse(handleApiCall));

    dispatch(fetchSuccess(getDataFromApiResponse(response)));
  } catch (error: unknown) {
    handleAxiosError(error, dispatch, fetchFailure);
  }
}

type ResponseTypeWithPendingData<ResponseType> = ResponseType & {
  is_pending?: boolean;
};

async function getApiPollingResponse<ResponseType>({
  minPollingInterval = DEFAULT_POLLING_DELAY,
  getResponseFunction,
  getKeepPollingFunction,
  getState,
}: {
  minPollingInterval?: number;
  getResponseFunction: () => Promise<AxiosResponse<ResponseType>>;
  getKeepPollingFunction: (state: RootState) => boolean;
  getState: () => RootState;
}) {
  const pollingPage = window.location.pathname;
  let pollResponse;
  let pollFinishied = false;

  while (!pollFinishied || !pollResponse) {
    const poll = getResponseFunction();

    const pollDealy = new Promise((resolve) => setTimeout(resolve, minPollingInterval));

    pollResponse = await poll;

    const isPolling =
      pollResponse.status === 204 ||
      (typeof pollResponse.data === "object" &&
        (pollResponse.data as ResponseTypeWithPendingData<ResponseType>).is_pending);

    if (isPolling && getKeepPollingFunction(getState()) && window.location.pathname === pollingPage) {
      await pollDealy;
    } else {
      pollFinishied = true;
      break;
    }
  }

  return pollResponse;
}

async function getApiResponse<ResponseType>(getResponseFunction: () => Promise<AxiosResponse<ResponseType>>) {
  const reqPromise = getResponseFunction();

  const minimumDelay = new Promise((resolve) => setTimeout(resolve, 300));

  const [reqResponse] = await Promise.all([reqPromise, minimumDelay]);

  return reqResponse;
}

export type GetListResponseFromRestApiClientFunction<ResponseType, PayloadType> = (
  functionArguments: {
    state: RootState;
    dispatch: ThunkDispatch<RootState, unknown, AnyAction>;
  },
  payload: PayloadType,
) => Promise<AxiosResponse<ResponseType[]>>;

interface MakeFetchMoreListThunkActionProps<ResponseType, PayloadType> extends CommonMakeThunkActionProps<PayloadType> {
  getResponseListFunction: GetListResponseFromRestApiClientFunction<ResponseType, PayloadType>;
}

interface ListAsyncAction<ResponseType> extends CommonAsyncAction {
  fetchSuccess: ActionCreatorWithPayload<ListFetchSuccessPayload<ResponseType>, string>;
}

export function makeFetchMoreListThunkAction<ResponseType, PayloadType>(
  { fetchRequest, ...actions }: ListAsyncAction<ResponseType>,
  {
    payloadValidationFunction,
    getResponseListFunction,
    ...props
  }: MakeFetchMoreListThunkActionProps<ResponseType, PayloadType>,
): (payload: PayloadType) => GenericThunkAction {
  return (payload) => async (dispatch, getState) => {
    if (payloadValidationFunction && !payloadValidationFunction(payload)) {
      return;
    }

    dispatch(fetchRequest());

    const handleApiCall = () =>
      getResponseListFunction(
        {
          state: getState(),
          dispatch,
        },
        payload!,
      );

    const getDataFromApiResponse = ({ headers, data }: AxiosResponse<ResponseType[]>) => {
      const totalCount = headers["x-total-count"];

      return {
        list: data,
        totalCount,
      };
    };

    await makeApiCallAndFetchActions<PayloadType, ResponseType[], ListFetchSuccessPayload<ResponseType>>({
      actions,
      payload,
      dispatch,
      getState,
      handleApiCall,
      getDataFromApiResponse,
      ...props,
    });
  };
}

export type GetResponseFromRestApiClientFunction<ResponseType, PayloadType> = (
  functionArguments: {
    state: RootState;
    dispatch: ThunkDispatch<RootState, unknown, AnyAction>;
  },
  payload: PayloadType,
) => Promise<AxiosResponse<ResponseType>>;

interface MakeFetchThunkActionProps<ResponseType, PayloadType> extends CommonMakeThunkActionProps<PayloadType> {
  getResponseFunction: GetResponseFromRestApiClientFunction<ResponseType, PayloadType>;
}

interface AsyncAction<ResponseType> extends CommonAsyncAction {
  fetchSuccess: ActionCreatorWithPayload<ResponseType, string>;
}

export function makeFetchThunkAction<ResponseType, PayloadType>(
  { fetchRequest, ...actions }: AsyncAction<ResponseType>,
  { payloadValidationFunction, getResponseFunction, ...props }: MakeFetchThunkActionProps<ResponseType, PayloadType>,
): (payload: PayloadType) => GenericThunkAction {
  return (payload) => async (dispatch, getState) => {
    if (payloadValidationFunction && !payloadValidationFunction(payload)) {
      return;
    }

    dispatch(fetchRequest());

    const handleApiCall = () =>
      getResponseFunction(
        {
          state: getState(),
          dispatch,
        },
        payload,
      );

    const getDataFromApiResponse = ({ data }: AxiosResponse<ResponseType>) => data;

    await makeApiCallAndFetchActions<PayloadType, ResponseType, ResponseType>({
      actions,
      payload,
      dispatch,
      getState,
      handleApiCall,
      getDataFromApiResponse,
      ...props,
    });
  };
}

export function getListRequestSuccessPayloadFromResponse<ItemType>(
  { data }: AxiosResponse<ItemType[]>,
): ListRequestSuccessPayload<ItemType> {
  return {
    list: data,
  };
}
