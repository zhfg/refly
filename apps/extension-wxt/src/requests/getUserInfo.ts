import { appConfig } from "@/utils/config";
import { request } from "@/utils/request";
import { storage } from "wxt/storage";

import type { HandlerRequest, HandlerResponse } from "@/types/request";
import { User } from "@/types";

const handler = async (
  req?: HandlerRequest<any>
): Promise<HandlerResponse<User>> => {
  console.log(req?.body);

  try {
    const [err, userRes] = await request<User>(appConfig.url.userSettings, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (err) {
      return {
        success: false,
        errMsg: err,
      };
    } else {
      return {
        success: true,
        data: userRes,
      };
    }
  } catch (err) {
    return {
      success: false,
      errMsg: err,
    };
  }
};

export default handler;
