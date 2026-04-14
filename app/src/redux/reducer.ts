import { combineReducers } from "@reduxjs/toolkit";
import { noticeReducer as notice } from "@/redux/notice/slice";

export const rootReducerMap = {
  notice
};

const rootReducer = combineReducers(rootReducerMap);

export default rootReducer;
