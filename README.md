# Redux Utility Example

Redux Toolkit 기반의 비동기 상태 관리를 표준화하기 위한 유틸리티 모음입니다.
반복되는 슬라이스 보일러플레이트를 제거하고, 타입 안전한 팩토리 함수를 통해 일관된 구조의 Redux 코드를 작성할 수 있습니다.

---

## 디렉토리 구조

```
app/src/
├── interfaces/
│   └── fetch.ts              # FetchState 타입 정의
├── redux/
│   ├── action.ts             # 루트 액션 모음
│   ├── reducer.ts            # 루트 리듀서
│   ├── store.ts              # Redux store 설정
│   ├── types.ts              # 전역 Redux 타입
│   ├── util.ts               # 에러 핸들링 유틸
│   └── notice/               # 슬라이스 구현 예시
│       ├── actions.ts
│       ├── selectors.ts
│       ├── slice.ts
│       ├── thunk.ts
│       └── types.ts
└── utils/
    └── redux/
        ├── actions.ts        # mergeAsyncAction
        ├── reducer.ts        # makeAsyncReducer
        ├── selector.ts       # makeAsyncStateSelectorMap
        ├── state.ts          # getAsyncInitialState
        ├── thunk.ts          # makeFetchThunkAction
        └── types.ts          # 공통 상태 타입
```

---

## 핵심 개념

### FetchState

모든 비동기 요청은 아래 4단계 상태 사이클을 따릅니다.

```ts
type FetchState = "READY" | "FETCHING" | "SUCCESS" | "FAILURE";
```

### CommonAsyncState

키(key) 하나를 기반으로 값 필드와 상태 필드를 자동으로 파생합니다.

```ts
// CommonAsyncState<"userData", User>는 아래와 같이 전개됩니다
{
  userData: User | null;
  userDataFetchState: FetchState;
}
```

### CommonListAsyncState

리스트 조회에 필요한 페이지네이션 관련 필드를 추가로 포함합니다.

```ts
// CommonListAsyncState<"noticeList", NoticeResponse[]>
{
  noticeList: NoticeResponse[] | null;
  noticeListFetchState: FetchState;
  noticeListTotalCount: number | null;
}
```

---

## 유틸리티 API

### `getTypedAsyncInitialState` / `getTypedAsyncListInitialState`

슬라이스의 `initialState`를 타입 안전하게 생성합니다.

```ts
const getAsyncInitialState = getTypedAsyncInitialState<NoticeState>();
const getAsyncListInitialState = getTypedAsyncListInitialState<NoticeState>();

const initialState: NoticeState = {
  ...getAsyncListInitialState("noticeList"),  // noticeList, noticeListFetchState, noticeListTotalCount
  ...getAsyncInitialState("noticeDetailImage"), // noticeDetailImage, noticeDetailImageFetchState
  createNoticeFetchState: null,
  updateNoticeFetchState: null,
};
```

---

### `makeTypedAsyncReducer`

키 이름 하나로 `FetchRequest` / `FetchSuccess` / `FetchFailure` 리듀서 3개를 자동 생성합니다.

```ts
const makeAsyncReducer = makeTypedAsyncReducer<NoticeState>();

// slice.reducers 내부에서 사용
reducers: {
  // noticeListFetchRequest, noticeListFetchSuccess, noticeListFetchFailure 생성
  // useListSuccessReducer: true → list, totalCount를 함께 업데이트
  ...makeAsyncReducer<"noticeList", void, ListFetchSuccessPayload<NoticeResponse>>("noticeList", {
    useListSuccessReducer: true,
  }),

  // createNoticeFetchRequest, createNoticeFetchSuccess, createNoticeFetchFailure 생성
  ...makeAsyncReducer("createNotice"),
}
```

| 옵션 | 설명 |
|---|---|
| `useListSuccessReducer` | `list`, `totalCount`를 함께 업데이트하는 리스트 전용 success 리듀서 사용 |
| `onlyFetchState` | success 시 값은 업데이트하지 않고 `FetchState`만 변경 |
| `requestReducer` / `successReducer` / `failureReducer` | 각 단계 리듀서 직접 주입 |

---

### `makeAsyncStateResetReducer`

특정 비동기 상태를 `initialState`로 초기화하는 리듀서를 생성합니다.

```ts
reducers: {
  resetNoticeListState: makeAsyncStateResetReducer(initialState, "noticeList"),
}
```

---

### `mergeAsyncAction`

슬라이스가 생성한 `{key}FetchRequest` / `{key}FetchSuccess` / `{key}FetchFailure` 액션을
하나의 객체 `{ fetchRequest, fetchSuccess, fetchFailure }`로 묶어 thunk에 전달하기 편하게 만듭니다.

