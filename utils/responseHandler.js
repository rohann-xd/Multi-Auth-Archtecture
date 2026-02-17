const sendResponse = (res, statusCode, status, message, data = null) => {
  if (!status) {
    return res.status(statusCode).json({
      status: status,
      error: message,
      data: data,
    });
  }

  return res.status(statusCode).json({
    status: status,
    message: message,
    data: data,
  });
};

module.exports = sendResponse;
