import { appConfig } from "@/utils/config";
import { extRequest } from "@/utils/request";

import type { HandlerRequest, HandlerResponse } from "@/types/request";
import type { ResourceListItem, ResourceDetail } from "@/types";

const handler = async (
  req: HandlerRequest<Partial<ResourceListItem>>
): Promise<HandlerResponse<ResourceDetail>> => {
  console.log(req.body);

  try {
    const [err, resourceRes] = await extRequest<{
      success: boolean;
      data: ResourceDetail;
    }>({
      name: "newResource",
      body: req.body,
    });

    return resourceRes;
  } catch (err) {
    return {
      success: false,
      errMsg: String(err),
    };
  }
};

export default handler;
