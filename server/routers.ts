import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { generateImage } from "./_core/imageGeneration";
import { invokeLLM, type Message } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { storageGetSignedUrl, storagePut } from "./storage";

function getTextContent(content: Message["content"]): string {
  const parts = Array.isArray(content) ? content : [content];
  return parts
    .map(part => typeof part === "string" ? part : part.type === "text" ? part.text : "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

function assertSuccessfulCompletion(result: Awaited<ReturnType<typeof invokeLLM>>) {
  const error = (result as typeof result & { error?: { message?: string } }).error;
  if (error) throw new Error(error.message || "The AI service returned an error.");
  const content = result.choices?.[0]?.message?.content;
  const text = content ? getTextContent(content) : "";
  if (!text) throw new Error("The assistant returned no usable answer.");
  return text;
}

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(20000),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  ai: router({
    chat: publicProcedure
      .input(z.object({ messages: z.array(messageSchema).min(1).max(30) }))
      .mutation(async ({ input }) => {
        const system: Message = {
          role: "system",
          content:
            "You are Adeer, a capable general-purpose AI assistant. Answer directly and structure complex responses with headings or bullets. Be precise, practical, and transparent about uncertainty. Never claim perfection. For high-stakes medical, legal, or financial topics, encourage qualified professional verification. When writing code, use fenced code blocks and explain key decisions briefly.",
        };
        const result = await invokeLLM({
          messages: [system, ...input.messages] as Message[],
          maxTokens: 3000,
        });
        return { content: assertSuccessfulCompletion(result) };
      }),
    analyzeImage: publicProcedure
      .input(z.object({
        dataUrl: z.string().startsWith("data:image/").max(18_000_000),
        question: z.string().max(4000).optional(),
      }))
      .mutation(async ({ input }) => {
        const match = input.dataUrl.match(/^data:(image\/[\w.+-]+);base64,(.+)$/);
        if (!match) throw new Error("Please attach a supported image file.");
        const [, mimeType, base64] = match;
        const buffer = Buffer.from(base64, "base64");
        const stored = await storagePut(`uploads/analysis-${Date.now()}`, buffer, mimeType);
        const signedUrl = await storageGetSignedUrl(stored.key);
        const result = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are Adeer, an accurate visual analysis assistant. Describe what is visible, call out uncertainty, and answer the user's question. Do not infer sensitive personal traits or claim details that are not visible.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: input.question?.trim() || "Analyze this image and describe the important visible details." },
                { type: "image_url", image_url: { url: signedUrl, detail: "auto" } },
              ],
            },
          ],
          maxTokens: 2200,
        });
        const content = assertSuccessfulCompletion(result);
        return { content };
      }),
    generateImage: publicProcedure
      .input(z.object({ prompt: z.string().min(4).max(4000) }))
      .mutation(async ({ input }) => {
        const result = await generateImage({ prompt: input.prompt });
        if (!result.url) throw new Error("The image service returned no preview URL.");
        return { url: result.url };
      }),
  }),
});

export type AppRouter = typeof appRouter;
