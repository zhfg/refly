import { z } from "zod";
import { StructuredTool } from "@langchain/core/tools";
import { formatToOpenAITool } from "@langchain/openai";

class CitedAnswer extends StructuredTool {
  name = "cited_answer";

  description =
    "Answer the user question based only on the given sources, and cite the sources used.";

  schema = z.object({
    answer: z
      .string()
      .describe(
        "The answer to the user question, which is based only on the given sources."
      ),
    citations: z
      .array(z.number())
      .describe(
        "The integer IDs of the SPECIFIC sources which justify the answer."
      ),
  });

  constructor() {
    super();
  }

  _call(input: z.infer<(typeof this)["schema"]>): Promise<string> {
    return Promise.resolve(JSON.stringify(input, null, 2));
  }
}

export { CitedAnswer };
export default CitedAnswer;
