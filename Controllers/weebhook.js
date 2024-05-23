// const { WebhookClient } = require("dialogflow-fulfillment");
const dialogflow = require('dialogflow');
// const dfFulfillment = require("dialogflow-fulfillment");
const config = require("../config/devKey");
const axios = require("axios");

const privateKey = config.googlePrivateKey;
const projectId = config.googleProjectId;
const sessionId = config.dialogFlowSessionID;

const credentials = {
  client_email: config.client_email,
  private_key: privateKey,
};

const sessionClient = new dialogflow.SessionsClient({
    projectId: projectId,
    credentials: credentials,
});

// console.log("sessionClient :>> ", sessionClient);
const weebHook = async (req, res) => {
  try {
    // const agent = new WebhookClient({ request: req, response: res });
    const sessionPath = sessionClient.sessionPath(
      projectId,
      sessionId + req.body.session.split('/').pop()
    );

    const queryInput = {
      text: {
        text: req.body.queryText,
        languageCode: 'en-US',
      },
    };

    const request = {
      session: sessionPath,
      queryInput: queryInput,
    };

    try {
      const responses = await sessionClient.detectIntent(request);
      console.log("asdsadasd", responses)
      const result = responses[0].queryResult;
      console.log("hello",result.intent )
      let responseText = '';
      if (result.intent.displayName === 'Order Inquiry') {
        responseText = 'Please provide your order ID.';
        await setContext('awaiting_order_id', 5, req.body.session);
      } else if (result.intent.displayName === 'Order ID Provided') {
        const orderId = result.parameters.fields.orderId.stringValue;
        if (orderId) {
          // Fetch order details from third-party API
          try {
            const orderDetails = await fetchOrderDetails(orderId);
            responseText = `Here are your order details: ${orderDetails}`;
            await clearContext('awaiting_order_id', req.body.session);
          } catch (error) {
            responseText = 'There was an error fetching your order details. Please try again.';
          }
        } else {
          responseText = 'Please provide a valid order ID.';
        }
      } else {
        responseText = result.fulfillmentText;
      }
  
      return res.status(200).send({
        status: 1,
        message: "Response",
        data: responseText,
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

const setContext = async (contextName, lifespanCount, session) => {
  const contextClient = new dialogflow.ContextsClient();
  const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId + session.split('/').pop());
  const contextPath = contextClient.projectAgentSessionContextPath(projectId, sessionPath, contextName);

  const context = {
    name: contextPath,
    lifespanCount: lifespanCount,
  };

  await contextClient.createContext({ parent: sessionPath, context: context });
};

const clearContext = async (contextName, session) => {
  const contextClient = new dialogflow.ContextsClient();
  const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId + session.split('/').pop());
  const contextPath = contextClient.projectAgentSessionContextPath(projectId, sessionPath, contextName);

  await contextClient.deleteContext({ name: contextPath });
};

const fetchOrderDetails = async (orderId) => {
  // Replace with your third-party API call logic
  const response = await axios.post(
    "https://orderstatusapi-dot-organization-project-311520.uc.r.appspot.com/api/getOrderStatus",
    { orderId }
  );

  return response.data;
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