```ts
// actions.ts
export const fetchNoticeList = mergeAsyncAction(actions, "noticeList");
export const createNotice    = mergeAsyncAction(actions, "createNotice");
```

---

### `makeFetchThunkAction` / `makeFetchMoreListThunkAction`

비동기 API 호출의 공통 흐름(Request → API Call → Success / Failure)을 추상화한 thunk 팩토리입니다.

```ts
// 단건 조회
export const fetchNoticeDetailImageThunk = makeFetchThunkAction<string, string>(
  fetchNoticeDetailImage,
  {
    getResponseFunction: async (_, path) => uploadFileApi.downloadFile(path),
  },
);

// 리스트 조회 (totalCount 자동 파싱)
export const fetchNoticeListThunk = makeFetchMoreListThunkAction<NoticeResponse, NoticeListRequestPayload>(
  fetchNoticeList,
  {
    getResponseListFunction: (_, { isPublic, page, pageSize, title }) =>
      noticeApi.getNoticeList(isPublic, page, pageSize, title),
  },
);
```

**공통 옵션**

| 옵션 | 설명 |
|---|---|
| `payloadValidationFunction` | `false` 반환 시 API 호출을 건너뜀 |
| `useApiPolling` | 응답이 `204` 이거나 `is_pending: true`이면 재요청 (기본 3초 간격) |
| `getKeepPollingFunction` | 폴링 지속 여부를 state 기반으로 제어 |

---

### `makeAsyncStateSelectorMap` / `makeAsyncListStateSelectorMap`

키 목록으로부터 `get{Key}State` 형태의 셀렉터 맵을 자동 생성합니다.
반환 객체는 `{ value, fetchState }` 또는 `{ value, fetchState, totalCount }` 구조입니다.

```ts
// selectors.ts
export const { getNoticeListState }        = makeAsyncListStateSelectorMap("notice", ["noticeList"]);
export const { getNoticeDetailImageState } = makeAsyncStateSelectorMap("notice", ["noticeDetailImage"]);

// 컴포넌트에서 사용
const { value, fetchState, totalCount } = useSelector(getNoticeListState);
```

단일 상태 값에 대한 셀렉터가 필요할 때는 `makeSubStateSelectorMap`을 사용합니다.

```ts
export const { getCreateNoticeFetchState } = makeSubStateSelectorMap("notice", NOTICE_STATE_KEY_LIST);
```

---

## 슬라이스 구현 예시 (notice)

위 유틸리티를 실제로 조합한 전체 슬라이스 구현 흐름입니다.

**1. 타입 정의 (`notice/types.ts`)**
```ts
export interface NoticeState
  extends CommonListAsyncState<"noticeList", NoticeResponse[]>,
    CommonAsyncState<"noticeDetailImage", string> {
  createNoticeFetchState: FetchState | null;
  updateNoticeFetchState: FetchState | null;
}
```

**2. 슬라이스 생성 (`notice/slice.ts`)**
```ts
const makeAsyncReducer = makeTypedAsyncReducer<NoticeState>();

export const noticeSlice = createSlice({
  name: "notice",
  initialState,
  reducers: {
    reset: () => initialState,
    resetNoticeListState: makeAsyncStateResetReducer(initialState, "noticeList"),
    ...makeAsyncReducer<"noticeList", void, ListFetchSuccessPayload<NoticeResponse>>("noticeList", {
      useListSuccessReducer: true,
    }),
    ...makeAsyncReducer("createNotice"),
    ...makeAsyncReducer("updateNotice"),
  },
});
```

**3. 액션 분리 (`notice/actions.ts`)**
```ts
export const fetchNoticeList = mergeAsyncAction(actions, "noticeList");
export const createNotice    = mergeAsyncAction(actions, "createNotice");
```

**4. Thunk 작성 (`notice/thunk.ts`)**
```ts
export const fetchNoticeListThunk = makeFetchMoreListThunkAction<NoticeResponse, NoticeListRequestPayload>(
  fetchNoticeList,
  {
    getResponseListFunction: (_, payload) =>
      noticeApi.getNoticeList(payload.isPublic, payload.page, payload.pageSize),
  },
);
```

**5. 셀렉터 작성 (`notice/selectors.ts`)**
```ts
export const { getNoticeListState } = makeAsyncListStateSelectorMap("notice", ["noticeList"]);
```

---

## 기술 스택

- [Redux Toolkit](https://redux-toolkit.js.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Axios](https://axios-http.com/)
