exports.handler = async function (event, context) {
  console.log("Login function invoked");
  console.log("HTTP Method:", event.httpMethod);
  console.log("Event body:", event.body);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Login function reached",
      method: event.httpMethod,
      body: event.body,
    }),
  };
};
