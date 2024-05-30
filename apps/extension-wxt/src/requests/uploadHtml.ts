import { appConfig } from "@/utils/config";
import { request } from "@/utils/request";

import type { HandlerRequest, HandlerResponse } from "@/types/request";

import { getServerlessWorkOrigin } from "@/utils/url";
import { HtmlUploadRequest, HtmlUploadResult } from "@/types";

const handler = async (
  req: HandlerRequest<HtmlUploadRequest>
): Promise<HandlerResponse<HtmlUploadResult>> => {
  console.log(req.body);

  try {
    const BASEURL = getServerlessWorkOrigin();

    const { pageContent = "", url = "", fileName = "" } = req.body;

    const formData = new FormData();
    const blob = new Blob([pageContent], { type: "text/html" });
    const file = new File([blob], fileName || `test.html`, {
      type: "text/html",
    });

    formData.append("file", file);
    formData.append("url", url);

    const [err, uploadHtmlRes] = await request<HtmlUploadResult>(
      `${BASEURL}${appConfig.url.uploadHtml}`,
      {
        method: "POST",
        body: formData,
      }
    );
    if (err) {
      return {
        success: false,
        errMsg: err,
      };
    } else {
      return {
        success: true,
        data: uploadHtmlRes,
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
