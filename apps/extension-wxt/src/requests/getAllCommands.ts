import type { HandlerRequest, HandlerResponse } from "@/types/request";

const handler = async (
  req: HandlerRequest<null>
): Promise<HandlerResponse<chrome.commands.Command[]>> => {
  console.log(req?.body);

  try {
    const commands = (await chrome.commands.getAll()) || [];
    return {
      success: true,
      data: commands,
    };
  } catch (err) {
    return {
      success: false,
    };
  }
};

export default handler;
