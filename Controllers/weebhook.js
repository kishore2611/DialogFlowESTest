// const { WebhookClient } = require("dialogflow-fulfillment");
const dialogflow = require("dialogflow");
// const dfFulfillment = require("dialogflow-fulfillment");
const config = require("../config/devKey");
const axios = require("axios");

const privateKey = config.googlePrivateKey;
const projectId = config.googleProjectId;
const sessionId = config.dialogFlowSessionID;

const credentials = {
  client_email: config.client_email,
  privateKey: privateKey,
};

const sessionClient = new dialogflow.SessionsClient({
    projectId: projectId,
    credentials: credentials,
});

console.log("sessionClient :>> ", sessionClient);
const weebHook = async (req, res) => {
  try {
    // const agent = new WebhookClient({ request: req, response: res });
    const sessionPath = sessionClient.sessionPath(
      projectId,
      sessionId + req.body.useId
    );

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: req.body.text,
          languageCode: "en-US",
        },
      },
    };

    try {
      const response = sessionClient.detectIntent(request);
      return res.status(200).send({
        status: 1,
        message: "Response",
        data: response,
      });
    } catch (error) {
      return res.status(500).send({
        status: 0,
        message: "Internal Server Error 2",
        error: error.message,
      });
    }
  } catch (error) {
    return res.status(500).send({
      status: 0,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const weebHookNew = async (req, res) => {
  try {
    const agent = new WebhookClient({ request: req, response: res });

    // Function to handle the welcome intent
    const handleWelcome = (agent) => {
      agent.add(
        "Hello! I'm your shipping assistant bot. How can I help you today?"
      );
    };

    // Function to handle the shipping inquiry intent
    const handleShippingInquiry = async (agent) => {
      const { orderId } = agent.parameters;

      if (!orderId) {
        agent.add(
          "I'm sorry, I didn't get the order ID. Can you provide it again?"
        );
        return;
      }

      try {
        const response = await axios.post(
          "https://orderstatusapi-dot-organization-project-311520.uc.r.appspot.com/api/getOrderStatus",
          { orderId }
        );

        if (response.data && response.data.status === "success") {
          const orderDetails = response.data.data;
          agent.add(
            `Here are the shipping details for order ${orderId}: ${orderDetails}`
          );
        } else {
          agent.add(
            `I'm sorry, I couldn't find details for order ID ${orderId}.`
          );
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        agent.add(
          `I'm sorry, there was an error fetching details for order ID ${orderId}. Please try again later.`
        );
      }
    };

    // Map intents to handler functions
    var intentMap = new Map();
    intentMap.set("Default Welcome Intent", handleWelcome);
    intentMap.set("Shipping Inquiry Intent", handleShippingInquiry);

    // Route the request to the appropriate handler function
    agent.handleRequest(intentMap);
  } catch (error) {
    return res.status(500).send({
      status: 0,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports = {
  weebHook,
  weebHookNew,
};
