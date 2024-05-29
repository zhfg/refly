import { appConfig } from "@/src/utils/config";
import { extRequest } from "@/src/utils/request";

import type { HandlerRequest, HandlerResponse } from "@/src/types/request";
import type { ResourceListItem, ResourceDetail } from "@/src/types";

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
