import { makeFetchThunkAction, makeFetchMoreListThunkAction } from "@/utils/redux/thunk";
import { NoticeRequest, NoticeResponse } from "@witu/api-client";
import { noticeApi, uploadFileApi } from "@/client";
import { createNotice, fetchNoticeDetailImage, fetchNoticeList, updateNotice } from "./actions";
import { NoticeListRequestPayload } from "./types";
import { UploadFile } from "antd";

export const fetchNoticeListThunk = makeFetchMoreListThunkAction<NoticeResponse, NoticeListRequestPayload>(
  fetchNoticeList,
  {
    getResponseListFunction: (_, { isPublic, title, createdDateStart, createdDateEnd, isReleased, page, pageSize }) =>
      noticeApi.getNoticeList(isPublic, page, pageSize, title, isReleased, createdDateStart, createdDateEnd),
  },
);

export const createNoticeThunk = makeFetchThunkAction<void, { images?: UploadFile<any>[]; request: NoticeRequest }>(
  createNotice,
  {
    getResponseFunction: async (_, { images = [], request }) => {
      const imageResponse = await Promise.all(images.map((image) => uploadFileApi.uploadFile(image.originFileObj)));
      const imageData = imageResponse.map(({ data }) => data.path);

      return noticeApi.createNotice({ ...request, imageFilePath: imageData[0] });
    },
  },
);

export const updateNoticeThunk = makeFetchThunkAction<
  void,
  { id: number; images?: UploadFile<any>[]; request: NoticeRequest }
>(updateNotice, {
  getResponseFunction: async (_, { id, images, request }) => {
    const imageResponse = images?.length ? await Promise.all(images.map((image) => uploadFileApi.uploadFile(image.originFileObj))) : [];
    const imageData = imageResponse.map(({ data }) => data.path);

    return noticeApi.updateNotice(id, { ...request, imageFilePath: imageData[0] ?? request.imageFilePath });
  },
});

export const fetchNoticeDetailImageThunk = makeFetchThunkAction<string, string>(fetchNoticeDetailImage, {
  getResponseFunction: async (_, path) => {
    const response = await uploadFileApi.downloadFile(path, { headers: { contentType: "image/*" } });

    const reader = new FileReader();
    reader.readAsDataURL(new Blob(response.data));

    return new Promise((resolve) => {
      reader.onload = (e) => {
        const newResponse = response;
        newResponse.data = Buffer.from(decodeURI(encodeURIComponent(response.data)), "base64").toString("base64");

        resolve(newResponse);
      };
    });
  },
});
