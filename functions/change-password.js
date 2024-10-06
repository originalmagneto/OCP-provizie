exports.handler = async function (event, context) {
  console.log("Change password function invoked");
  console.log("HTTP Method:", event.httpMethod);
  console.log("Event body:", event.body);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Change password function reached",
      method: event.httpMethod,
      body: event.body,
    }),
  };
};
