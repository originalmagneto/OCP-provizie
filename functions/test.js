exports.handler = async (event) => {
  console.log("Test function invoked");
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Test function successful" })
  };
};
