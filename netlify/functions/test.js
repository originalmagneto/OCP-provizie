// Test Netlify function
exports.handler = async function (event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Test function deployed successfully!" }),
  };
};
exports.handler = async function (event, context) {
  console.log("Received request:", event);
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello from Netlify Function!" }),
  };
};
