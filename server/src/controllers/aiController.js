const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const { generateFonReply } = require("../services/fonAiService");

const chatWithFonAi = asyncHandler(async (req, res) => {
  const { message, history = [] } = req.body;

  const result = await generateFonReply({ message, history });

  return sendSuccess(
    res,
    {
      reply: result.reply,
      model: result.model,
    },
    "FON AI reply generated"
  );
});

module.exports = {
  chatWithFonAi,
};
