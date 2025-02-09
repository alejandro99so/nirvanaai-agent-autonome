const express = require("express");
const app = express();
const axios = require("axios");
app.use(express.static("static"));
app.use(express.json());
require("dotenv").config();
const { Telegraf } = require("telegraf");
const { Buffer } = require("buffer");
const bot = new Telegraf(process.env.BOT_TOKEN);
const whiteList = ["idTelegram"];
const connectDB = require("./config/db");
const History = require("./models/history");

const getAIResponse = async (message) => {
  // const idUser = message.chat.id
  const encodedCredentials = Buffer.from(
    `${process.env.AUTONOME_USERNAME}:${process.env.AUTONOME_PASSWORD}`
  ).toString("base64");
  console.log(`Basic ${encodedCredentials}`, message);
  try {
    const response = await axios.post(
      process.env.AUTONOME_API_URL || "",
      {
        input: message,
      },
      {
        headers: {
          Authorization: `Basic ${encodedCredentials}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.response || "I didn't understand that.";
  } catch (error) {
    // console.error("Autonome Error:", error);
    return "There was an issue processing your request.";
  }
};

bot.command("start", (ctx) => {
  console.log(ctx.from);
  console.log({ id: ctx.chat.id });
  bot.telegram.sendMessage(
    ctx.chat.id,
    "Hello!! My Name is NirvanaAI, I'm here to talk with u about yourself!!",
    {}
  );
});

bot.command("ethereum", (ctx) => {
  var rate;
  console.log(ctx.from);
  axios
    .get(
      `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`
    )
    .then((response) => {
      console.log(response.data);
      rate = response.data.ethereum;
      const message = `Hello, today the ethereum price is ${rate.usd}USD`;
      bot.telegram.sendMessage(ctx.chat.id, message, {});
    });
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text || "";
  console.log({ whiteList, chatId });
  if (!whiteList.includes(chatId.toString())) {
    bot.telegram.sendMessage(chatId, "User is not available");
    return;
  }
  await connectDB();
  try {
    let history = await History.findOne({ userId: chatId });
    const today = new Date();
    const month = today.getMonth() + 1;
    if (!history) {
      history = await History.create({
        userId: chatId,
        total: 1,
        totalMonth: 1,
        lastMonthUpdate: month,
      });
    } else {
      const month = today.getMonth() + 1;
      if (
        month > history.lastMonthUpdate ||
        (month == 1 && history.lastMonthUpdate == 12)
      )
        history = await History.updateOne(
          { userId: chatId },
          {
            total: history.total + 1,
            totalMonth: 1,
            lastMonthUpdate: month,
          }
        );
      else
        history = await History.updateOne(
          { userId: chatId },
          {
            total: history.total + 1,
            totalMonth: history.totalMonth + 1,
          }
        );
    }
    console.log({ history });
  } catch (ex) {
    console.log({ ex });
  }
  if (userMessage) {
    const response = await getAIResponse(userMessage);
    bot.telegram.sendMessage(chatId, response);
  }
});

bot.launch();
